import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { rateLimit, getClientIP } from '@/lib/rateLimit'
import { logger } from '@/lib/logger'
import { searchATS, detectATS, scrapeJobPage, extractLicenses } from '@/lib/ats'
import type { FinanceLicense } from '@/lib/ats'

/**
 * GET /api/admin/resolve-jobs
 *
 * Full pipeline: check URLs, resolve via ATS, scrape descriptions, extract licenses.
 * Runs on Vercel where it has network access and env vars.
 *
 * Query params:
 *   ?limit=N       - max jobs to process (default 20, max 50)
 *   ?offset=N      - skip first N jobs
 *   ?company=Name  - only process jobs from this company
 *   ?deadOnly=true - only process jobs with dead/missing URLs
 *   ?dryRun=true   - report what would change without writing to DB
 */
export const maxDuration = 300 // 5 min for pro, 60s for hobby

const DEAD_REDIRECT_RE = [
  /\/404/i, /\/not[-_]?found/i, /\/error/i,
  /\/careers?\/?$/i, /\/search[-_]?jobs?\/?$/i,
]

const SOFT_404_RE = [
  /page\s+(not|does\s*n.t)\s+/i,
  /job\s+(has been|was|is no longer)\s+(removed|closed|expired|filled)/i,
  /no\s+(jobs|positions|results)\s+found/i,
  /404\s*(not\s*found|error)?/i,
]

export async function GET(request: NextRequest) {
  const ip = getClientIP(request)
  const { limited } = rateLimit(`admin-resolve:${ip}`, 10, 60_000)
  if (limited) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const { searchParams } = new URL(request.url)
  const keyParam = searchParams.get('key')
  const adminPassword = process.env.ADMIN_PASSWORD
  const cronSecret = process.env.CRON_SECRET
  const validSecret = cronSecret || adminPassword
  if (!validSecret) {
    return NextResponse.json({ error: 'No admin secret configured' }, { status: 500 })
  }
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${validSecret}` && keyParam !== validSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
  const offset = parseInt(searchParams.get('offset') || '0')
  const companyFilter = searchParams.get('company')
  const deadOnly = searchParams.get('deadOnly') === 'true'
  const dryRun = searchParams.get('dryRun') === 'true'

  try {
    const query = supabaseAdmin
      .from('jobs')
      .select('id, title, apply_url, source_url, description, licenses_required, last_verified_at, removal_detected_at, company:companies(name, website, careers_url)')
      .eq('is_active', true)
      .order('posted_date', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data: jobs, error } = await query
    if (error) throw error

    let jobList = jobs || []
    if (companyFilter) {
      jobList = jobList.filter((j: Record<string, unknown>) => {
        const co = j.company as { name?: string } | null
        return co?.name?.toLowerCase().includes(companyFilter.toLowerCase())
      })
    }

    interface JobResult {
      id: string
      title: string
      company: string
      urlStatus: string
      resolvedUrl: string | null
      resolvedVia: string | null
      descriptionScraped: boolean
      descriptionLength: number
      licensesFound: string[]
      licensesRequired: boolean
      licensesPreferred: boolean
      fieldsUpdated: string[]
      error: string | null
    }

    const results: JobResult[] = []
    const stats = {
      processed: 0, alive: 0, dead: 0, resolved: 0,
      scraped: 0, licensesUpdated: 0, urlsUpdated: 0, errors: 0,
    }

    // Process in batches of 3 (be respectful to ATS APIs)
    const BATCH = 3
    for (let i = 0; i < jobList.length; i += BATCH) {
      const batch = jobList.slice(i, i + BATCH)
      const batchResults = await Promise.all(batch.map(async (job: Record<string, unknown>) => {
        const company = job.company as { name?: string; website?: string; careers_url?: string } | null
        const companyName = company?.name || 'Unknown'
        const careersUrl = company?.careers_url || ''
        const applyUrl = (job.apply_url as string)?.startsWith('http')
          ? job.apply_url as string
          : job.apply_url ? `https://${job.apply_url}` : null

        const result: JobResult = {
          id: job.id as string,
          title: job.title as string,
          company: companyName,
          urlStatus: 'unknown',
          resolvedUrl: null,
          resolvedVia: null,
          descriptionScraped: false,
          descriptionLength: (job.description as string || '').length,
          licensesFound: [],
          licensesRequired: false,
          licensesPreferred: false,
          fieldsUpdated: [],
          error: null,
        }

        stats.processed++

        try {
          // Step 1: Check current URL
          let urlAlive = false
          let isGeneric = false
          if (applyUrl) {
            const urlCheck = await checkJobUrl(applyUrl)
            result.urlStatus = urlCheck.status
            urlAlive = urlCheck.status === 'alive' || urlCheck.status === 'redirect'
            isGeneric = isGenericUrl(applyUrl)

            if (urlAlive && !isGeneric) {
              stats.alive++
              if (deadOnly) return result // Skip alive jobs in dead-only mode
            } else {
              stats.dead++
            }
          } else {
            result.urlStatus = 'missing'
            stats.dead++
          }

          const updates: Record<string, unknown> = {}

          // Step 2: ATS resolution for dead/generic/missing URLs
          if ((!urlAlive || isGeneric || !applyUrl) && careersUrl) {
            const ats = detectATS(careersUrl)
            if (ats.platform !== 'custom') {
              const resolved = await searchATS(careersUrl, job.title as string)
              if (resolved) {
                result.resolvedUrl = resolved.url
                result.resolvedVia = ats.platform
                updates.apply_url = resolved.url
                updates.removal_detected_at = null
                stats.resolved++
                stats.urlsUpdated++

                if (resolved.description && resolved.description.length > 100) {
                  updates.description = resolved.description.slice(0, 10000)
                  result.descriptionScraped = true
                  result.descriptionLength = resolved.description.length
                  stats.scraped++
                }
              }
            }
          }

          // Step 3: Scrape if we still need a description
          const targetUrl = (updates.apply_url as string) || applyUrl
          if (!updates.description && targetUrl) {
            const currentDesc = job.description as string || ''
            if (currentDesc.length < 200) {
              const scraped = await scrapeJobPage(targetUrl)
              if (scraped && scraped.status === 'ok' && scraped.description.length > 100) {
                updates.description = scraped.description.slice(0, 10000)
                result.descriptionScraped = true
                result.descriptionLength = scraped.description.length
                stats.scraped++
              }
            }
          }

          // Step 4: License extraction
          const descToAnalyze = (updates.description as string) || (job.description as string) || ''
          if (descToAnalyze.length > 50) {
            const analysis = extractLicenses(descToAnalyze)
            result.licensesFound = analysis.licensesFound
            result.licensesRequired = analysis.isRequired
            result.licensesPreferred = analysis.isPreferred

            const current = JSON.stringify(job.licenses_required || [])
            const updated = JSON.stringify(analysis.licensesFound)
            if (current !== updated) {
              updates.licenses_required = analysis.licensesFound as FinanceLicense[]
              updates.licenses_info = {
                study_time_days: null,
                pass_deadline_days: null,
                max_attempts: null,
                prep_materials_paid: null,
                notes: analysis.isRequired ? 'Required' : analysis.isPreferred ? 'Preferred' : null,
              }
              stats.licensesUpdated++
            }
          }

          // Step 5: Timestamps
          if (urlAlive && !isGeneric) {
            updates.last_verified_at = new Date().toISOString()
          } else if (result.resolvedUrl) {
            updates.last_verified_at = new Date().toISOString()
          } else if (!urlAlive && !result.resolvedUrl) {
            updates.removal_detected_at = new Date().toISOString()
          }

          // Step 6: Write
          result.fieldsUpdated = Object.keys(updates).filter(k => k !== 'updated_at')
          if (Object.keys(updates).length > 0 && !dryRun) {
            updates.updated_at = new Date().toISOString()
            const { error: updateErr } = await supabaseAdmin
              .from('jobs')
              .update(updates)
              .eq('id', job.id as string)
            if (updateErr) {
              result.error = updateErr.message
              stats.errors++
            }
          }
        } catch (err) {
          result.error = err instanceof Error ? err.message : 'Unknown error'
          stats.errors++
        }

        return result
      }))

      results.push(...batchResults)
    }

    return NextResponse.json({
      dryRun,
      stats,
      results,
    }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (err) {
    logger.error('resolve-jobs error:', err)
    return NextResponse.json({ error: 'Resolution failed' }, { status: 500 })
  }
}

function isGenericUrl(url: string): boolean {
  try {
    const path = new URL(url).pathname
    return /^\/?(careers?|jobs?|search|openings?)?\/?$/i.test(path)
  } catch { return false }
}

async function checkJobUrl(url: string): Promise<{ status: string; finalUrl?: string }> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 12000)
  try {
    let resp: Response
    try {
      resp = await fetch(url, {
        method: 'HEAD', redirect: 'follow', signal: controller.signal,
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36' },
      })
    } catch {
      resp = await fetch(url, {
        method: 'GET', redirect: 'follow', signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'text/html',
        },
      })
    }
    clearTimeout(timer)
    const finalUrl = resp.url || ''

    if (resp.status === 404 || resp.status === 410) return { status: 'dead', finalUrl }
    if (resp.status >= 500) return { status: 'error', finalUrl }

    if (resp.ok) {
      try {
        const origPath = new URL(url).pathname
        const finalPath = finalUrl ? new URL(finalUrl).pathname : ''
        if (finalUrl && finalPath !== origPath) {
          const isDead = DEAD_REDIRECT_RE.some(re => re.test(finalPath)) || finalPath === '/'
          if (isDead) return { status: 'dead', finalUrl }
          return { status: 'redirect', finalUrl }
        }
      } catch { /* */ }

      // Soft-404 check on body
      if (resp.headers.get('content-type')?.includes('text/html')) {
        try {
          const text = await resp.text()
          const snippet = text.slice(0, 30000).toLowerCase()
          const hasJobContent = ['responsibilities', 'qualifications', 'requirements', 'job description', 'apply now'].some(kw => snippet.includes(kw))
          if (!hasJobContent && SOFT_404_RE.some(re => re.test(snippet))) {
            return { status: 'dead', finalUrl }
          }
        } catch { /* */ }
      }

      return { status: 'alive', finalUrl }
    }
    return { status: 'error', finalUrl }
  } catch (err) {
    clearTimeout(timer)
    if (err instanceof Error && err.name === 'AbortError') return { status: 'timeout' }
    return { status: 'error' }
  }
}
