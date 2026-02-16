import Link from 'next/link'
import { Metadata } from 'next'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import CompaniesGrid from '@/components/CompaniesGrid'
import { slugify } from '@/lib/formatting'
import { SITE_URL } from "@/lib/constants"

export const revalidate = 300


export const metadata: Metadata = {
  title: 'Companies Hiring | FinanceJobs',
  description: 'Browse all companies with entry-level finance and accounting job openings. Find your next employer and explore open positions.',
  alternates: { canonical: `${SITE_URL}/companies` },
  openGraph: {
    title: 'Companies Hiring | FinanceJobs',
    description: 'Browse all companies with entry-level finance and accounting job openings.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Companies Hiring | FinanceJobs',
    description: 'Browse all companies with entry-level finance and accounting job openings.',
  },
}

export interface CompanyWithCount {
  id: string
  name: string
  slug: string
  website: string
  careers_url: string
  logo_url: string | null
  description: string | null
  job_count: number
  categories: string[]
  locations: string[]
}

async function getCompaniesWithJobs(): Promise<CompanyWithCount[]> {
  const [companyRes, jobRes] = await Promise.all([
    supabaseAdmin
      .from('companies')
      .select('*')
      .order('name', { ascending: true }),
    supabaseAdmin
      .from('jobs')
      .select('company_id, category, location')
      .eq('is_active', true),
  ])

  const companies = companyRes.data
  const jobs = jobRes.data
  if (!companies) return []

  const jobsByCompany: Record<string, { count: number; categories: Set<string>; locations: Set<string> }> = {}
  ;(jobs || []).forEach((job: { company_id: string; category: string; location: string }) => {
    if (!jobsByCompany[job.company_id]) {
      jobsByCompany[job.company_id] = { count: 0, categories: new Set(), locations: new Set() }
    }
    jobsByCompany[job.company_id].count++
    if (job.category) jobsByCompany[job.company_id].categories.add(job.category)
    if (job.location) jobsByCompany[job.company_id].locations.add(job.location)
  })

  interface RawCompany {
    id: string
    name: string
    website: string
    careers_url: string
    logo_url: string | null
    description: string | null
  }

  return (companies as RawCompany[])
    .filter((c) => jobsByCompany[c.id]?.count > 0)
    .map((c) => ({
      id: c.id,
      name: c.name,
      slug: slugify(c.name),
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


  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'Companies Hiring',
      description: `Browse ${companies.length} companies with ${totalJobs} open entry-level finance positions.`,
      url: `${SITE_URL}/companies`,
      isPartOf: { '@type': 'WebSite', name: 'FinanceJobs', url: SITE_URL },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'Companies', item: `${SITE_URL}/companies` },
      ],
    },
  ]

  return (
    <div className="min-h-screen bg-navy-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

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

      {/* Company Grid with Client Search */}
      <CompaniesGrid companies={companies} />
    </div>
  )
}
