import { logger } from '@/lib/logger'

/**
 * Google Custom Search utility for finding job posting URLs
 * Uses Google Custom Search JSON API with rate limiting awareness
 * Free tier: 100 queries/day
 */

// Track search query count for the day
let searchQueryCount = 0
let lastResetDate = new Date().toDateString()

interface CustomSearchResult {
  title: string
  link: string
  snippet: string
}

interface CustomSearchResponse {
  items?: CustomSearchResult[]
  error?: {
    code: number
    message: string
  }
}

/**
 * Get current search query count for the day
 */
export function getSearchQueryCount(): number {
  const today = new Date().toDateString()
  if (today !== lastResetDate) {
    searchQueryCount = 0
    lastResetDate = today
  }
  return searchQueryCount
}

/**
 * Check if we can perform another search (respects free tier limit)
 */
export function canPerformSearch(): boolean {
  return getSearchQueryCount() < 100
}

/**
 * Check if a URL looks like a job posting URL
 * Filters out generic career pages, news articles, LinkedIn, etc.
 */
export function isJobPostingUrl(url: string): boolean {
  try {
    const urlLower = url.toLowerCase()
    const pathname = new URL(url).pathname.toLowerCase()

    // Reject known bad patterns
    if (urlLower.includes('linkedin.com')) return false
    if (urlLower.includes('indeed.com')) return false
    if (urlLower.includes('glassdoor.com')) return false
    if (urlLower.includes('news') || urlLower.includes('press')) return false
    if (pathname === '/' || pathname === '/careers' || pathname === '/careers/') return false
    if (pathname.includes('/careers') && !pathname.includes('/job') && !pathname.includes('/position')) {
      return false
    }

    // Accept known job posting platforms
    if (
      urlLower.includes('greenhouse.io') ||
      urlLower.includes('lever.co') ||
      urlLower.includes('workday.com') ||
      urlLower.includes('bamboohr.com') ||
      urlLower.includes('smartrecruiters.com') ||
      urlLower.includes('ashby.co')
    ) {
      return true
    }

    // Accept URLs with job/position/career keywords
    if (
      pathname.includes('/job/') ||
      pathname.includes('/jobs/') ||
      pathname.includes('/position/') ||
      pathname.includes('/positions/') ||
      pathname.includes('/career/') ||
      pathname.includes('/careers/') ||
      pathname.includes('/opening/') ||
      pathname.includes('/apply/') ||
      pathname.includes('/opportunities/') ||
      urlLower.includes('?job=') ||
      urlLower.includes('&job=') ||
      urlLower.includes('?position=') ||
      urlLower.includes('&position=')
    ) {
      return true
    }

    return false
  } catch {
    return false
  }
}

/**
 * Search for a job posting URL using Google Custom Search
 * @param companyName - Name of the company
 * @param jobTitle - Title of the job position
 * @returns URL of the job posting, or null if not found
 */
export async function searchForJobUrl(companyName: string, jobTitle: string): Promise<string | null> {
  // Check rate limit
  if (!canPerformSearch()) {
    logger.warn(
      '[googleSearch] Rate limit reached for today',
      { queryCount: getSearchQueryCount() }
    )
    return null
  }

  // Validate inputs
  if (!companyName?.trim() || !jobTitle?.trim()) {
    return null
  }

  const apiKey = process.env.GOOGLE_API_KEY
  const cseId = process.env.GOOGLE_CSE_ID

  if (!apiKey || !cseId) {
    logger.error('[googleSearch] Missing Google API configuration')
    return null
  }

  try {
    // Construct search query: company name + job title + apply/careers keywords
    const query = `"${companyName}" "${jobTitle}" apply careers`
    const encodedQuery = encodeURIComponent(query)
    const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cseId}&q=${encodedQuery}`

    logger.info('[googleSearch] Searching', { companyName, jobTitle, query })
    searchQueryCount++

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      const errorData = await response.text()
      logger.error('[googleSearch] API error', {
        status: response.status,
        error: errorData,
      })
      return null
    }

    const data: CustomSearchResponse = await response.json()

    // Handle API errors
    if (data.error) {
      logger.error('[googleSearch] API returned error', {
        code: data.error.code,
        message: data.error.message,
      })
      return null
    }

    // No results found
    if (!data.items || data.items.length === 0) {
      logger.info('[googleSearch] No results found', { companyName, jobTitle })
      return null
    }

    // Find the first result that looks like a real job posting
    for (const item of data.items) {
      if (isJobPostingUrl(item.link)) {
        logger.info('[googleSearch] Found job posting URL', {
          companyName,
          jobTitle,
          url: item.link,
          title: item.title,
        })
        return item.link
      }
    }

    // No suitable job posting URL found in results
    logger.info('[googleSearch] No suitable job posting URL found', {
      companyName,
      jobTitle,
      resultCount: data.items.length,
    })
    return null
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    logger.error('[googleSearch] Search failed', { companyName, jobTitle, error: msg })
    return null
  }
}
