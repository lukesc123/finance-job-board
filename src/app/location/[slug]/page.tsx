import Link from 'next/link'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { timeAgo, formatSalary, slugify, stageColors, isGenericApplyUrl } from '@/lib/formatting'

export const revalidate = 300

interface LocationJob {
  id: string
  title: string
  category: string
  location: string
  remote_type: string
  salary_min: number | null
  salary_max: number | null
  job_type: string
  pipeline_stage: string
  licenses_required: string[]
  posted_date: string
  apply_url: string | null
  company: { name: string; logo_url: string | null } | null
}

async function getAllLocations(): Promise<string[]> {
  const { data } = await supabaseAdmin
    .from('jobs')
    .select('location')
    .eq('is_active', true)

  if (!data) return []
  return [...new Set(data.map((j: any) => j.location as string))].filter(Boolean).sort()
}

async function getLocationJobs(locationSlug: string): Promise<{ location: string; jobs: LocationJob[] } | null> {
  const locations = await getAllLocations()
  const location = locations.find((loc) => slugify(loc) === locationSlug)
  if (!location) return null

  const { data } = await supabaseAdmin
    .from('jobs')
    .select('id, title, category, location, remote_type, salary_min, salary_max, job_type, pipeline_stage, licenses_required, posted_date, apply_url, company:company_id(name, logo_url)')
    .eq('location', location)
    .eq('is_active', true)
    .order('posted_date', { ascending: false })

  const jobs = ((data || []) as any[]).map((j) => ({
    ...j,
    company: Array.isArray(j.company) ? j.company[0] || null : j.company,
  })) as LocationJob[]

  return { location, jobs }
}

const LOCATION_DESCRIPTIONS: Record<string, string> = {
  'New York, NY': 'The financial capital of the world. Home to Wall Street, major investment banks, hedge funds, and the NYSE. The largest concentration of entry-level finance jobs in the US.',
  'San Francisco, CA': 'Hub for fintech, venture capital, and tech-focused finance roles. Home to leading VC firms on Sand Hill Road and growing fintech startups.',
  'Chicago, IL': 'Major center for derivatives trading, commodities, and commercial banking. Home to the CME Group, CBOE, and top proprietary trading firms.',
  'Charlotte, NC': 'Second-largest banking center in the US. Headquarters of Bank of America and Truist, with a growing financial services ecosystem.',
  'Boston, MA': 'Leading center for asset management and mutual funds. Home to Fidelity, State Street, and numerous hedge funds.',
  'Houston, TX': 'Energy finance capital with strong investment banking, energy trading, and commercial banking presence.',
  'Miami, FL': 'Growing financial hub for wealth management, Latin American banking, and alternative investments.',
  'Dallas, TX': 'Major center for commercial banking, insurance, and corporate finance with a growing private equity presence.',
  'Los Angeles, CA': 'West Coast finance hub for entertainment banking, real estate finance, and wealth management.',
  'Washington, DC': 'Center for government finance, regulatory roles, consulting, and policy-oriented financial positions.',
  'Philadelphia, PA': 'Historic financial center with strength in insurance, asset management, and commercial banking.',
  'Minneapolis, MN': 'Strong presence in corporate finance, banking, and insurance. Home to major financial services companies.',
  'Salt Lake City, UT': 'Emerging finance hub with growing presence of Goldman Sachs and other major firms.',
  'Pittsburgh, PA': 'Growing financial services center with roles in asset management and banking.',
  'Atlanta, GA': 'Southeast financial hub with strength in commercial banking, fintech, and corporate finance.',
  'Denver, CO': 'Growing market for wealth management, corporate finance, and financial technology.',
  'St. Louis, MO': 'Home to major financial institutions including Edward Jones and regional banking headquarters.',
  'Nashville, TN': 'Emerging financial center with growing healthcare finance and banking sectors.',
  'Remote': 'Work-from-anywhere finance positions. Fully remote roles across investment banking, accounting, consulting, and more.',
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const result = await getLocationJobs(slug)
  if (!result) return { title: 'Location Not Found | FinanceJobs' }

  const { location, jobs } = result
  const desc = LOCATION_DESCRIPTIONS[location] || `Entry-level finance and accounting positions in ${location}.`
  const companies = [...new Set(jobs.map((j) => j.company?.name).filter(Boolean))]
  const title = `Finance Jobs in ${location} | Entry-Level Positions | FinanceJobs`
  const description = `Browse ${jobs.length} entry-level finance jobs in ${location} at ${companies.length} companies. ${desc}`.trim()

  return {
    title,
    description,
    openGraph: {
      title: `Finance Jobs in ${location} | FinanceJobs`,
      description: `${jobs.length} open entry-level finance positions in ${location}`,
      type: 'website',
    },
    alternates: {
      canonical: `/location/${slug}`,
    },
  }
}

export async function generateStaticParams() {
  const locations = await getAllLocations()
  return locations.map((loc) => ({ slug: slugify(loc) }))
}


const categoryColors: Record<string, string> = {
  'Investment Banking': 'bg-blue-50 text-blue-700 border-blue-200',
  'Private Wealth': 'bg-purple-50 text-purple-700 border-purple-200',
  'Accounting': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Sales & Trading': 'bg-red-50 text-red-700 border-red-200',
  'Corporate Finance': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'Consulting': 'bg-teal-50 text-teal-700 border-teal-200',
  'Research': 'bg-cyan-50 text-cyan-700 border-cyan-200',
  'Risk Management': 'bg-orange-50 text-orange-700 border-orange-200',
  'Private Equity': 'bg-violet-50 text-violet-700 border-violet-200',
  'Commercial Banking': 'bg-sky-50 text-sky-700 border-sky-200',
}

export default async function LocationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const result = await getLocationJobs(slug)
  if (!result) notFound()

  const { location, jobs } = result
  const description = LOCATION_DESCRIPTIONS[location] || `Entry-level finance and accounting positions in ${location}.`

  const categories = [...new Set(jobs.map((j) => j.category))].sort()
  const stages = [...new Set(jobs.map((j) => j.pipeline_stage))].sort()
  const companies = [...new Set(jobs.map((j) => j.company?.name).filter(Boolean))].sort()
  const salaryJobs = jobs.filter((j) => j.salary_min || j.salary_max)
  const avgSalary = salaryJobs.length > 0
    ? Math.round(salaryJobs.reduce((s, j) => s + (j.salary_min || j.salary_max || 0), 0) / salaryJobs.length)
    : null

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://finance-job-board.vercel.app'

  // Get all locations for the "Other Locations" section
  const allLocations = await getAllLocations()
  const otherLocations = allLocations.filter((loc) => loc !== location).slice(0, 8)

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: `Finance Jobs in ${location}`,
      description,
      url: `${siteUrl}/location/${slug}`,
      isPartOf: { '@type': 'WebSite', name: 'FinanceJobs', url: siteUrl },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
        { '@type': 'ListItem', position: 2, name: 'Locations', item: `${siteUrl}/locations` },
        { '@type': 'ListItem', position: 3, name: location, item: `${siteUrl}/location/${slug}` },
      ],
    },
  ]

  return (
    <div className="min-h-screen bg-navy-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Breadcrumb */}
      <div className="bg-white border-b border-navy-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center gap-1.5 text-xs text-navy-400">
            <Link href="/" className="hover:text-navy-700 transition">Home</Link>
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            <Link href="/locations" className="hover:text-navy-700 transition">Locations</Link>
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            <span className="text-navy-700 font-medium">{location}</span>
          </nav>
        </div>
      </div>

      {/* Location Header */}
      <section className="bg-gradient-to-b from-navy-950 to-navy-900 text-white py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <svg className="h-7 w-7 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Finance Jobs in {location}
            </h1>
          </div>
          {description && (
            <p className="text-sm text-navy-300 max-w-2xl mb-4">{description}</p>
          )}

          {/* Stats */}
          <div className="flex flex-wrap gap-6 mt-4 pt-4 border-t border-navy-800">
            <div>
              <p className="text-2xl font-extrabold text-emerald-400">{jobs.length}</p>
              <p className="text-[11px] text-navy-400 uppercase tracking-wider font-semibold">Open Positions</p>
            </div>
            <div>
              <p className="text-2xl font-extrabold text-white">{companies.length}</p>
              <p className="text-[11px] text-navy-400 uppercase tracking-wider font-semibold">Companies Hiring</p>
            </div>
            <div>
              <p className="text-2xl font-extrabold text-white">{categories.length}</p>
              <p className="text-[11px] text-navy-400 uppercase tracking-wider font-semibold">Categories</p>
            </div>
            {avgSalary && (
              <div>
                <p className="text-2xl font-extrabold text-white">${Math.round(avgSalary / 1000)}K</p>
                <p className="text-[11px] text-navy-400 uppercase tracking-wider font-semibold">Avg. Salary</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Category breakdown pills */}
        {categories.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-5">
            {categories.map((cat) => (
              <Link
                key={cat}
                href={`/category/${slugify(cat)}`}
                className={`rounded-full border px-3 py-1 text-xs font-semibold hover:shadow-sm transition ${categoryColors[cat] || 'bg-gray-50 text-gray-600 border-gray-200'}`}
              >
                {cat} ({jobs.filter((j) => j.category === cat).length})
              </Link>
            ))}
          </div>
        )}

        {/* Stage filter pills */}
        {stages.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-5">
            {stages.map((stage) => (
              <span key={stage} className={`rounded-full border px-3 py-1 text-xs font-semibold ${stageColors[stage] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                {stage} ({jobs.filter((j) => j.pipeline_stage === stage).length})
              </span>
            ))}
          </div>
        )}

        {/* Job cards */}
        <div className="space-y-3">
          {jobs.map((job) => {
            const salary = formatSalary(job.salary_min, job.salary_max)
            return (
              <Link
                key={job.id}
                href={`/jobs/${job.id}`}
                className="block rounded-xl border border-navy-200 bg-white p-4 sm:p-5 hover:shadow-md hover:border-navy-300 transition group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex gap-3 min-w-0">
                    {job.company?.logo_url ? (
                      <img src={job.company.logo_url} alt="" className="h-10 w-10 rounded-lg object-contain border border-navy-100 bg-white flex-shrink-0 mt-0.5" />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy-900 text-white font-bold text-sm flex-shrink-0 mt-0.5">
                        {job.company?.name?.charAt(0) || '?'}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h3 className="font-bold text-navy-900 group-hover:text-navy-700 transition truncate text-sm sm:text-base">
                        {job.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5 text-xs text-navy-500">
                        <span className="font-medium">{job.company?.name}</span>
                        <span className="text-navy-200">|</span>
                        <span>{job.remote_type}</span>
                        <span className="text-navy-200">|</span>
                        <span>{job.job_type}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    {salary && (
                      <span className="text-sm font-bold text-emerald-600 whitespace-nowrap">{salary}</span>
                    )}
                    <span className="text-[11px] text-navy-400">{timeAgo(job.posted_date)}</span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${stageColors[job.pipeline_stage] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                    {job.pipeline_stage}
                  </span>
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${categoryColors[job.category] || 'bg-navy-50 text-navy-600 border-navy-200'}`}>
                    {job.category}
                  </span>
                  {job.licenses_required?.filter((l: string) => l !== 'None Required').map((lic: string) => (
                    <span key={lic} className="rounded-full bg-orange-50 border border-orange-200 px-2 py-0.5 text-[10px] font-medium text-orange-700">
                      {lic}
                    </span>
                  ))}
                  {job.apply_url && (() => {
                    const url = job.apply_url!.startsWith('http') ? job.apply_url! : `https://${job.apply_url}`
                    const generic = isGenericApplyUrl(url)
                    return (
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="ml-auto inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2.5 py-1 text-[10px] font-semibold text-white hover:bg-emerald-700 transition"
                      >
                        {generic ? `Careers at ${job.company?.name || 'Company'}` : `Apply at ${job.company?.name || 'Company'}`}
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    )
                  })()}
                </div>
              </Link>
            )
          })}
        </div>

        {jobs.length === 0 && (
          <div className="text-center py-12 text-navy-400">
            <p className="text-lg font-semibold mb-2">No open positions in {location} right now</p>
            <p className="text-sm">Check back soon or browse all available jobs.</p>
          </div>
        )}

        {/* Companies hiring in this location */}
        {companies.length > 0 && (
          <div className="mt-10 pt-8 border-t border-navy-200">
            <h2 className="text-lg font-bold text-navy-900 mb-4">Companies Hiring in {location}</h2>
            <div className="flex flex-wrap gap-2">
              {companies.map((name) => (
                <Link
                  key={name}
                  href={`/companies/${slugify(name as string)}`}
                  className="rounded-lg border border-navy-200 bg-white px-3 py-2 text-sm font-medium text-navy-700 hover:bg-navy-50 hover:border-navy-300 transition"
                >
                  {name}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Other Locations */}
        {otherLocations.length > 0 && (
          <div className="mt-8 pt-8 border-t border-navy-200">
            <h2 className="text-lg font-bold text-navy-900 mb-4">Browse Other Locations</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {otherLocations.map((loc) => (
                <Link
                  key={loc}
                  href={`/location/${slugify(loc)}`}
                  className="rounded-lg border border-navy-200 bg-white px-4 py-3 text-sm font-medium text-navy-700 hover:bg-navy-50 hover:border-navy-300 transition"
                >
                  {loc}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/" className="inline-flex items-center gap-2 rounded-lg bg-navy-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-navy-800 transition">
            Browse All Jobs
          </Link>
          <Link href="/companies" className="inline-flex items-center gap-2 rounded-lg border border-navy-200 bg-white px-5 py-2.5 text-sm font-semibold text-navy-700 hover:bg-navy-50 transition">
            View All Companies
          </Link>
        </div>
      </section>
    </div>
  )
}
