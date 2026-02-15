import Link from 'next/link'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { slugify } from '@/lib/formatting'
import CompanyJobList from '@/components/CompanyJobList'
import CompanyLogo from '@/components/CompanyLogo'
import { SITE_URL } from "@/lib/constants"

export const revalidate = 300


interface CompanyDetail {
  id: string
  name: string
  website: string
  careers_url: string
  logo_url: string | null
  description: string | null
}

interface CompanyJob {
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
}

async function getCompanyBySlug(slug: string): Promise<{ company: CompanyDetail; jobs: CompanyJob[] } | null> {
  const { data: companies } = await supabaseAdmin
    .from('companies')
    .select('id, name, website, careers_url, logo_url, description')
  if (!companies) return null

  const company = companies.find((c: any) => slugify(c.name) === slug)
  if (!company) return null

  const { data: jobs } = await supabaseAdmin
    .from('jobs')
    .select('id, title, category, location, remote_type, salary_min, salary_max, job_type, pipeline_stage, licenses_required, posted_date, apply_url')
    .eq('company_id', company.id)
    .eq('is_active', true)
    .order('posted_date', { ascending: false })

  return { company, jobs: jobs || [] }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const result = await getCompanyBySlug(slug)
  if (!result) return { title: 'Company Not Found | FinanceJobs' }

  const { company, jobs } = result
  return {
    title: `${company.name} Jobs | FinanceJobs`,
    description: `Browse ${jobs.length} entry-level finance positions at ${company.name}. ${company.description || ''}`.trim(),
    alternates: { canonical: `${SITE_URL}/companies/${slug}` },
    openGraph: {
      title: `${company.name} - Entry-Level Finance Jobs`,
      description: `${jobs.length} open positions at ${company.name}`,
      type: 'website',
    },
  }
}

export async function generateStaticParams() {
  const { data: companies } = await supabaseAdmin.from('companies').select('name')
  return (companies || []).map((c: any) => ({ slug: slugify(c.name) }))
}

export default async function CompanyDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const result = await getCompanyBySlug(slug)
  if (!result) notFound()

  const { company, jobs } = result
  const categories = [...new Set(jobs.map((j) => j.category))].sort()
  const locations = [...new Set(jobs.map((j) => j.location))].sort()
  const salaryJobs = jobs.filter((j) => j.salary_min || j.salary_max)
  const avgMin = salaryJobs.length > 0 ? Math.round(salaryJobs.reduce((s, j) => s + (j.salary_min || j.salary_max || 0), 0) / salaryJobs.length) : null

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: company.name,
      url: company.website,
      description: company.description,
      ...(company.logo_url && { logo: company.logo_url }),
      ...(company.careers_url && { sameAs: [company.website, company.careers_url].filter(Boolean) }),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'Companies', item: `${SITE_URL}/companies` },
        { '@type': 'ListItem', position: 3, name: company.name, item: `${SITE_URL}/companies/${slug}` },
      ],
    },
  ]

  return (
    <div className="min-h-screen bg-navy-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Breadcrumb */}
      <div className="bg-white border-b border-navy-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center gap-1.5 text-xs text-navy-400" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-navy-700 transition">Home</Link>
            <svg className="h-3 w-3" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            <Link href="/companies" className="hover:text-navy-700 transition">Companies</Link>
            <svg className="h-3 w-3" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            <span className="text-navy-700 font-medium" aria-current="page">{company.name}</span>
          </nav>
        </div>
      </div>

      {/* Company Header */}
      <section className="bg-gradient-to-b from-navy-950 to-navy-900 text-white py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-start gap-4">
            <CompanyLogo
              logoUrl={company.logo_url}
              name={company.name}
              size="lg"
              priority
              imgClassName="rounded-xl border-navy-700"
              fallbackClassName="bg-navy-800 text-white text-xl border border-navy-700 rounded-xl"
            />
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{company.name}</h1>
              {company.description && (
                <p className="text-sm text-navy-300 mt-1 max-w-2xl">{company.description}</p>
              )}
              <div className="flex flex-wrap items-center gap-3 mt-3">
                {company.careers_url && (
                  <a href={company.careers_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400 hover:text-emerald-300 transition">
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    Careers Page
                  </a>
                )}
                {company.website && (
                  <a href={company.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-medium text-navy-400 hover:text-navy-200 transition">
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" /></svg>
                    Website
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-6 mt-6 pt-5 border-t border-navy-800">
            <div>
              <p className="text-2xl font-extrabold text-emerald-400">{jobs.length}</p>
              <p className="text-[11px] text-navy-400 uppercase tracking-wider font-semibold">Open Positions</p>
            </div>
            <div>
              <p className="text-2xl font-extrabold text-white">{categories.length}</p>
              <p className="text-[11px] text-navy-400 uppercase tracking-wider font-semibold">Categories</p>
            </div>
            <div>
              <p className="text-2xl font-extrabold text-white">{locations.length}</p>
              <p className="text-[11px] text-navy-400 uppercase tracking-wider font-semibold">Locations</p>
            </div>
            {avgMin && (
              <div>
                <p className="text-2xl font-extrabold text-white">${Math.round(avgMin / 1000)}K</p>
                <p className="text-[11px] text-navy-400 uppercase tracking-wider font-semibold">Avg. Salary</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Job Listings */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CompanyJobList jobs={jobs} companyName={company.name} />

        {jobs.length === 0 && (
          <div className="text-center py-12 text-navy-400">
            <p className="text-lg font-semibold mb-2">No open positions right now</p>
            <p className="text-sm">Check back soon or visit their careers page directly.</p>
          </div>
        )}

        {/* Browse by Category & Location */}
        {(categories.length > 0 || locations.length > 0) && (
          <div className="mt-8 pt-6 border-t border-navy-200">
            {categories.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-bold text-navy-700 mb-2">Categories at {company.name}</h3>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <Link
                      key={cat}
                      href={`/category/${slugify(cat)}`}
                      className="rounded-full border border-navy-200 bg-white px-3 py-1 text-xs font-medium text-navy-600 hover:bg-navy-50 hover:border-navy-300 transition"
                    >
                      {cat}
                    </Link>
                  ))}
                </div>
              </div>
            )}
            {locations.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-bold text-navy-700 mb-2">Locations</h3>
                <div className="flex flex-wrap gap-2">
                  {locations.map((loc) => (
                    <Link
                      key={loc}
                      href={`/location/${slugify(loc)}`}
                      className="rounded-full border border-navy-200 bg-white px-3 py-1 text-xs font-medium text-navy-600 hover:bg-navy-50 hover:border-navy-300 transition"
                    >
                      {loc}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* CTA */}
        <div className="mt-6 flex flex-wrap gap-3">
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
