import { MetadataRoute } from 'next'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { JOB_CATEGORIES, PIPELINE_STAGES } from '@/types'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://finance-job-board.vercel.app'

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
    url: `${baseUrl}/jobs/${job.id}`,
    lastModified: new Date(job.updated_at || new Date()),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  // Category filter pages
  const categoryEntries: MetadataRoute.Sitemap = JOB_CATEGORIES.map((cat) => ({
    url: `${baseUrl}/?category=${encodeURIComponent(cat)}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.7,
  }))

  // Pipeline stage filter pages
  const stageEntries: MetadataRoute.Sitemap = PIPELINE_STAGES.map((stage) => ({
    url: `${baseUrl}/?pipeline_stage=${encodeURIComponent(stage)}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.6,
  }))

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/companies`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/employers`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/resources`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/tracker`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.5,
    },
    ...categoryEntries,
    ...stageEntries,
    ...jobEntries,
  ]
}
