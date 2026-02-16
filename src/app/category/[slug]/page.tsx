import Link from 'next/link'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { JOB_CATEGORIES, type JobCategory } from '@/types'
import { slugify } from '@/lib/formatting'
import FilterableJobList from '@/components/FilterableJobList'
import { SITE_URL } from "@/lib/constants"

export const revalidate = 300

const CATEGORY_SLUGS: Record<string, JobCategory> = Object.fromEntries(
  JOB_CATEGORIES.map((cat) => [slugify(cat), cat])
)

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  'Investment Banking': 'Find analyst and associate roles at top investment banks. Merger advisory, capital markets, and financial modeling positions.',
  'Private Wealth': 'Wealth management, private banking, and financial advisory roles at leading firms serving high-net-worth clients.',
  'Accounting': 'Public accounting, audit, tax, and advisory positions at Big 4 firms and beyond. CPA-track opportunities included.',
  'Private Equity': 'Entry-level private equity analyst roles focused on deal sourcing, due diligence, and portfolio company management.',
  'Venture Capital': 'Analyst and associate positions at venture capital firms. Evaluate startups and emerging technology companies.',
  'Corporate Finance': 'FP&A, treasury, corporate development, and internal finance roles at Fortune 500 companies and growing businesses.',
  'Consulting': 'Management consulting, financial advisory, and strategy roles at top consulting firms.',
  'Financial Planning': 'Financial planning and analysis, personal financial advisory, and CFP-track positions.',
  'Insurance': 'Actuarial, underwriting, claims, and risk assessment positions in the insurance industry.',
  'Commercial Banking': 'Relationship management, credit analysis, and lending roles in commercial and business banking.',
  'Sales & Trading': 'Equity, fixed income, derivatives, and commodities trading desk positions. Sales and market-making roles.',
  'Research': 'Equity research, credit research, and economic analysis positions at sell-side and buy-side firms.',
  'Risk Management': 'Enterprise risk, credit risk, market risk, and compliance positions across financial services.',
  'Operations': 'Middle office, back office, trade support, and operations roles in financial services.',
  'Other': 'Additional entry-level finance and business positions across various specializations.',
}


interface CategoryJob {
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
  company: { name: string; logo_url: string | null; website?: string | null } | null
}

async function getCategoryJobs(category: JobCategory): Promise<CategoryJob[]> {
  const { data } = await supabaseAdmin
    .from('jobs')
    .select('id, title, category, location, remote_type, salary_min, salary_max, job_type, pipeline_stage, licenses_required, posted_date, apply_url, company:companies(name, logo_url, website)')
    .eq('category', category)
    .eq('is_active', true)
    .order('posted_date', { ascending: false })

  type RawCategoryJob = Omit<CategoryJob, 'company'> & {
    company: { name: string; logo_url: string | null; website?: string | null }[] | { name: string; logo_url: string | null; website?: string | null } | null
  }
  return ((data || []) as RawCategoryJob[]).map((j): CategoryJob => ({
    ...j,
    company: Array.isArray(j.company) ? j.company[0] || null : j.company,
  }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const category = CATEGORY_SLUGS[slug]
  if (!category) return { title: 'Category Not Found | Entry Level Finance Jobs', robots: { index: false, follow: false } }

  const jobs = await getCategoryJobs(category)
  const desc = CATEGORY_DESCRIPTIONS[category] || ''
  const title = `${category} Jobs | Entry-Level ${category} Careers | Entry Level Finance Jobs`
  const description = `Browse ${jobs.length} entry-level ${category.toLowerCase()} positions. ${desc}`.trim()

  return {
    title,
    description,
    openGraph: {
      title: `${category} Jobs | Entry Level Finance Jobs`,
      description: `${jobs.length} open entry-level ${category.toLowerCase()} positions`,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${category} Jobs | Entry Level Finance Jobs`,
      description: `${jobs.length} open entry-level ${category.toLowerCase()} positions`,
    },
    alternates: {
      canonical: `${SITE_URL}/category/${slug}`,
    },
  }
}

export async function generateStaticParams() {
  return JOB_CATEGORIES.map((cat) => ({ slug: slugify(cat) }))
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const category = CATEGORY_SLUGS[slug]
  if (!category) notFound()

  const jobs = await getCategoryJobs(category)
  const description = CATEGORY_DESCRIPTIONS[category] || ''

  const locations = [...new Set(jobs.map((j) => j.location))].sort()
  const companies = [...new Set(jobs.map((j) => j.company?.name).filter(Boolean))].sort()
  const salaryJobs = jobs.filter((j) => j.salary_min || j.salary_max)
  const avgSalary = salaryJobs.length > 0
    ? Math.round(salaryJobs.reduce((s, j) => {
        if (j.salary_min && j.salary_max) return s + (j.salary_min + j.salary_max) / 2
        return s + (j.salary_min || j.salary_max || 0)
      }, 0) / salaryJobs.length)
    : null


  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: `${category} Jobs`,
      description,
      url: `${SITE_URL}/category/${slug}`,
      isPartOf: { '@type': 'WebSite', name: 'Entry Level Finance Jobs', url: SITE_URL },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'Categories', item: `${SITE_URL}/categories` },
        { '@type': 'ListItem', position: 3, name: category, item: `${SITE_URL}/category/${slug}` },
      ],
    },
  ]

  // Related categories (all except current)
  const relatedCategories = JOB_CATEGORIES.filter((c) => c !== category).slice(0, 6)

  return (
    <div className="min-h-screen bg-navy-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Breadcrumb */}
      <div className="bg-white border-b border-navy-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center gap-1.5 text-xs text-navy-400" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-navy-700 transition">Home</Link>
            <svg className="h-3 w-3" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            <Link href="/categories" className="hover:text-navy-700 transition">Categories</Link>
            <svg className="h-3 w-3" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            <span className="text-navy-700 font-medium" aria-current="page">{category}</span>
          </nav>
        </div>
      </div>

      {/* Category Header */}
      <section className="bg-gradient-to-b from-navy-950 to-navy-900 text-white py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
            {category} Jobs
          </h1>
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
              <p className="text-[11px] text-navy-400 uppercase tracking-wider font-semibold">Companies</p>
            </div>
            <div>
              <p className="text-2xl font-extrabold text-white">{locations.length}</p>
              <p className="text-[11px] text-navy-400 uppercase tracking-wider font-semibold">Locations</p>
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
        <FilterableJobList
          jobs={jobs}
          filterBy="stage"
          emptyLabel={`No open ${category.toLowerCase()} positions right now`}
        />

        {/* Related Categories */}
        <div className="mt-10 pt-8 border-t border-navy-200">
          <h2 className="text-lg font-bold text-navy-900 mb-4">Browse Other Categories</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {relatedCategories.map((cat) => (
              <Link
                key={cat}
                href={`/category/${slugify(cat)}`}
                className="rounded-lg border border-navy-200 bg-white px-4 py-3 text-sm font-medium text-navy-700 hover:bg-navy-50 hover:border-navy-300 transition"
              >
                {cat}
              </Link>
            ))}
          </div>
        </div>

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
