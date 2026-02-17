import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimit, getClientIP } from '@/lib/rateLimit'
import { UUID_RE } from '@/lib/constants'

// POST /api/tracker/migrate - bulk import localStorage data to Supabase
export async function POST(request: NextRequest) {
  const ip = getClientIP(request)
  const { limited } = rateLimit(`migrate:${ip}`, 5, 60_000)
  if (limited) {
    return NextResponse.json(
      { error: 'Too many requests', code: 'RATE_LIMITED' },
      { status: 429, headers: { 'Retry-After': '60' } }
    )
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { applications } = body as {
    applications: Array<{
      job_id: string
      status?: string
      notes?: string
      applied_date?: string
    }>
  }

  if (!applications || !Array.isArray(applications) || applications.length === 0) {
    return NextResponse.json({ migrated: 0 })
  }

  if (applications.length > 200) {
    return NextResponse.json({ error: 'Too many applications (max 200)' }, { status: 400 })
  }

  const validApps = applications.filter(app => app.job_id && UUID_RE.test(app.job_id))
  if (validApps.length === 0) {
    return NextResponse.json({ migrated: 0 })
  }

  const rows = validApps.map(app => ({
    user_id: user.id,
    job_id: app.job_id,
    status: app.status || 'applied',
    notes: (app.notes || '').slice(0, 2000) || null,
    applied_date: app.applied_date || new Date().toISOString(),
  }))

  const { data, error } = await supabase
    .from('user_applications')
    .upsert(rows, { onConflict: 'user_id,job_id', ignoreDuplicates: true })
    .select()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ migrated: data?.length || 0 })
}
