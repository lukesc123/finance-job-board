import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('id')

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID required' }, { status: 400 })
    }

    // Fetch the source job
    const { data: sourceJob, error: jobError } = await supabaseAdmin
      .from('jobs')
      .select('*, company:companies(*)')
      .eq('id', jobId)
      .single()

    if (jobError || !sourceJob) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Fetch candidate jobs: prefer same category + pipeline stage, fall back to broader pool
    const { data: sameCategoryCandidates, error: catErr } = await supabaseAdmin
      .from('jobs')
      .select('*, company:companies(*)')
      .eq('is_active', true)
      .eq('category', sourceJob.category)
      .neq('id', jobId)
      .order('posted_date', { ascending: false })
      .limit(50)

    if (catErr) throw catErr

    // If few same-category results, fetch more from same pipeline stage
    let candidates = sameCategoryCandidates || []
    if (candidates.length < 8) {
      const existingIds = new Set(candidates.map(j => j.id))
      const { data: stageCandidates, error: stageErr } = await supabaseAdmin
        .from('jobs')
        .select('*, company:companies(*)')
        .eq('is_active', true)
        .eq('pipeline_stage', sourceJob.pipeline_stage)
        .neq('id', jobId)
        .order('posted_date', { ascending: false })
        .limit(30)
      if (stageErr) throw stageErr
      const extra = (stageCandidates || []).filter(j => !existingIds.has(j.id))
      candidates = [...candidates, ...extra]
    }

    const error = null

    if (error) throw error

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

      return { ...job, _score: score }
    })

    // Sort by score descending, return top 4 with minimum relevance
    scored.sort((a, b) => b._score - a._score)

    const results = scored
      .slice(0, 4)
      .filter((job) => job._score >= 2)
      .map(({ _score, ...rest }) => rest)

    return NextResponse.json(results, {
      headers: { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=600' },
    })
  } catch (error) {
    console.error('Error fetching similar jobs:', error)
    return NextResponse.json({ error: 'Failed to fetch similar jobs' }, { status: 500 })
  }
}
