'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { JOB_CATEGORIES, STORAGE_KEYS } from '@/lib/constants'
import { slugify } from '@/lib/formatting'

interface RecentJob {
  id: string
  title: string
  company: string
  location: string
  salary: string
  stage: string
  viewedAt: number
}

export default function JobNotFound() {
  const [recentJobs, setRecentJobs] = useState<RecentJob[]>([])
  const [suggestedCategory, setSuggestedCategory] = useState<string | null>(null)
  const [suggestedLocation, setSuggestedLocation] = useState<string | null>(null)

  useEffect(() => {
    try {
      const viewed: RecentJob[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.RECENTLY_VIEWED) || '[]')
      setRecentJobs(viewed.slice(0, 4))

      // Infer what the user was browsing to suggest relevant alternatives
      if (viewed.length > 0) {
        // Find most common category-like stage or company from recent views
        const locations = viewed.map(v => v.location).filter(Boolean)
        if (locations.length > 0) {
          const freq = new Map<string, number>()
          for (const loc of locations) freq.set(loc, (freq.get(loc) || 0) + 1)
          const top = [...freq.entries()].sort((a, b) => b[1] - a[1])[0]
          if (top) setSuggestedLocation(top[0])
        }
      }
    } catch { /* ignore */ }

    // Try to extract category from the referrer or document title
    try {
      const cats = JOB_CATEGORIES
      const path = window.location.pathname + window.location.search
      for (const cat of cats) {
        if (path.toLowerCase().includes(slugify(cat))) {
          setSuggestedCategory(cat)
          break
        }
      }
    } catch { /* ignore */ }
  }, [])

  return (
    <div className="min-h-screen bg-navy-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <div className="rounded-xl bg-white border border-navy-200 overflow-hidden shadow-sm">
          {/* Header */}
          <div className="p-8 sm:p-10 text-center border-b border-navy-100">
            <div className="flex items-center justify-center mb-4">
              <div className="rounded-full bg-navy-100 p-4">
                <svg className="h-8 w-8 text-navy-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <h1 className="text-xl font-bold text-navy-900 mb-2">This position is no longer available</h1>
            <p className="text-sm text-navy-500 max-w-md mx-auto">
              It may have been filled, removed by the employer, or the link may be incorrect. Here are some ways to keep your search going.
            </p>
          </div>

          {/* Recently Viewed Jobs */}
          {recentJobs.length > 0 && (
            <div className="p-5 sm:p-8 border-b border-navy-100">
              <h2 className="text-sm font-bold text-navy-900 mb-3">Jobs you recently viewed</h2>
              <div className="space-y-2">
                {recentJobs.map((job) => (
                  <Link
                    key={job.id}
                    href={`/jobs/${job.id}`}
                    className="block rounded-lg border border-navy-200 bg-white p-3 hover:shadow-sm hover:border-navy-300 transition group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-400 focus-visible:ring-offset-2"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-navy-900 group-hover:text-navy-700 text-sm truncate">{job.title}</p>
                        <p className="text-xs text-navy-500 mt-0.5">{job.company} &middot; {job.location}</p>
                      </div>
                      {job.salary && (
                        <span className="text-xs font-bold text-emerald-600 whitespace-nowrap flex-shrink-0">{job.salary}</span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Smart Suggestions */}
          <div className="p-5 sm:p-8 border-b border-navy-100">
            <h2 className="text-sm font-bold text-navy-900 mb-3">Keep searching</h2>
            <div className="flex flex-wrap gap-2">
              {suggestedCategory && (
                <Link
                  href={`/category/${slugify(suggestedCategory)}`}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-navy-900 px-4 py-2 text-xs font-semibold text-white hover:bg-navy-800 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-400 focus-visible:ring-offset-2"
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                  {suggestedCategory} Jobs
                </Link>
              )}
              {suggestedLocation && (
                <Link
                  href={`/location/${slugify(suggestedLocation)}`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-navy-200 bg-white px-4 py-2 text-xs font-semibold text-navy-700 hover:bg-navy-50 hover:border-navy-300 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-400 focus-visible:ring-offset-2"
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  Jobs in {suggestedLocation}
                </Link>
              )}
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 rounded-lg border border-navy-200 bg-white px-4 py-2 text-xs font-semibold text-navy-700 hover:bg-navy-50 hover:border-navy-300 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-400 focus-visible:ring-offset-2"
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                Browse All Jobs
              </Link>
              <Link
                href="/companies"
                className="inline-flex items-center gap-1.5 rounded-lg border border-navy-200 bg-white px-4 py-2 text-xs font-semibold text-navy-700 hover:bg-navy-50 hover:border-navy-300 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-400 focus-visible:ring-offset-2"
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                Companies Hiring
              </Link>
            </div>
          </div>

          {/* Category Quick Links */}
          <div className="p-5 sm:p-8">
            <p className="text-xs font-semibold text-navy-400 uppercase tracking-wider mb-3">Browse by Category</p>
            <div className="flex flex-wrap gap-2">
              {JOB_CATEGORIES.map((cat) => (
                <Link
                  key={cat}
                  href={`/category/${slugify(cat)}`}
                  className="rounded-full bg-navy-50 border border-navy-200 px-3 py-1.5 text-xs font-medium text-navy-600 hover:bg-navy-100 hover:border-navy-300 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-400 focus-visible:ring-offset-2"
                >
                  {cat}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
