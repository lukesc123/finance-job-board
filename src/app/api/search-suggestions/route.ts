import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { rateLimit, getClientIP } from '@/lib/rateLimit'
import { logger } from '@/lib/logger'
import { withETag } from '@/lib/etag'

export async function GET(request: NextRequest) {
  try {
    const ip = getClientIP(request)
    const { limited } = rateLimit(`suggestions:${ip}`, 60, 60_000)
    if (limited) {
      return NextResponse.json(
        { suggestions: [] },
        { status: 429, headers: { 'Retry-After': '60' } }
      )
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')?.slice(0, 100).toLowerCase()

    if (!query || query.length < 2) {
      return NextResponse.json({ suggestions: [] })
    }

    // Escape SQL LIKE wildcards to prevent pattern injection
    const escaped = query.replace(/[%_\\]/g, '\\$&')
    // Use prefix match first (uses indexes), fall back to contains for short queries
    const prefixPattern = `${escaped}%`
    const containsPattern = `%${escaped}%`

    // Run filtered queries in parallel
    // Strategy: prefix match is much faster (can use B-tree/trigram indexes)
    // We use prefix for company/category (short fields) and contains for title/location
    const [titleRes, companyRes, locationRes, categoryRes] = await Promise.all([
      // Title matches: contains pattern (users search mid-word often)
      supabaseAdmin
        .from('jobs')
        .select('title')
        .eq('is_active', true)
        .ilike('title', containsPattern)
        .order('posted_date', { ascending: false })
        .limit(5),

      // Company matches: prefer prefix (faster, more relevant for autocomplete)
      supabaseAdmin
        .from('companies')
        .select('name, jobs:jobs(count)')
        .ilike('name', prefixPattern)
        .limit(5),

      // Location matches: contains (users may type city without state)
      supabaseAdmin
        .from('jobs')
        .select('location')
        .eq('is_active', true)
        .ilike('location', containsPattern)
        .limit(50),

      // Category matches: prefix (categories are short, well-known strings)
      supabaseAdmin
        .from('jobs')
        .select('category')
        .eq('is_active', true)
        .ilike('category', prefixPattern)
        .limit(50),
    ])

    const suggestions: { type: string; value: string; count?: number }[] = []
    const seen = new Set<string>()

    // Title suggestions (deduplicated)
    if (titleRes.data) {
      for (const j of titleRes.data) {
        const k = 't:' + j.title
        if (!seen.has(k)) {
          seen.add(k)
          suggestions.push({ type: 'job', value: j.title })
          if (suggestions.length >= 3) break
        }
      }
    }

    // Company suggestions with job counts
    if (companyRes.data) {
      for (const co of companyRes.data.slice(0, 3)) {
        const count = Array.isArray(co.jobs) && co.jobs[0] ? (co.jobs[0] as { count: number }).count : 0
        if (count > 0) {
          suggestions.push({ type: 'company', value: co.name, count })
        }
      }
    }

    // Category suggestions with counts
    if (categoryRes.data) {
      const cats = new Map<string, number>()
      for (const j of categoryRes.data) {
        cats.set(j.category, (cats.get(j.category) || 0) + 1)
      }
      for (const [c, n] of [...cats].slice(0, 3)) {
        suggestions.push({ type: 'category', value: c, count: n })
      }
    }

    // Location suggestions with counts (deduplicate by full location string)
    if (locationRes.data) {
      const locs = new Map<string, number>()
      for (const j of locationRes.data) {
        const loc = j.location.trim()
        locs.set(loc, (locs.get(loc) || 0) + 1)
      }
      const sorted = [...locs].sort((a, b) => b[1] - a[1])
      for (const [l, c] of sorted.slice(0, 3)) {
        const k = 'l:' + l
        if (!seen.has(k)) {
          seen.add(k)
          suggestions.push({ type: 'location', value: l, count: c })
        }
      }
    }

    const payload = { suggestions: suggestions.slice(0, 8) }
    const cacheHeaders = {
      'Cache-Control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=600',
      'Vary': 'Accept-Encoding',
    }
    const { response } = withETag(request, payload, cacheHeaders)
    return response
  } catch (error) {
    logger.error('Search suggestions error:', error)
    return NextResponse.json({ suggestions: [], code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
