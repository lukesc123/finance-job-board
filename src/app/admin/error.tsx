'use client'

import Link from 'next/link'

export default function AdminError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <h2 className="text-lg font-bold text-navy-900 mb-2">Something went wrong</h2>
        <p className="text-sm text-navy-600 mb-6">An error occurred in the admin panel. Please try again.</p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="rounded-lg bg-navy-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-navy-800 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-400 focus-visible:ring-offset-2"
          >
            Try Again
          </button>
          <Link
            href="/admin/login"
            className="rounded-lg border border-navy-200 px-5 py-2.5 text-sm font-semibold text-navy-700 hover:bg-navy-50 transition"
          >
            Re-login
          </Link>
        </div>
      </div>
    </div>
  )
}
