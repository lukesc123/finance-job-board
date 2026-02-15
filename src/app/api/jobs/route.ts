import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { requireAdmin } from '@/lib/auth'
import { rateLimit, getClientIP } from '@/lib/rateLimit'

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
    const company = searchParams.get('company')

    // If specific IDs requested, return just those jobs (max 50)
    if (ids.length > 0) {
      const safeIds = ids.slice(0, 50).filter(id => /^[a-f0-9-]{36}$/i.test(id))
      if (safeIds.length === 0) {
        return NextResponse.json([])
      }
      const { data, error } = await supabaseAdmin
        .from('jobs')
        .select('*, company:companies(*)')
        .in('id', safeIds)
      if (error) throw error
      return NextResponse.json(data ?? [])
    }

    let query = supabaseAdmin
      .from('jobs')
      .select('*, company:companies(*)')
      .eq('is_active', true)
      .order('posted_date', { ascending: false })

    // Apply category filter
    if (category) query = query.eq('category', category)

    // Apply location filter (case-insensitive partial match)
    if (location) query = query.ilike('location', `%${location}%`)

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

    // Apply job type filter
    if (jobType) query = query.eq('job_type', jobType)

    // Apply pipeline stage filter
    if (pipelineStage) query = query.eq('pipeline_stage', pipelineStage)

    // Apply remote type filter
    if (remoteType) query = query.eq('remote_type', remoteType)

    // Apply license filter (check if licenses_required JSONB array contains the value)
    if (license) {
      const sanitized = license.replace(/[^a-zA-Z0-9 /&()-]/g, '')
      if (sanitized) {
        query = query.contains('licenses_required', JSON.stringify([sanitized]))
      }
    }

    // Apply salary range filter
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

    const { data, error } = await query

    if (error) throw error

    // Post-fetch: filter and rank by search term (includes company name matching)
    interface JobRow {
      title?: string
      description?: string
      location?: string
      company?: { name?: string } | null
      posted_date: string
      grad_date_required?: boolean
      grad_date_earliest?: string | null
      grad_date_latest?: string | null
      _relevance?: number
      [key: string]: unknown
    }
    let filteredData: JobRow[] = (data ?? []) as JobRow[]

    if (search) {
      const searchLower = search.toLowerCase()
      filteredData = filteredData.filter(
        (job) =>
          job.title?.toLowerCase().includes(searchLower) ||
          job.description?.toLowerCase().includes(searchLower) ||
          job.location?.toLowerCase().includes(searchLower) ||
          job.company?.name?.toLowerCase().includes(searchLower)
      )

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
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
    })
  } catch (error: unknown) {
    console.error('Error fetching jobs:', error)
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    requireAdmin(request)

    const body = await request.json()
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
      .select('*, company:companies(*)')
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: unknown) {
    console.error('Error creating job:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to create job' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    requireAdmin(request)

    const body = await request.json()
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
      .select('*, company:companies(*)')
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: unknown) {
    console.error('Error updating job:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to update job' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    requireAdmin(request)

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    const { error } = await supabaseAdmin.from('jobs').delete().eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('Error deleting job:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to delete job' }, { status: 500 })
  }
}
