import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { rateLimit, getClientIP } from '@/lib/rateLimit'
import { logger } from '@/lib/logger'
import { UUID_RE } from '@/lib/constants'
import { searchATS, detectATS } from '@/lib/ats'

/**
 * GET /api/jobs/check-url?id=<job_id>
 *
 * Smart health check + ATS resolution for a job's apply URL.
 * 1. HEAD/GET check on current apply_url
 * 2. If dead/generic, attempts to resolve the actual job URL via ATS API
 * 3. Updates DB with resolved URL or flags as dead
 *
 * Returns:
 *   { status: 'alive' | 'dead' | 'resolved' | 'redirect' | 'error' | 'timeout',
 *     finalUrl?: string, resolvedUrl?: string, applyUrl: string,
 *     sourceUrl?: string, careersUrl?: string, googleSearchUrl: string }
 */

// Soft-404 patterns (lightweight subset for quick checks)
const SOFT_404_RE = [
  /page\s+(not|does\s*n.t)\s+/i,
  /job\s+(has been|was|is no longer)\s+(removed|closed|expired|filled|deleted|available)/i,
  /position\s+(has been|was)\s+(removed|filled)/i,
  /no\s+(jobs|positions|results|openings)\s+found/i,
  /404\s*(not\s*found|error|page)?/i,
  /this\s+link\s+(may be|is)\s+(broken|expired|invalid)/i,
]

const DEAD_REDIRECT_RE = [
  /\/404/i,
  /\/not[-_]?found/i,
  /\/error/i,
  /\/careers?\/?$/i,
  /\/search[-_]?jobs?\/?$/i,
]

export async function GET(request: NextRequest) {
  const ip = getClientIP(request)
  const { limited } = rateLimit(`check-url:${ip}`, 30, 60_000)
  if (limited) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': '60' } })
  }

  const jobId = request.nextUrl.searchParams.get('id')
  if (!jobId || !UUID_RE.test(jobId)) {
    return NextResponse.json({ error: 'Valid job ID required' }, { status: 400 })
  }

  try {
    const { data: job, error: dbError } = await supabaseAdmin
      .from('jobs')
      .select('id,title,apply_url,source_url,company:companies(name,website,careers_url)')
      .eq('id', jobId)
      .single()

    if (dbError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    const applyUrl = job.apply_url?.startsWith('http') ? job.apply_url : job.apply_url ? `https://${job.apply_url}` : null
    const company = job.company as { name?: string; website?: string; careers_url?: string } | null
    const careersUrl = company?.careers_url || null
    const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(`${job.apply_url ? '' : 'apply '}site:${company?.website?.replace(/^https?:\/\//, '') || ''} ${jobId}`)}`

    if (!applyUrl) {
      // No URL at all: try ATS resolution before giving up
      const resolved = careersUrl ? await tryATSResolve(careersUrl, job.title) : null
      if (resolved) {
        // Update DB with resolved URL (fire-and-forget)
        void Promise.resolve(
          supabaseAdmin.from('jobs').update({
            apply_url: resolved.url,
            removal_detected_at: null,
            last_verified_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }).eq('id', jobId)
        ).catch(() => {})

        return NextResponse.json({
          status: 'resolved',
          resolvedUrl: resolved.url,
          applyUrl: resolved.url,
          sourceUrl: job.source_url || null,
          careersUrl,
          googleSearchUrl,
        }, { headers: { 'Cache-Control': 's-maxage=120, stale-while-revalidate=300' } })
      }

      return NextResponse.json({
        status: 'dead',
        applyUrl: null,
        sourceUrl: job.source_url || null,
        careersUrl,
        googleSearchUrl,
      }, { headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=600' } })
    }

    const result = await checkUrl(applyUrl)
    const isGenericPath = isGenericUrl(applyUrl)

    // If dead or generic, attempt ATS resolution
    let resolvedUrl: string | null = null
    if ((result.status === 'dead' || result.status === 'soft-404' || isGenericPath) && careersUrl) {
      const resolved = await tryATSResolve(careersUrl, job.title)
      if (resolved) {
        resolvedUrl = resolved.url
        // Update DB with the better URL (fire-and-forget)
        void Promise.resolve(
          supabaseAdmin.from('jobs').update({
            apply_url: resolved.url,
            removal_detected_at: null,
            last_verified_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }).eq('id', jobId)
        ).catch(() => {})
      }
    }

    // Side-effect: update the job in DB based on result
    if (!resolvedUrl) {
      if (result.status === 'alive') {
        void Promise.resolve(
          supabaseAdmin.from('jobs')
            .update({ last_verified_at: new Date().toISOString() })
            .eq('id', jobId)
        ).catch(() => {})
      } else if (result.status === 'dead' || result.status === 'soft-404') {
        void Promise.resolve(
          supabaseAdmin.from('jobs')
            .update({ removal_detected_at: new Date().toISOString() })
            .eq('id', jobId)
        ).catch(() => {})
      }
    }

    return NextResponse.json({
      status: resolvedUrl ? 'resolved' : result.status,
      finalUrl: result.finalUrl || null,
      resolvedUrl,
      applyUrl: resolvedUrl || applyUrl,
      sourceUrl: job.source_url || null,
      careersUrl,
      googleSearchUrl,
    }, {
      headers: { 'Cache-Control': 's-maxage=120, stale-while-revalidate=300' },
    })
  } catch (error) {
    logger.error('check-url error:', error)
    return NextResponse.json({ error: 'Check failed' }, { status: 500 })
  }
}

/** Check if a URL points to a generic careers/search page rather than a specific job */
function isGenericUrl(url: string): boolean {
  try {
    const path = new URL(url).pathname
    return /^\/?(careers?|jobs?|search|openings?)?\/?$/i.test(path)
  } catch { return false }
}

/** Attempt to resolve a specific job URL via the company's ATS */
async function tryATSResolve(
  careersUrl: string,
  jobTitle: string
): Promise<{ url: string; title: string } | null> {
  try {
    const ats = detectATS(careersUrl)
    if (ats.platform === 'custom') return null
    const result = await searchATS(careersUrl, jobTitle)
    return result ? { url: result.url, title: result.title } : null
  } catch {
    return null
  }
}

async function checkUrl(url: string): Promise<{
  status: 'alive' | 'dead' | 'soft-404' | 'redirect' | 'error' | 'timeout'
  finalUrl?: string
}> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 12_000)

  try {
    // Try HEAD first (fast), fall back to GET if HEAD fails
    let resp: Response
    try {
      resp = await fetch(url, {
        method: 'HEAD',
        redirect: 'follow',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      })
    } catch {
      resp = await fetch(url, {
        method: 'GET',
        redirect: 'follow',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      })
    }

    clearTimeout(timer)
    const finalUrl = resp.url || ''

    // Hard 404/410
    if (resp.status === 404 || resp.status === 410) {
      return { status: 'dead', finalUrl }
    }

    // Server errors
    if (resp.status >= 500) {
      return { status: 'error', finalUrl }
    }

    if (resp.ok) {
      // Check for generic redirect (careers page, search page, etc.)
      try {
        const origPath = new URL(url).pathname
        const finalPath = finalUrl ? new URL(finalUrl).pathname : ''
        if (finalUrl && finalPath !== origPath) {
          const isDead = DEAD_REDIRECT_RE.some(re => re.test(finalPath)) || finalPath === '/'
          if (isDead) return { status: 'dead', finalUrl }
          return { status: 'redirect', finalUrl }
        }
      } catch { /* URL parse failed, ignore */ }

      // For GET responses, check body for soft-404 patterns
      if (resp.body && resp.headers.get('content-type')?.includes('text/html')) {
        try {
          const text = await resp.text()
          // Only check first 30KB
          const snippet = text.slice(0, 30_000).toLowerCase()

          // Check for job content indicators
          const hasJobContent =
            snippet.includes('responsibilities') ||
            snippet.includes('qualifications') ||
            snippet.includes('requirements') ||
            snippet.includes('job description') ||
            snippet.includes('apply now') ||
            snippet.includes('submit application') ||
            snippet.includes('about the role')

          if (!hasJobContent) {
            const isSoft404 = SOFT_404_RE.some(re => re.test(snippet))
            if (isSoft404) return { status: 'soft-404', finalUrl }
          }
        } catch { /* body read failed */ }
      }

      return { status: 'alive', finalUrl }
    }

    return { status: 'error', finalUrl }
  } catch (err) {
    clearTimeout(timer)
    if (err instanceof DOMException && err.name === 'AbortError') {
      return { status: 'timeout' }
    }
    return { status: 'error' }
  }
}
