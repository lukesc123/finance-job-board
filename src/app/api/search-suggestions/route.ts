import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')?.toLowerCase()

    if (!query || query.length < 2) {
      return NextResponse.json({ suggestions: [] })
    }

    const { data: jobs, error } = await supabaseAdmin
      .from('jobs')
      .select('title, category, location, company:companies(name)')
      .eq('is_active', true)

    if (error) throw error

    const suggestions = []
    const seen = new Set()
    const titleMatches = (jobs || []).filter(j => j.title.toLowerCase().includes(query)).slice(0, 3)
    for (const j of titleMatches) { const k = 't:'+j.title; if (!seen.has(k)) { seen.add(k); suggestions.push({ type: 'job', value: j.title }) } }
    const companyNames = new Map()
    for (const j of jobs || []) { const n = j.company?.name; if (n && n.toLowerCase().includes(query)) companyNames.set(n, (companyNames.get(n)||0)+1) }
    for (const [n,c] of [...companyNames].slice(0,3)) suggestions.push({ type: 'company', value: n, count: c })
    const cats = new Map()
    for (const j of jobs || []) { if (j.category.toLowerCase().includes(query)) cats.set(j.category, (cats.get(j.category)||0)+1) }
    for (const [c,n] of [...cats].slice(0,3)) suggestions.push({ type: 'category', value: c, count: n })
    const locs = new Map()
    for (const j of jobs || []) { if (j.location.toLowerCase().includes(query)) { const l = k.location.split(',')[0].trim(); locs.set(l, (locs.get(l)||0)+1) } }
    for (const [l,c] of [...locs].slice(0,3)) { if (!seen.has('l:'+l)) { seen.add('l:'+l); suggestions.push({ type: 'location', value: l, count: c }) } }
    return NextResponse.json({ suggestions: suggestions.slice(0, 8) })
  } catch (error) { return NextResponse.json({ suggestions: [] }) }
}
