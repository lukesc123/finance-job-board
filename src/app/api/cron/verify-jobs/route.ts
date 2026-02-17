import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { logger } from '@/lib/logger'
import { searchForJobUrl, canPerformSearch } from '@/lib/googleSearch'

/**
 * GET /api/cron/verify-jobs
 * Automated cron job that runs daily to:
 * 1. Deactivate jobs flagged for 3+ days (grace period)
 * 2. Content-aware verification of all active job URLs
 *    - Full GET requests to read page body
 *    - Detects soft 404s ("page doesn't exist", "job no longer available")
 *    - Detects redirects to error/404/generic career pages
 * 3. Flag dead jobs with removal_detected_at
 * 4. Update last_verified_at for alive jobs
 *
 * Runs on Vercel Cron - scheduled daily at 3am UTC
 */
export const maxDuration = 300

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
  /the\s+requested\s+(page|url|resource)\s+(was\s+not\s+found|does\s*n.t\s+exist|could\s+not\s+be\s+found)/i,
  /404\s*[-:]?\s*(not\s+found|error|page)/i,
  /error[:\s]+not\s+found/i,
  /we\s+couldn.t\s+find\s+(the|that|this)\s+(page|job|position|listing)/i,
  /this\s+link\s+(may\s+be\s+|is\s+)?(broken|expired|invalid)/i,
  /search\s+for\s+jobs/i,
]

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
    return DEAD_REDIRECT_PATTERNS.some(p => p.test(finalUrl)) || finalPath === '/'
  } catch {
    return false
  }
}

function isSoft404(html: string): boolean {
  const hasJobDescription = html.toLowerCase().includes('responsibilities') ||
    html.toLowerCase().includes('qualifications') ||
    html.toLowerCase().includes('requirements') ||
    html.toLowerCase().includes('job description') ||
    html.toLowerCase().includes('apply now') ||
    html.toLowerCase().includes('apply for this') ||
    html.toLowerCase().includes('submit application')

  for (const pattern of SOFT_404_PATTERNS) {
    if (pattern.test(html)) {
      if (pattern.source.includes('search\\s+for\\s+jobs') && hasJobDescription) {
        continue
      }
      return true
    }
  }
  return false
}

async function checkJob(url: string): Promise<{ status: 'alive' | 'dead' | 'soft-404' | 'redirect' | 'error' | 'timeout' }> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000)

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

    clearTimeout(timeoutId)

    if (resp.status === 404 || resp.status === 410) {
      return { status: 'dead' }
    }

    if (resp.status >= 200 && resp.status < 400) {
      // Check redirect patterns
      if (isGenericRedirect(url, resp.url || '')) {
        return { status: 'dead' }
      }

      // Read body for soft 404 detection
      try {
        const body = await resp.text()
        const snippet = body.substring(0, 50000)
        if (isSoft404(snippet)) {
          return { status: 'soft-404' }
        }
      } catch { /* fall through */ }

      // Check non-dead redirects
      const finalUrl = resp.url || ''
      try {
        const originalPath = new URL(url).pathname
        const finalPath = finalUrl ? new URL(finalUrl).pathname : ''
        if (finalUrl && finalPath !== originalPath) {
          return { status: 'redirect' }
        }
      } catch { /* ignore */ }

      return { status: 'alive' }
    }

    return { status: 'error' }
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return { status: 'timeout' }
    }
    return { status: 'error' }
  }
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const startTime = Date.now()
  const log: string[] = []

  try {
    // Step 1: Deactivate jobs flagged 3+ days ago
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    const { data: expiredJobs, error: expireErr } = await supabaseAdmin
      .from('jobs')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .lt('removal_detected_at', threeDaysAgo)
      .eq('is_active', true)
      .select('id, title')

    if (expireErr) {
      log.push(`Error deactivating expired jobs: ${expireErr.message}`)
    } else {
      log.push(`Deactivated ${expiredJobs?.length || 0} jobs (flagged 3+ days ago)`)
    }

    // Step 2: Fetch all active unflagged jobs (with company info for potential resolution)
    const { data: jobs, error: fetchErr } = await supabaseAdmin
      .from('jobs')
      .select('id, title, apply_url, removal_detected_at, company:companies(name)')
      .eq('is_active', true)
      .is('removal_detected_at', null)
      .order('posted_date', { ascending: false })

    if (fetchErr) throw fetchErr

    const jobsToCheck = jobs || []
    log.push(`Checking ${jobsToCheck.length} active unflagged jobs`)

    // Step 3: Content-aware URL verification in batches
    const batchSize = 5
    const deadIds: string[] = []
    const aliveIds: string[] = []
    let alive = 0, dead = 0, soft404 = 0, redirect = 0, errorCount = 0, timeout = 0

    for (let i = 0; i < jobsToCheck.length; i += batchSize) {
      const batch = jobsToCheck.slice(i, i + batchSize)
      const results = await Promise.all(
        batch.map(async (job: Record<string, unknown>) => {
          const jobId = job.id as string
          const applyUrl = (job.apply_url as string) || ''
          if (!applyUrl) return { id: jobId, status: 'error' as const }
          const url = applyUrl.startsWith('http') ? applyUrl : `https://${applyUrl}`
          const result = await checkJob(url)
          return { id: jobId, ...result }
        })
      )

      for (const r of results) {
        if (r.status === 'alive') { alive++; aliveIds.push(r.id) }
        else if (r.status === 'dead' || r.status === 'soft-404') {
          if (r.status === 'soft-404') soft404++
          else dead++
          deadIds.push(r.id)
        }
        else if (r.status === 'redirect') { redirect++; aliveIds.push(r.id) }
        else if (r.status === 'error') errorCount++
        else if (r.status === 'timeout') timeout++
      }
    }

    const now = new Date().toISOString()

    // Step 3.5: Attempt Google Search resolution for dead jobs
    let resolved = 0
    const resolvedIds: string[] = []

    if (deadIds.length > 0 && canPerformSearch()) {
      log.push(`Attempting Google Search resolution for up to 20 dead jobs`)
      const jobsToResolve = jobsToCheck.filter((j: Record<string, unknown>) => deadIds.includes(j.id as string))
      const jobsForResolution = jobsToResolve.slice(0, 20) // Limit to 20 per run

      for (const job of jobsForResolution) {
        const jobId = job.id as string
        const jobTitle = job.title as string
        const companyData = job.company as unknown
        const company = Array.isArray(companyData) ? companyData[0] : companyData
        const companyName = (company as { name?: string } | null)?.name ?? null

        if (!companyName || !jobTitle) {
          continue
        }

        try {
          const newUrl = await searchForJobUrl(companyName, jobTitle)
          if (newUrl) {
            // Update job with new URL and clear the removal flag
            const { error: updateErr } = await supabaseAdmin
              .from('jobs')
              .update({
                apply_url: newUrl,
                removal_detected_at: null,
                last_verified_at: now,
                updated_at: now,
              })
              .eq('id', jobId)

            if (!updateErr) {
              resolved++
              resolvedIds.push(jobId)
              // Move from dead to alive
              deadIds.splice(deadIds.indexOf(jobId), 1)
              aliveIds.push(jobId)
              log.push(`Resolved job ${jobId}: ${companyName} - ${jobTitle}`)
            } else {
              logger.error('[Cron: verify-jobs] Failed to update resolved job', {
                jobId,
                error: updateErr.message,
              })
            }
          }
        } catch (error: unknown) {
          const msg = error instanceof Error ? error.message : 'Unknown error'
          logger.error('[Cron: verify-jobs] Error during Google Search resolution', {
            jobId,
            error: msg,
          })
        }
      }

      if (resolved > 0) {
        log.push(`Successfully resolved ${resolved} jobs via Google Search`)
      }
    }

    // Step 4: Flag dead jobs (batched)
    if (deadIds.length > 0) {
      for (let i = 0; i < deadIds.length; i += 50) {
        const chunk = deadIds.slice(i, i + 50)
        await supabaseAdmin
          .from('jobs')
          .update({ removal_detected_at: now, updated_at: now })
          .in('id', chunk)
      }
    }

    // Step 5: Update last_verified_at for alive jobs
    if (aliveIds.length > 0) {
      for (let i = 0; i < aliveIds.length; i += 50) {
        const chunk = aliveIds.slice(i, i + 50)
        await supabaseAdmin
          .from('jobs')
          .update({ last_verified_at: now, updated_at: now })
          .in('id', chunk)
      }
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
    log.push(`Verification complete in ${elapsed}s`)
    log.push(`Results: ${alive} alive, ${dead} dead, ${soft404} soft-404, ${redirect} redirect, ${errorCount} error, ${timeout} timeout`)

    const summary = {
      checked: jobsToCheck.length,
      alive,
      dead,
      soft_404: soft404,
      redirect,
      error: errorCount,
      timeout,
      google_search_resolved: resolved,
      newly_flagged: deadIds.length,
      deactivated_expired: expiredJobs?.length || 0,
      elapsed_seconds: parseFloat(elapsed),
    }

    console.info('[Cron: verify-jobs]', JSON.stringify(summary))

    return NextResponse.json({ success: true, summary, log })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    logger.error('[Cron: verify-jobs] Fatal error:', msg)
    return NextResponse.json({ error: msg, log }, { status: 500 })
  }
}
