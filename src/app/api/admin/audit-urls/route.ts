import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

// Patterns that indicate a generic career page (not a specific job posting)
const GENERIC_PATTERNS = [
  '/search-jobs',
  '/job-search',
  '/careers/$',
  '/careers$',
  '/early-careers',
  '/early-career',
  '/entry-level',
  '/students-and-graduates',
  '/students',
  '/SearchJobs',
  '/Campus$',
  '/job-search-results',
  '/career-opportunities$',
]

function isGenericUrl(url: string): boolean {
  const normalized = url.replace(/\/$/, '') // remove trailing slash
  return GENERIC_PATTERNS.some(pattern => {
    if (pattern.endsWith('$')) {
      return normalized.endsWith(pattern.replace('$', ''))
    }
    return normalized.includes(pattern)
  })
}

export async function GET() {
  try {
    const { data: jobs, error } = await supabaseAdmin
      .from('jobs')
      .select('id, title, apply_url, is_active, company:company_id(name)')
      .eq('is_active', true)
      .order('posted_date', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const results = jobs.map((j: any) => {
      const companyName = Array.isArray(j.company) ? j.company[0]?.name : j.company?.name
      const url = j.apply_url || ''
      return {
        id: j.id,
        title: j.title,
        company: companyName || 'Unknown',
        apply_url: url,
        is_generic: isGenericUrl(url),
        has_url: !!url && url.length > 0,
      }
    })

    const generic = results.filter((r: any) => r.is_generic)
    const specific = results.filter((r: any) => !r.is_generic && r.has_url)
    const missing = results.filter((r: any) => !r.has_url)

    return NextResponse.json({
      total: results.length,
      specific_count: specific.length,
      generic_count: generic.length,
      missing_count: missing.length,
      generic_jobs: generic.map((r: any) => ({
        id: r.id,
        title: r.title,
        company: r.company,
        apply_url: r.apply_url,
      })),
      by_company: Object.entries(
        results.reduce((acc: any, r: any) => {
          if (!acc[r.company]) acc[r.company] = { total: 0, generic: 0, specific: 0 }
          acc[r.company].total++
          if (r.is_generic) acc[r.company].generic++
          else acc[r.company].specific++
          return acc
        }, {})
      ).sort((a: any, b: any) => b[1].generic - a[1].generic),
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
