'use client'

import { useState, useEffect, useRef, memo } from 'react'
import { JobFilters } from '@/types'
import { STORAGE_KEYS, LIMITS } from '@/lib/constants'

interface SavedSearch {
  id: string
  label: string
  filters: JobFilters
  createdAt: number
}

interface SavedSearchesProps {
  currentFilters: JobFilters
  onApply: (filters: JobFilters) => void
}

const MAX_SAVED = LIMITS.MAX_SAVED_SEARCHES

function getFilterSummary(filters: JobFilters): string {
  const parts: string[] = []
  if (filters.category) parts.push(filters.category)
  if (filters.location) parts.push(filters.location)
  if (filters.company) parts.push(filters.company)
  if (filters.search) parts.push(`"${filters.search}"`)
  if (filters.pipeline_stage) parts.push(filters.pipeline_stage)
  if (filters.remote_type) parts.push(filters.remote_type)
  if (filters.salary_min) parts.push(`$${Math.round(Number(filters.salary_min) / 1000)}K+`)
  if (filters.job_type) parts.push(filters.job_type)
  return parts.join(' + ') || 'All Jobs'
}

function hasActiveFilters(filters: JobFilters): boolean {
  return !!(filters.category || filters.location || filters.company || filters.search ||
    filters.pipeline_stage || filters.remote_type || filters.salary_min || filters.salary_max ||
    filters.job_type || filters.license || filters.grad_date)
}

export default memo(function SavedSearches({ currentFilters, onApply }: SavedSearchesProps) {
  const [searches, setSearches] = useState<SavedSearch[]>([])
  const [justSaved, setJustSaved] = useState(false)
  const savedTimerRef = useRef<ReturnType<typeof setTimeout>>(null)
  useEffect(() => () => { if (savedTimerRef.current) clearTimeout(savedTimerRef.current) }, [])

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.SAVED_SEARCHES) || '[]')
      setSearches(stored)
    } catch { /* ignore */ }
  }, [])

  const saveSearch = () => {
    const newSearch: SavedSearch = {
      id: Date.now().toString(36),
      label: getFilterSummary(currentFilters),
      filters: currentFilters,
      createdAt: Date.now(),
    }
    const updated = [newSearch, ...searches].slice(0, MAX_SAVED)
    setSearches(updated)
    try { localStorage.setItem(STORAGE_KEYS.SAVED_SEARCHES, JSON.stringify(updated)) } catch { /* ignore */ }
    setJustSaved(true)
    savedTimerRef.current = setTimeout(() => setJustSaved(false), 2000)
  }

  const removeSearch = (id: string) => {
    const updated = searches.filter(s => s.id !== id)
    setSearches(updated)
    try { localStorage.setItem(STORAGE_KEYS.SAVED_SEARCHES, JSON.stringify(updated)) } catch { /* ignore */ }
  }

  // Only show if user has active filters or has saved searches
  if (!hasActiveFilters(currentFilters) && searches.length === 0) return null

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 flex-wrap">
        {/* Save current search */}
        {hasActiveFilters(currentFilters) && (
          <button
            onClick={saveSearch}
            disabled={justSaved}
            className="inline-flex items-center gap-1 rounded-lg border border-dashed border-navy-300 px-2.5 py-1.5 text-[11px] font-medium text-navy-500 hover:border-navy-400 hover:text-navy-700 transition disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-400"
          >
            {justSaved ? (
              <>
                <svg className="h-3 w-3 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Saved
              </>
            ) : (
              <>
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Save this search
              </>
            )}
          </button>
        )}

        {/* Saved search pills */}
        {searches.map((search) => (
          <div
            key={search.id}
            className="inline-flex items-center gap-1 rounded-lg bg-navy-100/60 text-[11px] font-medium text-navy-600 group"
          >
            <button
              onClick={() => onApply(search.filters)}
              className="px-2.5 py-1.5 hover:text-navy-900 transition rounded-l-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-navy-400"
              title={search.label}
            >
              {search.label.length > 30 ? search.label.substring(0, 30) + '...' : search.label}
            </button>
            <button
              onClick={() => removeSearch(search.id)}
              className="px-1.5 py-1.5 text-navy-400 hover:text-red-500 transition rounded-r-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-navy-400"
              aria-label={`Remove saved search: ${search.label}`}
            >
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  )
})
