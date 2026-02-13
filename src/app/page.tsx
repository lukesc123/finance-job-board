'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import SearchBar from '@/components/SearchBar'
import Filters from '@/components/Filters'
import JobCard from '@/components/JobCard'
import { Job, JobFilters } from '@/types'
import { debounce } from '@/lib/formatting'

type SortBy = 'newest' | 'salary_high' | 'salary_low' | 'company_az'

export default function HomePage() {
  const [filters, setFilters] = useState<JobFilters>({
    category: '',
    job_type: '',
    pipeline_stage: '',
    remote_type: '',
    license: '',
    search: '',
    grad_date: '',
  })

  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<SortBy>('newest')

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
    fetchJobs(filters)
  }, [])

  const handleFilterChange = (newFilters: JobFilters) => {
    setFilters(newFilters)
    fetchJobs(newFilters)
  }

  const debouncedSearch = useMemo(
    () =>
      debounce((query: string) => {
        const newFilters = { ...filters, search: query }
        setFilters(newFilters)
        fetchJobs(newFilters)
      }, 300),
    [filters, fetchJobs]
  )

  const handleSearch = (query: string) => {
    debouncedSearch(query)
  }

  const sortedJobs = useMemo(() => {
    const jobsCopy = [...jobs]

    switch (sortBy) {
      case 'newest':
        return jobsCopy.sort(
          (a, b) => new Date(b.posted_date).getTime() - new Date(a.posted_date).getTime()
        )
      case 'salary_high':
        return jobsCopy.sort((a, b) => {
          const aMax = a.salary_max || 0
          const bMax = b.salary_max || 0
          return bMax - aMax
        })
      case 'salary_low':
        return jobsCopy.sort((a, b) => {
          const aMin = a.salary_min || 0
          const bMin = b.salary_min || 0
          return aMin - bMin
        })
      case 'company_az':
        return jobsCopy.sort((a, b) =>
          (a.company?.name || '').localeCompare(b.company?.name || '')
        )
      default:
        return jobsCopy
    }
  }, [jobs, sortBy])

  const getSortLabel = () => {
    switch (sortBy) {
      case 'newest':
        return 'newest'
      case 'salary_high':
        return 'highest salary'
      case 'salary_low':
        return 'lowest salary'
      case 'company_az':
        return 'company name'
      default:
        return 'newest'
    }
  }

  const uniqueCompanies = new Set(jobs.map((job) => job.company_id)).size

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-navy-950 text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            Entry-Level Finance Jobs
          </h1>
          <p className="text-lg text-navy-200 mb-6">
            Curated positions from company career pages. Find the right opportunity for your finance career.
          </p>
          {!loading && jobs.length > 0 && (
            <div className="flex items-center justify-center gap-6 text-sm text-navy-100">
              <span>{jobs.length} active jobs</span>
              <span>•</span>
              <span>{uniqueCompanies} companies</span>
            </div>
          )}
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Error Banner */}
        {error && (
          <div className="mb-8 rounded-lg bg-red-50 border border-red-200 px-4 py-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Search Bar */}
        <div className="mb-8">
          <SearchBar onSearch={handleSearch} />
        </div>

        {/* Filters */}
        <div className="mb-8">
          <Filters
            filters={filters}
            onFilterChange={handleFilterChange}
            sortBy={sortBy}
            onSortChange={(val) => setSortBy(val as SortBy)}
          />
        </div>

        {/* Results Count */}
        <div className="mb-6">
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-navy-300 border-t-navy-600"></div>
              <span className="text-sm text-navy-600">Loading jobs...</span>
            </div>
          ) : (
            <p className="text-sm font-medium text-navy-700">
              {sortedJobs.length} {sortedJobs.length === 1 ? 'job' : 'jobs'} found
              {sortedJobs.length > 0 && `, sorted by ${getSortLabel()}`}
            </p>
          )}
        </div>

        {/* Jobs List */}
        <div className="space-y-4">
          {loading ? (
            <>
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="rounded-lg border border-navy-200 bg-white p-6 animate-pulse"
                >
                  <div className="h-6 w-2/3 rounded bg-navy-100 mb-3"></div>
                  <div className="h-4 w-1/2 rounded bg-navy-50 mb-4"></div>
                  <div className="flex gap-2 mb-4">
                    <div className="h-3 w-20 rounded bg-navy-50"></div>
                    <div className="h-3 w-20 rounded bg-navy-50"></div>
                  </div>
                  <div className="h-4 w-full rounded bg-navy-50"></div>
                </div>
              ))}
            </>
          ) : sortedJobs.length === 0 ? (
            <div className="rounded-lg border border-navy-200 bg-navy-50 px-6 py-12 text-center">
              <div className="mb-3 text-3xl">📋</div>
              <p className="text-navy-700 font-medium mb-1">No jobs found</p>
              <p className="text-sm text-navy-600">Try adjusting your filters or search terms</p>
            </div>
          ) : (
            sortedJobs.map((job) => <JobCard key={job.id} job={job} />)
          )}
        </div>
      </section>
    </div>
  )
}
