#!/usr/bin/env node
/**
 * resolve-and-verify.mjs
 *
 * Comprehensive job URL resolver and license verifier.
 *
 * For every active job in the database, this script:
 * 1. Checks if the current apply_url is alive
 * 2. If dead/generic, attempts to resolve the actual job posting URL via ATS APIs
 * 3. Scrapes the real job page for the full description
 * 4. Extracts license/certification requirements from the description
 * 5. Updates the database with resolved URLs, descriptions, and license data
 *
 * Usage:
 *   # Dry run (no DB writes, just report)
 *   node resolve-and-verify.mjs --dry-run
 *
 *   # Full run with DB updates
 *   node resolve-and-verify.mjs
 *
 *   # Only process jobs with dead/unverified links
 *   node resolve-and-verify.mjs --dead-only
 *
 *   # Only process a specific company
 *   node resolve-and-verify.mjs --company "Goldman Sachs"
 *
 *   # Limit to N jobs (useful for testing)
 *   node resolve-and-verify.mjs --limit 10
 *
 * Requires .env.local with:
 *   NEXT_PUBLIC_SUPABASE_URL=...
 *   SUPABASE_SERVICE_ROLE_KEY=...
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

// ─── Load env from .env.local ────────────────────────────────────────────────

const __dirname = dirname(fileURLToPath(import.meta.url))

function loadEnv() {
  for (const file of ['.env.local', '.env']) {
    try {
      const content = readFileSync(resolve(__dirname, file), 'utf8')
      for (const line of content.split('\n')) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith('#')) continue
        const eq = trimmed.indexOf('=')
        if (eq < 0) continue
        const key = trimmed.slice(0, eq).trim()
        const val = trimmed.slice(eq + 1).trim()
        if (!process.env[key]) process.env[key] = val
      }
    } catch { /* file not found */ }
  }
}

loadEnv()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// ─── CLI args ────────────────────────────────────────────────────────────────

const args = process.argv.slice(2)
const DRY_RUN = args.includes('--dry-run')
const DEAD_ONLY = args.includes('--dead-only')
const COMPANY_FILTER = args.includes('--company') ? args[args.indexOf('--company') + 1] : null
const LIMIT = args.includes('--limit') ? parseInt(args[args.indexOf('--limit') + 1]) : null

// ─── ATS Detection (same logic as src/lib/ats.ts, duplicated for standalone use) ─

const ATS_PATTERNS = [
  [/([a-z0-9-]+)\.(?:wd\d+\.)?myworkdayjobs\.com/i, 'workday'],
  [/(?:boards\.greenhouse\.io\/([a-z0-9_-]+)|([a-z0-9-]+)\.greenhouse\.io)/i, 'greenhouse'],
  [/jobs\.lever\.co\/([a-z0-9_-]+)/i, 'lever'],
  [/careers?-?([a-z0-9-]+)\.icims\.com/i, 'icims'],
  [/jobs\.smartrecruiters\.com\/([a-z0-9_-]+)/i, 'smartrecruiters'],
  [/([a-z0-9-]+)\.oraclecloud\.com/i, 'taleo'],
]

function detectATS(url) {
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`)
    for (const [pattern, platform] of ATS_PATTERNS) {
      const match = parsed.hostname.match(pattern) || url.match(pattern)
      if (match) {
        return { platform, companySlug: match[1] || match[2], url: parsed }
      }
    }
  } catch { /* ignore */ }
  return { platform: 'custom' }
}

// ─── Fetch helpers ───────────────────────────────────────────────────────────

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'

async function safeFetch(url, opts = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), opts.timeout || 15000)
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': UA, 'Accept': opts.accept || '*/*' },
      redirect: 'follow',
      ...opts,
      headers: { 'User-Agent': UA, ...opts.headers },
    })
    clearTimeout(timer)
    return res
  } catch (err) {
    clearTimeout(timer)
    throw err
  }
}

// ─── URL Health Check ────────────────────────────────────────────────────────

const DEAD_REDIRECT_RE = [
  /\/404/i, /\/not[-_]?found/i, /\/error/i,
  /\/careers?\/?$/i, /\/search[-_]?jobs?\/?$/i,
]

async function checkUrl(url) {
  try {
    let resp
    try {
      resp = await safeFetch(url, { method: 'HEAD' })
    } catch {
      resp = await safeFetch(url, { method: 'GET', accept: 'text/html' })
    }

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
      } catch { /* URL parse */ }

      // Check for soft-404 in body
      if (resp.body && resp.headers.get('content-type')?.includes('text/html')) {
        try {
          const text = await resp.text()
          const snippet = text.slice(0, 30000).toLowerCase()
          const hasJobContent = ['responsibilities', 'qualifications', 'requirements',
            'job description', 'apply now', 'submit application', 'about the role']
            .some(kw => snippet.includes(kw))
          if (!hasJobContent) {
            const isSoft404 = [
              /page\s+(not|does\s*n.t)\s+/i,
              /job\s+(has been|was|is no longer)\s+(removed|closed|expired|filled)/i,
              /no\s+(jobs|positions|results)\s+found/i,
              /404\s*(not\s*found|error)?/i,
            ].some(re => re.test(snippet))
            if (isSoft404) return { status: 'dead', finalUrl, body: text }
          }
          return { status: 'alive', finalUrl, body: text }
        } catch { /* body read failed */ }
      }
      return { status: 'alive', finalUrl }
    }
    return { status: 'error', finalUrl }
  } catch (err) {
    if (err.name === 'AbortError') return { status: 'timeout' }
    return { status: 'error', error: err.message }
  }
}

// ─── ATS Search Functions ────────────────────────────────────────────────────

function fuzzyMatch(jobs, targetTitle, getTitle) {
  const titleLower = targetTitle.toLowerCase().replace(/[^a-z0-9\s]/g, '')
  const titleWords = titleLower.split(/\s+/).filter(w => w.length > 2)

  let bestScore = 0
  let bestJob = null

  for (const job of jobs) {
    const jobTitle = getTitle(job).toLowerCase().replace(/[^a-z0-9\s]/g, '')

    if (jobTitle.includes(titleLower) || titleLower.includes(jobTitle)) {
      if (100 > bestScore) { bestScore = 100; bestJob = job }
      continue
    }

    const jobWords = jobTitle.split(/\s+/).filter(w => w.length > 2)
    const overlap = titleWords.filter(w => jobWords.includes(w)).length
    const score = (overlap / Math.max(titleWords.length, 1)) * 80

    if (score > bestScore) { bestScore = score; bestJob = job }
  }

  return bestScore >= 40 ? bestJob : null
}

async function searchGreenhouse(slug, title) {
  try {
    const res = await safeFetch(`https://boards-api.greenhouse.io/v1/boards/${slug}/jobs?content=true`, {
      headers: { 'Accept': 'application/json' },
    })
    if (!res.ok) return null
    const data = await res.json()
    const match = fuzzyMatch(data.jobs || [], title, j => j.title)
    if (!match) return null
    return {
      url: match.absolute_url,
      title: match.title,
      description: stripHtml(match.content || ''),
      descriptionHtml: match.content || '',
    }
  } catch { return null }
}

async function searchLever(slug, title) {
  try {
    const res = await safeFetch(`https://api.lever.co/v0/postings/${slug}`, {
      headers: { 'Accept': 'application/json' },
    })
    if (!res.ok) return null
    const jobs = await res.json()
    const match = fuzzyMatch(jobs || [], title, j => j.text)
    if (!match) return null
    return {
      url: match.hostedUrl,
      title: match.text,
      description: match.descriptionPlain || stripHtml(match.description || ''),
      descriptionHtml: match.description || '',
    }
  } catch { return null }
}

async function searchSmartRecruiters(slug, title) {
  try {
    const params = new URLSearchParams({ q: title, limit: '20' })
    const res = await safeFetch(`https://api.smartrecruiters.com/v1/companies/${slug}/postings?${params}`, {
      headers: { 'Accept': 'application/json' },
    })
    if (!res.ok) return null
    const data = await res.json()
    const match = fuzzyMatch(data.content || [], title, j => j.name)
    if (!match) return null

    // Get full description
    let description = ''
    let descriptionHtml = ''
    try {
      const detailRes = await safeFetch(`https://api.smartrecruiters.com/v1/companies/${slug}/postings/${match.id}`, {
        headers: { 'Accept': 'application/json' },
      })
      if (detailRes.ok) {
        const detail = await detailRes.json()
        descriptionHtml = detail.jobAd?.sections?.jobDescription?.text || ''
        description = stripHtml(descriptionHtml)
      }
    } catch { /* ignore */ }

    return {
      url: `https://jobs.smartrecruiters.com/${slug}/${match.id}`,
      title: match.name,
      description,
      descriptionHtml,
    }
  } catch { return null }
}

async function searchWorkday(ats, title, careersUrl) {
  try {
    const base = careersUrl.replace(/\/[^/]*$/, '')
    const res = await safeFetch(`${base}?q=${encodeURIComponent(title)}&format=json`, {
      headers: { 'Accept': 'application/json' },
    })
    if (!res.ok) return null
    const data = await res.json()
    const postings = data?.jobPostings || data?.body?.children?.[0]?.children || []
    if (!Array.isArray(postings) || postings.length === 0) return null

    const match = fuzzyMatch(postings, title, p => String(p.title || p.bulletFields?.[0] || ''))
    if (!match) return null

    const jobUrl = match.externalPath
      ? `${new URL(careersUrl).origin}${match.externalPath}`
      : null

    return jobUrl ? {
      url: jobUrl,
      title: String(match.title || match.bulletFields?.[0] || title),
      description: '',
      descriptionHtml: '',
    } : null
  } catch { return null }
}

async function resolveViaATS(careersUrl, title) {
  const ats = detectATS(careersUrl)
  switch (ats.platform) {
    case 'greenhouse': return searchGreenhouse(ats.companySlug, title)
    case 'lever': return searchLever(ats.companySlug, title)
    case 'smartrecruiters': return searchSmartRecruiters(ats.companySlug, title)
    case 'workday': return searchWorkday(ats, title, careersUrl)
    default: return null
  }
}

// ─── Job Page Scraper ────────────────────────────────────────────────────────

async function scrapeJobPage(url) {
  try {
    const res = await safeFetch(url, {
      method: 'GET',
      accept: 'text/html,application/xhtml+xml',
    })
    if (!res.ok) return null
    const html = await res.text()

    const lower = html.toLowerCase()
    const hasJobContent = ['responsibilities', 'qualifications', 'requirements',
      'job description', 'about the role', "what you'll do", 'apply now']
      .some(kw => lower.includes(kw))
    if (!hasJobContent) return null

    // Title
    const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i)
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    const title = h1Match?.[1]?.trim() || titleMatch?.[1]?.trim()

    // Description from JSON-LD
    const jsonLdBlocks = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)
    if (jsonLdBlocks) {
      for (const block of jsonLdBlocks) {
        try {
          const json = block.replace(/<\/?script[^>]*>/gi, '')
          const data = JSON.parse(json)
          const job = data['@type'] === 'JobPosting' ? data
            : Array.isArray(data) ? data.find(d => d['@type'] === 'JobPosting') : null
          if (job?.description) {
            return { title, description: stripHtml(job.description), descriptionHtml: job.description }
          }
        } catch { /* invalid JSON-LD */ }
      }
    }

    // Description from HTML containers
    const containerPatterns = [
      /data-(?:job-?)?description[^>]*>([\s\S]*?)<\/(?:div|section|article)/i,
      /class="[^"]*(?:job[-_]?description|posting[-_]?description|job[-_]?details|job[-_]?content|description[-_]?body)[^"]*"[^>]*>([\s\S]*?)<\/(?:div|section|article)/i,
      /id="[^"]*(?:job[-_]?description|posting[-_]?body|job[-_]?details)[^"]*"[^>]*>([\s\S]*?)<\/(?:div|section|article)/i,
    ]
    for (const pattern of containerPatterns) {
      const match = html.match(pattern)
      if (match?.[1] && match[1].length > 200) {
        return { title, description: stripHtml(match[1]), descriptionHtml: match[1] }
      }
    }

    // Fallback: grab around keywords
    const kwStart = html.search(/(?:responsibilities|qualifications|requirements|about the role)/i)
    if (kwStart > 0) {
      const chunk = html.slice(Math.max(0, kwStart - 500), kwStart + 10000)
      return { title, description: stripHtml(chunk), descriptionHtml: chunk }
    }

    return null
  } catch { return null }
}

// ─── License Extraction ──────────────────────────────────────────────────────

const LICENSE_PATTERNS = [
  [/\bSIE\b(?:\s+(?:exam|license|certification))?/i, 'SIE'],
  [/\bSeries\s*6\b/i, 'Series 6'],
  [/\bSeries\s*7\b/i, 'Series 7'],
  [/\bSeries\s*63\b/i, 'Series 63'],
  [/\bSeries\s*65\b/i, 'Series 65'],
  [/\bSeries\s*66\b/i, 'Series 66'],
  [/\bSeries\s*79\b/i, 'Series 79'],
  [/\bSeries\s*3\b/i, 'Series 3'],
  [/\bCPA\b(?:\s+(?:certification|license|designation|eligible|track))?/i, 'CPA'],
  [/\bCPA\s+Track\b/i, 'CPA Track'],
  [/\bCFA\b(?:\s+Level\s*(?:1|I)\b)?/i, 'CFA Level 1'],
  [/\bFINRA\b.*(?:Series|license|registration)/i, 'SIE'],
]

const REQUIRED_CONTEXT = [
  /(?:must|required|need|shall)\s+(?:have|hold|obtain|possess|maintain)/i,
  /(?:required|mandatory)\s+(?:licenses?|certifications?|registrations?)/i,
  /(?:obtain|pass|complete)\s+(?:within|before|prior)/i,
]

const PREFERRED_CONTEXT = [
  /(?:prefer(?:red)?|nice\s+to\s+have|desir(?:ed|able)|plus|bonus|asset)/i,
  /(?:working\s+towards?|pursuing|in\s+progress)/i,
  /(?:willingness|willing|ability)\s+to\s+(?:obtain|study|pursue)/i,
]

function extractLicenses(description) {
  const text = stripHtml(description)
  const found = new Set()
  const rawMatches = []

  for (const [pattern, license] of LICENSE_PATTERNS) {
    const match = text.match(pattern)
    if (match) {
      found.add(license)
      const idx = match.index || 0
      const context = text.slice(Math.max(0, idx - 80), idx + match[0].length + 80)
      rawMatches.push(context.replace(/\s+/g, ' ').trim())
    }
  }

  if (found.has('CPA Track')) found.delete('CPA')

  let isRequired = false
  let isPreferred = false
  for (const ctx of rawMatches) {
    if (REQUIRED_CONTEXT.some(re => re.test(ctx))) isRequired = true
    if (PREFERRED_CONTEXT.some(re => re.test(ctx))) isPreferred = true
  }

  return {
    licensesFound: found.size > 0 ? [...found] : ['None Required'],
    isRequired: found.size > 0 && isRequired,
    isPreferred: found.size > 0 && isPreferred,
    rawMatches,
  }
}

// ─── Utilities ───────────────────────────────────────────────────────────────

function stripHtml(html) {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(?:p|div|li|h[1-6]|tr)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n').replace(/[ \t]+/g, ' ')
    .trim()
}

function isGenericUrl(url) {
  if (!url) return true
  const path = new URL(url.startsWith('http') ? url : `https://${url}`).pathname
  return /^\/?(careers?|jobs?|search|openings?)?\/?$/i.test(path)
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('resolve-and-verify.mjs')
  console.log('='.repeat(60))
  if (DRY_RUN) console.log('DRY RUN MODE (no DB writes)')
  if (DEAD_ONLY) console.log('DEAD-ONLY MODE (skipping alive jobs)')
  if (COMPANY_FILTER) console.log(`COMPANY FILTER: "${COMPANY_FILTER}"`)
  if (LIMIT) console.log(`LIMIT: ${LIMIT} jobs`)
  console.log()

  // Fetch all active jobs with company data
  let query = supabase
    .from('jobs')
    .select('id, title, apply_url, source_url, description, licenses_required, last_verified_at, removal_detected_at, company:companies(name, website, careers_url)')
    .eq('is_active', true)
    .order('posted_date', { ascending: false })

  if (LIMIT) query = query.limit(LIMIT)

  const { data: jobs, error } = await query

  if (error) {
    console.error('Database error:', error.message)
    process.exit(1)
  }

  console.log(`Found ${jobs.length} active jobs\n`)

  // Stats
  const stats = {
    total: jobs.length,
    alive: 0,
    dead: 0,
    resolved: 0,
    scraped: 0,
    licensesUpdated: 0,
    descriptionUpdated: 0,
    urlUpdated: 0,
    errors: 0,
    skipped: 0,
  }

  const report = {
    resolved: [],
    dead: [],
    licensesFound: [],
    errors: [],
  }

  // Process in batches of 5 (be nice to ATS APIs)
  const BATCH_SIZE = 5
  for (let i = 0; i < jobs.length; i += BATCH_SIZE) {
    const batch = jobs.slice(i, i + BATCH_SIZE)

    await Promise.all(batch.map(async (job, batchIdx) => {
      const idx = i + batchIdx + 1
      const company = job.company
      const companyName = company?.name || 'Unknown'
      const careersUrl = company?.careers_url || ''
      const prefix = `[${idx}/${jobs.length}]`

      // Company filter
      if (COMPANY_FILTER && !companyName.toLowerCase().includes(COMPANY_FILTER.toLowerCase())) {
        stats.skipped++
        return
      }

      const applyUrl = job.apply_url?.startsWith('http') ? job.apply_url : job.apply_url ? `https://${job.apply_url}` : null

      // Step 1: Check current URL
      let urlStatus = null
      if (applyUrl) {
        urlStatus = await checkUrl(applyUrl)
      }

      const isAlive = urlStatus?.status === 'alive' || urlStatus?.status === 'redirect'
      const isDead = !applyUrl || urlStatus?.status === 'dead' || urlStatus?.status === 'timeout'
      const isGeneric = applyUrl ? isGenericUrl(applyUrl) : true

      if (DEAD_ONLY && isAlive && !isGeneric) {
        stats.alive++
        return
      }

      if (isAlive && !isGeneric) {
        stats.alive++
        console.log(`${prefix} ALIVE: ${companyName} - ${job.title}`)
      } else if (isDead) {
        stats.dead++
        console.log(`${prefix} DEAD:  ${companyName} - ${job.title}  ${applyUrl || '(no URL)'}`)
      } else if (isGeneric) {
        console.log(`${prefix} GENERIC: ${companyName} - ${job.title}  ${applyUrl}`)
      }

      const updates = {}

      // Step 2: Try to resolve via ATS if dead or generic
      if ((isDead || isGeneric) && careersUrl) {
        const resolved = await resolveViaATS(careersUrl, job.title)
        if (resolved) {
          stats.resolved++
          console.log(`${prefix}   -> RESOLVED via ATS: ${resolved.url}`)
          report.resolved.push({ job: `${companyName} - ${job.title}`, oldUrl: applyUrl, newUrl: resolved.url })

          updates.apply_url = resolved.url
          updates.removal_detected_at = null // Clear dead flag
          stats.urlUpdated++

          // If ATS gave us a description, use it
          if (resolved.description && resolved.description.length > 100) {
            updates.description = resolved.description.slice(0, 10000) // Cap at 10K chars
            stats.descriptionUpdated++
            stats.scraped++
          }
        } else if (isDead) {
          report.dead.push({ job: `${companyName} - ${job.title}`, url: applyUrl, id: job.id })
        }
      } else if (isDead) {
        report.dead.push({ job: `${companyName} - ${job.title}`, url: applyUrl, id: job.id })
      }

      // Step 3: Scrape the actual page if we still need a description
      const targetUrl = updates.apply_url || applyUrl
      if (targetUrl && !updates.description) {
        // Only scrape if description is short or missing
        const needsScrape = !job.description || job.description.length < 200
        if (needsScrape) {
          const scraped = await scrapeJobPage(targetUrl)
          if (scraped && scraped.description && scraped.description.length > 100) {
            updates.description = scraped.description.slice(0, 10000)
            stats.descriptionUpdated++
            stats.scraped++
            console.log(`${prefix}   -> Scraped description (${scraped.description.length} chars)`)
          }
        }
      }

      // Step 4: Extract licenses from description
      const descriptionToAnalyze = updates.description || job.description || ''
      if (descriptionToAnalyze.length > 50) {
        const licenseAnalysis = extractLicenses(descriptionToAnalyze)

        // Check if licenses changed
        const currentLicenses = JSON.stringify(job.licenses_required || [])
        const newLicenses = JSON.stringify(licenseAnalysis.licensesFound)

        if (currentLicenses !== newLicenses) {
          updates.licenses_required = licenseAnalysis.licensesFound
          updates.licenses_info = {
            study_time_days: null,
            pass_deadline_days: null,
            max_attempts: null,
            prep_materials_paid: null,
            notes: licenseAnalysis.isRequired ? 'Required' : licenseAnalysis.isPreferred ? 'Preferred' : null,
          }
          stats.licensesUpdated++

          if (!licenseAnalysis.licensesFound.includes('None Required')) {
            report.licensesFound.push({
              job: `${companyName} - ${job.title}`,
              licenses: licenseAnalysis.licensesFound,
              required: licenseAnalysis.isRequired,
              preferred: licenseAnalysis.isPreferred,
              evidence: licenseAnalysis.rawMatches.slice(0, 2),
            })
          }
        }
      }

      // Step 5: Update verification timestamp
      if (isAlive) {
        updates.last_verified_at = new Date().toISOString()
      } else if (isDead && !updates.apply_url) {
        updates.removal_detected_at = new Date().toISOString()
      }

      // Write updates
      if (Object.keys(updates).length > 0 && !DRY_RUN) {
        updates.updated_at = new Date().toISOString()
        const { error: updateErr } = await supabase
          .from('jobs')
          .update(updates)
          .eq('id', job.id)

        if (updateErr) {
          console.error(`${prefix}   -> DB UPDATE ERROR: ${updateErr.message}`)
          stats.errors++
          report.errors.push({ job: `${companyName} - ${job.title}`, error: updateErr.message })
        }
      } else if (Object.keys(updates).length > 0 && DRY_RUN) {
        console.log(`${prefix}   -> Would update: ${Object.keys(updates).join(', ')}`)
      }
    }))

    // Rate limit between batches
    if (i + BATCH_SIZE < jobs.length) {
      await sleep(1000)
    }
  }

  // ─── Final Report ──────────────────────────────────────────────────────────
  console.log('\n' + '='.repeat(60))
  console.log('RESULTS')
  console.log('='.repeat(60))
  console.log(`  Total processed: ${stats.total - stats.skipped}`)
  console.log(`  Skipped: ${stats.skipped}`)
  console.log(`  Alive: ${stats.alive}`)
  console.log(`  Dead (unresolvable): ${stats.dead - stats.resolved}`)
  console.log(`  Resolved via ATS: ${stats.resolved}`)
  console.log(`  Descriptions scraped: ${stats.scraped}`)
  console.log(`  URLs updated: ${stats.urlUpdated}`)
  console.log(`  Descriptions updated: ${stats.descriptionUpdated}`)
  console.log(`  Licenses updated: ${stats.licensesUpdated}`)
  console.log(`  DB errors: ${stats.errors}`)

  if (report.resolved.length > 0) {
    console.log(`\nRESOLVED URLS (${report.resolved.length}):`)
    for (const r of report.resolved) {
      console.log(`  ${r.job}`)
      console.log(`    Old: ${r.oldUrl}`)
      console.log(`    New: ${r.newUrl}`)
    }
  }

  if (report.dead.length > 0) {
    console.log(`\nSTILL DEAD (${report.dead.length}):`)
    for (const d of report.dead) {
      console.log(`  [${d.id}] ${d.job}`)
      console.log(`    URL: ${d.url || '(none)'}`)
    }
  }

  if (report.licensesFound.length > 0) {
    console.log(`\nLICENSES DETECTED (${report.licensesFound.length}):`)
    for (const l of report.licensesFound) {
      console.log(`  ${l.job}`)
      console.log(`    Licenses: ${l.licenses.join(', ')} (${l.required ? 'REQUIRED' : l.preferred ? 'PREFERRED' : 'mentioned'})`)
      if (l.evidence.length > 0) {
        console.log(`    Evidence: "${l.evidence[0].slice(0, 120)}..."`)
      }
    }
  }

  if (report.dead.length > 0) {
    console.log(`\nSQL to deactivate unresolvable dead jobs:`)
    const ids = report.dead.map(d => `'${d.id}'`).join(', ')
    console.log(`UPDATE jobs SET is_active = false, updated_at = NOW(), removal_detected_at = NOW() WHERE id IN (${ids});`)
  }

  if (DRY_RUN) {
    console.log(`\nRun without --dry-run to apply these changes.`)
  }
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
