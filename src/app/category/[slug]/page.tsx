import Link from 'next/link'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { JOB_CATEGORIES, type JobCategory } from '@/types'
import { timeAgo, formatSalary, slugify, stageColors, isGenericApplyUrl } from '@/lib/formatting'
import BackToTop from '@/components/BackToTop'

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
  company: { name: string; logo_url: string | null } | null
}

async function getCategoryJobs(category: JobCategory): Promise<CategoryJob[]> {
  const { data } = await supabaseAdmin
    .from('jobs')
    .select('id, title, category, location, remote_type, salary_min, salary_max, job_type, pipeline_stage, licenses_required, posted_date, apply_url, company:company_id(name, logo_url)')
    .eq('category', category)
    .eq('is_active', true)
    .order('posted_date', { ascending: false })

  return ((data || []) as any[]).map((j) => ({
    ...j,
    company: Array.isArray(j.company) ? j.company[0] || null : j.company,
  })) as CategoryJob[]
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const category = CATEGORY_SLUGS[slug]
  if (!category) return { title: 'Category Not Found | FinanceJobs' }

  const jobs = await getCategoryJobs(category)
  const desc = CATEGORY_DESCRIPTIONS[category] || ''
  const title = `${category} Jobs | Entry-Level ${category} Careers | FinanceJobs`
  const description = `Browse ${jobs.length} entry-level ${category.toLowerCase()} positions. ${desc}`.trim()

  return {
    title,
    description,
    openGraph: {
      title: `${category} Jobs | FinanceJobs`,
      description: `${jobs.length} open entry-level ${category.toLowerCase()} positions`,
      type: 'website',
    },
    alternates: {
      canonical: `/category/${slug}`,
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
  const stages = [...new Set(jobs.map((j) => j.pipeline_stage))].sort()
  const companies = [...new Set(jobs.map((j) => j.company?.name).filter(Boolean))].sort()
  const salaryJobs = jobs.filter((j) => j.salary_min || j.salary_max)
  const avgSalary = salaryJobs.length > 0
    ? Math.round(salaryJobs.reduce((s, j) => s + (j.salary_min || j.salary_max || 0), 0) / salaryJobs.length)
    : null

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://finance-job-board.vercel.app'

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: `${category} Jobs`,
      description,
      url: `${siteUrl}/category/${slug}`,
      isPartOf: { '@type': 'WebSite', name: 'FinanceJobs', url: siteUrl },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
        { '@type': 'ListItem', position: 2, name: 'Categories', item: `${siteUrl}/categories` },
        { '@type': 'ListItem', position: 3, name: category, item: `${siteUrl}/category/${slug}` },
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
          <nav className="flex items-center gap-1.5 text-xs text-navy-400">
            <Link href="/" className="hover:text-navy-700 transition">Home</Link>
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            <Link href="/categories" className="hover:text-navy-700 transition">Categories</Link>
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            <span className="text-navy-700 font-medium">{category}</span>
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
                        <span className="font-medium">
                          {job.company?.name}
                        </span>
                        <span className="text-navy-200">|</span>
                        <span className="inline-flex items-center gap-1">
                          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                          {job.location}
                        </span>
                        <span className="text-navy-200">|</span>
                        <span>{job.remote_type}</span>
                        <span className="text-navy-200">|</span>
                        <span>{job.job_type}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    {salary && (
                      <span className="text-sm font-bold text-emerald-600 whitespace-nowrap">
                        {salary}
                      </span>
                    )}
                    <span className="text-[11px] text-navy-400">{timeAgo(job.posted_date)}</span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${stageColors[job.pipeline_stage] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                    {job.pipeline_stage}
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
            <p className="text-lg font-semibold mb-2">No open {category.toLowerCase()} positions right now</p>
            <p className="text-sm">Check back soon or browse all available jobs.</p>
          </div>
        )}

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

      <BackToTop />
    </div>
  )
}
