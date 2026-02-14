'use client'

import { useState, useCallback, useEffect, useMemo, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import SearchBar from '@/components/SearchBar'
import Filters from '@/components/Filters'
import JobCard from '@/components/JobCard'
import JobCardSkeleton from '@/components/JobCardSkeleton'
import JobAlertSignup from '@/components/JobAlertSignup'
import { Job, JobFilters } from '@/types'
import { debounce } from '@/lib/formatting'

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

const HERO_CATEGORIES = [
  'Investment Banking',
  'Accounting',
  'Sales & Trading',
  'Corporate Finance',
  'Consulting',
  'Private Wealth',
  'Research',
  'Risk Management',
  'Private Equity',
]

function HomePageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const isInitialMount = useRef(true)

  const [filters, setFilters] = useState<JobFilters>(() => filtersFromParams(searchParams))
  const [allJobs, setAllJobs] = useState<Job[]>([])
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<SortBy>(() => (searchParams.get('sort') as SortBy) || 'newest')
  const [visibleCount, setVisibleCount] = useState(20)
  const [showSaved, setShowSaved] = useState(() => searchParams.get('saved') === '1')
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('savedJobs') || '[]')
      setSavedJobIds(new Set(saved))
    } catch { /* ignore */ }

    const handleChange = () => {
      try {
        const saved = JSON.parse(localStorage.getItem('savedJobs') || '[]')
        setSavedJobIds(new Set(saved))
      } catch { /* ignore */ }
    }
    window.addEventListener('savedJobsChanged', handleChange)
    return () => window.removeEventListener('savedJobsChanged', handleChange)
  }, [])

  const companyNames = useMemo(() => {
    const names = new Set<string>()
    allJobs.forEach(job => {
      if (job.company?.name) names.add(job.company.name)
    })
    return Array.from(names).sort((a, b) => a.localeCompare(b))
  }, [allJobs])

  const locationNames = useMemo(() => {
    const locs = new Set<string>()
    allJobs.forEach(job => {
      if (job.location) locs.add(job.location)
    })
    return Array.from(locs).sort((a, b) => a.localeCompare(b))
  }, [allJobs])

  const updateURL = useCallback((newFilters: JobFilters, newSort: string, newShowSaved?: boolean) => {
    const qs = filtersToParams(newFilters, newSort, newShowSaved ?? showSaved)
    const url = qs ? `/?${qs}` : '/'
    router.replace(url, { scroll: false })
  }, [router, showSaved])

  const fetchJobs = useCallback(async (filterState: JobFilters) => {
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

      const response = await fetch(`/api/jobs?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch jobs')
      const data = await response.json()
      setJobs(data)
    } catch (err) {
      console.error('Error fetching jobs:', err)
      setError('Failed to load jobs. Please try again.')
      setJobs([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    async function fetchAllJobs() {
      try {
        const response = await fetch('/api/jobs')
        if (!response.ok) return
        const data = await response.json()
        setAllJobs(data)
      } catch { /* ignore */ }
    }
    fetchAllJobs()
  }, [])

  useEffect(() => {
    fetchJobs(filters)
    isInitialMount.current = false
  }, [])

  const handleFilterChange = (newFilters: JobFilters) => {
    setFilters(newFilters)
    setVisibleCount(20)
    fetchJobs(newFilters)
    updateURL(newFilters, sortBy)
  }

  const handleSortChange = (newSort: string) => {
    setSortBy(newSort as SortBy)
    updateURL(filters, newSort)
  }

  const debouncedSearch = useMemo(
    () =>
      debounce((query: string) => {
        const newFilters = { ...filters, search: query }
        setFilters(newFilters)
        fetchJobs(newFilters)

        if (query && sortBy === 'newest') {
          setSortBy('relevance')
          updateURL(newFilters, 'relevance')
        } else if (!query && sortBy === 'relevance') {
          setSortBy('newest')
          updateURL(newFilters, 'newest')
        } else {
          updateURL(newFilters, sortBy)
        }
      }, 300),
    [filters, fetchJobs, sortBy, updateURL]
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
    setVisibleCount(20)
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

  const uniqueCompanies = new Set(jobs.map((job) => job.company_id)).size

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    jobs.forEach(job => {
      if (job.category) counts[job.category] = (counts[job.category] || 0) + 1
    })
    return counts
  }, [jobs])

  return (
    <div className="min-h-screen bg-navy-50">
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
            {HERO_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  const newFilters = { ...filters, category: filters.category === cat ? '' : cat } as JobFilters
                  handleFilterChange(newFilters)
                  window.scrollTo({ top: 400, behavior: 'smooth' })
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all inline-flex items-center gap-1.5 ${
                  filters.category === cat
                    ? 'bg-white text-navy-950 shadow-sm'
                    : 'bg-navy-800/60 text-navy-200 hover:bg-navy-700 hover:text-white'
                }`}
              >
                {cat}
                {categoryCounts[cat] > 0 && (
                  <span className={`text-[10px] font-bold rounded-full min-w-[18px] h-[18px] inline-flex items-center justify-center ${
                    filters.category === cat
                      ? 'bg-navy-900 text-white'
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
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Banner */}
        {error && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 px-4 py-3">
            <p className="text-sm text-red-700">{error}</p>
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

        {/* Job Alert Signup */}
        <div className="mb-5">
          <JobAlertSignup />
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
          />
        </div>

        {/* Results Count + Saved Toggle */}
        <div className="mb-4 flex items-center justify-between">
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-navy-300 border-t-navy-600"></div>
              <span className="text-sm text-navy-500">Loading...</span>
            </div>
          ) : (
            <p className="text-sm text-navy-600">
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
            <svg className="h-3.5 w-3.5" fill={showSaved ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            Saved{savedJobIds.size > 0 ? ` (${savedJobIds.size})` : ''}
          </button>
        </div>

        {/* Jobs List */}
        <div className="space-y-2.5">
          {loading ? (
            <>
              {[1, 2, 3, 4, 5].map((i) => (
                <JobCardSkeleton key={i} />
              ))}
            </>
          ) : sortedJobs.length === 0 ? (
            <div className="rounded-xl border border-navy-200 bg-white px-6 py-16 text-center">
              <svg className="mx-auto h-10 w-10 text-navy-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p className="text-navy-700 font-semibold mb-1">
                {showSaved ? 'No saved jobs yet' : 'No jobs match your criteria'}
              </p>
              <p className="text-sm text-navy-500">
                {showSaved ? 'Click the bookmark icon on any job to save it' : 'Try broadening your filters or search terms'}
              </p>
            </div>
          ) : (
            <>
              {sortedJobs.slice(0, visibleCount).map((job) => (
                <JobCard key={job.id} job={job} searchQuery={filters.search} />
              ))}

              {sortedJobs.length > visibleCount && (
                <div className="pt-6 flex flex-col items-center gap-2">
                  <button
                    onClick={() => setVisibleCount(prev => prev + PAGE_SIZE)}
                    className="px-8 py-2.5 bg-navy-900 text-white rounded-lg hover:bg-navy-800 transition-colors font-semibold text-sm shadow-sm"
                  >
                    Show More Jobs
                  </button>
                  <span className="text-xs text-navy-400">{sortedJobs.length - visibleCount} more available</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Back to top */}
        {!loading && sortedJobs.length > 10 && visibleCount > PAGE_SIZE && (
          <div className="mt-8 text-center">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="inline-flex items-center gap-1.5 text-xs text-navy-400 hover:text-navy-600 transition-colors"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
              Back to top
            </button>
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
