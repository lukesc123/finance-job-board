import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

/**
 * GET /api/admin/verify-urls
 * Server-side URL verification for all active jobs.
 * Checks each apply_url with a HEAD request (falls back to GET) to detect dead links.
 *
 * Query params:
 *   ?company=Name  - only check jobs from this company
 *   ?limit=N       - max jobs to check (default 50, max 200)
 *   ?offset=N      - skip first N jobs
 *   ?markDead=true  - automatically set removal_detected_at for dead URLs
 */
export const maxDuration = 60 // Allow up to 60s for Vercel

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const companyFilter = searchParams.get('company')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200)
    const offset = parseInt(searchParams.get('offset') || '0')
    const markDead = searchParams.get('markDead') === 'true'

    let query = supabaseAdmin
      .from('jobs')
      .select('id, title, apply_url, source_url, removal_detected_at, company:companies(name)')
      .eq('is_active', true)
      .order('posted_date', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data: jobs, error } = await query

    if (error) throw error

    let jobsToCheck = jobs || []

    // Filter by company if specified
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
      status: 'alive' | 'dead' | 'redirect' | 'error' | 'timeout'
      http_status: number | null
      final_url: string | null
      error: string | null
      already_flagged: boolean
    }

    const results: VerifyResult[] = []
    const deadIds: string[] = []

    // Check URLs in batches of 10 to avoid overwhelming
    const batchSize = 10
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
          already_flagged: !!(job.removal_detected_at),
        }

        try {
          const controller = new AbortController()
          const timeout = setTimeout(() => controller.abort(), 12000)

          // Try HEAD first (lighter), fall back to GET
          let resp: Response
          try {
            resp = await fetch(url, {
              method: 'HEAD',
              redirect: 'follow',
              signal: controller.signal,
              headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; EntryLevelFinanceJobs/1.0; +https://finance-job-board.vercel.app)',
              },
            })
          } catch {
            // Some servers reject HEAD, try GET
            resp = await fetch(url, {
              method: 'GET',
              redirect: 'follow',
              signal: controller.signal,
              headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; EntryLevelFinanceJobs/1.0; +https://finance-job-board.vercel.app)',
              },
            })
          }

          clearTimeout(timeout)
          result.http_status = resp.status
          result.final_url = resp.url || null

          if (resp.status >= 200 && resp.status < 400) {
            // Check if we were redirected to a generic page (possible dead link)
            const finalUrl = resp.url || ''
            const originalPath = new URL(url).pathname
            const finalPath = finalUrl ? new URL(finalUrl).pathname : ''

            // If redirected to root or generic careers page, likely dead
            if (finalUrl && finalPath !== originalPath) {
              const isRedirectToGeneric =
                finalPath === '/' ||
                /\/careers?\/?$/i.test(finalPath) ||
                /\/search-jobs\/?$/i.test(finalPath) ||
                /\/job-search\/?$/i.test(finalPath) ||
                /\/404\/?$/i.test(finalPath) ||
                /\/not-found\/?$/i.test(finalPath)

              if (isRedirectToGeneric) {
                result.status = 'dead'
                deadIds.push(job.id as string)
              } else {
                result.status = 'redirect'
              }
            } else {
              result.status = 'alive'
            }
          } else if (resp.status === 404 || resp.status === 410) {
            result.status = 'dead'
            deadIds.push(job.id as string)
          } else {
            result.status = 'error'
            result.error = `HTTP ${resp.status}`
          }
        } catch (err: unknown) {
          if (err instanceof DOMException && err.name === 'AbortError') {
            result.status = 'timeout'
            result.error = 'Request timed out after 12s'
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
