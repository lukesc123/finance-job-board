import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { requireAdmin } from '@/lib/auth'

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('companies')
      .select('*')
      .order('name', { ascending: true })

    if (error) throw error

    return NextResponse.json(data ?? [], {
      headers: { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=600' },
    })
  } catch (error) {
    console.error('Error fetching companies:', error)
    return NextResponse.json({ error: 'Failed to fetch companies' }, { status: 500 })
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
      name: body.name,
      website: body.website,
      careers_url: body.careers_url || null,
      logo_url: body.logo_url || null,
      description: body.description || null,
      created_at: now,
    }

    const { data, error } = await supabaseAdmin
      .from('companies')
      .insert(payload)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Error creating company:', error)
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to create company' }, { status: 500 })
  }
}
