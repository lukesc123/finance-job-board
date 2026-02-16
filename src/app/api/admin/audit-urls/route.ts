import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { isGenericApplyUrl } from '@/lib/formatting'

/**
 * GET /api/admin/audit-urls
 * Returns a report of all active jobs with URL quality analysis.
 * No auth required for read-only audit (public data).
 * Query params:
 *   ?filter=generic  - only generic/career-page URLs
 *   ?filter=missing   - only jobs with no apply_url
 *   ?company=Name     - filter by company name
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const filter = searchParams.get('filter')
    const companyFilter = searchParams.get('company')

    const { data: jobs, error } = await supabaseAdmin
      .from('jobs')
      .select('id, title, apply_url, source_url, is_active, posted_date, last_verified_at, removal_detected_at, company:companies(id, name, website, careers_url)')
      .eq('is_active', true)
      .order('posted_date', { ascending: false })

    if (error) throw error

    interface AuditJob {
      id: string
      title: string
      company_name: string
      company_id: string
      apply_url: string
      source_url: string
      url_type: 'specific' | 'generic' | 'missing'
      url_domain: string
      posted_date: string
      last_verified_at: string
      days_since_verified: number
      removal_detected: boolean
      company_careers_url: string | null
    }

    const auditResults: AuditJob[] = (jobs || []).map((job: Record<string, unknown>) => {
      const company = job.company as Record<string, string> | null
      const applyUrl = (job.apply_url as string) || ''
      let urlDomain = ''
      try {
        if (applyUrl) {
          urlDomain = new URL(applyUrl.startsWith('http') ? applyUrl : `https://${applyUrl}`).hostname.replace('www.', '')
        }
      } catch { /* ignore */ }

      const isGeneric = applyUrl ? isGenericApplyUrl(applyUrl) : false
      const urlType: 'specific' | 'generic' | 'missing' = !applyUrl ? 'missing' : isGeneric ? 'generic' : 'specific'

      const lastVerified = new Date(job.last_verified_at as string).getTime()
      const daysSinceVerified = Math.floor((Date.now() - lastVerified) / (1000 * 60 * 60 * 24))

      return {
        id: job.id as string,
        title: job.title as string,
        company_name: company?.name || 'Unknown',
        company_id: company?.id || '',
        apply_url: applyUrl,
        source_url: (job.source_url as string) || '',
        url_type: urlType,
        url_domain: urlDomain,
        posted_date: job.posted_date as string,
        last_verified_at: job.last_verified_at as string,
        days_since_verified: daysSinceVerified,
        removal_detected: !!(job.removal_detected_at),
        company_careers_url: company?.careers_url || null,
      }
    })

    // Apply filters
    let filtered = auditResults
    if (filter === 'generic') {
      filtered = filtered.filter(j => j.url_type === 'generic')
    } else if (filter === 'missing') {
      filtered = filtered.filter(j => j.url_type === 'missing')
    }
    if (companyFilter) {
      filtered = filtered.filter(j => j.company_name.toLowerCase().includes(companyFilter.toLowerCase()))
    }

    // Summary stats
    const summary = {
      total_active_jobs: auditResults.length,
      specific_urls: auditResults.filter(j => j.url_type === 'specific').length,
      generic_urls: auditResults.filter(j => j.url_type === 'generic').length,
      missing_urls: auditResults.filter(j => j.url_type === 'missing').length,
      stale_jobs: auditResults.filter(j => j.days_since_verified > 14).length,
      removal_detected: auditResults.filter(j => j.removal_detected).length,
      companies_with_generic: [...new Set(auditResults.filter(j => j.url_type === 'generic').map(j => j.company_name))].sort(),
    }

    return NextResponse.json({ summary, jobs: filtered }, {
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch (error: unknown) {
    console.error('Audit error:', error)
    return NextResponse.json({ error: 'Audit failed' }, { status: 500 })
  }
}
