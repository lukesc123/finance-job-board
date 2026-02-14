import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

// Patterns that indicate a generic career page (not a specific job posting)
// Uses regex for precise matching - generic only when it's the terminal path segment
const GENERIC_REGEXES = [
  /\/search-jobs\/?$/i,                    // bare /search-jobs with nothing after
  /\/job-search\/?$/i,
  /\/careers\/?$/i,                        // bare /careers
  /\/early-careers?\/?$/i,                 // /early-careers or /early-career
  /\/entry-level\/?$/i,
  /\/students-and-graduates\/?$/i,
  /\/students\/?$/i,                       // bare /students (not /students/assurance)
  /\/SearchJobs\/?$/i,
  /\/Campus\/?$/i,
  /\/job-search-results\/?$/i,
  /\/career-opportunities\/?$/i,
  /\/open-positions\/?$/i,
  /\/current-openings\/?$/i,
  /\/job-openings\/?$/i,
]

function isGenericUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    const path = parsed.pathname
    // If URL has search params with keywords/query, it's targeted (not generic)
    if (parsed.search && /[?&](q|query|keyword|keywords|search)=/i.test(parsed.search)) {
      return false
    }
    return GENERIC_REGEXES.some(regex => regex.test(path))
  } catch {
    return !url || url.length === 0
  }
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
