'use client'

import { useState, useRef, useEffect } from 'react'

interface SearchBarProps {
  onSearch: (query: string) => void
  placeholder?: string
  initialValue?: string
}

export default function SearchBar({
  onSearch,
  placeholder = 'Search jobs by title, company, location...',
  initialValue = ''
}: SearchBarProps) {
  const [query, setQuery] = useState(initialValue)
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus search bar on "/" key press
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)
    onSearch(value)
  }

  const handleClear = () => {
    setQuery('')
    onSearch('')
    inputRef.current?.focus()
  }

  return (
    <div className="relative w-full">
      <svg
        className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-navy-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full rounded-xl border border-navy-200 bg-white py-3.5 pl-12 pr-20 text-navy-900 placeholder-navy-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent transition"
      />
      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
        {query ? (
          <button
            onClick={handleClear}
            className="text-navy-400 hover:text-navy-600 transition p-1"
            aria-label="Clear search"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        ) : (
          <kbd className="hidden sm:inline-flex items-center rounded-md border border-navy-200 bg-navy-50 px-2 py-0.5 text-xs font-medium text-navy-500">
            /
          </kbd>
        )}
      </div>
    </div>
  )
}
