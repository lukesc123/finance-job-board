'use client'

import { useState, useCallback } from 'react'
import SearchBar from '@/components/SearchBar'
import Filters from '@/components/Filters'
import JobCard from '@/components/JobCard'
import { Job, JobFilters } from '@/types'

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

  const fetchJobs = useCallback(async (filterState: JobFilters) => {
    setLoading(true)
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
    } catch (error) {
      console.error('Error fetching jobs:', error)
      setJobs([])
    } finally {
      setLoading(false)
    }
  }, [])

  const handleFilterChange = (newFilters: JobFilters) => {
    setFilters(newFilters)
    fetchJobs(newFilters)
  }

  const handleSearch = (query: string) => {
    const newFilters = { ...filters, search: query }
    setFilters(newFilters)
    fetchJobs(newFilters)
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-navy-950 text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            Entry-Level Finance Jobs
          </h1>
          <p className="text-lg text-navy-200">
            Curated positions from company career pages. Find the right opportunity for your finance career.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Search Bar */}
        <div className="mb-8">
          <SearchBar onSearch={handleSearch} />
        </div>

        {/* Filters */}
        <div className="mb-8">
          <Filters filters={filters} onFilterChange={handleFilterChange} />
        </div>

        {/* Job Count */}
        <div className="mb-6">
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-navy-300 border-t-navy-600"></div>
              <span className="text-sm text-navy-600">Loading jobs...</span>
            </div>
          ) : (
            <p className="text-sm font-medium text-navy-700">
              {jobs.length} {jobs.length === 1 ? 'job' : 'jobs'} found
            </p>
          )}
        </div>

        {/* Jobs List */}
        <div className="space-y-4">
          {!loading && jobs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-navy-600">No jobs found. Try adjusting your filters.</p>
            </div>
          ) : (
            jobs.map((job) => <JobCard key={job.id} job={job} />)
          )}
        </div>
      </section>
    </div>
  )
}
