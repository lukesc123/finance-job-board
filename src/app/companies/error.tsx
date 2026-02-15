'use client'

import Link from 'next/link'

export default function CompaniesError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4">
          <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-navy-900 mb-2">Failed to load companies</h2>
        <p className="text-sm text-navy-500 mb-6">Something went wrong while loading the company directory. Please try again.</p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="rounded-lg bg-navy-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-navy-800 transition"
          >
            Try Again
          </button>
          <Link href="/" className="rounded-lg border border-navy-200 px-5 py-2.5 text-sm font-semibold text-navy-700 hover:bg-navy-50 transition">
            Browse Jobs
          </Link>
        </div>
      </div>
    </div>
  )
}
