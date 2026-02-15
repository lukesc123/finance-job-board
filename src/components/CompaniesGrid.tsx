'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { slugify } from '@/lib/formatting'
import CompanyLogo from '@/components/CompanyLogo'

interface CompanyWithCount {
  id: string
  name: string
  slug: string
  website: string
  careers_url: string
  logo_url: string | null
  description: string | null
  job_count: number
  categories: string[]
  locations: string[]
}

type SortOption = 'jobs' | 'name_az' | 'name_za'

export default function CompaniesGrid({ companies }: { companies: CompanyWithCount[] }) {
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('jobs')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedLocation, setSelectedLocation] = useState('')

  const allCategories = useMemo(() => {
    const cats = new Set<string>()
    companies.forEach((c) => c.categories.forEach((cat) => cats.add(cat)))
    return Array.from(cats).sort()
  }, [companies])

  const allLocations = useMemo(() => {
    const locs = new Map<string, number>()
    companies.forEach((c) => c.locations.forEach((loc) => locs.set(loc, (locs.get(loc) || 0) + 1)))
    return Array.from(locs.entries()).sort((a, b) => b[1] - a[1]).map(([loc]) => loc)
  }, [companies])

  const filtered = useMemo(() => {
    let result = companies

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.description?.toLowerCase().includes(q) ||
          c.categories.some((cat) => cat.toLowerCase().includes(q)) ||
          c.locations.some((loc) => loc.toLowerCase().includes(q))
      )
    }

    if (selectedCategory) {
      result = result.filter((c) => c.categories.includes(selectedCategory))
    }

    if (selectedLocation) {
      result = result.filter((c) => c.locations.includes(selectedLocation))
    }

    if (sortBy === 'name_az') {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name))
    } else if (sortBy === 'name_za') {
      result = [...result].sort((a, b) => b.name.localeCompare(a.name))
    } else {
      result = [...result].sort((a, b) => b.job_count - a.job_count)
    }

    return result
  }, [companies, search, sortBy, selectedCategory, selectedLocation])

  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Search + Sort Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-5">
        <div className="relative flex-1" role="search" aria-label="Search companies">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-navy-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search companies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search companies by name"
            className="w-full rounded-lg border border-navy-200 bg-white py-2.5 pl-10 pr-4 text-sm text-navy-900 placeholder-navy-400 focus:border-navy-400 focus:outline-none focus:ring-1 focus:ring-navy-400 transition"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-400 hover:text-navy-600"
              aria-label="Clear search"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <select
          value={selectedLocation}
          onChange={(e) => setSelectedLocation(e.target.value)}
          aria-label="Filter by location"
          className="rounded-lg border border-navy-200 bg-white px-3 py-2.5 text-sm text-navy-700 focus:border-navy-400 focus:outline-none"
        >
          <option value="">All locations</option>
          {allLocations.map((loc) => (
            <option key={loc} value={loc}>{loc}</option>
          ))}
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortOption)}
          aria-label="Sort companies"
          className="rounded-lg border border-navy-200 bg-white px-3 py-2.5 text-sm text-navy-700 focus:border-navy-400 focus:outline-none"
        >
          <option value="jobs">Most jobs</option>
          <option value="name_az">A to Z</option>
          <option value="name_za">Z to A</option>
        </select>
      </div>

      {/* Category filter pills */}
      <div className="flex flex-wrap gap-1.5 mb-5">
        <button
          onClick={() => setSelectedCategory('')}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
            !selectedCategory
              ? 'bg-navy-900 text-white'
              : 'bg-white text-navy-600 border border-navy-200 hover:border-navy-300'
          }`}
        >
          All
        </button>
        {allCategories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(selectedCategory === cat ? '' : cat)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
              selectedCategory === cat
                ? 'bg-navy-900 text-white'
                : 'bg-white text-navy-600 border border-navy-200 hover:border-navy-300'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Results count */}
      <p className="text-sm text-navy-600 mb-4" aria-live="polite" aria-atomic="true">
        <span className="font-semibold text-navy-900">{filtered.length}</span> {filtered.length === 1 ? 'company' : 'companies'}
        {search && <span className="text-navy-400"> matching &ldquo;{search}&rdquo;</span>}
        {selectedCategory && <span className="text-navy-400"> in {selectedCategory}</span>}
        {selectedLocation && <span className="text-navy-400"> in {selectedLocation}</span>}
      </p>

      {/* Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((company) => (
          <div key={company.id} className="rounded-xl border border-navy-200 bg-white p-5 hover:shadow-md transition-shadow group">
            <div className="flex items-start gap-3 mb-3">
              <CompanyLogo logoUrl={company.logo_url} name={company.name} fallbackClassName="bg-navy-100 text-navy-600" />
              <div className="min-w-0">
                <Link
                  href={`/companies/${company.slug}`}
                  className="font-bold text-navy-900 group-hover:text-navy-700 transition block truncate"
                >
                  {company.name}
                </Link>
                <p className="text-xs text-navy-500">
                  <span className="font-semibold text-navy-700">{company.job_count}</span> open {company.job_count === 1 ? 'position' : 'positions'}
                </p>
              </div>
            </div>

            {company.description && (
              <p className="text-xs text-navy-600 leading-relaxed mb-3 line-clamp-2">
                {company.description}
              </p>
            )}

            {/* Categories - link to category pages */}
            <div className="flex flex-wrap gap-1 mb-3">
              {company.categories.slice(0, 3).map((cat) => (
                <Link
                  key={cat}
                  href={`/category/${slugify(cat)}`}
                  className="rounded-full bg-navy-50 px-2 py-0.5 text-[10px] font-medium text-navy-600 hover:bg-navy-100 transition"
                >
                  {cat}
                </Link>
              ))}
              {company.categories.length > 3 && (
                <span className="rounded-full bg-navy-50 px-2 py-0.5 text-[10px] font-medium text-navy-400">
                  +{company.categories.length - 3} more
                </span>
              )}
            </div>

            {/* Locations - link to location pages */}
            {company.locations.length > 0 && (
              <div className="flex flex-wrap items-center gap-1 text-[10px] text-navy-400 mb-3">
                <svg className="h-3 w-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {company.locations.slice(0, 3).map((loc, i, arr) => (
                  <span key={loc}>
                    <Link
                      href={`/location/${slugify(loc)}`}
                      className="hover:text-navy-600 hover:underline transition"
                    >
                      {loc}
                    </Link>
                    {i < arr.length - 1 && ', '}
                  </span>
                ))}
                {company.locations.length > 3 && (
                  <span className="text-navy-300">+{company.locations.length - 3} more</span>
                )}
              </div>
            )}

            {/* Links */}
            <div className="flex items-center gap-3 pt-2 border-t border-navy-100">
              <Link
                href={`/companies/${company.slug}`}
                className="inline-flex items-center gap-1 text-xs font-semibold text-navy-600 hover:text-navy-900 transition"
              >
                View Jobs
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
              {company.careers_url && (
                <a
                  href={company.careers_url}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="inline-flex items-center gap-1 text-xs font-medium text-navy-400 hover:text-navy-600 transition"
                >
                  Careers
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              )}
              {company.website && (
                <a
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="inline-flex items-center gap-1 text-xs font-medium text-navy-400 hover:text-navy-600 transition ml-auto"
                >
                  Website
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-navy-400">
          <p className="text-lg font-semibold mb-2">No companies found</p>
          <p className="text-sm">Try a different search term or clear your filters.</p>
          <button
            onClick={() => { setSearch(''); setSelectedCategory(''); setSelectedLocation('') }}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-navy-900 px-4 py-2 text-sm font-semibold text-white hover:bg-navy-800 transition"
          >
            Clear filters
          </button>
        </div>
      )}
    </section>
  )
}
