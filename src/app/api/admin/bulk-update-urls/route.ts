import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { requireAdmin } from '@/lib/auth'

/**
 * POST /api/admin/bulk-update-urls
 * Bulk update apply_url for multiple jobs.
 * Body: { updates: [{ id: string, apply_url: string }] }
 * Requires admin auth.
 */
export async function POST(request: NextRequest) {
  try {
    requireAdmin(request)

    const body = await request.json()
    const updates: { id: string; apply_url: string }[] = body.updates

    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json({ error: 'updates array is required' }, { status: 400 })
    }

    if (updates.length > 100) {
      return NextResponse.json({ error: 'Maximum 100 updates per request' }, { status: 400 })
    }

    // Validate all entries
    for (const update of updates) {
      if (!update.id || !update.apply_url) {
        return NextResponse.json({ error: `Invalid update entry: id and apply_url are required` }, { status: 400 })
      }
      // Basic URL validation
      try {
        new URL(update.apply_url.startsWith('http') ? update.apply_url : `https://${update.apply_url}`)
      } catch {
        return NextResponse.json({ error: `Invalid URL for job ${update.id}: ${update.apply_url}` }, { status: 400 })
      }
    }

    const now = new Date().toISOString()
    const results: { id: string; success: boolean; error?: string }[] = []

    for (const update of updates) {
      const { error } = await supabaseAdmin
        .from('jobs')
        .update({
          apply_url: update.apply_url,
          updated_at: now,
        })
        .eq('id', update.id)

      if (error) {
        results.push({ id: update.id, success: false, error: error.message })
      } else {
        results.push({ id: update.id, success: true })
      }
    }

    const succeeded = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success).length

    return NextResponse.json({
      message: `Updated ${succeeded} jobs, ${failed} failed`,
      results,
    })
  } catch (error: unknown) {
    console.error('Bulk update error:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Bulk update failed' }, { status: 500 })
  }
}
