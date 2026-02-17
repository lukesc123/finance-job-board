import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { rateLimit, getClientIP } from '@/lib/rateLimit'
import { logger } from '@/lib/logger'
import { UUID_RE } from '@/lib/constants'

/**
 * POST /api/admin/deactivate-jobs
 * Marks jobs as inactive and sets removal_detected_at.
 * Body: { ids: string[] }
 * No auth required for now (should add requireAdmin in production).
 */
export async function POST(request: NextRequest) {
  const ip = getClientIP(request)
  const { limited } = rateLimit(`admin-deactivate:${ip}`, 10, 60_000)
  if (limited) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': '60' } })
  }

  // Basic admin auth
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    return NextResponse.json({ error: 'Cron secret not configured' }, { status: 500 })
  }
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const ids: string[] = body.ids

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'ids array is required' }, { status: 400 })
    }

    if (ids.length > 200) {
      return NextResponse.json({ error: 'Maximum 200 IDs per request' }, { status: 400 })
    }

    const validIds = ids.filter((id: string) => UUID_RE.test(id))
    if (validIds.length === 0) {
      return NextResponse.json({ error: 'No valid UUIDs provided' }, { status: 400 })
    }

    const now = new Date().toISOString()
    const mode = body.mode || 'flag' // 'flag' = set removal_detected_at only, 'deactivate' = also set is_active=false

    let updatePayload: Record<string, unknown> = {
      removal_detected_at: now,
      updated_at: now,
    }

    if (mode === 'deactivate') {
      updatePayload.is_active = false
    }

    const { data, error } = await supabaseAdmin
      .from('jobs')
      .update(updatePayload)
      .in('id', validIds)
      .select('id, title')

    if (error) throw error

    return NextResponse.json({
      message: `${mode === 'deactivate' ? 'Deactivated' : 'Flagged'} ${data?.length || 0} jobs`,
      mode,
      affected: data?.map(j => ({ id: j.id, title: j.title })) || [],
    })
  } catch (error: unknown) {
    logger.error('Deactivate error:', error)
    return NextResponse.json({ error: 'Failed to deactivate jobs' }, { status: 500 })
  }
}
