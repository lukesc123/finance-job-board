'use client'

import { useState, useRef, useEffect, useCallback, memo } from 'react'
import { fetchRetry } from '@/lib/fetchRetry'

interface Suggestion {
  type: string
  value: string
  count?: number
}

interface SearchBarProps {
  onSearch: (query: string) => void
  onCategorySelect?: (category: string) => void
  placeholder?: string
  initialValue?: string
}

const TYPE_LABELS: Record<string, string> = {
  job: 'Job',
  company: 'Company',
  category: 'Category',
  location: 'Location',
}

const TYPE_ICON_PATHS: Record<string, string[]> = {
  job: ['M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'],
  company: ['M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'],
  category: ['M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z'],
  location: ['M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z', 'M15 11a3 3 0 11-6 0 3 3 0 016 0z'],
}

function getTypeIcon(type: string) {
  const paths = TYPE_ICON_PATHS[type]
  if (!paths) return null
  return (
    <svg className="h-3.5 w-3.5 text-navy-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      {paths.map((d, i) => (
        <path key={i} strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
      ))}
    </svg>
  )
}

function getTypeLabel(type: string): string {
  return TYPE_LABELS[type] || ''
}

export default memo(function SearchBar({
  onSearch,
  onCategorySelect,
  placeholder = 'Search by title, company, or location...',
  initialValue = ''
}: SearchBarProps) {
  const [query, setQuery] = useState(initialValue)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [suggestionsLoading, setSuggestionsLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const fetchTimeout = useRef<ReturnType<typeof setTimeout>>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA' && document.activeElement?.tagName !== 'SELECT') {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Cleanup fetch timeout and abort controller on unmount
  useEffect(() => {
    return () => {
      if (fetchTimeout.current) clearTimeout(fetchTimeout.current)
      abortRef.current?.abort()
    }
  }, [])

  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.length < 2) {
      setSuggestions([])
      setSuggestionsLoading(false)
      return
    }
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setSuggestionsLoading(true)
    const timeoutId = setTimeout(() => controller.abort(), 5000)
    try {
      const res = await fetchRetry(`/api/search-suggestions?q=${encodeURIComponent(q)}`, { signal: controller.signal, retries: 1 })
      clearTimeout(timeoutId)
      if (!res.ok) { setSuggestions([]); setSuggestionsLoading(false); return }
      const data = (await res.json()) as { suggestions?: Suggestion[] }
      setSuggestions(data.suggestions ?? [])
    } catch (err) {
      clearTimeout(timeoutId)
      if (err instanceof DOMException && err.name === 'AbortError') return
      setSuggestions([])
    } finally {
      setSuggestionsLoading(false)
    }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)
    onSearch(value)
    setSelectedIndex(-1)

    if (fetchTimeout.current) clearTimeout(fetchTimeout.current)
    fetchTimeout.current = setTimeout(() => {
      fetchSuggestions(value)
      setShowSuggestions(true)
    }, 200)
  }

  const handleSelectSuggestion = (suggestion: Suggestion) => {
    if (suggestion.type === 'category' && onCategorySelect) {
      onCategorySelect(suggestion.value)
      setQuery('')
      onSearch('')
    } else {
      setQuery(suggestion.value)
      onSearch(suggestion.value)
    }
    setShowSuggestions(false)
    setSelectedIndex(-1)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => Math.min(prev + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => Math.max(prev - 1, -1))
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault()
      handleSelectSuggestion(suggestions[selectedIndex])
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
      inputRef.current?.focus()
    }
  }

  const handleClear = () => {
    setQuery('')
    onSearch('')
    setSuggestions([])
    setShowSuggestions(false)
    inputRef.current?.focus()
  }

  return (
    <div ref={containerRef} className="relative w-full" role="search" aria-label="Search jobs">
      <svg
        className="absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-navy-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
        maxLength={200}
        placeholder={placeholder}
        aria-label="Search jobs by title, company, or location"
        className="w-full rounded-xl border border-navy-200 bg-white py-3 pl-11 pr-20 text-sm text-navy-900 placeholder-navy-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-navy-500/30 focus:border-navy-400 transition"
        role="combobox"
        aria-expanded={showSuggestions}
        aria-autocomplete="list"
        aria-controls="search-suggestions"
        aria-activedescendant={selectedIndex >= 0 ? `suggestion-${selectedIndex}` : undefined}
      />
      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
        {query ? (
          <button
            onClick={handleClear}
            className="text-navy-400 hover:text-navy-600 transition p-1.5 rounded-md hover:bg-navy-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-400/50"
            aria-label="Clear search"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        ) : (
          <kbd className="hidden sm:inline-flex items-center rounded border border-navy-200 bg-navy-50 px-1.5 py-0.5 text-[10px] font-medium text-navy-400">
            /
          </kbd>
        )}
      </div>

      {/* Screen reader announcement for suggestion count */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {showSuggestions && suggestions.length > 0 && `${suggestions.length} suggestion${suggestions.length === 1 ? '' : 's'} available`}
        {showSuggestions && suggestionsLoading && suggestions.length === 0 && 'Loading suggestions'}
      </div>

      {/* Suggestions Loading Skeleton */}
      {showSuggestions && suggestionsLoading && suggestions.length === 0 && query.length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-navy-200 rounded-xl shadow-lg z-50 animate-dropdown-in p-2 space-y-1">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-2.5 animate-pulse">
              <div className="h-4 w-4 rounded bg-navy-100" />
              <div className="flex-1 h-4 rounded bg-navy-100" />
              <div className="h-4 w-10 rounded bg-navy-50" />
            </div>
          ))}
        </div>
      )}

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          id="search-suggestions"
          role="listbox"
          className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-navy-200 rounded-xl shadow-lg z-50 max-h-[50vh] overflow-y-auto animate-dropdown-in"
        >
          {suggestions.map((s, i) => (
            <button
              key={`${s.type}-${s.value}`}
              id={`suggestion-${i}`}
              role="option"
              aria-selected={i === selectedIndex}
              onClick={() => handleSelectSuggestion(s)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition ${
                i === selectedIndex ? 'bg-navy-50' : 'hover:bg-navy-50'
              }`}
            >
              {getTypeIcon(s.type)}
              <span className="flex-1 text-sm text-navy-800 truncate">{s.value}</span>
              <span className="flex items-center gap-1.5">
                {s.count && (
                  <span className="text-[11px] text-navy-400">{s.count}</span>
                )}
                <span className="text-[10px] font-medium text-navy-400 bg-navy-50 rounded px-1.5 py-0.5 uppercase tracking-wider">
                  {getTypeLabel(s.type)}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
})
