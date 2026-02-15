import { MetadataRoute } from 'next'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { JOB_CATEGORIES } from '@/types'
import { slugify } from '@/lib/formatting'
import { SITE_URL } from "@/lib/constants"

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {

  // Fetch all companies
  const { data: companies } = await supabaseAdmin
    .from('companies')
    .select('name')

  const companyEntries: MetadataRoute.Sitemap = (companies || []).map((c: { name: string }) => ({
    url: `${SITE_URL}/companies/${slugify(c.name)}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }))

  // Fetch all active jobs
  const { data: jobs, error } = await supabaseAdmin
    .from('jobs')
    .select('id, updated_at')
    .eq('is_active', true)
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('Error fetching jobs for sitemap:', error)
  }

  const jobEntries: MetadataRoute.Sitemap = (jobs || []).map((job) => ({
    url: `${SITE_URL}/jobs/${job.id}`,
    lastModified: new Date(job.updated_at || new Date()),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  // Category landing pages
  const categoryEntries: MetadataRoute.Sitemap = JOB_CATEGORIES.map((cat) => ({
    url: `${SITE_URL}/category/${slugify(cat)}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }))

  // Location landing pages
  const { data: locationJobs } = await supabaseAdmin
    .from('jobs')
    .select('location')
    .eq('is_active', true)

  const uniqueLocations = [...new Set((locationJobs || []).map((j: { location: string }) => j.location))].filter(Boolean)
  const locationEntries: MetadataRoute.Sitemap = uniqueLocations.map((loc) => ({
    url: `${SITE_URL}/location/${slugify(loc)}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }))

  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${SITE_URL}/companies`,
      lastModified: new Date(),
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
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/categories`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/resources`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    ...companyEntries,
    ...categoryEntries,
    ...locationEntries,
    ...jobEntries,
  ]
}
