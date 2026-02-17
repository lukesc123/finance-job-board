import { MetadataRoute } from 'next'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { JOB_CATEGORIES } from '@/types'
import { slugify } from '@/lib/formatting'
import { SITE_URL } from "@/lib/constants"

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {

  // Batch all DB queries into a single Promise.all instead of sequential fetches
  const [companiesResult, jobsResult, locationJobsResult] = await Promise.all([
    supabaseAdmin.from('companies').select('name, updated_at').limit(2000),
    supabaseAdmin.from('jobs').select('id, updated_at').eq('is_active', true).order('updated_at', { ascending: false }).limit(5000),
    supabaseAdmin.from('jobs').select('location, updated_at').eq('is_active', true).limit(5000),
  ])

  const companies = companiesResult.data || []
  const jobs = jobsResult.data || []
  const locationJobs = locationJobsResult.data || []

  if (jobsResult.error) {
    console.error('Error fetching jobs for sitemap:', jobsResult.error)
  }

  // Use the most recent job update as the lastModified for aggregate pages
  const latestJobDate = jobs.length > 0 ? new Date(jobs[0].updated_at) : new Date()

  const companyEntries: MetadataRoute.Sitemap = companies.map((c: { name: string; updated_at: string }) => ({
    url: `${SITE_URL}/companies/${slugify(c.name)}`,
    lastModified: new Date(c.updated_at || latestJobDate),
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }))

  const jobEntries: MetadataRoute.Sitemap = jobs.map((job) => ({
    url: `${SITE_URL}/jobs/${job.id}`,
    lastModified: new Date(job.updated_at || new Date()),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  // Category landing pages
  const categoryEntries: MetadataRoute.Sitemap = JOB_CATEGORIES.map((cat) => ({
    url: `${SITE_URL}/category/${slugify(cat)}`,
    lastModified: latestJobDate,
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }))

  // Location landing pages: use each location's most recent job update
  const locationDateMap = new Map<string, Date>()
  for (const j of locationJobs as { location: string; updated_at: string }[]) {
    if (!j.location) continue
    const existing = locationDateMap.get(j.location)
    const jDate = new Date(j.updated_at)
    if (!existing || jDate > existing) {
      locationDateMap.set(j.location, jDate)
    }
  }
  const locationEntries: MetadataRoute.Sitemap = [...locationDateMap.entries()].map(([loc, date]) => ({
    url: `${SITE_URL}/location/${slugify(loc)}`,
    lastModified: date,
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }))

  return [
    {
      url: SITE_URL,
      lastModified: latestJobDate,
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${SITE_URL}/companies`,
      lastModified: latestJobDate,
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/employers`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/locations`,
      lastModified: latestJobDate,
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/categories`,
      lastModified: latestJobDate,
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/resources`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/terms`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.3,
    },
    ...companyEntries,
    ...categoryEntries,
    ...locationEntries,
    ...jobEntries,
  ]
}
