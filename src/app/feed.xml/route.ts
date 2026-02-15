import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { SITE_URL } from "@/lib/constants"

export const dynamic = 'force-dynamic'

export async function GET() {

  const { data: jobs } = await supabaseAdmin
    .from('jobs')
    .select('id, title, description, posted_date, location, category, company:company_id(name)')
    .eq('is_active', true)
    .order('posted_date', { ascending: false })
    .limit(50)

  function escapeXml(str: string): string {
    return str.replace(/[<>&'"]/g, (c: string) => {
      const map: Record<string, string> = { '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }
      return map[c] || c
    })
  }

  const items = (jobs || []).map((job: any) => {
    const company = Array.isArray(job.company) ? job.company[0] : job.company
    const companyName = company?.name || 'Company'
    const desc = escapeXml((job.description || '').substring(0, 300))
    return `    <item>
      <title>${escapeXml(job.title)} at ${escapeXml(companyName)}</title>
      <link>${SITE_URL}/jobs/${job.id}</link>
      <guid isPermaLink="true">${SITE_URL}/jobs/${job.id}</guid>
      <description>${desc}...</description>
      <category>${escapeXml(job.category)}</category>
      <pubDate>${new Date(job.posted_date).toUTCString()}</pubDate>
    </item>`
  }).join('\n')

  const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>FinanceJobs - Entry-Level Finance Positions</title>
    <link>${SITE_URL}</link>
    <description>Curated entry-level finance and accounting jobs sourced directly from company career pages.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`

  return new Response(feed, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
