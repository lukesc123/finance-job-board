import Link from 'next/link'
import { Metadata } from 'next'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { slugify } from '@/lib/formatting'
import { SITE_URL } from "@/lib/constants"

export const revalidate = 300

interface LocationData {
  name: string
  slug: string
  jobCount: number
  companyCount: number
  categories: string[]
}

async function getLocationsData(): Promise<LocationData[]> {
  const { data: jobs } = await supabaseAdmin
    .from('jobs')
    .select('location, category, company:company_id(name)')
    .eq('is_active', true)

  if (!jobs || jobs.length === 0) return []

  const locMap = new Map<string, { jobs: number; companies: Set<string>; categories: Set<string> }>()

  for (const job of jobs as Array<{ location: string; category: string; company: { name: string } | { name: string }[] | null }>) {
    const loc = job.location
    if (!loc) continue
    if (!locMap.has(loc)) {
      locMap.set(loc, { jobs: 0, companies: new Set(), categories: new Set() })
    }
    const entry = locMap.get(loc)!
    entry.jobs++
    const company = Array.isArray(job.company) ? job.company[0] : job.company
    if (company?.name) entry.companies.add(company.name)
    if (job.category) entry.categories.add(job.category)
  }

  return Array.from(locMap.entries())
    .map(([name, data]) => ({
      name,
      slug: slugify(name),
      jobCount: data.jobs,
      companyCount: data.companies.size,
      categories: Array.from(data.categories).sort(),
    }))
    .sort((a, b) => b.jobCount - a.jobCount)
}

export async function generateMetadata(): Promise<Metadata> {
  const locations = await getLocationsData()
  const totalJobs = locations.reduce((sum, l) => sum + l.jobCount, 0)

  return {
    title: `Finance Jobs by Location | ${locations.length} Cities | FinanceJobs`,
    description: `Browse ${totalJobs}+ entry-level finance jobs across ${locations.length} cities. Find positions in New York, San Francisco, Chicago, Charlotte, Boston, and more.`,
    alternates: { canonical: `${SITE_URL}/locations` },
    openGraph: {
      title: `Finance Jobs by Location | ${locations.length} Cities`,
      description: `Browse ${totalJobs}+ entry-level finance jobs across ${locations.length} cities.`,
      url: `${SITE_URL}/locations`,
      siteName: 'FinanceJobs',
      type: 'website',
    },
  }
}

export default async function LocationsPage() {
  const locations = await getLocationsData()
  const totalJobs = locations.reduce((sum, l) => sum + l.jobCount, 0)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `Finance Jobs by Location`,
    description: `Browse ${totalJobs}+ entry-level finance jobs across ${locations.length} cities.`,
    url: `${SITE_URL}/locations`,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: locations.length,
      itemListElement: locations.slice(0, 20).map((loc, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: loc.name,
        url: `${SITE_URL}/location/${loc.slug}`,
      })),
    },
  }

  const stateGroups = new Map<string, LocationData[]>()
  for (const loc of locations) {
    const parts = loc.name.split(',')
    const state = parts.length > 1 ? parts[parts.length - 1].trim() : 'Other'
    if (!stateGroups.has(state)) stateGroups.set(state, [])
    stateGroups.get(state)!.push(loc)
  }

  const sortedStates = Array.from(stateGroups.entries()).sort((a, b) => {
    const aJobs = a[1].reduce((s, l) => s + l.jobCount, 0)
    const bJobs = b[1].reduce((s, l) => s + l.jobCount, 0)
    return bJobs - aJobs
  })

  return (
    <div className="min-h-screen bg-navy-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <div className="bg-navy-950 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
          <nav className="flex items-center gap-2 text-xs text-navy-400 mb-6" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-white transition">Home</Link>
            <span aria-hidden="true">/</span>
            <span className="text-navy-300" aria-current="page">Locations</span>
          </nav>
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-navy-800">
              <svg className="h-5 w-5 text-navy-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold">Browse Jobs by Location</h1>
          </div>
          <p className="text-navy-400 text-sm max-w-xl">
            Explore {totalJobs}+ entry-level finance positions across {locations.length} cities. Click any location to see open roles, hiring companies, and salary data.
          </p>
          <div className="flex items-center gap-6 mt-6 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-lg">{locations.length}</span>
              <span className="text-navy-400">Cities</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-lg">{totalJobs}</span>
              <span className="text-navy-400">Open Positions</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Top Locations Grid */}
        <h2 className="text-lg font-bold text-navy-900 mb-4">Top Locations</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          {locations.slice(0, 9).map((loc) => (
            <Link
              key={loc.slug}
              href={`/location/${loc.slug}`}
              className="group rounded-xl border border-navy-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-navy-300 transition"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-navy-900 group-hover:text-navy-700 transition">{loc.name}</h3>
                  <p className="text-xs text-navy-500 mt-0.5">{loc.companyCount} {loc.companyCount === 1 ? 'company' : 'companies'} hiring</p>
                </div>
                <span className="inline-flex items-center rounded-full bg-navy-100 px-2.5 py-0.5 text-xs font-semibold text-navy-700">
                  {loc.jobCount} {loc.jobCount === 1 ? 'job' : 'jobs'}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {loc.categories.slice(0, 4).map((cat) => (
                  <span key={cat} className="inline-block rounded-md bg-navy-50 px-2 py-0.5 text-[10px] font-medium text-navy-600">
                    {cat}
                  </span>
                ))}
                {loc.categories.length > 4 && (
                  <span className="inline-block rounded-md bg-navy-50 px-2 py-0.5 text-[10px] font-medium text-navy-400">
                    +{loc.categories.length - 4} more
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>

        {/* All Locations by State */}
        <h2 className="text-lg font-bold text-navy-900 mb-4">All Locations by State</h2>
        <div className="rounded-xl border border-navy-200 bg-white shadow-sm overflow-hidden">
          {sortedStates.map(([state, locs], si) => (
            <div key={state} className={si > 0 ? 'border-t border-navy-100' : ''}>
              <div className="px-5 py-3 bg-navy-50/50">
                <h3 className="text-sm font-bold text-navy-800">{state}</h3>
              </div>
              <div className="divide-y divide-navy-50">
                {locs.sort((a, b) => b.jobCount - a.jobCount).map((loc) => (
                  <Link
                    key={loc.slug}
                    href={`/location/${loc.slug}`}
                    className="flex items-center justify-between px-5 py-3 hover:bg-navy-50/50 transition group"
                  >
                    <div className="flex items-center gap-3">
                      <svg className="h-4 w-4 text-navy-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <div>
                        <span className="text-sm font-semibold text-navy-900 group-hover:text-navy-700 transition">{loc.name}</span>
                        <span className="text-xs text-navy-400 ml-2">{loc.companyCount} {loc.companyCount === 1 ? 'company' : 'companies'}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-navy-600">{loc.jobCount} {loc.jobCount === 1 ? 'job' : 'jobs'}</span>
                      <svg className="h-4 w-4 text-navy-300 group-hover:text-navy-500 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Cross-links */}
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link href="/" className="rounded-xl border border-navy-200 bg-white p-5 text-center hover:shadow-md hover:border-navy-300 transition">
            <h3 className="font-bold text-navy-900 text-sm">Browse All Jobs</h3>
            <p className="text-xs text-navy-500 mt-1">{totalJobs}+ open positions</p>
          </Link>
          <Link href="/companies" className="rounded-xl border border-navy-200 bg-white p-5 text-center hover:shadow-md hover:border-navy-300 transition">
            <h3 className="font-bold text-navy-900 text-sm">Companies Hiring</h3>
            <p className="text-xs text-navy-500 mt-1">View all employers</p>
          </Link>
          <Link href="/resources" className="rounded-xl border border-navy-200 bg-white p-5 text-center hover:shadow-md hover:border-navy-300 transition">
            <h3 className="font-bold text-navy-900 text-sm">Career Resources</h3>
            <p className="text-xs text-navy-500 mt-1">Guides and tips</p>
          </Link>
        </div>
      </div>
    </div>
  )
}
