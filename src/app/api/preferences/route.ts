import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { JOB_CATEGORIES } from '@/types'

const VALID_FREQUENCIES = ['daily', 'weekly', 'none']

// GET /api/preferences - get user preferences
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = no rows returned (new user)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Return defaults for new users
  if (!data) {
    return NextResponse.json({
      tracked_categories: [],
      email_digest_enabled: false,
      email_digest_frequency: 'daily',
    })
  }

  return NextResponse.json(data)
}

// PUT /api/preferences - create or update user preferences
export async function PUT(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { tracked_categories, email_digest_enabled, email_digest_frequency } = body

  if (tracked_categories !== undefined) {
    if (!Array.isArray(tracked_categories) ||
        !tracked_categories.every((c: unknown) => typeof c === 'string' && (JOB_CATEGORIES as readonly string[]).includes(c))) {
      return NextResponse.json({ error: 'tracked_categories must be an array of valid categories' }, { status: 400 })
    }
  }
  if (email_digest_frequency !== undefined && !VALID_FREQUENCIES.includes(email_digest_frequency)) {
    return NextResponse.json({ error: `email_digest_frequency must be one of: ${VALID_FREQUENCIES.join(', ')}` }, { status: 400 })
  }
  if (email_digest_enabled !== undefined && typeof email_digest_enabled !== 'boolean') {
    return NextResponse.json({ error: 'email_digest_enabled must be a boolean' }, { status: 400 })
  }

  const updates: Record<string, unknown> = { user_id: user.id }
  if (tracked_categories !== undefined) updates.tracked_categories = tracked_categories
  if (email_digest_enabled !== undefined) updates.email_digest_enabled = email_digest_enabled
  if (email_digest_frequency !== undefined) updates.email_digest_frequency = email_digest_frequency

  const { data, error } = await supabase
    .from('user_preferences')
    .upsert(updates, { onConflict: 'user_id' })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
