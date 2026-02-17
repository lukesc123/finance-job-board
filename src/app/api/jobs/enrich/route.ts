import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { rateLimit, getClientIP } from '@/lib/rateLimit'
import { logger } from '@/lib/logger'
import { UUID_RE } from '@/lib/constants'
import { scrapeJobPage, extractLicenses, searchATS, detectATS } from '@/lib/ats'
import type { FinanceLicense } from '@/lib/ats'

/**
 * POST /api/jobs/enrich
 *
 * Enriches a job listing by:
 * 1. Resolving the actual job URL via ATS APIs (if current URL is dead/generic)
 * 2. Scraping the job page for full description
 * 3. Extracting license/certification requirements
 * 4. Updating the database with enriched data
 *
 * Body: { job_id: string }
 *
 * Requires CRON_SECRET header for batch operations, or rate-limited for single requests.
 */

export async function POST(request: NextRequest) {
  const ip = getClientIP(request)
  const cronSecret = request.headers.get('x-cron-secret')
  const isAdmin = cronSecret === process.env.CRON_SECRET

  if (!isAdmin) {
    const { limited } = rateLimit(`enrich:${ip}`, 10, 60_000)
    if (limited) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': '60' } })
    }
  }

  let body: { job_id?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const jobId = body.job_id
  if (!jobId || !UUID_RE.test(jobId)) {
    return NextResponse.json({ error: 'Valid job_id required' }, { status: 400 })
  }

  try {
    const { data: job, error: dbError } = await supabaseAdmin
      .from('jobs')
      .select('id,title,apply_url,source_url,description,licenses_required,company:companies(name,website,careers_url)')
      .eq('id', jobId)
      .single()

    if (dbError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    const company = job.company as { name?: string; website?: string; careers_url?: string } | null
    const careersUrl = company?.careers_url || ''
    let applyUrl = job.apply_url?.startsWith('http') ? job.apply_url : job.apply_url ? `https://${job.apply_url}` : null

    const updates: Record<string, unknown> = {}
    const enrichment: Record<string, unknown> = { jobId, title: job.title, company: company?.name }

    // Step 1: Try ATS resolution if URL is generic or missing
    const isGeneric = !applyUrl || isGenericUrl(applyUrl)
    if (isGeneric && careersUrl) {
      const ats = detectATS(careersUrl)
      if (ats.platform !== 'custom') {
        const resolved = await searchATS(careersUrl, job.title)
        if (resolved) {
          applyUrl = resolved.url
          updates.apply_url = resolved.url
          updates.removal_detected_at = null
          enrichment.resolvedUrl = resolved.url
          enrichment.resolvedVia = ats.platform

          // Use ATS description if available
          if (resolved.description && resolved.description.length > 100) {
            updates.description = resolved.description.slice(0, 10000)
            enrichment.descriptionSource = 'ats-api'
            enrichment.descriptionLength = resolved.description.length
          }
        }
      }
    }

    // Step 2: Scrape the job page if we still need a better description
    if (!updates.description && applyUrl) {
      const needsScrape = !job.description || job.description.length < 200
      if (needsScrape) {
        const scraped = await scrapeJobPage(applyUrl)
        if (scraped && scraped.status === 'ok' && scraped.description.length > 100) {
          updates.description = scraped.description.slice(0, 10000)
          enrichment.descriptionSource = 'scrape'
          enrichment.descriptionLength = scraped.description.length
        }
      }
    }

    // Step 3: Extract licenses from the best available description
    const descToAnalyze = (updates.description as string) || job.description || ''
    if (descToAnalyze.length > 50) {
      const licenseAnalysis = extractLicenses(descToAnalyze)
      enrichment.licenses = licenseAnalysis

      // Update licenses if they changed
      const currentLicenses = JSON.stringify(job.licenses_required || [])
      const newLicenses = JSON.stringify(licenseAnalysis.licensesFound)

      if (currentLicenses !== newLicenses) {
        updates.licenses_required = licenseAnalysis.licensesFound as FinanceLicense[]
        updates.licenses_info = {
          study_time_days: null,
          pass_deadline_days: null,
          max_attempts: null,
          prep_materials_paid: null,
          notes: licenseAnalysis.isRequired ? 'Required' : licenseAnalysis.isPreferred ? 'Preferred' : null,
        }
        enrichment.licensesUpdated = true
      }
    }

    // Step 4: Write updates
    if (Object.keys(updates).length > 0) {
      updates.updated_at = new Date().toISOString()
      updates.last_verified_at = new Date().toISOString()

      const { error: updateErr } = await supabaseAdmin
        .from('jobs')
        .update(updates)
        .eq('id', jobId)

      if (updateErr) {
        logger.error('enrich update error:', updateErr)
        return NextResponse.json({ error: 'Database update failed', enrichment }, { status: 500 })
      }

      enrichment.fieldsUpdated = Object.keys(updates).filter(k => k !== 'updated_at' && k !== 'last_verified_at')
    }

    return NextResponse.json({
      success: true,
      enrichment,
    })
  } catch (error) {
    logger.error('enrich error:', error)
    return NextResponse.json({ error: 'Enrichment failed' }, { status: 500 })
  }
}

function isGenericUrl(url: string): boolean {
  try {
    const path = new URL(url).pathname
    return /^\/?(careers?|jobs?|search|openings?)?\/?$/i.test(path)
  } catch { return false }
}
