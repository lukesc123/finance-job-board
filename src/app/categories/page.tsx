import Link from 'next/link'
import { Metadata } from 'next'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { JOB_CATEGORIES } from '@/types'
import { slugify } from '@/lib/formatting'
import { SITE_URL } from "@/lib/constants"

export const revalidate = 300

const CATEGORY_ICONS: Record<string, string> = {
  'Investment Banking': '🏦',
  'Private Wealth': '💎',
  'Accounting': '📊',
  'Private Equity': '📈',
  'Venture Capital': '🚀',
  'Corporate Finance': '🏢',
  'Consulting': '💡',
  'Financial Planning': '📋',
  'Insurance': '🛡️',
  'Commercial Banking': '🏛️',
  'Sales & Trading': '📉',
  'Research': '🔬',
  'Risk Management': '⚖️',
  'Operations': '⚙️',
  'Other': '📁',
}

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  'Investment Banking': 'Mergers & acquisitions, IPOs, capital raising, and financial advisory roles at bulge bracket and boutique banks.',
  'Private Wealth': 'Wealth management, financial advising, and portfolio management for high-net-worth clients.',
  'Accounting': 'Audit, tax, advisory, and financial reporting positions at Big 4 firms and corporate accounting departments.',
  'Private Equity': 'Buyout, growth equity, and fund operations roles at PE firms of all sizes.',
  'Venture Capital': 'Deal sourcing, due diligence, and portfolio support at VC firms backing startups.',
  'Corporate Finance': 'FP&A, treasury, and corporate development roles inside major corporations.',
  'Consulting': 'Strategy, management, and financial consulting at top advisory firms.',
  'Financial Planning': 'Personal financial planning, retirement planning, and certified financial planner roles.',
  'Insurance': 'Underwriting, actuarial, claims, and insurance product roles across the industry.',
  'Commercial Banking': 'Commercial lending, credit analysis, and relationship management at regional and national banks.',
  'Sales & Trading': 'Equity, fixed income, derivatives trading, and institutional sales positions.',
  'Research': 'Equity research, credit research, and economic analysis roles.',
  'Risk Management': 'Market risk, credit risk, operational risk, and compliance positions.',
  'Operations': 'Middle and back office operations, trade support, and fund administration.',
  'Other': 'Unique finance roles that span multiple disciplines.',
}

interface CategoryData {
  name: string
  slug: string
  jobCount: number
  companyCount: number
  locations: string[]
  avgSalaryMax: number | null
}

async function getCategoriesData(): Promise<CategoryData[]> {
  const { data: jobs } = await supabaseAdmin
    .from('jobs')
    .select('category, location, salary_max, company:company_id(name)')
    .eq('is_active', true)

  if (!jobs || jobs.length === 0) return []

  const catMap = new Map<string, { jobs: number; companies: Set<string>; locations: Set<string>; salaries: number[] }>()

  for (const job of jobs as Array<{ category: string; location: string; salary_max: number | null; company: { name: string } | { name: string }[] | null }>) {
    const cat = job.category
    if (!cat) continue
    if (!catMap.has(cat)) {
      catMap.set(cat, { jobs: 0, companies: new Set(), locations: new Set(), salaries: [] })
    }
    const entry = catMap.get(cat)!
    entry.jobs++
    const company = Array.isArray(job.company) ? job.company[0] : job.company
    if (company?.name) entry.companies.add(company.name)
    if (job.location) entry.locations.add(job.location)
    if (job.salary_max) entry.salaries.push(job.salary_max)
  }

  return JOB_CATEGORIES
    .map((name) => {
      const data = catMap.get(name)
      if (!data || data.jobs === 0) return null
      return {
        name,
        slug: slugify(name),
        jobCount: data.jobs,
        companyCount: data.companies.size,
        locations: Array.from(data.locations).sort(),
        avgSalaryMax: data.salaries.length > 0 ? Math.round(data.salaries.reduce((a, b) => a + b, 0) / data.salaries.length) : null,
      }
    })
    .filter(Boolean) as CategoryData[]
}

export async function generateMetadata(): Promise<Metadata> {
  const categories = await getCategoriesData()
  const totalJobs = categories.reduce((sum, c) => sum + c.jobCount, 0)

  return {
    title: `Finance Job Categories | ${categories.length} Specializations | FinanceJobs`,
    description: `Browse ${totalJobs}+ entry-level finance jobs across ${categories.length} categories including Investment Banking, Accounting, Private Equity, Consulting, and more.`,
    alternates: { canonical: `${SITE_URL}/categories` },
    openGraph: {
      title: `Finance Job Categories | ${categories.length} Specializations`,
      description: `Browse ${totalJobs}+ entry-level finance jobs across ${categories.length} categories.`,
      url: `${SITE_URL}/categories`,
      siteName: 'FinanceJobs',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `Finance Job Categories | FinanceJobs`,
      description: `Browse ${totalJobs}+ entry-level finance jobs across ${categories.length} categories.`,
    },
  }
}

function formatSalaryShort(amount: number): string {
  if (amount >= 1000) return `$${Math.round(amount / 1000)}K`
  return `$${amount}`
}

export default async function CategoriesPage() {
  const categories = await getCategoriesData()
  const totalJobs = categories.reduce((sum, c) => sum + c.jobCount, 0)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Finance Job Categories',
    description: `Browse ${totalJobs}+ entry-level finance jobs across ${categories.length} categories.`,
    url: `${SITE_URL}/categories`,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: categories.length,
      itemListElement: categories.map((cat, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: cat.name,
        url: `${SITE_URL}/category/${cat.slug}`,
      })),
    },
  }

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
            <span className="text-navy-300" aria-current="page">Categories</span>
          </nav>
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-navy-800">
              <svg className="h-5 w-5 text-navy-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold">Browse by Category</h1>
          </div>
          <p className="text-navy-400 text-sm max-w-xl">
            Explore {totalJobs}+ entry-level finance positions across {categories.length} specializations. Each category page shows open roles, hiring companies, and salary data.
          </p>
          <div className="flex items-center gap-6 mt-6 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-lg">{categories.length}</span>
              <span className="text-navy-400">Categories</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-lg">{totalJobs}</span>
              <span className="text-navy-400">Open Positions</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Category Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/category/${cat.slug}`}
              className="group rounded-xl border border-navy-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-navy-300 transition"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{CATEGORY_ICONS[cat.name] || '📁'}</span>
                  <h2 className="font-bold text-navy-900 group-hover:text-navy-700 transition">{cat.name}</h2>
                </div>
                <span className="inline-flex items-center rounded-full bg-navy-100 px-2.5 py-0.5 text-xs font-semibold text-navy-700">
                  {cat.jobCount}
                </span>
              </div>
              <p className="text-xs text-navy-500 leading-relaxed mb-4 line-clamp-2">
                {CATEGORY_DESCRIPTIONS[cat.name] || `${cat.name} positions in finance.`}
              </p>
              <div className="flex items-center gap-4 text-xs text-navy-400">
                <span>{cat.companyCount} {cat.companyCount === 1 ? 'company' : 'companies'}</span>
                <span>{cat.locations.length} {cat.locations.length === 1 ? 'city' : 'cities'}</span>
                {cat.avgSalaryMax && (
                  <span className="text-emerald-600 font-semibold">Avg up to {formatSalaryShort(cat.avgSalaryMax)}</span>
                )}
              </div>
            </Link>
          ))}
        </div>

        {/* Cross-links */}
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link href="/" className="rounded-xl border border-navy-200 bg-white p-5 text-center hover:shadow-md hover:border-navy-300 transition">
            <h3 className="font-bold text-navy-900 text-sm">Browse All Jobs</h3>
            <p className="text-xs text-navy-500 mt-1">{totalJobs}+ open positions</p>
          </Link>
          <Link href="/locations" className="rounded-xl border border-navy-200 bg-white p-5 text-center hover:shadow-md hover:border-navy-300 transition">
            <h3 className="font-bold text-navy-900 text-sm">Browse by Location</h3>
            <p className="text-xs text-navy-500 mt-1">Find jobs near you</p>
          </Link>
          <Link href="/companies" className="rounded-xl border border-navy-200 bg-white p-5 text-center hover:shadow-md hover:border-navy-300 transition">
            <h3 className="font-bold text-navy-900 text-sm">Companies Hiring</h3>
            <p className="text-xs text-navy-500 mt-1">View all employers</p>
          </Link>
        </div>
      </div>
    </div>
  )
}
