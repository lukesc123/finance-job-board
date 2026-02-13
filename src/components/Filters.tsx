'use client'

import { useState, useEffect } from 'react'
import {
  JobFilters,
  JOB_CATEGORIES,
  JOB_TYPES,
  PIPELINE_STAGES,
  REMOTE_TYPES,
  FINANCE_LICENSES,
} from '@/types'

interface FiltersProps {
  filters: JobFilters
  onFilterChange: (filters: JobFilters) => void
  sortBy: string
  onSortChange: (sort: string) => void
  hasSearch?: boolean
}

const selectClassName = "rounded-lg border border-navy-200 bg-white px-3 py-2 text-sm text-navy-900 transition hover:border-navy-300 focus:border-navy-500 focus:outline-none focus:ring-2 focus:ring-navy-500/20"

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'relevance', label: 'Most relevant', searchOnly: true },
  { value: 'salary_high', label: 'Salary: High to Low' },
  { value: 'salary_low', label: 'Salary: Low to High' },
  { value: 'company_az', label: 'Company A-Z' },
]

export default function Filters({
  filters,
  onFilterChange,
  sortBy,
  onSortChange,
  hasSearch = false,
}: FiltersProps) {
  const [filtersOpen, setFiltersOpen] = useState(true)

  // Open filters by default on desktop, closed on mobile
  useEffect(() => {
    const handleResize = () => {
      setFiltersOpen(window.innerWidth >= 640)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleChange = (key: keyof JobFilters, value: string) => {
    onFilterChange({
      ...filters,
      [key]: value,
    })
  }

  const handleClearAll = () => {
    onFilterChange({
      category: '',
      job_type: '',
      pipeline_stage: '',
      remote_type: '',
      license: '',
      search: '',
      grad_date: '',
      salary_min: '',
      salary_max: '',
    })
  }

  const handleRemoveFilter = (key: keyof JobFilters) => {
    handleChange(key, '')
  }

  const isFiltered =
    filters.category ||
    filters.job_type ||
    filters.pipeline_stage ||
    filters.remote_type ||
    filters.license ||
    filters.grad_date ||
    filters.salary_min ||
    filters.salary_max

  const getFilterLabel = (key: keyof JobFilters, value: string): string => {
    const labels: Record<string, Record<string, string>> = {
      category: { ...Object.fromEntries(JOB_CATEGORIES.map((c) => [c, c])) },
      job_type: { ...Object.fromEntries(JOB_TYPES.map((t) => [t, t])) },
      pipeline_stage: { ...Object.fromEntries(PIPELINE_STAGES.map((s) => [s, s])) },
      remote_type: { ...Object.fromEntries(REMOTE_TYPES.map((r) => [r, r])) },
      license: { ...Object.fromEntries(FINANCE_LICENSES.map((l) => [l, l])) },
      grad_date: { [value]: `Graduating: ${value}` },
      salary_min: {
        [value]: `Min: $${parseInt(value) >= 1000 ? `${Math.round(parseInt(value) / 1000)}K` : value}`,
      },
      salary_max: {
        [value]: `Max: $${parseInt(value) >= 1000 ? `${Math.round(parseInt(value) / 1000)}K` : value}`,
      },
    }
    return labels[key]?.[value] || value
  }

  const activeFilters = [
    { key: 'category' as const, value: filters.category },
    { key: 'job_type' as const, value: filters.job_type },
    { key: 'pipeline_stage' as const, value: filters.pipeline_stage },
    { key: 'remote_type' as const, value: filters.remote_type },
    { key: 'license' as const, value: filters.license },
    { key: 'grad_date' as const, value: filters.grad_date },
    { key: 'salary_min' as const, value: filters.salary_min },
    { key: 'salary_max' as const, value: filters.salary_max },
  ].filter((f) => f.value)

  const activeFilterCount = activeFilters.length

  // Filter sort options: show "Most relevant" only when search is active
  const visibleSortOptions = SORT_OPTIONS.filter(opt => !opt.searchOnly || hasSearch)

  return (
    <div className="space-y-6">
      {/* Sort Dropdown - Always Visible */}
      <div className="flex flex-col gap-2">
        <label htmlFor="sort" className="text-sm font-semibold text-navy-900">
          Sort by
        </label>
        <select
          id="sort"
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
          className={`${selectClassName} w-full`}
        >
          {visibleSortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Mobile Filters Toggle */}
      <button
        onClick={() => setFiltersOpen(!filtersOpen)}
        className="sm:hidden flex items-center justify-between w-full bg-navy-50 border border-navy-200 rounded-lg px-4 py-3 hover:bg-navy-100 transition"
        aria-expanded={filtersOpen}
      >
        <span className="flex items-center gap-2 font-semibold text-navy-900">
          Filters
          {activeFilterCount > 0 && (
            <span className="inline-flex items-center justify-center min-w-5 h-5 bg-navy-900 text-white text-xs font-bold rounded-full">
              {activeFilterCount}
            </span>
          )}
        </span>
        <svg
          className={`w-5 h-5 text-navy-900 transition-transform duration-300 ${
            filtersOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </button>

      {/* Filter Grid - Collapsible on Mobile */}
      {filtersOpen && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {/* Category */}
            <div>
              <select
                value={filters.category}
                onChange={(e) => handleChange('category', e.target.value)}
                className={`${selectClassName} w-full`}
              >
                <option value="">Category</option>
                {JOB_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Job Type */}
            <div>
              <select
                value={filters.job_type}
                onChange={(e) => handleChange('job_type', e.target.value)}
                className={`${selectClassName} w-full`}
              >
                <option value="">Job Type</option>
                {JOB_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Pipeline Stage */}
            <div>
              <select
                value={filters.pipeline_stage}
                onChange={(e) => handleChange('pipeline_stage', e.target.value)}
                className={`${selectClassName} w-full`}
              >
                <option value="">Pipeline Stage</option>
                {PIPELINE_STAGES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Remote Type */}
            <div>
              <select
                value={filters.remote_type}
                onChange={(e) => handleChange('remote_type', e.target.value)}
                className={`${selectClassName} w-full`}
              >
                <option value="">Remote Type</option>
                {REMOTE_TYPES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {/* License Required */}
            <div>
              <select
                value={filters.license}
                onChange={(e) => handleChange('license', e.target.value)}
                className={`${selectClassName} w-full`}
              >
                <option value="">License Required</option>
                {FINANCE_LICENSES.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Salary Range + Graduation Date */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="block text-xs font-medium text-navy-500 mb-1">Min Salary</label>
              <select
                value={filters.salary_min}
                onChange={(e) => handleChange('salary_min', e.target.value)}
                className={`${selectClassName} w-full`}
              >
                <option value="">No minimum</option>
                <option value="40000">$40K+</option>
                <option value="50000">$50K+</option>
                <option value="60000">$60K+</option>
                <option value="70000">$70K+</option>
                <option value="80000">$80K+</option>
                <option value="90000">$90K+</option>
                <option value="100000">$100K+</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-navy-500 mb-1">Max Salary</label>
              <select
                value={filters.salary_max}
                onChange={(e) => handleChange('salary_max', e.target.value)}
                className={`${selectClassName} w-full`}
              >
                <option value="">No maximum</option>
                <option value="60000">Up to $60K</option>
                <option value="80000">Up to $80K</option>
                <option value="100000">Up to $100K</option>
                <option value="120000">Up to $120K</option>
                <option value="150000">Up to $150K</option>
                <option value="200000">Up to $200K</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-navy-500 mb-1">Graduation Date</label>
              <input
                id="grad_date"
                type="month"
                value={filters.grad_date}
                onChange={(e) => handleChange('grad_date', e.target.value)}
                placeholder="Your graduation date"
                className={`${selectClassName} w-full`}
              />
            </div>
          </div>
        </div>
      )}

      {/* Active Filters Badges */}
      {activeFilters.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-navy-900">Active Filters</h3>
            {isFiltered && (
              <button
                onClick={handleClearAll}
                className="text-xs font-medium text-navy-600 transition hover:text-navy-900 hover:underline"
              >
                Clear all
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {activeFilters.map(({ key, value }) => (
              <div
                key={`${key}-${value}`}
                className="inline-flex items-center gap-2 rounded-lg bg-navy-100 px-3 py-2"
              >
                <span className="text-sm font-medium text-navy-900">
                  {getFilterLabel(key, value)}
                </span>
                <button
                  onClick={() => handleRemoveFilter(key)}
                  className="inline-flex items-center justify-center rounded text-navy-600 transition hover:bg-navy-200 hover:text-navy-900"
                  aria-label={`Remove ${key} filter`}
                >
                  <span className="text-lg leading-none">&times;</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
