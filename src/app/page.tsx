'use client'

import { useState, useCallback, useEffect, useMemo, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import SearchBar from '@/components/SearchBar'
import Filters from '@/components/Filters'
import JobCard from '@/components/JobCard'
import JobCardSkeleton from '@/components/JobCardSkeleton'
import { Job, JobFilters } from '@/types'
import { debounce } from '@/lib/formatting'

type SortBy = 'newest' | 'salary_high' | 'salary_low' | 'company_az' | 'relevance'

const FILTER_KEYS: (keyof JobFilters)[] = ['category', 'job_type', 'pipeline_stage', 'remote_type', 'license', 'search', 'grad_date', 'salary_min', 'salary_max']
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

  const [filters, setFilters] = useState<JobFilters>(() => filtersFromParams(searchParams))
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<SortBy>(() => (searchParams.get('sort') as SortBy) || 'newest')
  const [visibleCount, setVisibleCount] = useState(20)
  const [showSaved, setShowSaved] = useState(() => searchParams.get('saved') === '1')
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set())

  // Infinite scroll with callback ref
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useCallback((node: HTMLDivElement | null) => {
    if (observerRef.current) observerRef.current.disconnect()
    if (!node) return
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount(prev => prev + PAGE_SIZE)
        }
      },
      { rootMargin: '200px' }
    )
    observerRef.current.observe(node)
  }, [])

  // Load saved job IDs from localStorage
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

  const updateURL = useCallback((newFilters: JobFilters, newSort: string, newShowSaved?: boolean) => {
    const qs = filtersToParams(newFilters, newSort, newShowSaved ?? showSaved)
    const url = qs ? `/?${qs}` : '/'
    router.replace