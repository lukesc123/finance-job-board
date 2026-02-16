import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/tracker/migrate - bulk import localStorage data to Supabase
export async function POST(request: Request) {
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

  // Upsert all applications (skip conflicts with existing data)
  const rows = applications.map(app => ({
    user_id: user.id,
    job_id: app.job_id,
    status: app.status || 'applied',
    notes: app.notes || null,
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
