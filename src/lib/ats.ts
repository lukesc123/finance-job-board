/**
 * ATS (Applicant Tracking System) resolver and job page scraper.
 *
 * Given a company's career URL or a generic apply URL, this module can:
 * 1. Detect which ATS platform the company uses
 * 2. Search the ATS for a specific job by title
 * 3. Scrape the actual job posting page for description and requirements
 * 4. Extract license/certification requirements from the description
 *
 * Supported ATS platforms:
 * - Workday (myworkdayjobs.com)
 * - Greenhouse (greenhouse.io, boards.greenhouse.io)
 * - Lever (lever.co, jobs.lever.co)
 * - iCIMS (icims.com, careers-*.icims.com)
 * - SmartRecruiters (smartrecruiters.com)
 * - Taleo/Oracle (oraclecloud.com)
 * - Custom career pages (fallback: HTML scraping)
 */

// ─── ATS Detection ───────────────────────────────────────────────────────────

export type ATSPlatform =
  | 'workday'
  | 'greenhouse'
  | 'lever'
  | 'icims'
  | 'smartrecruiters'
  | 'taleo'
  | 'custom'

interface ATSDetection {
  platform: ATSPlatform
  companySlug?: string
  apiBase?: string
}

const ATS_PATTERNS: [RegExp, ATSPlatform, (match: RegExpMatchArray, url: URL) => ATSDetection][] = [
  // Workday: *.myworkdayjobs.com or *.wd5.myworkdayjobs.com
  [
    /([a-z0-9-]+)\.(?:wd\d+\.)?myworkdayjobs\.com/i,
    'workday',
    (m, url) => ({
      platform: 'workday',
      companySlug: m[1],
      apiBase: `${url.origin}${url.pathname.split('/').slice(0, 3).join('/')}`,
    }),
  ],
  // Greenhouse: boards.greenhouse.io/<company> or <company>.greenhouse.io
  [
    /(?:boards\.greenhouse\.io\/([a-z0-9_-]+)|([a-z0-9-]+)\.greenhouse\.io)/i,
    'greenhouse',
    (m) => ({
      platform: 'greenhouse',
      companySlug: m[1] || m[2],
      apiBase: `https://boards-api.greenhouse.io/v1/boards/${m[1] || m[2]}`,
    }),
  ],
  // Lever: jobs.lever.co/<company>
  [
    /jobs\.lever\.co\/([a-z0-9_-]+)/i,
    'lever',
    (m) => ({
      platform: 'lever',
      companySlug: m[1],
      apiBase: `https://api.lever.co/v0/postings/${m[1]}`,
    }),
  ],
  // iCIMS: careers-*.icims.com
  [
    /careers?-?([a-z0-9-]+)\.icims\.com/i,
    'icims',
    (m, url) => ({
      platform: 'icims',
      companySlug: m[1],
      apiBase: url.origin,
    }),
  ],
  // SmartRecruiters: jobs.smartrecruiters.com/<company>
  [
    /jobs\.smartrecruiters\.com\/([a-z0-9_-]+)/i,
    'smartrecruiters',
    (m) => ({
      platform: 'smartrecruiters',
      companySlug: m[1],
      apiBase: `https://api.smartrecruiters.com/v1/companies/${m[1]}`,
    }),
  ],
  // Oracle/Taleo
  [
    /([a-z0-9-]+)\.oraclecloud\.com/i,
    'taleo',
    (m, url) => ({
      platform: 'taleo',
      companySlug: m[1],
      apiBase: url.origin,
    }),
  ],
]

export function detectATS(url: string): ATSDetection {
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`)
    for (const [pattern, , factory] of ATS_PATTERNS) {
      const match = parsed.hostname.match(pattern) || url.match(pattern)
      if (match) return factory(match, parsed)
    }
  } catch { /* ignore */ }
  return { platform: 'custom' }
}

// ─── Job Search per ATS ──────────────────────────────────────────────────────

export interface ResolvedJob {
  url: string
  title: string
  location?: string
  description?: string
  descriptionHtml?: string
}

const FETCH_OPTS: RequestInit = {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/html, */*',
  },
  signal: AbortSignal.timeout(15_000),
}

/**
 * Search an ATS for a specific job by title.
 * Returns the best-matching job posting URL and metadata.
 */
export async function searchATS(
  careersUrl: string,
  jobTitle: string,
  opts?: { location?: string }
): Promise<ResolvedJob | null> {
  const ats = detectATS(careersUrl)

  switch (ats.platform) {
    case 'greenhouse':
      return searchGreenhouse(ats, jobTitle, opts?.location)
    case 'lever':
      return searchLever(ats, jobTitle, opts?.location)
    case 'smartrecruiters':
      return searchSmartRecruiters(ats, jobTitle, opts?.location)
    case 'workday':
      return searchWorkday(ats, jobTitle, careersUrl)
    default:
      return null // Custom sites need HTML scraping (handled separately)
  }
}

// --- Greenhouse API ---
async function searchGreenhouse(
  ats: ATSDetection,
  title: string,
  location?: string
): Promise<ResolvedJob | null> {
  try {
    const res = await fetch(`${ats.apiBase}/jobs?content=true`, FETCH_OPTS)
    if (!res.ok) return null
    const data = await res.json() as { jobs: Array<{
      id: number; title: string; location: { name: string };
      absolute_url: string; content: string
    }> }

    const match = findBestMatch(data.jobs, title, location, {
      getTitle: j => j.title,
      getLocation: j => j.location?.name,
    })

    if (!match) return null
    return {
      url: match.absolute_url,
      title: match.title,
      location: match.location?.name,
      descriptionHtml: match.content,
      description: stripHtml(match.content),
    }
  } catch { return null }
}

// --- Lever API ---
async function searchLever(
  ats: ATSDetection,
  title: string,
  location?: string
): Promise<ResolvedJob | null> {
  try {
    const res = await fetch(`${ats.apiBase}`, FETCH_OPTS)
    if (!res.ok) return null
    const jobs = await res.json() as Array<{
      id: string; text: string; categories: { location: string };
      hostedUrl: string; descriptionPlain: string; description: string
    }>

    const match = findBestMatch(jobs, title, location, {
      getTitle: j => j.text,
      getLocation: j => j.categories?.location,
    })

    if (!match) return null
    return {
      url: match.hostedUrl,
      title: match.text,
      location: match.categories?.location,
      descriptionHtml: match.description,
      description: match.descriptionPlain || stripHtml(match.description),
    }
  } catch { return null }
}

// --- SmartRecruiters API ---
async function searchSmartRecruiters(
  ats: ATSDetection,
  title: string,
  location?: string
): Promise<ResolvedJob | null> {
  try {
    const params = new URLSearchParams({ q: title, limit: '20' })
    const res = await fetch(`${ats.apiBase}/postings?${params}`, FETCH_OPTS)
    if (!res.ok) return null
    const data = await res.json() as { content: Array<{
      id: string; name: string; location: { city: string };
      ref: string; company: { name: string }
    }> }

    const match = findBestMatch(data.content || [], title, location, {
      getTitle: j => j.name,
      getLocation: j => j.location?.city,
    })

    if (!match) return null

    // Get full description
    const detailRes = await fetch(
      `${ats.apiBase}/postings/${match.id}`,
      FETCH_OPTS
    )
    let description = ''
    if (detailRes.ok) {
      const detail = await detailRes.json() as { jobAd?: { sections?: { jobDescription?: { text: string } } } }
      description = detail.jobAd?.sections?.jobDescription?.text || ''
    }

    return {
      url: `https://jobs.smartrecruiters.com/${ats.companySlug}/${match.id}`,
      title: match.name,
      location: match.location?.city,
      description: stripHtml(description),
      descriptionHtml: description,
    }
  } catch { return null }
}

// --- Workday ---
async function searchWorkday(
  ats: ATSDetection,
  title: string,
  careersUrl: string
): Promise<ResolvedJob | null> {
  // Workday uses a JSON API at the career site's base URL
  try {
    const base = ats.apiBase || careersUrl
    const searchUrl = `${base}?q=${encodeURIComponent(title)}&format=json`
    const res = await fetch(searchUrl, {
      ...FETCH_OPTS,
      headers: {
        ...FETCH_OPTS.headers as Record<string, string>,
        'Accept': 'application/json',
      },
    })
    if (!res.ok) return null
    const data = await res.json()

    // Workday response structure varies, try common patterns
    const postings = data?.jobPostings || data?.body?.children?.[0]?.children || []
    if (!Array.isArray(postings) || postings.length === 0) return null

    const titleLower = title.toLowerCase()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const best = postings.find((p: any) => {
      const t = String(p.title || p.bulletFields?.[0] || '').toLowerCase()
      return t.includes(titleLower) || titleLower.includes(t)
    })

    if (!best) return null

    const jobUrl = best.externalPath
      ? `${new URL(careersUrl).origin}${best.externalPath}`
      : null

    return jobUrl ? {
      url: jobUrl,
      title: String(best.title || best.bulletFields?.[0] || title),
      location: String(best.locationsText || ''),
    } : null
  } catch { return null }
}

// ─── HTML Job Page Scraper ───────────────────────────────────────────────────

/**
 * Scrape a job posting page for its description content.
 * Works on any page by extracting the largest text block that looks like a job description.
 */
export async function scrapeJobPage(url: string): Promise<{
  title?: string
  description: string
  descriptionHtml: string
  status: 'ok' | 'not-found' | 'error'
} | null> {
  try {
    const fullUrl = url.startsWith('http') ? url : `https://${url}`
    const res = await fetch(fullUrl, {
      ...FETCH_OPTS,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    })

    if (res.status === 404 || res.status === 410) {
      return { description: '', descriptionHtml: '', status: 'not-found' }
    }
    if (!res.ok) return { description: '', descriptionHtml: '', status: 'error' }

    const html = await res.text()

    // Check for soft-404 indicators
    const lower = html.toLowerCase()
    const hasJobContent =
      lower.includes('responsibilities') ||
      lower.includes('qualifications') ||
      lower.includes('requirements') ||
      lower.includes('job description') ||
      lower.includes('about the role') ||
      lower.includes('what you\'ll do') ||
      lower.includes('apply now')

    if (!hasJobContent) {
      return { description: '', descriptionHtml: '', status: 'not-found' }
    }

    // Extract title from <title> or <h1>
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i)
    const title = h1Match?.[1]?.trim() || titleMatch?.[1]?.trim()

    // Extract job description - look for common container patterns
    const descriptionHtml = extractJobDescription(html)
    const description = stripHtml(descriptionHtml)

    return {
      title,
      description,
      descriptionHtml,
      status: 'ok',
    }
  } catch {
    return null
  }
}

function extractJobDescription(html: string): string {
  // Try structured data first (JSON-LD)
  const jsonLdMatch = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)
  if (jsonLdMatch) {
    for (const block of jsonLdMatch) {
      try {
        const json = block.replace(/<\/?script[^>]*>/gi, '')
        const data = JSON.parse(json)
        if (data['@type'] === 'JobPosting' && data.description) {
          return data.description
        }
        // Sometimes it's in an array
        if (Array.isArray(data)) {
          const jobPost = data.find((d: Record<string, unknown>) => d['@type'] === 'JobPosting')
          if (jobPost?.description) return jobPost.description
        }
      } catch { /* invalid JSON-LD, try next */ }
    }
  }

  // Try common description container selectors via regex
  const containerPatterns = [
    // data attributes
    /data-(?:job-?)?description[^>]*>([\s\S]*?)<\/(?:div|section|article)/i,
    // class-based
    /class="[^"]*(?:job[-_]?description|posting[-_]?description|job[-_]?details|job[-_]?content|description[-_]?body)[^"]*"[^>]*>([\s\S]*?)<\/(?:div|section|article)/i,
    // id-based
    /id="[^"]*(?:job[-_]?description|posting[-_]?body|job[-_]?details)[^"]*"[^>]*>([\s\S]*?)<\/(?:div|section|article)/i,
  ]

  for (const pattern of containerPatterns) {
    const match = html.match(pattern)
    if (match?.[1] && match[1].length > 200) {
      return match[1]
    }
  }

  // Fallback: find the largest block of text between common job keywords
  const keywordStart = html.search(/(?:responsibilities|qualifications|requirements|about the role|what you)/i)
  if (keywordStart > 0) {
    // Grab a generous chunk from keyword start
    const chunk = html.slice(Math.max(0, keywordStart - 500), keywordStart + 10000)
    return chunk
  }

  return ''
}

// ─── License/Certification Extraction ────────────────────────────────────────

export type FinanceLicense =
  | 'SIE' | 'Series 6' | 'Series 7' | 'Series 63' | 'Series 65'
  | 'Series 66' | 'Series 79' | 'Series 3' | 'CPA' | 'CPA Track'
  | 'CFA Level 1' | 'None Required'

interface LicenseAnalysis {
  licensesFound: FinanceLicense[]
  isRequired: boolean
  /** Whether the license is a "preferred"/"nice to have" rather than required */
  isPreferred: boolean
  rawMatches: string[]
}

const LICENSE_PATTERNS: [RegExp, FinanceLicense][] = [
  [/\bSIE\b(?:\s+exam|\s+license|\s+certification)?/i, 'SIE'],
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
  [/\bFINRA\b.*(?:Series|license|registration)/i, 'SIE'], // FINRA mention usually implies SIE
]

// Context patterns that indicate these are required vs preferred
const REQUIRED_CONTEXT = [
  /(?:must|required|need|shall)\s+(?:have|hold|obtain|possess|maintain)/i,
  /(?:required|mandatory)\s+(?:licenses?|certifications?|registrations?)/i,
  /(?:obtain|pass|complete)\s+(?:within|before|prior)/i,
  /(?:licensed|registered|certified)\s+(?:as|in|with|to)/i,
]

const PREFERRED_CONTEXT = [
  /(?:prefer(?:red)?|nice\s+to\s+have|desir(?:ed|able)|plus|bonus|asset|advantage)/i,
  /(?:working\s+towards?|pursuing|in\s+progress|studying\s+for)/i,
  /(?:willingness|willing|ability)\s+to\s+(?:obtain|study|pursue)/i,
]

/**
 * Analyze a job description for license/certification requirements.
 */
export function extractLicenses(description: string): LicenseAnalysis {
  const text = stripHtml(description)
  const found = new Set<FinanceLicense>()
  const rawMatches: string[] = []

  for (const [pattern, license] of LICENSE_PATTERNS) {
    const match = text.match(pattern)
    if (match) {
      found.add(license)
      // Capture surrounding context (80 chars each side)
      const idx = match.index || 0
      const context = text.slice(Math.max(0, idx - 80), idx + match[0].length + 80)
      rawMatches.push(context.replace(/\s+/g, ' ').trim())
    }
  }

  if (found.has('CPA Track')) found.delete('CPA') // CPA Track is more specific

  // Determine if required or preferred
  let isRequired = false
  let isPreferred = false

  for (const ctx of rawMatches) {
    if (REQUIRED_CONTEXT.some(re => re.test(ctx))) isRequired = true
    if (PREFERRED_CONTEXT.some(re => re.test(ctx))) isPreferred = true
  }

  // If both required and preferred appear, treat as required with some preferred
  const licensesFound = found.size > 0 ? [...found] : ['None Required' as FinanceLicense]

  return {
    licensesFound,
    isRequired: found.size > 0 && isRequired,
    isPreferred: found.size > 0 && isPreferred,
    rawMatches,
  }
}

// ─── Utilities ───────────────────────────────────────────────────────────────

/** Strip HTML tags and decode entities */
export function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(?:p|div|li|h[1-6]|tr)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .trim()
}

/** Fuzzy title matching: find the best match from a list of jobs */
function findBestMatch<T>(
  jobs: T[],
  title: string,
  location: string | undefined,
  accessors: { getTitle: (j: T) => string; getLocation: (j: T) => string | undefined }
): T | null {
  if (jobs.length === 0) return null

  const titleLower = title.toLowerCase().replace(/[^a-z0-9\s]/g, '')
  const titleWords = titleLower.split(/\s+/).filter(w => w.length > 2)
  const locLower = location?.toLowerCase() || ''

  let bestScore = 0
  let bestMatch: T | null = null

  for (const job of jobs) {
    const jobTitle = accessors.getTitle(job).toLowerCase().replace(/[^a-z0-9\s]/g, '')
    const jobLoc = (accessors.getLocation(job) || '').toLowerCase()

    // Exact substring match is best
    if (jobTitle.includes(titleLower) || titleLower.includes(jobTitle)) {
      const locBonus = locLower && jobLoc.includes(locLower) ? 10 : 0
      const score = 100 + locBonus
      if (score > bestScore) {
        bestScore = score
        bestMatch = job
      }
      continue
    }

    // Word overlap scoring
    const jobWords = jobTitle.split(/\s+/).filter(w => w.length > 2)
    const overlap = titleWords.filter(w => jobWords.includes(w)).length
    const score = (overlap / Math.max(titleWords.length, 1)) * 80
    const locBonus = locLower && jobLoc.includes(locLower) ? 10 : 0

    if (score + locBonus > bestScore) {
      bestScore = score + locBonus
      bestMatch = job
    }
  }

  // Only return if we have a reasonable match (>40% word overlap or exact match)
  return bestScore >= 40 ? bestMatch : null
}
