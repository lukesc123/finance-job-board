export function timeAgoFromTimestamp(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  return `${months}mo ago`
}

export function timeAgo(date: string): string {
  return timeAgoFromTimestamp(new Date(date).getTime())
}

export function formatSalaryShort(n: number): string {
  return n >= 1000 ? `$${Math.round(n / 1000)}K` : `$${n}`
}

export function formatSalary(min: number | null, max: number | null): string | null {
  if (!min && !max) return null
  const fmt = (n: number) => (n >= 1000 ? `$${Math.round(n / 1000)}K` : `$${n}`)
  if (min && max && min !== max) return `${fmt(min)} - ${fmt(max)}`
  if (min) return fmt(min)
  if (max) return fmt(max)
  return null
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Returns a clearer label for pipeline stages with class-year context.
 * In finance recruiting:
 * - "Sophomore Internship" = programs for rising sophomores (current freshmen)
 * - "Junior Internship" = programs for rising juniors (current sophomores)
 * - "Senior Internship" = summer analyst for rising seniors (current juniors)
 */
export function getPipelineStageDisplay(stage: string): { label: string; subtitle: string } {
  switch (stage) {
    case 'Sophomore Internship':
      return { label: 'Sophomore Intern', subtitle: 'For rising sophomores (freshmen)' }
    case 'Junior Internship':
      return { label: 'Junior Intern', subtitle: 'For rising juniors (sophomores)' }
    case 'Senior Internship':
      return { label: 'Senior Intern', subtitle: 'For rising seniors (juniors)' }
    case 'New Grad':
      return { label: 'New Grad', subtitle: 'Recent graduates' }
    case 'Early Career':
      return { label: 'Early Career', subtitle: '1-3 years experience' }
    case 'No Experience Required':
      return { label: 'No Exp. Required', subtitle: 'Open to all levels' }
    default:
      return { label: stage, subtitle: '' }
  }
}

/**
 * Returns target graduation year text based on grad date fields
 */
export function getGradYearText(earliest: string | null, latest: string | null): string | null {
  if (!earliest && !latest) return null
  const date = latest || earliest
  if (!date) return null
  const year = new Date(date).getFullYear()
  return `Class of ${year}`
}

/**
 * Checks if an apply URL is a generic careers page rather than a specific job posting.
 * Generic URLs point to search pages, career landing pages, etc. rather than a direct job listing.
 */
export function isGenericApplyUrl(url: string): boolean {
  if (!url) return false
  try {
    const u = new URL(url.startsWith('http') ? url : `https://${url}`)
    const path = u.pathname.toLowerCase()
    const host = u.hostname.toLowerCase()
    const fullUrl = u.href.toLowerCase()

    // Root-only career domains (e.g., careers.truist.com/, jobs.prudential.com/)
    if (path === '/' && /careers?\.|jobs\.|campus\.|hiring\./i.test(host)) return true

    // Patterns that indicate a generic careers/search page
    const genericPatterns = [
      /\/careers\/?$/,
      /\/careers\/?#/,
      /\/careers\/$/,
      /\/search-jobs\/?$/,
      /\/search-results\/?$/,
      /\/job-search-results\/?$/,
      /\/early-careers?\/?$/,
      /\/entry-level\/?$/,
      /\/students?\/?$/,
      /\/students-and-graduates\/?$/,
      /\/career-discovery-programs\/?$/,
      /\/open-positions\/?$/,
      /\/find-open-positions\/?$/,
      /\/new-analyst-program\/?$/,
      /\/campus\/?$/,
      /\/jobboard\/?/,
      /\/results\/?$/,
      /\/roles\/?$/,
      /\/SearchJobs\/?$/i,
      /\/internships?\/?$/,
      /\/full-time-opportunities\/?$/,
      /\/programs-and-internships\/?$/i,
      /\/campus-recruiting\/?$/i,
      /\/experienced-professionals\/?$/i,
      /\/job-opportunities\/?$/i,
      /\/opportunities\/?$/i,
      /\/apply-now\/?$/i,
      /\/job-listings\/?$/i,
    ]

    // Check path against generic patterns
    for (const pattern of genericPatterns) {
      if (pattern.test(path)) return true
    }

    // Workday campus/search pages (specific jobs have /job/ with alphanumeric ID)
    if (host.includes('myworkdayjobs.com') && !path.match(/\/job\//)) return true

    // Greenhouse job board landing pages (specific jobs have /jobs/<id>)
    if (host.includes('greenhouse.io') && !path.match(/\/jobs\/\d+/)) return true

    // Lever job listings (specific jobs have a UUID)
    if (host.includes('lever.co') && !path.match(/\/[a-f0-9-]{36}/)) return true

    // Goldman higher.gs.com (specific roles have /roles/<number>)
    if (host === 'higher.gs.com' && !path.match(/\/roles\/\d+/)) return true

    // Oracle/Taleo (JPMC, etc.) - specific jobs have /job/<number>
    if (host.includes('oraclecloud.com') && !path.match(/\/job\/\d+/)) return true

    // Citi jobs - generic search pages without specific job ID
    if (host === 'jobs.citi.com' && !path.match(/\/job\//)) return true

    // Bank of America campus - specific pages have descriptive slugs with year
    if (host === 'campus.bankofamerica.com' && path.split('/').filter(Boolean).length <= 1) return true

    // Deloitte apply portal - specific jobs have /JobDetail/ with ID
    if (host === 'apply.deloitte.com' && !path.match(/\/JobDetail\//i)) return true

    // EY careers - specific jobs have /job/ with a numeric ID at the end
    if (host === 'careers.ey.com' && !path.match(/\/job\/.+\/\d+\/?$/)) return true

    // EY referrals (SelectMinds) - generic unless specific job ID
    if (host.includes('selectminds.com') && !path.match(/\/\d+/)) return true

    // Morgan Stanley - specific jobs have /apply/<number> or /opp/<number>
    if (host.includes('morganstanley.tal.net') && !path.match(/\/(apply|opp)\/\d+/)) return true

    // Barclays - specific jobs have /job/ with path segments
    if (host === 'search.jobs.barclays' && !path.match(/\/job\//)) return true

    // Jefferies - specific openings have /opp/<number>
    if (host === 'jefferies.tal.net' && !path.match(/\/opp\/\d+/)) return true

    // Bridgewater - generic careers page
    if (host.includes('bridgewater.com') && /\/careers?\/?$/i.test(path)) return true

    // Citadel - specific jobs have /details/<slug>
    if (host.includes('citadel.com') && path.includes('/careers') && !path.match(/\/details\//)) return true

    // Protiviti - generic careers
    if (host.includes('protiviti.com') && !path.match(/\/\d+/)) return true

    // Northern Trust - generic careers
    if (host.includes('northerntrust.com') && /\/careers?\/?/i.test(path) && !path.match(/\/\d{4,}/)) return true

    // PwC - generic careers
    if (host.includes('pwc.com') && /\/careers?\/?/i.test(path) && !path.match(/\/\d{4,}/)) return true

    // Generic: paths that are just /careers/<section> without a job ID
    if (/\/careers?\/(search|browse|explore|find|results|listings)\/?$/i.test(path)) return true

    // Very short paths on career-related domains
    const segments = path.split('/').filter(Boolean)
    if (segments.length <= 1 && /career|jobs|hiring|campus|recruiting/i.test(host)) return true

    // URL contains no numeric ID of 4+ digits anywhere (path or query) on known ATS domains
    const hasJobId = path.match(/\d{4,}/) || u.search.match(/\d{4,}/)
    if (!hasJobId && /career|jobs|campus|recruiting|talent/i.test(host) && segments.length <= 2) return true

    return false
  } catch {
    return false
  }
}

export function getPipelineStageBadgeColor(stage: string): string {
  if (stage.includes('Internship')) return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  if (stage === 'New Grad') return 'bg-blue-50 text-blue-700 border-blue-200'
  if (stage === 'Early Career') return 'bg-amber-50 text-amber-700 border-amber-200'
  if (stage === 'No Experience Required') return 'bg-violet-50 text-violet-700 border-violet-200'
  return 'bg-navy-50 text-navy-700 border-navy-200'
}

export function getPipelineStageAccent(stage: string): string {
  if (stage.includes('Internship')) return 'border-l-emerald-400'
  if (stage === 'New Grad') return 'border-l-blue-400'
  if (stage === 'Early Career') return 'border-l-amber-400'
  if (stage === 'No Experience Required') return 'border-l-violet-400'
  return 'border-l-navy-300'
}

export function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

export const stageColors: Record<string, string> = {
  'Sophomore Internship': 'bg-purple-50 text-purple-700 border-purple-200',
  'Junior Internship': 'bg-blue-50 text-blue-700 border-blue-200',
  'Senior Internship': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'New Grad': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Early Career': 'bg-teal-50 text-teal-700 border-teal-200',
  'No Experience Required': 'bg-amber-50 text-amber-700 border-amber-200',
}

/** Safely extract a clean hostname from a URL string, stripping 'www.' prefix. */
export function extractHostname(url: string): string {
  try {
    return new URL(url.startsWith('http') ? url : `https://${url}`).hostname.replace('www.', '')
  } catch {
    return ''
  }
}

// Generic debounce: args typed via Parameters<T>
export function debounce<T extends (...args: never[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}
