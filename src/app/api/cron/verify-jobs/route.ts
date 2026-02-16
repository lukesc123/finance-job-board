import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

/**
 * GET /api/cron/verify-jobs
 * Automated cron job that runs daily to:
 * 1. Check all active job URLs for dead links (404, 410, redirect to generic pages)
 * 2. Flag dead jobs with removal_detected_at
 * 3. Deactivate jobs that have been flagged for 3+ days (grace period)
 * 4. Log summary for monitoring
 *
 * Runs on Vercel Cron - scheduled daily at 3am UTC
 */
export const maxDuration = 300 // 5 minutes for Pro, 60 for Hobby

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const startTime = Date.now()
  const log: string[] = []

  try {
    // Step 1: Deactivate jobs flagged 3+ days ago (grace period expired)
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

    // Step 2: Fetch all active jobs to verify
    const { data: jobs, error: fetchErr } = await supabaseAdmin
      .from('jobs')
      .select('id, title, apply_url, source_url, removal_detected_at, company:companies(name)')
      .eq('is_active', true)
      .is('removal_detected_at', null) // Only check unflagged jobs
      .order('posted_date', { ascending: false })

    if (fetchErr) throw fetchErr

    const jobsToCheck = jobs || []
    log.push(`Checking ${jobsToCheck.length} active unflagged jobs`)

    // Step 3: Verify URLs in batches
    const batchSize = 10
    const deadIds: string[] = []
    const aliveIds: string[] = []
    let alive = 0
    let dead = 0
    let redirect = 0
    let errorCount = 0
    let timeout = 0

    for (let i = 0; i < jobsToCheck.length; i += batchSize) {
      const batch = jobsToCheck.slice(i, i + batchSize)
      const checks = batch.map(async (job: Record<string, unknown>) => {
        const jobId = job.id as string
        const applyUrl = (job.apply_url as string) || ''
        if (!applyUrl) return { id: jobId, status: 'error' as const }

        const url = applyUrl.startsWith('http') ? applyUrl : `https://${applyUrl}`

        try {
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 12000)

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
            resp = await fetch(url, {
              method: 'GET',
              redirect: 'follow',
              signal: controller.signal,
              headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; EntryLevelFinanceJobs/1.0; +https://finance-job-board.vercel.app)',
              },
            })
          }

          clearTimeout(timeoutId)

          if (resp.status >= 200 && resp.status < 400) {
            const finalUrl = resp.url || ''
            const originalPath = new URL(url).pathname
            const finalPath = finalUrl ? new URL(finalUrl).pathname : ''

            if (finalUrl && finalPath !== originalPath) {
              const isRedirectToGeneric =
                finalPath === '/' ||
                /\/careers?\/?$/i.test(finalPath) ||
                /\/search-jobs\/?$/i.test(finalPath) ||
                /\/job-search\/?$/i.test(finalPath) ||
                /\/404\/?$/i.test(finalPath) ||
                /\/not-found\/?$/i.test(finalPath)

              if (isRedirectToGeneric) {
                return { id: jobId, status: 'dead' as const }
              }
              return { id: jobId, status: 'redirect' as const }
            }
            return { id: jobId, status: 'alive' as const }
          } else if (resp.status === 404 || resp.status === 410) {
            return { id: jobId, status: 'dead' as const }
          }
          return { id: jobId, status: 'error' as const }
        } catch (err: unknown) {
          if (err instanceof DOMException && err.name === 'AbortError') {
            return { id: jobId, status: 'timeout' as const }
          }
          return { id: jobId, status: 'error' as const }
        }
      })

      const results = await Promise.all(checks)
      for (const r of results) {
        if (r.status === 'alive') { alive++; aliveIds.push(r.id) }
        else if (r.status === 'dead') { dead++; deadIds.push(r.id) }
        else if (r.status === 'redirect') { redirect++; aliveIds.push(r.id) }
        else if (r.status === 'error') errorCount++
        else if (r.status === 'timeout') timeout++
      }
    }

    const now = new Date().toISOString()

    // Step 4: Flag dead jobs with removal_detected_at
    if (deadIds.length > 0) {
      for (const id of deadIds) {
        await supabaseAdmin
          .from('jobs')
          .update({ removal_detected_at: now, updated_at: now })
          .eq('id', id)
      }
    }

    // Step 5: Update last_verified_at for alive/redirect jobs (batch update)
    if (aliveIds.length > 0) {
      // Update in chunks of 50 to stay within Supabase limits
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
    log.push(`Results: ${alive} alive, ${dead} dead (flagged), ${redirect} redirect, ${errorCount} error, ${timeout} timeout`)

    const summary = {
      checked: jobsToCheck.length,
      alive,
      dead,
      redirect,
      error: errorCount,
      timeout,
      newly_flagged: deadIds.length,
      deactivated_expired: expiredJobs?.length || 0,
      elapsed_seconds: parseFloat(elapsed),
    }

    console.log('[Cron: verify-jobs]', JSON.stringify(summary))

    return NextResponse.json({
      success: true,
      summary,
      log,
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    console.error('[Cron: verify-jobs] Fatal error:', msg)
    return NextResponse.json({ error: msg, log }, { status: 500 })
  }
}
