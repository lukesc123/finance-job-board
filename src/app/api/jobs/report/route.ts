import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { rateLimit, getClientIP } from '@/lib/rateLimit'
import { logger } from '@/lib/logger'
import { UUID_RE } from '@/lib/constants'
const VALID_REASONS = ['dead_link', 'not_entry_level', 'duplicate', 'spam', 'other']

/**
 * POST /api/jobs/report
 * Allows users to report dead links or problematic jobs.
 * If a job accumulates enough reports, it can be auto-flagged for review.
 */
export async function POST(request: NextRequest) {
  const ip = getClientIP(request)
  const { limited } = rateLimit(`report:${ip}`, 10, 60_000)
  if (limited) {
    return NextResponse.json(
      { error: 'Too many reports. Please try again later.', code: 'RATE_LIMITED' },
      { status: 429, headers: { 'Retry-After': '60' } }
    )
  }

  try {
    const body = await request.json()
    const { job_id, reason } = body

    if (!job_id || !UUID_RE.test(job_id)) {
      return NextResponse.json({ error: 'Valid job ID required', code: 'INVALID_INPUT' }, { status: 400 })
    }
    if (!reason || !VALID_REASONS.includes(reason)) {
      return NextResponse.json({ error: `reason must be one of: ${VALID_REASONS.join(', ')}`, code: 'INVALID_INPUT' }, { status: 400 })
    }

    // Check if the job exists
    const { data: job, error: jobError } = await supabaseAdmin
      .from('jobs')
      .select('id, is_active, removal_detected_at')
      .eq('id', job_id)
      .single()

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found', code: 'NOT_FOUND' }, { status: 404 })
    }

    // For dead_link reports, immediately flag the job for verification
    if (reason === 'dead_link' && job.is_active && !job.removal_detected_at) {
      await supabaseAdmin
        .from('jobs')
        .update({ removal_detected_at: new Date().toISOString() })
        .eq('id', job_id)
    }

    return NextResponse.json({ reported: true })
  } catch (error) {
    logger.error('Error reporting job:', error)
    return NextResponse.json({ error: 'Failed to report job', code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
