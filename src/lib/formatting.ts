export function timeAgo(date: string): string {
  const now = new Date()
  const then = new Date(date)
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000)

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

    // Patterns that indicate a generic careers/search page
    const genericPatterns = [
      /\/careers\/?$/,
      /\/careers\/?#/,
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
    ]

    // Check path against generic patterns
    for (const pattern of genericPatterns) {
      if (pattern.test(path)) return true
    }

    // Workday campus/search pages
    if (host.includes('myworkdayjobs.com') && !path.match(/\/job\/\d/)) return true

    // Goldman higher.gs.com roles listing (not a specific role)
    if (host === 'higher.gs.com' && path === '/roles') return true

    // Very short paths on careers domains are likely generic
    if (path.split('/').filter(Boolean).length <= 2 && /career|jobs|hiring/i.test(path)) return true

    return false
  } catch {
    return false
  }
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function debounce<T extends (...args: any[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}
