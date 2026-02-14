import Link from 'next/link'
import { Metadata } from 'next'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Companies Hiring | FinanceJobs',
  description: 'Browse all companies with entry-level finance and accounting job openings. Find your next employer and explore open positions.',
  openGraph: {
    title: 'Companies Hiring | FinanceJobs',
    description: 'Browse all companies with entry-level finance and accounting job openings.',
    type: 'website',
  },
}

interface CompanyWithCount {
  id: string
  name: string
  website: string
  careers_url: string
  logo_url: string | null
  description: string | null
  job_count: number
  categories: string[]
  locations: string[]
}

async function getCompaniesWithJobs(): Promise<CompanyWithCount[]> {
  const { data: companies } = await supabaseAdmin
    .from('companies')
    .select('*')
    .order('name', { ascending: true })

  const { data: jobs } = await supabaseAdmin
    .from('jobs')
    .select('company_id, category, location')
    .eq('is_active', true)

  if (!companies) return []

  const jobsByCompany: Record<string, { count: number; categories: Set<string>; locations: Set<string> }> = {}
  ;(jobs || []).forEach((job: any) => {
    if (!jobsByCompany[job.company_id]) {
      jobsByCompany[job.company_id] = { count: 0, categories: new Set(), locations: new Set() }
    }
    jobsByCompany[job.company_id].count++
    if (job.category) jobsByCompany[job.company_id].categories.add(job.category)
    if (job.location) jobsByCompany[job.company_id].locations.add(job.location)
  })

  return companies
    .filter((c: any) => jobsByCompany[c.id]?.count > 0)
    .map((c: any) => ({
      id: c.id,
      name: c.name,
      website: c.website,
      careers_url: c.careers_url,
      logo_url: c.logo_url,
      description: c.description,
      job_count: jobsByCompany[c.id]?.count || 0,
      categories: Array.from(jobsByCompany[c.id]?.categories || []),
      locations: Array.from(jobsByCompany[c.id]?.locations || []).slice(0, 5),
    }))
    .sort((a: CompanyWithCount, b: CompanyWithCount) => b.job_count - a.job_count)
}

export default async function CompaniesPage() {
  const companies = await getCompaniesWithJobs()
  const totalJobs = companies.reduce((sum, c) => sum + c.job_count, 0)

  return (
    <div className="min-h-screen bg-navy-50">
      {/* Hero */}
      <section className="bg-gradient-to-b from-navy-950 to-navy-900 text-white py-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-3">
            Companies Hiring
          </h1>
          <p className="text-base sm:text-lg text-navy-300 mb-4 max-w-2xl mx-auto">
            Browse {companies.length} companies with {totalJobs} open entry-level finance positions.
          </p>
        </div>
      </section>

      {/* Company Grid */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {companies.map((company) => (
            <div key={company.id} className="rounded-xl border border-navy-200 bg-white p-5 hover:shadow-md transition-shadow group">
              <div className="flex items-start gap-3 mb-3">
                {company.logo_url ? (
                  <img src={company.logo_url} alt="" className="h-10 w-10 rounded-lg object-contain border border-navy-100 bg-white flex-shrink-0" />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy-100 text-navy-600 font-bold text-sm flex-shrink-0">
                    {company.name.charAt(0)}
                  </div>
                )}
                <div className="min-w-0">
                  <Link
                    href={`/?company=${encodeURIComponent(company.name)}`}
                    className="font-bold text-navy-900 group-hover:text-navy-700 transition block truncate"
                  >
                    {company.name}
                  </Link>
                  <p className="text-xs text-navy-500">
                    <span className="font-semibold text-navy-700">{company.job_count}</span> open {company.job_count === 1 ? 'position' : 'positions'}
                  </p>
                </div>
              </div>

              {company.description && (
                <p className="text-xs text-navy-600 leading-relaxed mb-3 line-clamp-2">
                  {company.description}
                </p>
              )}

              {/* Categories */}
              <div className="flex flex-wrap gap-1 mb-3">
                {company.categories.slice(0, 3).map((cat) => (
                  <Link
                    key={cat}
                    href={`/?company=${encodeURIComponent(company.name)}&category=${encodeURIComponent(cat)}`}
                    className="rounded-full bg-navy-50 px-2 py-0.5 text-[10px] font-medium text-navy-600 hover:bg-navy-100 transition"
                  >
                    {cat}
                  </Link>
                ))}
                {company.categories.length > 3 && (
                  <span className="rounded-full bg-navy-50 px-2 py-0.5 text-[10px] font-medium text-navy-400">
                    +{company.categories.length - 3} more
                  </span>
                )}
              </div>

              {/* Locations */}
              {company.locations.length > 0 && (
                <div className="flex items-center gap-1 text-[10px] text-navy-400 mb-3">
                  <svg className="h-3 w-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="truncate">{company.locations.join(', ')}</span>
                </div>
              )}

              {/* Links */}
              <div className="flex items-center gap-3 pt-2 border-t border-navy-100">
                <Link
                  href={`/?company=${encodeURIComponent(company.name)}`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-navy-600 hover:text-navy-900 transition"
                >
                  View Jobs
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
                {company.careers_url && (
                  <a
                    href={company.careers_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-medium text-navy-400 hover:text-navy-600 transition"
                  >
                    Careers Page
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                )}
                {company.website && (
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-medium text-navy-400 hover:text-navy-600 transition ml-auto"
                  >
                    Website
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
