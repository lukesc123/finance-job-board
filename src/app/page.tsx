'use client'

import { useState, useCallback, useEffect, useMemo, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import SearchBar from '@/components/SearchBar'
import Filters from '@/components/Filters'
import SavedSearches from '@/components/SavedSearches'
import JobCard from '@/components/JobCard'
import JobCardSkeleton from '@/components/JobCardSkeleton'
// Lazy-load non-critical interactive overlays
const JobPreview = dynamic(() => import('@/components/JobPreview'), { ssr: false })
const KeyboardNav = dynamic(() => import('@/components/KeyboardNav'), { ssr: false })
const CompareBar = dynamic(() => import('@/components/CompareBar'), { ssr: false })

// Lazy-load below-the-fold components with loading skeletons
const JobAlertSignup = dynamic(() => import('@/components/JobAlertSignup'), {
  loading: () => <div className="h-12 bg-white rounded-xl animate-pulse border border-navy-100" />,
  ssr: false,
})
const RecentlyViewed = dynamic(() => import('@/components/RecentlyViewed'), {
  loading: () => <div className="h-16 bg-white rounded-xl animate-pulse border border-navy-100" />,
  ssr: false,
})
const SalaryInsights = dynamic(() => import('@/components/SalaryInsights'), {
  loading: () => <div className="h-20 bg-white rounded-xl animate-pulse border border-navy-100" />,
  ssr: false,
})
import ErrorBoundary from '@/components/ErrorBoundary'
import { Job, JobFilters, PIPELINE_STAGES } from '@/types'
import { getPipelineStageDisplay, debounce } from '@/lib/formatting'
import { JOB_CATEGORIES, CATEGORY_ACCENT, STORAGE_KEYS, STORAGE_EVENTS } from '@/lib/constants'
import { fetchRetry } from '@/lib/fetchRetry'
import { useNewJobCount } from '@/hooks/useRealtimeJobs'

type SortBy = 'newest' | 'salary_high' | 'salary_low' | 'company_az' | 'relevance'

const FILTER_KEYS: (keyof JobFilters)[] = ['category', 'job_type', 'pipeline_stage', 'remote_type', 'license', 'search', 'grad_date', 'salary_min', 'salary_max', 'company', 'location']

const PAGE_SIZE = 20

function filtersFromParams(params: URLSearchParams): JobFilters {
  return {
    category: (params.get('category') || '') as JobFilters['category'],
    job_type: (params.get('job_type') || '') as JobFilters['job_type'],
    pipeline_stage: (params.get('pipeline_stage') || '') as JobFilters['pipeline_stage'],
    remote_type: (params.get('remote_type') || '') as JobFilters['remote_type'],
    license: (params.get('license') || '') as JobFilters['license'],
    search: params.get('search') || '',
    grad_date: params.get('grad_date') || '',
    salary_min: params.get('salary_min') || '',
    salary_max: params.get('salary_max') || '',
    company: params.get('company') || '',
    location: params.get('location') || '',
  }
}

function filtersToParams(filters: JobFilters, sortBy: string, showSaved: boolean): string {
  const params = new URLSearchParams()
  FILTER_KEYS.forEach(key => {
    if (filters[key]) params.set(key, filters[key])
  })
  if (sortBy !== 'newest' && sortBy !== 'relevance') params.set('sort', sortBy)
  if (showSaved) params.set('saved', '1')
  return params.toString()
}


function HomePageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const isInitialMount = useRef(true)

  const [filters, setFilters] = useState<JobFilters>(() => {
    const fromUrl = filtersFromParams(searchParams)
    const hasUrlFilters = FILTER_KEYS.some(k => fromUrl[k])
    if (hasUrlFilters) return fromUrl
    // Restore from sessionStorage on back navigation
    try {
      const cached = sessionStorage.getItem(STORAGE_KEYS.FILTERS)
      if (cached) return JSON.parse(cached)
    } catch { /* ignore */ }
    return fromUrl
  })
  const [allJobs, setAllJobs] = useState<Job[]>([])
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<SortBy>(() => {
    const urlSort = searchParams.get('sort') as SortBy
    if (urlSort) return urlSort
    try { return (sessionStorage.getItem(STORAGE_KEYS.SORT) as SortBy) || 'newest' } catch { return 'newest' }
  })
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [showSaved, setShowSaved] = useState(() => searchParams.get('saved') === '1')
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set())
  const [previewJob, setPreviewJob] = useState<Job | null>(null)
  const [isDesktop, setIsDesktop] = useState(false)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)
  const previewSourceRef = useRef<HTMLElement | null>(null)

  // Realtime: track new jobs since last fetch
  const { count: newJobCount, reset: resetNewJobCount } = useNewJobCount(
    filters.category || undefined,
  )

  // Desktop detection for split-pane; close preview when resizing below breakpoint
  useEffect(() => {
    const check = () => {
      const desktop = window.innerWidth >= 1024
      setIsDesktop(desktop)
      if (!desktop) setPreviewJob(null)
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Scroll position restoration on back navigation
  useEffect(() => {
    try {
      const savedScroll = sessionStorage.getItem(STORAGE_KEYS.SCROLL)
      if (savedScroll) {
        const y = Math.max(0, parseInt(savedScroll, 10) || 0)
        requestAnimationFrame(() => window.scrollTo(0, y))
        sessionStorage.removeItem(STORAGE_KEYS.SCROLL)
      }
    } catch { /* ignore */ }

    const saveScroll = () => {
      try { sessionStorage.setItem(STORAGE_KEYS.SCROLL, String(window.scrollY)) } catch { /* ignore */ }
    }
    // Save on any navigation away (link clicks trigger beforeunload in SPA via popstate)
    window.addEventListener('beforeunload', saveScroll)
    // Also save periodically for SPA navigations
    const interval = setInterval(saveScroll, 2000)
    return () => {
      saveScroll()
      window.removeEventListener('beforeunload', saveScroll)
      clearInterval(interval)
    }
  }, [])

  // Infinite scroll observer.
  // Only re-attach when loading changes (the sentinel element mounts/unmounts).
  // The callback uses setVisibleCount(prev => ...) so it never goes stale.
  useEffect(() => {
    const el = loadMoreRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount(prev => prev + PAGE_SIZE)
        }
      },
      { rootMargin: '200px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [loading])

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.SAVED) || '[]')
      setSavedJobIds(new Set(saved))
    } catch { /* ignore */ }

    const handleChange = () => {
      try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.SAVED) || '[]')
        setSavedJobIds(new Set(saved))
      } catch { /* ignore */ }
    }
    window.addEventListener(STORAGE_EVENTS.SAVED, handleChange)
    return () => window.removeEventListener(STORAGE_EVENTS.SAVED, handleChange)
  }, [])

  const companyCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    allJobs.forEach(job => {
      if (job.company?.name) counts[job.company.name] = (counts[job.company.name] || 0) + 1
    })
    return counts
  }, [allJobs])

  const locationCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    allJobs.forEach(job => {
      if (job.location) counts[job.location] = (counts[job.location] || 0) + 1
    })
    return counts
  }, [allJobs])

  const companyNames = useMemo(() => {
    return Object.keys(companyCounts).sort((a, b) => a.localeCompare(b))
  }, [companyCounts])

  const locationNames = useMemo(() => {
    return Object.keys(locationCounts).sort((a, b) => a.localeCompare(b))
  }, [locationCounts])

  const updateURL = useCallback((newFilters: JobFilters, newSort: string, newShowSaved?: boolean) => {
    const qs = filtersToParams(newFilters, newSort, newShowSaved ?? showSaved)
    const url = qs ? `/?${qs}` : '/'
    router.replace(url, { scroll: false })
  }, [router, showSaved])

  const abortRef = useRef<AbortController | null>(null)

  const fetchJobs = useCallback(async (filterState: JobFilters) => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (filterState.category) params.append('category', filterState.category)
      if (filterState.job_type) params.append('job_type', filterState.job_type)
      if (filterState.pipeline_stage) params.append('pipeline_stage', filterState.pipeline_stage)
      if (filterState.remote_type) params.append('remote_type', filterState.remote_type)
      if (filterState.license) params.append('license', filterState.license)
      if (filterState.search) params.append('search', filterState.search)
      if (filterState.grad_date) params.append('grad_date', filterState.grad_date)
      if (filterState.salary_min) params.append('salary_min', filterState.salary_min)
      if (filterState.salary_max) params.append('salary_max', filterState.salary_max)
      if (filterState.company) params.append('company', filterState.company)
      if (filterState.location) params.append('location', filterState.location)

      // Use slim mode to omit description (not needed in list view, saves ~60% payload)
      params.append('fields', 'slim')
      const response = await fetchRetry(`/api/jobs?${params.toString()}`, { signal: controller.signal })
      if (!response.ok) {
        if (response.status === 503) throw new Error('SERVICE_UNAVAILABLE')
        if (response.status >= 500) throw new Error('SERVER_ERROR')
        throw new Error('FETCH_FAILED')
      }
      const data = (await response.json()) as Job[]
      setJobs(data)
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      console.error('Error fetching jobs:', err)
      const msg = err instanceof Error ? err.message : ''
      if (err instanceof TypeError && err.message === 'Failed to fetch') {
        setError('Unable to connect. Check your internet connection and try again.')
      } else if (msg === 'SERVICE_UNAVAILABLE') {
        setError('The server is temporarily unavailable. Please try again in a few minutes.')
      } else if (msg === 'SERVER_ERROR') {
        setError('Something went wrong on our end. Please try again shortly.')
      } else {
        setError('Failed to load jobs. Please try again.')
      }
      setJobs([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    async function initialFetch() {
      try {
        // Fetch all jobs once for counts, salary insights, etc.
        const allRes = await fetchRetry('/api/jobs?fields=slim')
        if (cancelled || !allRes.ok) return
        const allData = (await allRes.json()) as Job[]
        if (cancelled) return
        setAllJobs(allData)

        // If no filters are active on initial load, reuse the same data
        const hasFilters = FILTER_KEYS.some(key => filters[key])
        if (!hasFilters) {
          setJobs(allData)
        } else {
          await fetchJobs(filters)
        }
      } catch (err) {
        if (cancelled) return
        console.error('Initial jobs fetch failed:', err)
        await fetchJobs(filters)
      }
    }
    initialFetch()
    isInitialMount.current = false
    return () => { cancelled = true }
  }, [])

  const isFiltered =
    filters.category || filters.job_type || filters.pipeline_stage ||
    filters.remote_type || filters.license || filters.grad_date ||
    filters.salary_min || filters.salary_max || filters.company || filters.location || filters.search

  const handleClearAll = () => {
    const cleared: JobFilters = {
      category: '', job_type: '', pipeline_stage: '', remote_type: '',
      license: '', search: '', grad_date: '', salary_min: '', salary_max: '',
      company: '', location: '',
    }
    setFilters(cleared)
    setVisibleCount(PAGE_SIZE)
    fetchJobs(cleared)
    updateURL(cleared, 'newest')
    setSortBy('newest')
    try { sessionStorage.removeItem(STORAGE_KEYS.FILTERS); sessionStorage.removeItem(STORAGE_KEYS.SORT) } catch { /* ignore */ }
    // Move focus to job list region for screen readers
    requestAnimationFrame(() => {
      document.getElementById('job-results')?.focus()
    })
  }

  const handleFilterChange = (newFilters: JobFilters) => {
    setFilters(newFilters)
    setVisibleCount(PAGE_SIZE)
    fetchJobs(newFilters)
    updateURL(newFilters, sortBy)
    try { sessionStorage.setItem(STORAGE_KEYS.FILTERS, JSON.stringify(newFilters)) } catch { /* ignore */ }
  }

  const handleSortChange = (newSort: string) => {
    setSortBy(newSort as SortBy)
    updateURL(filters, newSort)
    try { sessionStorage.setItem(STORAGE_KEYS.SORT, newSort) } catch { /* ignore */ }
  }

  // Use refs to avoid stale closures in the debounced callback.
  // Without this, the debounce is recreated on every state change, defeating its purpose.
  const filtersRef = useRef(filters)
  filtersRef.current = filters
  const sortByRef = useRef(sortBy)
  sortByRef.current = sortBy
  const fetchJobsRef = useRef(fetchJobs)
  fetchJobsRef.current = fetchJobs
  const updateURLRef = useRef(updateURL)
  updateURLRef.current = updateURL

  const debouncedSearch = useMemo(
    () =>
      debounce((query: string) => {
        const newFilters = { ...filtersRef.current, search: query }
        setFilters(newFilters)
        fetchJobsRef.current(newFilters)

        if (query && sortByRef.current === 'newest') {
          setSortBy('relevance')
          updateURLRef.current(newFilters, 'relevance')
        } else if (!query && sortByRef.current === 'relevance') {
          setSortBy('newest')
          updateURLRef.current(newFilters, 'newest')
        } else {
          updateURLRef.current(newFilters, sortByRef.current)
        }
      }, 300),
    [] // stable: refs keep values current without recreating the debounce
  )

  const handleSearch = (query: string) => {
    debouncedSearch(query)
  }

  const handleCategoryFromSearch = (category: string) => {
    const newFilters = { ...filters, category: category as JobFilters['category'] }
    handleFilterChange(newFilters)
  }

  const handleToggleSaved = () => {
    const next = !showSaved
    setShowSaved(next)
    setVisibleCount(PAGE_SIZE)
    updateURL(filters, sortBy, next)
  }

  const sortedJobs = useMemo(() => {
    let jobsCopy = [...jobs]
    if (showSaved) {
      jobsCopy = jobsCopy.filter(j => savedJobIds.has(j.id))
    }
    if (sortBy === 'relevance' && filters.search) {
      return jobsCopy
    }
    switch (sortBy) {
      case 'newest':
        return jobsCopy.sort(
          (a, b) => new Date(b.posted_date).getTime() - new Date(a.posted_date).getTime()
        )
      case 'salary_high':
        return jobsCopy.sort((a, b) => (b.salary_max || 0) - (a.salary_max || 0))
      case 'salary_low':
        return jobsCopy.sort((a, b) => (a.salary_min || 0) - (b.salary_min || 0))
      case 'company_az':
        return jobsCopy.sort((a, b) =>
          (a.company?.name || '').localeCompare(b.company?.name || '')
        )
      default:
        return jobsCopy
    }
  }, [jobs, sortBy, filters.search, showSaved, savedJobIds])

  const getSortLabel = () => {
    switch (sortBy) {
      case 'newest': return 'newest'
      case 'relevance': return 'relevance'
      case 'salary_high': return 'highest salary'
      case 'salary_low': return 'lowest salary'
      case 'company_az': return 'company name'
      default: return 'newest'
    }
  }

  const uniqueCompanies = useMemo(() => new Set(jobs.map((job) => job.company_id)).size, [jobs])

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    jobs.forEach(job => {
      if (job.category) counts[job.category] = (counts[job.category] || 0) + 1
    })
    return counts
  }, [jobs])

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'How often are jobs updated on Entry Level Finance Jobs?',
        acceptedAnswer: { '@type': 'Answer', text: 'Jobs are refreshed daily from company career pages. We source positions directly from official career portals to ensure accuracy and freshness.' },
      },
      {
        '@type': 'Question',
        name: 'What types of finance jobs does Entry Level Finance Jobs cover?',
        acceptedAnswer: { '@type': 'Answer', text: 'We cover 9 major categories: Investment Banking, Accounting, Sales & Trading, Corporate Finance, Consulting, Private Wealth, Research, Risk Management, and Private Equity.' },
      },
      {
        '@type': 'Question',
        name: 'Is Entry Level Finance Jobs free to use?',
        acceptedAnswer: { '@type': 'Answer', text: 'Yes, Entry Level Finance Jobs is completely free for job seekers. We link directly to company career pages where you apply through their own systems.' },
      },
      {
        '@type': 'Question',
        name: 'Can I filter jobs by salary, location, and experience level?',
        acceptedAnswer: { '@type': 'Answer', text: 'Yes. Use our advanced filters to narrow results by salary range, location, job type, work style (remote/hybrid/in-office), license requirements, and graduation year.' },
      },
    ],
  }

  return (
    <div className="min-h-screen bg-navy-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <KeyboardNav />
      <CompareBar />
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-navy-950 to-navy-900 text-white py-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-3">
            Entry-Level Finance Jobs
          </h1>
          <p className="text-base sm:text-lg text-navy-300 mb-6 max-w-2xl mx-auto">
            Curated positions from company career pages. No easy apply. Real opportunities.
          </p>
          {!loading && jobs.length > 0 && (
            <div className="flex items-center justify-center gap-4 text-sm text-navy-300 mb-6">
              <span className="font-semibold text-white">{jobs.length}</span> active jobs
              <span className="text-navy-600">|</span>
              <span className="font-semibold text-white">{uniqueCompanies}</span> companies
            </div>
          )}

          {/* Category Quick Links */}
          <div className="flex flex-wrap justify-center gap-2 mt-2">
            {JOB_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  const newFilters = { ...filters, category: filters.category === cat ? '' : cat } as JobFilters
                  handleFilterChange(newFilters)
                  window.scrollTo({ top: 400, behavior: 'smooth' })
                }}
                aria-pressed={filters.category === cat}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all inline-flex items-center gap-1.5 ${
                  filters.category === cat
                    ? `${CATEGORY_ACCENT[cat] || 'bg-white text-navy-950'} shadow-sm`
                    : 'bg-navy-800/60 text-navy-200 hover:bg-navy-700 hover:text-white'
                }`}
              >
                {cat}
                {categoryCounts[cat] > 0 && (
                  <span className={`text-[10px] font-bold rounded-full min-w-[18px] h-[18px] inline-flex items-center justify-center ${
                    filters.category === cat
                      ? 'bg-white/20 text-white'
                      : 'bg-navy-700/80 text-navy-300'
                  }`}>
                    {categoryCounts[cat]}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className={`mx-auto px-4 sm:px-6 lg:px-8 py-8 ${previewJob && isDesktop ? 'max-w-[1400px]' : 'max-w-5xl'}`}>
        {/* Error Banner */}
        {error && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 px-4 py-3 flex items-center justify-between gap-3">
            <p className="text-sm text-red-700">{error}</p>
            <button
              onClick={() => { setError(null); fetchJobs(filters) }}
              className="flex-shrink-0 rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 transition"
            >
              Retry
            </button>
          </div>
        )}

        {/* Search Bar */}
        <div className="mb-5">
          <SearchBar
            onSearch={handleSearch}
            onCategorySelect={handleCategoryFromSearch}
            initialValue={filters.search}
          />
        </div>

        {/* Filters */}
        <div className="mb-5">
          <Filters
            filters={filters}
            onFilterChange={handleFilterChange}
            sortBy={sortBy}
            onSortChange={handleSortChange}
            hasSearch={!!filters.search}
            companies={companyNames}
            locations={locationNames}
            companyCounts={companyCounts}
            locationCounts={locationCounts}
          />
        </div>

        {/* Saved Searches */}
        <SavedSearches currentFilters={filters} onApply={handleFilterChange} />

        {/* Quick Stage Filters */}
        <div className="mb-4 flex flex-wrap gap-1.5">
          {PIPELINE_STAGES.map((stage) => (
            <button
              key={stage}
              onClick={() => {
                const newFilters = { ...filters, pipeline_stage: filters.pipeline_stage === stage ? '' : stage } as JobFilters
                handleFilterChange(newFilters)
              }}
              aria-pressed={filters.pipeline_stage === stage}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                filters.pipeline_stage === stage
                  ? 'bg-navy-900 text-white shadow-sm'
                  : 'bg-white text-navy-600 border border-navy-200 hover:border-navy-300 hover:text-navy-800'
              }`}
            >
              {getPipelineStageDisplay(stage).label}
            </button>
          ))}
        </div>

        {/* New jobs banner (Realtime) */}
        {newJobCount > 0 && (
          <button
            onClick={() => {
              resetNewJobCount()
              fetchJobs(filters)
            }}
            className="mb-3 w-full rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-2.5 text-sm text-emerald-700 font-medium hover:bg-emerald-100 transition flex items-center justify-center gap-2"
          >
            <svg className="h-4 w-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {newJobCount} new {newJobCount === 1 ? 'job' : 'jobs'} posted. Click to refresh.
          </button>
        )}

        {/* Results Count + Saved Toggle */}
        <div className="mb-4 flex items-center justify-between">
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-navy-300 border-t-navy-600"></div>
              <span className="text-sm text-navy-500">Loading...</span>
            </div>
          ) : (
            <p className="text-sm text-navy-600" aria-live="polite" aria-atomic="true">
              <span className="font-semibold text-navy-900">{sortedJobs.length}</span>{' '}
              {sortedJobs.length === 1 ? 'job' : 'jobs'}
              {sortedJobs.length > 0 && <span className="text-navy-400"> sorted by {getSortLabel()}</span>}
            </p>
          )}

          <button
            onClick={handleToggleSaved}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              showSaved
                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                : 'bg-white text-navy-500 border border-navy-200 hover:border-navy-300 hover:text-navy-700'
            }`}
          >
            <svg className="h-3.5 w-3.5" fill={showSaved ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            Saved{savedJobIds.size > 0 ? ` (${savedJobIds.size})` : ''}
          </button>
        </div>

        {/* Jobs List + Preview Split Pane */}
        <div className={`${previewJob && isDesktop ? 'flex gap-6' : ''}`}>
        <div id="job-results" tabIndex={-1} role="region" aria-label="Job listings" className={`space-y-3 outline-none ${previewJob && isDesktop ? 'flex-1 min-w-0' : ''}`}>
          {loading ? (
            <>
              {[1, 2, 3, 4, 5].map((i) => (
                <JobCardSkeleton key={i} />
              ))}
            </>
          ) : sortedJobs.length === 0 ? (
            <div className="rounded-xl border border-navy-200 bg-gradient-to-b from-white to-navy-50/40 px-6 py-20 text-center">
              {showSaved ? (
                <svg className="mx-auto h-12 w-12 text-amber-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              ) : (
                <svg className="mx-auto h-12 w-12 text-navy-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              )}
              <p className="text-navy-800 font-bold text-lg mb-1">
                {showSaved ? 'No saved jobs yet' : 'No jobs match your criteria'}
              </p>
              <p className="text-sm text-navy-500 mb-5 max-w-xs mx-auto">
                {showSaved ? 'Tap the bookmark icon on any job listing to save it for later' : 'Try broadening your filters or adjusting your search terms'}
              </p>
              {showSaved && (
                <button
                  onClick={() => handleToggleSaved()}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-navy-900 px-4 py-2 text-sm font-semibold text-white hover:bg-navy-800 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-400 focus-visible:ring-offset-2"
                >
                  Browse all jobs
                </button>
              )}
              {!showSaved && isFiltered && (
                <button
                  onClick={handleClearAll}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-navy-900 px-4 py-2 text-sm font-semibold text-white hover:bg-navy-800 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-400 focus-visible:ring-offset-2"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Clear all filters
                </button>
              )}
            </div>
          ) : (
            <>
              {sortedJobs.slice(0, visibleCount).map((job, i) => (
                <div key={job.id}>
                  <div className={i < PAGE_SIZE ? 'animate-fade-in-up' : ''} style={i < PAGE_SIZE ? { animationDelay: `${i * 30}ms` } : undefined}>
                    <JobCard
                      job={job}
                      searchQuery={filters.search}
                      onPreview={isDesktop ? (job: Job) => {
                        previewSourceRef.current = document.querySelector(`[data-job-id="${job.id}"]`)
                        setPreviewJob(job)
                      } : undefined}
                      isActive={previewJob?.id === job.id}
                    />
                  </div>
                  {i === 4 && sortedJobs.length > 5 && !previewJob && (
                    <div className="my-3 rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-white px-4 py-3 flex items-center justify-between gap-3 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                          <svg className="h-4 w-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                          </svg>
                        </div>
                        <p className="text-sm text-navy-700 truncate">
                          <span className="font-semibold">Finding good results?</span>{' '}
                          <span className="hidden sm:inline text-navy-500">Get new matches emailed to you daily.</span>
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          const alertEl = document.querySelector('[data-job-alert]')
                          if (alertEl) alertEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
                        }}
                        className="flex-shrink-0 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2"
                      >
                        Set alert
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {sortedJobs.length > visibleCount ? (
                <div ref={loadMoreRef} className="pt-6 flex flex-col items-center gap-2 animate-fade-in-up">
                  <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-navy-300 border-t-navy-600"></div>
                  <span className="text-xs text-navy-400">Loading more jobs...</span>
                </div>
              ) : sortedJobs.length > PAGE_SIZE && (
                <div className="pt-6 pb-2 text-center">
                  <p className="text-xs text-navy-400">Showing all {sortedJobs.length} jobs</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Preview Panel (Desktop only) */}
        {previewJob && isDesktop && (
          <div className="w-[480px] flex-shrink-0 sticky top-16 h-[calc(100vh-5rem)] rounded-xl border border-navy-200 overflow-hidden shadow-sm">
            <JobPreview job={previewJob} onClose={() => {
              setPreviewJob(null)
              previewSourceRef.current?.focus()
              previewSourceRef.current = null
            }} />
          </div>
        )}
        </div>

        {/* Back to top */}
        {!loading && sortedJobs.length > 10 && visibleCount > PAGE_SIZE && (
          <div className="mt-8 text-center">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="inline-flex items-center gap-1.5 text-xs text-navy-400 hover:text-navy-600 transition-colors"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
              Back to top
            </button>
          </div>
        )}

        {/* Below-the-fold: Recently Viewed, Job Alerts, Salary Insights */}
        {!loading && (
          <div className="mt-8 space-y-5">
            <ErrorBoundary><RecentlyViewed /></ErrorBoundary>
            <ErrorBoundary><div data-job-alert><JobAlertSignup /></div></ErrorBoundary>
            <ErrorBoundary><SalaryInsights jobs={allJobs} /></ErrorBoundary>
          </div>
        )}

        {/* Browse More Section */}
        {!loading && (
          <div className="mt-10 pt-8 border-t border-navy-200">
            <h2 className="text-lg font-bold text-navy-900 mb-4">Explore More</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Link
                href="/categories"
                className="group rounded-xl border border-navy-200 bg-white p-5 hover:shadow-md hover:border-navy-300 hover:-translate-y-0.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-400 focus-visible:ring-offset-2"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600">
                    <svg className="h-4.5 w-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <h3 className="font-bold text-navy-900 text-sm group-hover:text-navy-700 transition">Browse by Category</h3>
                </div>
                <p className="text-xs text-navy-500">Investment Banking, Accounting, Private Equity, and more</p>
              </Link>
              <Link
                href="/locations"
                className="group rounded-xl border border-navy-200 bg-white p-5 hover:shadow-md hover:border-navy-300 hover:-translate-y-0.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-400 focus-visible:ring-offset-2"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600">
                    <svg className="h-4.5 w-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <h3 className="font-bold text-navy-900 text-sm group-hover:text-navy-700 transition">Browse by Location</h3>
                </div>
                <p className="text-xs text-navy-500">New York, San Francisco, Chicago, Charlotte, and more</p>
              </Link>
              <Link
                href="/companies"
                className="group rounded-xl border border-navy-200 bg-white p-5 hover:shadow-md hover:border-navy-300 hover:-translate-y-0.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-400 focus-visible:ring-offset-2"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-amber-50 text-amber-600">
                    <svg className="h-4.5 w-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <h3 className="font-bold text-navy-900 text-sm group-hover:text-navy-700 transition">Companies Hiring</h3>
                </div>
                <p className="text-xs text-navy-500">Goldman Sachs, J.P. Morgan, Morgan Stanley, and more</p>
              </Link>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-navy-50">
        <section className="bg-gradient-to-b from-navy-950 to-navy-900 text-white py-14 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto text-center">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-3">Entry-Level Finance Jobs</h1>
            <p className="text-base sm:text-lg text-navy-300 mb-6">Curated positions from company career pages. No easy apply. Real opportunities.</p>
          </div>
        </section>
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-12 bg-white rounded-xl border border-navy-200" />
            <div className="h-10 bg-white rounded-lg border border-navy-200 w-48" />
            <div className="space-y-2.5">
              {[1,2,3].map(i => <div key={i} className="h-24 bg-white rounded-xl border border-navy-200" />)}
            </div>
          </div>
        </section>
      </div>
    }>
      <HomePageContent />
    </Suspense>
  )
}
