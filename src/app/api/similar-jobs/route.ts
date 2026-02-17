import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { rateLimit, getClientIP } from '@/lib/rateLimit'
import { logger } from '@/lib/logger'
import { withETag } from '@/lib/etag'

export async function GET(request: NextRequest) {
  try {
    const ip = getClientIP(request)
    const { limited } = rateLimit(`similar:${ip}`, 60, 60_000)
    if (limited) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': '60' } }
      )
    }

    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('id')

    if (!jobId || !/^[a-f0-9-]{36}$/i.test(jobId)) {
      return NextResponse.json({ error: 'Valid Job ID required' }, { status: 400 })
    }

    // ---------- Try RPC path first (single round-trip) ----------
    const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc('get_similar_jobs', {
      source_job_id: jobId,
      max_results: 4,
      min_score: 2,
    })

    if (!rpcError && rpcData) {
      // Reshape flat RPC rows into nested company format for the client
      const rpcResults = (rpcData as Record<string, unknown>[]).map((row) => ({
        id: row.id,
        title: row.title,
        category: row.category,
        location: row.location,
        remote_type: row.remote_type,
        job_type: row.job_type,
        pipeline_stage: row.pipeline_stage,
        salary_min: row.salary_min,
        salary_max: row.salary_max,
        posted_date: row.posted_date,
        company_id: row.company_id,
        company: row.company_name ? {
          id: row.company_id,
          name: row.company_name,
          logo_url: row.company_logo_url,
          website: row.company_website,
        } : null,
      }))

      const cacheHeaders = {
        'Cache-Control': 'public, max-age=0, s-maxage=120, stale-while-revalidate=600',
        'Vary': 'Accept-Encoding',
      }
      const { response } = withETag(request, rpcResults, cacheHeaders)
      return response
    }

    // RPC not deployed yet - fall through to multi-query path
    if (rpcError) {
      logger.warn('Similar jobs RPC unavailable, using fallback:', rpcError.message)
    }

    // ---------- Multi-query fallback ----------
    // Only select the fields needed for scoring + display (not full description)
    const SIMILAR_SELECT = [
      'id', 'title', 'category', 'location', 'remote_type', 'job_type',
      'pipeline_stage', 'salary_min', 'salary_max', 'posted_date', 'company_id',
      'company:companies(id,name,logo_url,website)',
    ].join(',')

    // Fetch the source job (only fields needed for matching)
    const { data: sourceJob, error: jobError } = await supabaseAdmin
      .from('jobs')
      .select('id,category,pipeline_stage,company_id,location,remote_type,job_type,salary_max')
      .eq('id', jobId)
      .single()

    if (jobError || !sourceJob) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Fetch category + stage candidates in parallel (eliminates waterfall)
    const [catResult, stageResult] = await Promise.all([
      supabaseAdmin
        .from('jobs')
        .select(SIMILAR_SELECT)
        .eq('is_active', true)
        .eq('category', sourceJob.category)
        .neq('id', jobId)
        .order('posted_date', { ascending: false })
        .limit(50),
      supabaseAdmin
        .from('jobs')
        .select(SIMILAR_SELECT)
        .eq('is_active', true)
        .eq('pipeline_stage', sourceJob.pipeline_stage)
        .neq('id', jobId)
        .neq('category', sourceJob.category) // Avoid duplicates with category query
        .order('posted_date', { ascending: false })
        .limit(30),
    ])

    if (catResult.error) throw catResult.error

    interface CandidateJob {
      id: string
      title: string
      category: string
      location: string
      remote_type: string
      job_type: string
      pipeline_stage: string
      salary_min: number
      salary_max: number
      posted_date: string
      company_id: string
      company: { id: string; name: string; logo_url: string | null; website: string | null } | null
      [key: string]: unknown
    }

    // Merge candidates, dedup by id
    const seenIds = new Set<string>()
    const candidates: CandidateJob[] = []
    for (const j of (catResult.data || []) as unknown as CandidateJob[]) {
      if (!seenIds.has(j.id)) { seenIds.add(j.id); candidates.push(j) }
    }
    for (const j of (stageResult.data || []) as unknown as CandidateJob[]) {
      if (!seenIds.has(j.id)) { seenIds.add(j.id); candidates.push(j) }
    }

    // Score candidates by similarity
    const scored = (candidates || []).map((job) => {
      let score = 0

      if (job.pipeline_stage === sourceJob.pipeline_stage) score += 5
      if (job.category === sourceJob.category) score += 3
      if (job.company_id === sourceJob.company_id) score += 2
      if (job.remote_type === sourceJob.remote_type) score += 1
      if (job.job_type === sourceJob.job_type) score += 1

      // City-level location match
      const sourceCity = sourceJob.location?.split(',')[0]?.trim().toLowerCase()
      const jobCity = job.location?.split(',')[0]?.trim().toLowerCase()
      if (sourceCity && jobCity && sourceCity === jobCity) score += 2

      // Salary proximity (within 20% range)
      if (sourceJob.salary_max > 0 && job.salary_max > 0) {
        const diff = Math.abs(sourceJob.salary_max - job.salary_max) / sourceJob.salary_max
        if (diff <= 0.2) score += 2
        else if (diff <= 0.4) score += 1
      }

      return { ...job, _score: score }
    })

    // Sort by score descending, return top 4 with minimum relevance
    scored.sort((a, b) => b._score - a._score)

    const results = scored
      .slice(0, 4)
      .filter((job) => job._score >= 2)
      .map(({ _score, ...rest }) => rest)

    const cacheHeaders = {
      'Cache-Control': 'public, max-age=0, s-maxage=120, stale-while-revalidate=600',
      'Vary': 'Accept-Encoding',
    }
    const { response } = withETag(request, results, cacheHeaders)
    return response
  } catch (error) {
    logger.error('Error fetching similar jobs:', error)
    return NextResponse.json({ error: 'Failed to fetch similar jobs', code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
