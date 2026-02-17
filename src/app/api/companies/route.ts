import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { requireAdmin } from '@/lib/auth'
import { rateLimit, getClientIP } from '@/lib/rateLimit'
import { logger } from '@/lib/logger'
import { withETag } from '@/lib/etag'

export async function GET(request: NextRequest) {
  try {
    const ip = getClientIP(request)
    const { limited } = rateLimit(`companies:${ip}`, 60, 60_000)
    if (limited) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': '60' } }
      )
    }

    // Select only columns needed by the client (skip large text fields)
    const { data, error } = await supabaseAdmin
      .from('companies')
      .select('id,name,website,careers_url,logo_url,description')
      .order('name', { ascending: true })
      .limit(2000)

    if (error) throw error

    const cacheHeaders = {
      'Cache-Control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=900',
      'Vary': 'Accept-Encoding',
    }
    const { response } = withETag(request, data ?? [], cacheHeaders)
    return response
  } catch (error) {
    logger.error('Error fetching companies:', error)
    return NextResponse.json({ error: 'Failed to fetch companies', code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}

function validateUrl(url: string): boolean {
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`)
    return parsed.protocol === 'https:' || parsed.protocol === 'http:'
  } catch {
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    requireAdmin(request)
    const body = await request.json()

    if (!body.name || typeof body.name !== 'string' || body.name.trim().length < 1 || body.name.trim().length > 255) {
      return NextResponse.json({ error: 'name is required (1-255 characters)' }, { status: 400 })
    }
    if (body.website && !validateUrl(body.website)) {
      return NextResponse.json({ error: 'website must be a valid URL' }, { status: 400 })
    }
    if (body.careers_url && !validateUrl(body.careers_url)) {
      return NextResponse.json({ error: 'careers_url must be a valid URL' }, { status: 400 })
    }
    if (body.logo_url && !validateUrl(body.logo_url)) {
      return NextResponse.json({ error: 'logo_url must be a valid URL' }, { status: 400 })
    }
    if (body.description && (typeof body.description !== 'string' || body.description.length > 5000)) {
      return NextResponse.json({ error: 'description must be under 5000 characters' }, { status: 400 })
    }

    const id = crypto.randomUUID()
    const now = new Date().toISOString()

    const payload = {
      id,
      name: body.name.trim(),
      website: body.website || null,
      careers_url: body.careers_url || null,
      logo_url: body.logo_url || null,
      description: body.description?.trim() || null,
      created_at: now,
    }

    const { data, error } = await supabaseAdmin
      .from('companies')
      .insert(payload)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: unknown) {
    logger.error('Error creating company:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to create company', code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
