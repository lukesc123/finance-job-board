import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { requireAdmin } from '@/lib/auth'
import { rateLimit, getClientIP } from '@/lib/rateLimit'
import { logger } from '@/lib/logger'
import { UUID_RE } from '@/lib/constants'
import { FINANCE_LICENSES, JOB_CATEGORIES, JOB_TYPES, PIPELINE_STAGES, REMOTE_TYPES, type FinanceLicense } from '@/types'

export async function GET(request: NextRequest) {
  try {
    const ip = getClientIP(request)
    const { limited } = rateLimit(`jobs:${ip}`, 120, 60_000)
    if (limited) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': '60' } }
      )
    }

    const { searchParams } = new URL(request.url)

    // Extract query parameters
    const ids = searchParams.getAll('ids')
    const category = searchParams.get('category')
    const location = searchParams.get('location')?.slice(0, 100) || null
    const jobType = searchParams.get('job_type')
    const pipelineStage = searchParams.get('pipeline_stage')
    const remoteType = searchParams.get('remote_type')
    const license = searchParams.get('license')
    const search = searchParams.get('search')?.slice(0, 200) || null
    const gradDate = searchParams.get('grad_date')
    const company = searchParams.get('company')?.slice(0, 200) || null
    // Optional: pass fields=slim to omit description (saves ~60% payload for list views)
    const slim = searchParams.get('fields') === 'slim'

    // Select only the columns the client actually needs
    const JOB_COLUMNS = [
      'id', 'title', 'category', 'location', 'remote_type', 'job_type',
      'pipeline_stage', 'salary_min', 'salary_max', 'posted_date', 'apply_url',
      'source_url', 'is_active', 'company_id',
      'grad_date_required', 'grad_date_earliest', 'grad_date_latest',
      'licenses_required', 'licenses_info', 'years_experience_max',
      'removal_detected_at', 'last_verified_at',
    ]
    // Include description for search relevance scoring (ILIKE fallback) or full payloads
    if (!slim) JOB_COLUMNS.push('description')
    JOB_COLUMNS.push('company:companies(id,name,website,careers_url,logo_url,description)')
    const JOB_SELECT = JOB_COLUMNS.join(',')

    // If specific IDs requested, return just those jobs (max 50, UUID-validated)
    if (ids.length > 0) {
      const safeIds = ids.slice(0, 50).filter(id => UUID_RE.test(id))
      if (safeIds.length === 0) return NextResponse.json([])
      const { data, error } = await supabaseAdmin
        .from('jobs')
        .select(JOB_SELECT)
        .in('id', safeIds)
      if (error) throw error
      return NextResponse.json(data ?? [], {
        headers: {
          'Cache-Control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=300',
          'Vary': 'Accept-Encoding',
        },
      })
    }

    let query = supabaseAdmin
      .from('jobs')
      .select(JOB_SELECT)
      .eq('is_active', true)
      .order('posted_date', { ascending: false })
      .limit(1000)

    // Apply category filter (validate against known categories)
    if (category) {
      if (!(JOB_CATEGORIES as readonly string[]).includes(category)) {
        return NextResponse.json({ error: 'Invalid category', code: 'INVALID_INPUT' }, { status: 400 })
      }
      query = query.eq('category', category)
    }

    // Apply location filter (case-insensitive partial match, sanitized)
    if (location) {
      const sanitizedLocation = location.replace(/[%_\\]/g, '\\$&')
      query = query.ilike('location', `%${sanitizedLocation}%`)
    }

    // Apply company filter (look up company_id by name)
    if (company) {
      const { data: companyData } = await supabaseAdmin
        .from('companies')
        .select('id')
        .eq('name', company)
        .single()
      if (companyData) {
        query = query.eq('company_id', companyData.id)
      } else {
        return NextResponse.json([])
      }
    }

    // Apply job type filter (validate against known types)
    if (jobType) {
      if (!(JOB_TYPES as readonly string[]).includes(jobType)) {
        return NextResponse.json({ error: 'Invalid job_type', code: 'INVALID_INPUT' }, { status: 400 })
      }
      query = query.eq('job_type', jobType)
    }

    // Apply pipeline stage filter (validate against known stages)
    if (pipelineStage) {
      if (!(PIPELINE_STAGES as readonly string[]).includes(pipelineStage)) {
        return NextResponse.json({ error: 'Invalid pipeline_stage', code: 'INVALID_INPUT' }, { status: 400 })
      }
      query = query.eq('pipeline_stage', pipelineStage)
    }

    // Apply remote type filter (validate against known types)
    if (remoteType) {
      if (!(REMOTE_TYPES as readonly string[]).includes(remoteType)) {
        return NextResponse.json({ error: 'Invalid remote_type', code: 'INVALID_INPUT' }, { status: 400 })
      }
      query = query.eq('remote_type', remoteType)
    }

    // Apply license filter (validate against known licenses, then check JSONB array)
    if (license) {
      if (FINANCE_LICENSES.includes(license as FinanceLicense)) {
        query = query.contains('licenses_required', JSON.stringify([license]))
      }
    }

    // Apply salary range filter (range overlap logic):
    // User's min threshold: show jobs where job.salary_max >= threshold (job pays at least this much)
    // User's max threshold: show jobs where job.salary_min <= threshold (job starts below this cap)
    const salaryMin = searchParams.get('salary_min')
    const salaryMax = searchParams.get('salary_max')
    if (salaryMin) {
      const parsed = parseInt(salaryMin, 10)
      if (!isNaN(parsed) && parsed > 0) query = query.gte('salary_max', parsed)
    }
    if (salaryMax) {
      const parsed = parseInt(salaryMax, 10)
      if (!isNaN(parsed) && parsed > 0) query = query.lte('salary_min', parsed)
    }

    interface JobRow {
      id: string
      title?: string
      description?: string
      location?: string
      company_id?: string
      company?: { name?: string; id?: string; website?: string; careers_url?: string; logo_url?: string; description?: string } | null
      posted_date: string
      grad_date_required?: boolean
      grad_date_earliest?: string | null
      grad_date_latest?: string | null
      _relevance?: number
      [key: string]: unknown
    }

    // ---------- Full-text search path (RPC) ----------
    // If search_jobs_fts() RPC is deployed, use it for ranked full-text search.
    // Falls back to ILIKE if the function doesn't exist yet.
    if (search) {
      const parsedSalaryMin = salaryMin ? parseInt(salaryMin, 10) : null
      const parsedSalaryMax = salaryMax ? parseInt(salaryMax, 10) : null

      const { data: ftsData, error: ftsError } = await supabaseAdmin.rpc('search_jobs_fts', {
        search_query: search,
        category_filter: category || null,
        location_filter: location || null,
        job_type_filter: jobType || null,
        pipeline_stage_filter: pipelineStage || null,
        remote_type_filter: remoteType || null,
        company_filter: company || null,
        salary_min_filter: (parsedSalaryMin && parsedSalaryMin > 0) ? parsedSalaryMin : null,
        salary_max_filter: (parsedSalaryMax && parsedSalaryMax > 0) ? parsedSalaryMax : null,
        result_limit: 200,
      })

      // If RPC succeeds, reshape the flat rows into the nested company format
      if (!ftsError && ftsData) {
        const ftsRows = (ftsData as Record<string, unknown>[]).map((row) => ({
          ...row,
          company: row.company_name ? {
            id: row.company_id,
            name: row.company_name,
            website: row.company_website,
            careers_url: row.company_careers_url,
            logo_url: row.company_logo_url,
            description: row.company_description,
          } : null,
          // Remove flat company fields from top level
          company_name: undefined,
          company_website: undefined,
          company_careers_url: undefined,
          company_logo_url: undefined,
          company_description: undefined,
        })) as unknown as JobRow[]

        // Apply grad date filter (not handled in the RPC)
        let filteredFts = ftsRows
        if (gradDate) {
          const gradDateTime = new Date(gradDate).getTime()
          filteredFts = ftsRows.filter((job) => {
            if (!job.grad_date_required) return true
            const earliest = job.grad_date_earliest ? new Date(job.grad_date_earliest).getTime() : null
            const latest = job.grad_date_latest ? new Date(job.grad_date_latest).getTime() : null
            if (earliest && gradDateTime < earliest) return false
            if (latest && gradDateTime > latest) return false
            return true
          })
        }

        // Apply license filter (not handled in RPC)
        if (license && FINANCE_LICENSES.includes(license as FinanceLicense)) {
          filteredFts = filteredFts.filter((job) => {
            const licenses = job.licenses_required as string[] | undefined
            return licenses?.includes(license) ?? false
          })
        }

        return NextResponse.json(filteredFts, {
          headers: {
            'Cache-Control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=300',
            'Vary': 'Accept-Encoding',
          },
        })
      }

      // RPC not available (function not deployed yet) - fall through to ILIKE path
      if (ftsError) {
        logger.warn('FTS RPC unavailable, falling back to ILIKE:', ftsError.message)
      }
    }

    // ---------- ILIKE fallback path ----------
    // Used when: no search term, or search_jobs_fts RPC is not deployed yet
    if (search) {
      const escaped = search.replace(/[%_\\]/g, '\\$&')
      const pattern = `%${escaped}%`
      query = query.or(`title.ilike.${pattern},description.ilike.${pattern},location.ilike.${pattern}`)
    }

    const { data, error } = await query

    if (error) throw error

    let filteredData = (data ?? []) as unknown as JobRow[]

    if (search) {
      const searchLower = search.toLowerCase()

      // Company name match (joined table can't be in the .or() filter)
      if (!company) {
        const escapedSearch = search.replace(/[%_\\]/g, '\\$&')
        const { data: companyMatches } = await supabaseAdmin
          .from('companies')
          .select('id')
          .ilike('name', `%${escapedSearch}%`)
          .limit(20)

        if (companyMatches && companyMatches.length > 0) {
          const existingIds = new Set(filteredData.map(j => j.id))
          const { data: companyJobs } = await supabaseAdmin
            .from('jobs')
            .select(JOB_SELECT)
            .eq('is_active', true)
            .in('company_id', companyMatches.map(c => c.id))
            .order('posted_date', { ascending: false })
            .limit(50)

          if (companyJobs) {
            for (const j of companyJobs as unknown as JobRow[]) {
              if (!existingIds.has(j.id)) {
                filteredData.push(j)
              }
            }
          }
        }
      }

      // Compute relevance scores for sorting
      filteredData = filteredData.map((job) => {
        let relevance = 0
        const titleLower = (job.title || '').toLowerCase()
        if (titleLower === searchLower) relevance += 100
        else if (titleLower.startsWith(searchLower)) relevance += 80
        else if (titleLower.includes(searchLower)) relevance += 60
        if (job.company?.name?.toLowerCase().includes(searchLower)) relevance += 40
        if (job.location?.toLowerCase().includes(searchLower)) relevance += 20
        if (job.description?.toLowerCase().includes(searchLower)) relevance += 10
        return { ...job, _relevance: relevance }
      })

      filteredData.sort((a, b) => {
        const aRel = a._relevance ?? 0
        const bRel = b._relevance ?? 0
        if (bRel !== aRel) return bRel - aRel
        return new Date(b.posted_date).getTime() - new Date(a.posted_date).getTime()
      })
    }

    // Apply graduation date filter (post-fetch since it requires conditional logic)
    if (gradDate) {
      const gradDateTime = new Date(gradDate).getTime()
      filteredData = filteredData.filter((job) => {
        if (!job.grad_date_required) return true
        const earliest = job.grad_date_earliest
          ? new Date(job.grad_date_earliest).getTime()
          : null
        const latest = job.grad_date_latest
          ? new Date(job.grad_date_latest).getTime()
          : null
        if (earliest && gradDateTime < earliest) return false
        if (latest && gradDateTime > latest) return false
        return true
      })
    }

    // Strip internal scoring field before returning to client
    const cleanData = filteredData.map(({ _relevance, ...rest }) => rest)

    return NextResponse.json(cleanData, {
      headers: {
        'Cache-Control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=300',
        'Vary': 'Accept-Encoding',
      },
    })
  } catch (error: unknown) {
    logger.error('Error fetching jobs:', error)
    const isDbError = error instanceof Error && (error.message.includes('PGRST') || error.message.includes('connection'))
    return NextResponse.json(
      { error: 'Failed to fetch jobs', code: isDbError ? 'DATABASE_ERROR' : 'INTERNAL_ERROR' },
      { status: isDbError ? 503 : 500, headers: isDbError ? { 'Retry-After': '10' } : {} }
    )
  }
}

function validateJobBody(body: Record<string, unknown>): string | null {
  if (!body.title || typeof body.title !== 'string' || body.title.trim().length < 2) {
    return 'title is required (min 2 characters)'
  }
  if (!body.company_id || typeof body.company_id !== 'string') {
    return 'company_id is required'
  }
  if (!body.category || !(JOB_CATEGORIES as readonly string[]).includes(body.category as string)) {
    return `category must be one of: ${JOB_CATEGORIES.join(', ')}`
  }
  if (!body.location || typeof body.location !== 'string' || body.location.trim().length < 2) {
    return 'location is required (min 2 characters)'
  }
  if (body.remote_type && !(REMOTE_TYPES as readonly string[]).includes(body.remote_type as string)) {
    return `remote_type must be one of: ${REMOTE_TYPES.join(', ')}`
  }
  if (body.job_type && !(JOB_TYPES as readonly string[]).includes(body.job_type as string)) {
    return `job_type must be one of: ${JOB_TYPES.join(', ')}`
  }
  if (body.pipeline_stage && !(PIPELINE_STAGES as readonly string[]).includes(body.pipeline_stage as string)) {
    return `pipeline_stage must be one of: ${PIPELINE_STAGES.join(', ')}`
  }
  if (body.apply_url && typeof body.apply_url === 'string') {
    try {
      const url = body.apply_url.startsWith('http') ? body.apply_url : `https://${body.apply_url}`
      new URL(url)
    } catch {
      return 'apply_url must be a valid URL'
    }
  }
  if (body.salary_min != null && (isNaN(Number(body.salary_min)) || Number(body.salary_min) < 0)) {
    return 'salary_min must be a non-negative number'
  }
  if (body.salary_max != null && (isNaN(Number(body.salary_max)) || Number(body.salary_max) < 0)) {
    return 'salary_max must be a non-negative number'
  }
  if (body.salary_min != null && body.salary_max != null && Number(body.salary_min) > Number(body.salary_max)) {
    return 'salary_min cannot exceed salary_max'
  }
  return null
}

export async function POST(request: NextRequest) {
  try {
    requireAdmin(request)

    const body = await request.json()

    const validationError = validateJobBody(body)
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 })
    }

    const id = crypto.randomUUID()
    const now = new Date().toISOString()

    const payload = {
      id,
      company_id: body.company_id,
      title: body.title,
      category: body.category,
      location: body.location,
      remote_type: body.remote_type,
      salary_min: body.salary_min ? parseInt(body.salary_min) : null,
      salary_max: body.salary_max ? parseInt(body.salary_max) : null,
      job_type: body.job_type,
      pipeline_stage: body.pipeline_stage,
      description: body.description,
      apply_url: body.apply_url,
      source_url: body.source_url,
      is_active: true,
      is_verified: true,
      grad_date_required: body.grad_date_required ?? false,
      grad_date_earliest: body.grad_date_earliest || null,
      grad_date_latest: body.grad_date_latest || null,
      years_experience_max: body.years_experience_max || null,
      licenses_required: body.licenses_required || [],
      licenses_info: body.licenses_info || null,
      posted_date: body.posted_date || now,
      last_verified_at: now,
      removal_detected_at: null,
      verification_count: 1,
      created_at: now,
      updated_at: now,
    }

    const { data, error } = await supabaseAdmin
      .from('jobs')
      .insert(payload)
      .select('*, company:companies(id,name,website,careers_url,logo_url,description)')
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: unknown) {
    logger.error('Error creating job:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to create job', code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    requireAdmin(request)

    const body = await request.json()

    if (!body.id || typeof body.id !== 'string') {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const validationError = validateJobBody(body)
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 })
    }

    const now = new Date().toISOString()

    const { data, error } = await supabaseAdmin
      .from('jobs')
      .update({
        company_id: body.company_id,
        title: body.title,
        category: body.category,
        location: body.location,
        remote_type: body.remote_type,
        salary_min: body.salary_min ? parseInt(body.salary_min) : null,
        salary_max: body.salary_max ? parseInt(body.salary_max) : null,
        job_type: body.job_type,
        pipeline_stage: body.pipeline_stage,
        description: body.description,
        apply_url: body.apply_url,
        source_url: body.source_url,
        is_active: body.is_active ?? true,
        is_verified: body.is_verified ?? true,
        grad_date_required: body.grad_date_required ?? false,
        grad_date_earliest: body.grad_date_earliest || null,
        grad_date_latest: body.grad_date_latest || null,
        years_experience_max: body.years_experience_max || null,
        licenses_required: body.licenses_required || [],
        licenses_info: body.licenses_info || null,
        posted_date: body.posted_date,
        last_verified_at: body.last_verified_at,
        removal_detected_at: body.removal_detected_at || null,
        verification_count: body.verification_count,
        updated_at: now,
      })
      .eq('id', body.id)
      .select('*, company:companies(id,name,website,careers_url,logo_url,description)')
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: unknown) {
    logger.error('Error updating job:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to update job', code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    requireAdmin(request)

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return NextResponse.json({ error: 'Valid UUID is required' }, { status: 400 })
    }

    const { error } = await supabaseAdmin.from('jobs').delete().eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    logger.error('Error deleting job:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to delete job', code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
