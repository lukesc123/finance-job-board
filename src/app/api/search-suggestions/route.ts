import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { rateLimit, getClientIP } from '@/lib/rateLimit'

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
    const query = searchParams.get('q')?.toLowerCase()

    if (!query || query.length < 2) {
      return NextResponse.json({ suggestions: [] })
    }

    const { data: jobs, error } = await supabaseAdmin
      .from('jobs')
      .select('title, category, location, company:company_id(name)')
      .eq('is_active', true)
      .limit(1000)

    if (error) throw error

    interface SuggestionJob {
      title: string
      category: string
      location: string
      company: { name: string } | { name: string }[] | null
    }
    const jobList = (jobs || []) as SuggestionJob[]
    const suggestions: { type: string; value: string; count?: number }[] = []
    const seen = new Set<string>()

    // Title matches
    const titleMatches = jobList.filter(j => j.title.toLowerCase().includes(query)).slice(0, 3)
    for (const j of titleMatches) {
      const k = 't:' + j.title
      if (!seen.has(k)) { seen.add(k); suggestions.push({ type: 'job', value: j.title }) }
    }

    // Company matches
    const companyNames = new Map<string, number>()
    for (const j of jobList) {
      const co = Array.isArray(j.company) ? j.company[0] : j.company
      const n = co?.name
      if (n && n.toLowerCase().includes(query)) companyNames.set(n, (companyNames.get(n) || 0) + 1)
    }
    for (const [n, c] of [...companyNames].slice(0, 3)) {
      suggestions.push({ type: 'company', value: n, count: c })
    }

    // Category matches
    const cats = new Map<string, number>()
    for (const j of jobList) {
      if (j.category.toLowerCase().includes(query)) cats.set(j.category, (cats.get(j.category) || 0) + 1)
    }
    for (const [c, n] of [...cats].slice(0, 3)) {
      suggestions.push({ type: 'category', value: c, count: n })
    }

    // Location matches
    const locs = new Map<string, number>()
    for (const j of jobList) {
      if (j.location.toLowerCase().includes(query)) {
        const l = j.location.split(',')[0].trim()
        locs.set(l, (locs.get(l) || 0) + 1)
      }
    }
    for (const [l, c] of [...locs].slice(0, 3)) {
      if (!seen.has('l:' + l)) { seen.add('l:' + l); suggestions.push({ type: 'location', value: l, count: c }) }
    }

    return NextResponse.json({ suggestions: suggestions.slice(0, 8) }, {
      headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120' },
    })
  } catch {
    return NextResponse.json({ suggestions: [] })
  }
}
