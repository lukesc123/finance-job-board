import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimit, getClientIP } from '@/lib/rateLimit'
import { logger } from '@/lib/logger'
import { UUID_RE } from '@/lib/constants'
const VALID_STATUSES = ['applied', 'interviewing', 'offered', 'rejected', 'withdrawn']

// Only select columns needed by the client
const TRACKER_SELECT = 'id,job_id,status,notes,applied_date'

// GET /api/tracker - get all tracked applications for current user
export async function GET(request: NextRequest) {
  try {
    const ip = getClientIP(request)
    const { limited } = rateLimit(`tracker:${ip}`, 60, 60_000)
    if (limited) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': '60' } })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('user_applications')
      .select(TRACKER_SELECT)
      .eq('user_id', user.id)
      .order('applied_date', { ascending: false })
      .limit(500)

    if (error) {
      return NextResponse.json({ error: error.message, code: 'DATABASE_ERROR' }, { status: 500 })
    }

    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'private, no-store' },
    })
  } catch (error) {
    logger.error('Error in tracker GET:', error)
    return NextResponse.json({ error: 'Internal error', code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}

// POST /api/tracker - add or update a tracked application
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { job_id, status = 'applied', notes, applied_date } = body

    if (!job_id || !UUID_RE.test(job_id)) {
      return NextResponse.json({ error: 'job_id must be a valid UUID' }, { status: 400 })
    }
    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: `status must be one of: ${VALID_STATUSES.join(', ')}` }, { status: 400 })
    }

    if (notes !== undefined && typeof notes === 'string' && notes.length > 2000) {
      return NextResponse.json({ error: 'notes must be under 2000 characters' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('user_applications')
      .upsert(
        {
          user_id: user.id,
          job_id,
          status,
          notes: notes ? (notes as string).slice(0, 2000) : null,
          applied_date: applied_date || new Date().toISOString(),
        },
        { onConflict: 'user_id,job_id' }
      )
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message, code: 'DATABASE_ERROR' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    logger.error('Error in tracker POST:', error)
    return NextResponse.json({ error: 'Internal error', code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}

// PATCH /api/tracker - update status or notes for an application
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { job_id, status, notes } = body

    if (!job_id || !UUID_RE.test(job_id)) {
      return NextResponse.json({ error: 'job_id must be a valid UUID' }, { status: 400 })
    }
    if (status !== undefined && !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: `status must be one of: ${VALID_STATUSES.join(', ')}` }, { status: 400 })
    }

    if (notes !== undefined && typeof notes === 'string' && notes.length > 2000) {
      return NextResponse.json({ error: 'notes must be under 2000 characters' }, { status: 400 })
    }

    const updates: Record<string, string> = {}
    if (status !== undefined) updates.status = status
    if (notes !== undefined) updates.notes = typeof notes === 'string' ? notes.slice(0, 2000) : notes

    const { data, error } = await supabase
      .from('user_applications')
      .update(updates)
      .eq('user_id', user.id)
      .eq('job_id', job_id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message, code: 'DATABASE_ERROR' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    logger.error('Error in tracker PATCH:', error)
    return NextResponse.json({ error: 'Internal error', code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}

// DELETE /api/tracker - remove an application
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const job_id = searchParams.get('job_id')

    if (!job_id || !UUID_RE.test(job_id)) {
      return NextResponse.json({ error: 'job_id must be a valid UUID' }, { status: 400 })
    }

    const { error } = await supabase
      .from('user_applications')
      .delete()
      .eq('user_id', user.id)
      .eq('job_id', job_id)

    if (error) {
      return NextResponse.json({ error: error.message, code: 'DATABASE_ERROR' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Error in tracker DELETE:', error)
    return NextResponse.json({ error: 'Internal error', code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
