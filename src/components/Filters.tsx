'use client'

import { useState } from 'react'
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
}

export default function Filters({ filters, onFilterChange }: FiltersProps) {
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
    })
  }

  const isFiltered =
    filters.category ||
    filters.job_type ||
    filters.pipeline_stage ||
    filters.remote_type ||
    filters.license ||
    filters.grad_date

  return (
    <div className="space-y-4">
      {/* Main Filters Row */}
      <div className="flex flex-wrap gap-3">
        <select
          value={filters.category}
          onChange={(e) => handleChange('category', e.target.value)}
          className="rounded-lg border border-navy-200 bg-white px-3 py-2 text-sm text-navy-900 transition focus:border-navy-500 focus:outline-none focus:ring-2 focus:ring-navy-500/20"
        >
          <option value="">Category</option>
          {JOB_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          value={filters.job_type}
          onChange={(e) => handleChange('job_type', e.target.value)}
          className="rounded-lg border border-navy-200 bg-white px-3 py-2 text-sm text-navy-900 transition focus:border-navy-500 focus:outline-none focus:ring-2 focus:ring-navy-500/20"
        >
          <option value="">Job Type</option>
          {JOB_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        <select
          value={filters.pipeline_stage}
          onChange={(e) => handleChange('pipeline_stage', e.target.value)}
          className="rounded-lg border border-navy-200 bg-white px-3 py-2 text-sm text-navy-900 transition focus:border-navy-500 focus:outline-none focus:ring-2 focus:ring-navy-500/20"
        >
          <option value="">Pipeline Stage</option>
          {PIPELINE_STAGES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <select
          value={filters.remote_type}
          onChange={(e) => handleChange('remote_type', e.target.value)}
          className="rounded-lg border border-navy-200 bg-white px-3 py-2 text-sm text-navy-900 transition focus:border-navy-500 focus:outline-none focus:ring-2 focus:ring-navy-500/20"
        >
          <option value="">Remote Type</option>
          {REMOTE_TYPES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>

        <select
          value={filters.license}
          onChange={(e) => handleChange('license', e.target.value)}
          className="rounded-lg border border-navy-200 bg-white px-3 py-2 text-sm text-navy-900 transition focus:border-navy-500 focus:outline-none focus:ring-2 focus:ring-navy-500/20"
        >
          <option value="">License Required</option>
          {FINANCE_LICENSES.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>

        {isFiltered && (
          <button
            onClick={handleClearAll}
            className="rounded-lg bg-navy-50 px-3 py-2 text-sm font-medium text-navy-700 transition hover:bg-navy-100"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Graduation Date Filter */}
      <div className="flex items-center gap-3">
        <label htmlFor="grad_date" className="text-sm font-medium text-navy-700">
          Your graduation date:
        </label>
        <input
          id="grad_date"
          type="month"
          value={filters.grad_date}
          onChange={(e) => handleChange('grad_date', e.target.value)}
          className="rounded-lg border border-navy-200 bg-white px-3 py-2 text-sm text-navy-900 transition focus:border-navy-500 focus:outline-none focus:ring-2 focus:ring-navy-500/20"
        />
        {filters.grad_date && (
          <button
            onClick={() => handleChange('grad_date', '')}
            className="text-sm text-navy-600 hover:text-navy-800 transition"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  )
}
