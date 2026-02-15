'use client'

import { memo } from 'react'
import Link from 'next/link'
import { useCompareIds } from '@/hooks/useJobActions'

export default memo(function CompareBar() {
  const { ids, clearAll: clearCompare } = useCompareIds()
  const count = ids.length

  const clearAll = () => clearCompare()

  if (count === 0) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 sm:bottom-4 sm:left-auto sm:right-4 sm:w-auto">
      <div className="bg-navy-900 text-white px-4 py-3 sm:rounded-xl sm:shadow-xl flex items-center gap-3">
        <svg className="h-5 w-5 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7" />
        </svg>
        <span className="text-sm font-medium">
          {count} {count === 1 ? 'job' : 'jobs'} selected
        </span>
        <Link
          href="/compare"
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-500 px-4 py-1.5 text-sm font-semibold text-white hover:bg-blue-600 transition"
        >
          Compare
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </Link>
        <button
          onClick={clearAll}
          className="p-1 rounded hover:bg-navy-800 text-navy-400 hover:text-white transition"
          aria-label="Clear compare list"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
})
