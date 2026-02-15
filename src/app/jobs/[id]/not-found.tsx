import Link from 'next/link'

export default function JobNotFound() {
  return (
    <div className="min-h-screen bg-navy-50">
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-24 text-center">
        <div className="rounded-xl bg-white border border-navy-200 p-10 shadow-sm">
          <div className="flex items-center justify-center mb-4">
            <svg className="h-12 w-12 text-navy-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-navy-900 mb-2">Job not found</h1>
          <p className="text-sm text-navy-600 mb-6">
            This job listing may have been removed, filled, or the link may be incorrect. Try browsing our current openings.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-lg bg-navy-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-navy-800 transition w-full sm:w-auto justify-center"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Browse All Jobs
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-lg border border-navy-200 bg-white px-5 py-2.5 text-sm font-semibold text-navy-700 hover:bg-navy-50 transition w-full sm:w-auto justify-center"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Go Back
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
