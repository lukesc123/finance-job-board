'use client'

import { useState, useEffect, memo } from 'react'
import {
  JobFilters,
  JOB_CATEGORIES,
  JOB_TYPES,
  PIPELINE_STAGES,
  REMOTE_TYPES,
  FINANCE_LICENSES,
} from '@/types'
import { SALARY_MIN_OPTIONS, SALARY_MAX_OPTIONS } from '@/lib/constants'

const SM_BREAKPOINT = 640

interface FiltersProps {
  filters: JobFilters
  onFilterChange: (filters: JobFilters) => void
  sortBy: string
  onSortChange: (sort: string) => void
  hasSearch?: boolean
  companies?: string[]
  locations?: string[]
  companyCounts?: Record<string, number>
  locationCounts?: Record<string, number>
}

const selectBase =
  "rounded-lg border bg-white px-3 py-2 text-sm text-navy-800 transition-all hover:border-navy-300 focus:border-navy-500 focus:outline-none focus:ring-2 focus:ring-navy-500/20 cursor-pointer"

const selectClassName = `${selectBase} border-navy-200`

function activeSelect(hasValue: string | undefined): string {
  return hasValue ? `${selectBase} border-navy-400 bg-navy-50/50` : selectClassName
}

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'relevance', label: 'Most relevant', searchOnly: true },
  { value: 'salary_high', label: 'Salary: High to Low' },
  { value: 'salary_low', label: 'Salary: Low to High' },
  { value: 'company_az', label: 'Company A-Z' },
]

export default memo(function Filters({
  filters,
  onFilterChange,
  sortBy,
  onSortChange,
  hasSearch = false,
  companies = [],
  locations = [],
  companyCounts = {},
  locationCounts = {},
}: FiltersProps) {
  const [filtersOpen, setFiltersOpen] = useState(true)

  useEffect(() => {
    const handleResize = () => {
      setFiltersOpen(window.innerWidth >= SM_BREAKPOINT)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleChange = (key: keyof JobFilters, value: string) => {
    onFilterChange({ ...filters, [key]: value })
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
      company: '',
      location: '',
    })
  }

  const handleRemoveFilter = (key: keyof JobFilters) => {
    handleChange(key, '')
  }

  const isFiltered =
    filters.category || filters.job_type || filters.pipeline_stage ||
    filters.remote_type || filters.license || filters.grad_date ||
    filters.salary_min || filters.salary_max || filters.company || filters.location

  const getFilterLabel = (key: keyof JobFilters, value: string): string => {
    const labels: Record<string, Record<string, string>> = {
      category: { ...Object.fromEntries(JOB_CATEGORIES.map((c) => [c, c])) },
      job_type: { ...Object.fromEntries(JOB_TYPES.map((t) => [t, t])) },
      pipeline_stage: { ...Object.fromEntries(PIPELINE_STAGES.map((s) => [s, s])) },
      remote_type: { ...Object.fromEntries(REMOTE_TYPES.map((r) => [r, r])) },
      license: { ...Object.fromEntries(FINANCE_LICENSES.map((l) => [l, l])) },
      company: { [value]: value },
      location: { [value]: value },
      grad_date: { [value]: `Grad: ${value}` },
      salary_min: {
        [value]: `Min $${parseInt(value) >= 1000 ? `${Math.round(parseInt(value) / 1000)}K` : value}`,
      },
      salary_max: {
        [value]: `Max $${parseInt(value) >= 1000 ? `${Math.round(parseInt(value) / 1000)}K` : value}`,
      },
    }
    return labels[key]?.[value] || value
  }

  const activeFilters = [
    { key: 'category' as const, value: filters.category },
    { key: 'company' as const, value: filters.company },
    { key: 'location' as const, value: filters.location },
    { key: 'job_type' as const, value: filters.job_type },
    { key: 'pipeline_stage' as const, value: filters.pipeline_stage },
    { key: 'remote_type' as const, value: filters.remote_type },
    { key: 'license' as const, value: filters.license },
    { key: 'grad_date' as const, value: filters.grad_date },
    { key: 'salary_min' as const, value: filters.salary_min },
    { key: 'salary_max' as const, value: filters.salary_max },
  ].filter((f) => f.value)

  const activeFilterCount = activeFilters.length

  const visibleSortOptions = SORT_OPTIONS.filter(
    (opt) => !opt.searchOnly || hasSearch
  )

  return (
    <div className="space-y-4">
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {activeFilterCount > 0 ? `${activeFilterCount} filter${activeFilterCount > 1 ? 's' : ''} active` : 'No filters active'}
      </div>
      {/* Top row: Sort + Mobile Toggle */}
      <div className="flex items-center gap-3">
        <select
          id="sort"
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
          className={`${selectClassName} flex-shrink-0`}
          aria-label="Sort by"
        >
          {visibleSortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {/* Mobile Filters Toggle */}
        <button
          onClick={() => setFiltersOpen(!filtersOpen)}
          className="sm:hidden flex items-center gap-2 rounded-lg border border-navy-200 bg-white px-3 py-2 text-sm font-medium text-navy-700 hover:bg-navy-50 transition flex-1 justify-between"
          aria-expanded={filtersOpen}
          aria-label={`${filtersOpen ? 'Hide' : 'Show'} filters${activeFilterCount > 0 ? ` (${activeFilterCount} active)` : ''}`}
        >
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4 text-navy-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filters
            {activeFilterCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-5 h-5 bg-navy-900 text-white text-xs font-bold rounded-full px-1.5">
                {activeFilterCount}
              </span>
            )}
          </span>
          <svg className={`w-4 h-4 text-navy-400 transition-transform duration-200 ${filtersOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Filter Grid */}
      {filtersOpen && (
        <div className="rounded-xl border border-navy-200 bg-white p-4 space-y-4">
          {/* Primary filters row */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            <select
              value={filters.category}
              onChange={(e) => handleChange('category', e.target.value)}
              aria-label="Filter by category"
              className={`${activeSelect(filters.category)} w-full`}
            >
              <option value="">All Categories</option>
              {JOB_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <select
              value={filters.company}
              onChange={(e) => handleChange('company', e.target.value)}
              aria-label="Filter by company"
              className={`${activeSelect(filters.company)} w-full`}
            >
              <option value="">All Companies</option>
              {companies.map((c) => (
                <option key={c} value={c}>{c}{companyCounts[c] ? ` (${companyCounts[c]})` : ''}</option>
              ))}
            </select>

            <select
              value={filters.location}
              onChange={(e) => handleChange('location', e.target.value)}
              aria-label="Filter by location"
              className={`${activeSelect(filters.location)} w-full`}
            >
              <option value="">All Locations</option>
              {locations.map((l) => (
                <option key={l} value={l}>{l}{locationCounts[l] ? ` (${locationCounts[l]})` : ''}</option>
              ))}
            </select>

            <select
              value={filters.job_type}
              onChange={(e) => handleChange('job_type', e.target.value)}
              aria-label="Filter by job type"
              className={`${activeSelect(filters.job_type)} w-full`}
            >
              <option value="">All Job Types</option>
              {JOB_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Secondary filters row */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            <select
              value={filters.pipeline_stage}
              onChange={(e) => handleChange('pipeline_stage', e.target.value)}
              aria-label="Filter by pipeline stage"
              className={`${activeSelect(filters.pipeline_stage)} w-full`}
            >
              <option value="">All Stages</option>
              {PIPELINE_STAGES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            <select
              value={filters.remote_type}
              onChange={(e) => handleChange('remote_type', e.target.value)}
              aria-label="Filter by work style"
              className={`${activeSelect(filters.remote_type)} w-full`}
            >
              <option value="">All Work Styles</option>
              {REMOTE_TYPES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>

            <select
              value={filters.license}
              onChange={(e) => handleChange('license', e.target.value)}
              aria-label="Filter by license requirement"
              className={`${activeSelect(filters.license)} w-full`}
            >
              <option value="">Any License</option>
              {FINANCE_LICENSES.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>

            <div>
              <input
                type="month"
                value={filters.grad_date}
                onChange={(e) => handleChange('grad_date', e.target.value)}
                placeholder="Graduation date"
                className={`${selectClassName} w-full`}
                aria-label="Graduation date"
              />
            </div>
          </div>

          {/* Salary range row */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-medium text-navy-500 uppercase tracking-wide">Salary</span>
            <select
              value={filters.salary_min}
              onChange={(e) => handleChange('salary_min', e.target.value)}
              aria-label="Minimum salary"
              className={`${selectClassName}`}
            >
              <option value="">No min</option>
              {SALARY_MIN_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <span className="text-navy-300">to</span>
            <select
              value={filters.salary_max}
              onChange={(e) => handleChange('salary_max', e.target.value)}
              aria-label="Maximum salary"
              className={`${selectClassName}`}
            >
              <option value="">No max</option>
              {SALARY_MAX_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Active Filters Badges */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {activeFilters.map(({ key, value }) => (
            <button
              key={`${key}-${value}`}
              onClick={() => handleRemoveFilter(key)}
              className="inline-flex items-center gap-1.5 rounded-full bg-navy-900 text-white pl-3 pr-2 py-1 text-xs font-medium transition hover:bg-navy-700 group"
            >
              {getFilterLabel(key, value)}
              <svg className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          ))}
          {isFiltered && (
            <button
              onClick={handleClearAll}
              className="text-xs font-medium text-navy-500 transition hover:text-navy-800 underline underline-offset-2"
            >
              Clear all
            </button>
          )}
        </div>
      )}
    </div>
  )
})
