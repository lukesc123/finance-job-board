import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { requireAdmin } from '@/lib/auth'

export async function GET(request: NextRequest) {
    try {
          const { searchParams } = new URL(request.url)

      // Extract query parameters
      const category = searchParams.get('category')
          const location = searchParams.get('location')
          const jobType = searchParams.get('job_type')
          const pipelineStage = searchParams.get('pipeline_stage')
          const remoteType = searchParams.get('remote_type')
          const license = searchParams.get('license')
          const search = searchParams.get('search')
          const gradDate = searchParams.get('grad_date')

      let query = supabaseAdmin
            .from('jobs')
            .select('*, company:companies(*)')
            .eq('is_active', true)
            .order('posted_date', { ascending: false })

      // Apply category filter
      if (category) query = query.eq('category', category)

      // Apply location filter (case-insensitive partial match)
      if (location) query = query.ilike('location', `%${location}%`)

      // Apply job type filter
      if (jobType) query = query.eq('job_type', jobType)

      // Apply pipeline stage filter
      if (pipelineStage) query = query.eq('pipeline_stage', pipelineStage)

      // Apply remote type filter
      if (remoteType) query = query.eq('remote_type', remoteType)

      // Apply license filter (check if licenses_required JSONB array contains the value)
      if (license) {
              query = query.contains('licenses_required', `["${license}"]`)
      }

      // Apply salary range filter
      const salaryMin = searchParams.get('salary_min')
          const salaryMax = searchParams.get('salary_max')
          if (salaryMin) query = query.gte('salary_max', parseInt(salaryMin))
          if (salaryMax) query = query.lte('salary_min', parseInt(salaryMax))

      const { data, error } = await query

      if (error) throw error

      // Post-fetch: filter and rank by search term (includes company name matching)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let filteredData: any[] = data ?? []
            if (search) {
                    const searchLower = search.toLowerCase()
                    filteredData = filteredData.filter((job) =>
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
                      if (b._relevance !== a._relevance) return b._relevance - a._relevance
                      return new Date(b.posted_date).getTime() - new Date(a.posted_date).getTime()
            })
            }

      // Apply graduation date filter (post-fetch since it requires conditional logic)
      if (gradDate) {
              const gradDateTime = new Date(gradDate).getTime()
              filteredData = filteredData.filter((job) => {
                        // If job doesn't require grad date, include it
                                                         if (!job.grad_date_required) return true

                                                         // If job requires grad date, check if provided grad_date falls within range
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

      return NextResponse.json(filteredData)
    } catch (error) {
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
