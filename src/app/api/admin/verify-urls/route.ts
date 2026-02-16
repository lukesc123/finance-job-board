import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

/**
 * GET /api/admin/verify-urls
 * Content-aware URL verification for all active jobs.
 * Does full GET requests and scans page body for soft-404 indicators
 * (e.g. "page doesn't exist", "job not found", "no longer available").
 *
 * Query params:
 *   ?company=Name  - only check jobs from this company
 *   ?limit=N       - max jobs to check (default 50, max 200)
 *   ?offset=N      - skip first N jobs
 *   ?markDead=true  - automatically set removal_detected_at for dead URLs
 */
export const maxDuration = 60

// Patterns that indicate a job page is dead even with HTTP 200
const SOFT_404_PATTERNS = [
  /page\s+(you\s+are\s+looking\s+for\s+)?does\s*n.t\s+exist/i,
  /page\s+not\s+found/i,
  /job\s+(has\s+been\s+|was\s+)?(removed|closed|expired|filled|deleted)/i,
  /job\s+(is\s+)?no\s+longer\s+(available|open|active|posted)/i,
  /position\s+(has\s+been\s+|was\s+)?(filled|closed|removed|expired)/i,
  /position\s+(is\s+)?no\s+longer\s+(available|open|active)/i,
  /this\s+(job|position|role|listing|posting)\s+(has\s+been\s+|was\s+|is\s+)?(removed|closed|expired|filled|no longer)/i,
  /sorry.*?(couldn.t|could\s+not|unable\s+to)\s+find/i,
  /no\s+(jobs?|positions?|results?|openings?)\s+(found|match|available)/i,
  /the\s+requested\s+(page|url|resource)\s+(was\s+not\s+found|does\s*n.t\s+exist|could\s+not\s+be\s+found)/i,
  /404\s*[-:]?\s*(not\s+found|error|page)/i,
  /error[:\s]+not\s+found/i,
  /we\s+couldn.t\s+find\s+(the|that|this)\s+(page|job|position|listing)/i,
  /this\s+link\s+(may\s+be\s+|is\s+)?(broken|expired|invalid)/i,
  /search\s+for\s+jobs/i, // Generic "search for jobs" on a supposed job detail page
]

// Patterns in redirect URLs that indicate dead
const DEAD_REDIRECT_PATTERNS = [
  /\/404/i,
  /\/not[-_]?found/i,
  /\/error/i,
  /\?error=true/i,
  /\/careers?\/?$/i,
  /\/search[-_]?jobs\/?$/i,
  /\/job[-_]?search\/?$/i,
]

function isGenericRedirect(originalUrl: string, finalUrl: string): boolean {
  if (!finalUrl || finalUrl === originalUrl) return false
  try {
    const originalPath = new URL(originalUrl).pathname
    const finalPath = new URL(finalUrl).pathname
    if (finalPath === originalPath) return false
    // Check if redirected to a known dead pattern
    return DEAD_REDIRECT_PATTERNS.some(p => p.test(finalUrl)) || finalPath === '/'
  } catch {
    return false
  }
}

function isSoft404(html: string, url: string): boolean {
  // Only check short pages or pages with clear signals
  // Long pages with lots of content are likely real job listings
  const lowerHtml = html.toLowerCase()

  // If the page has a "Search for Jobs" button prominently and no job description content, it's dead
  // But be careful: some search pages legitimately have this
  const hasJobDescription = lowerHtml.includes('responsibilities') ||
    lowerHtml.includes('qualifications') ||
    lowerHtml.includes('requirements') ||
    lowerHtml.includes('job description') ||
    lowerHtml.includes('what you\'ll do') ||
    lowerHtml.includes('about the role') ||
    lowerHtml.includes('apply now') ||
    lowerHtml.includes('apply for this') ||
    lowerHtml.includes('submit application')

  // Check for soft 404 patterns
  for (const pattern of SOFT_404_PATTERNS) {
    if (pattern.test(html)) {
      // "search for jobs" is too generic if the page also has job content
      if (pattern.source.includes('search\\s+for\\s+jobs') && hasJobDescription) {
        continue
      }
      return true
    }
  }

  return false
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const { searchParams } = new URL(request.url)
  const keyParam = searchParams.get('key')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}` && keyParam !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const companyFilter = searchParams.get('company')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200)
    const offset = parseInt(searchParams.get('offset') || '0')
    const markDead = searchParams.get('markDead') === 'true'

    const query = supabaseAdmin
      .from('jobs')
      .select('id, title, apply_url, source_url, removal_detected_at, company:companies(name)')
      .eq('is_active', true)
      .order('posted_date', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data: jobs, error } = await query

    if (error) throw error

    let jobsToCheck = jobs || []

    if (companyFilter) {
      jobsToCheck = jobsToCheck.filter((j: Record<string, unknown>) => {
        const company = j.company as { name: string } | null
        return company?.name?.toLowerCase().includes(companyFilter.toLowerCase())
      })
    }

    interface VerifyResult {
      id: string
      title: string
      company: string
      apply_url: string
      status: 'alive' | 'dead' | 'soft-404' | 'redirect' | 'error' | 'timeout'
      http_status: number | null
      final_url: string | null
      error: string | null
      soft_404_reason: string | null
      already_flagged: boolean
    }

    const results: VerifyResult[] = []
    const deadIds: string[] = []

    const batchSize = 5 // Smaller batches since we're doing full GET + body read
    for (let i = 0; i < jobsToCheck.length; i += batchSize) {
      const batch = jobsToCheck.slice(i, i + batchSize)
      const checks = batch.map(async (job: Record<string, unknown>) => {
        const company = job.company as { name: string } | null
        const applyUrl = (job.apply_url as string) || ''
        const url = applyUrl.startsWith('http') ? applyUrl : `https://${applyUrl}`

        const result: VerifyResult = {
          id: job.id as string,
          title: job.title as string,
          company: company?.name || 'Unknown',
          apply_url: applyUrl,
          status: 'error',
          http_status: null,
          final_url: null,
          error: null,
          soft_404_reason: null,
          already_flagged: !!(job.removal_detected_at),
        }

        try {
          const controller = new AbortController()
          const timeout = setTimeout(() => controller.abort(), 15000)

          // Always do GET to read body content
          const resp = await fetch(url, {
            method: 'GET',
            redirect: 'follow',
            signal: controller.signal,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
              'Accept-Language': 'en-US,en;q=0.9',
            },
          })

          clearTimeout(timeout)
          result.http_status = resp.status
          result.final_url = resp.url || null

          // Hard 404/410
          if (resp.status === 404 || resp.status === 410) {
            result.status = 'dead'
            deadIds.push(job.id as string)
            return result
          }

          // Read body for content analysis (limit to 50KB to avoid memory issues)
          let bodyText = ''
          if (resp.status >= 200 && resp.status < 400) {
            try {
              const fullBody = await resp.text()
              bodyText = fullBody.substring(0, 50000)
            } catch {
              // If we can't read body, fall back to redirect check only
            }
          }

          if (resp.status >= 200 && resp.status < 400) {
            // Check redirect to known dead patterns
            if (isGenericRedirect(url, resp.url || '')) {
              result.status = 'dead'
              result.soft_404_reason = `Redirected to dead pattern: ${resp.url}`
              deadIds.push(job.id as string)
              return result
            }

            // Check body content for soft 404 indicators
            if (bodyText && isSoft404(bodyText, url)) {
              // Find which pattern matched for debugging
              let matchedPattern = ''
              for (const pattern of SOFT_404_PATTERNS) {
                const match = bodyText.match(pattern)
                if (match) {
                  matchedPattern = match[0]
                  break
                }
              }
              result.status = 'soft-404'
              result.soft_404_reason = `Page contains: "${matchedPattern}"`
              deadIds.push(job.id as string)
              return result
            }

            // Check if redirected but to a non-dead page
            const finalUrl = resp.url || ''
            try {
              const originalPath = new URL(url).pathname
              const finalPath = finalUrl ? new URL(finalUrl).pathname : ''
              if (finalUrl && finalPath !== originalPath) {
                result.status = 'redirect'
                return result
              }
            } catch { /* ignore URL parse errors */ }

            result.status = 'alive'
          } else {
            result.status = 'error'
            result.error = `HTTP ${resp.status}`
          }
        } catch (err: unknown) {
          if (err instanceof DOMException && err.name === 'AbortError') {
            result.status = 'timeout'
            result.error = 'Request timed out after 15s'
          } else {
            result.status = 'error'
            result.error = err instanceof Error ? err.message : 'Unknown error'
          }
        }

        return result
      })

      const batchResults = await Promise.all(checks)
      results.push(...batchResults)
    }

    // Optionally mark dead URLs
    if (markDead && deadIds.length > 0) {
      const now = new Date().toISOString()
      for (const id of deadIds) {
        await supabaseAdmin
          .from('jobs')
          .update({ removal_detected_at: now, updated_at: now })
          .eq('id', id)
      }
    }

    const summary = {
      checked: results.length,
      alive: results.filter(r => r.status === 'alive').length,
      dead: results.filter(r => r.status === 'dead').length,
      soft_404: results.filter(r => r.status === 'soft-404').length,
      redirect: results.filter(r => r.status === 'redirect').length,
      error: results.filter(r => r.status === 'error').length,
      timeout: results.filter(r => r.status === 'timeout').length,
      dead_marked: markDead ? deadIds.length : 0,
    }

    return NextResponse.json({ summary, results }, {
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch (error: unknown) {
    console.error('Verify URLs error:', error)
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
  }
}
