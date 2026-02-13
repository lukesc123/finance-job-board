import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        <div className="rounded-xl bg-navy-50 p-12">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-navy-100">
            <svg
              className="h-10 w-10 text-navy-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-navy-900 mb-2">Page not found</h1>
          <p className="text-navy-600 mb-8 max-w-md mx-auto">
            The page you're looking for doesn't exist or may have been moved. Let's get you back on track.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-lg bg-navy-900 px-6 py-3 text-sm font-semibold text-white hover:bg-navy-800 transition"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Browse All Jobs
            </Link>
            <Link
              href="/employers"
              className="inline-flex items-center gap-2 rounded-lg border border-navy-200 bg-white px-6 py-3 text-sm font-semibold text-navy-700 hover:bg-navy-50 transition"
            >
              For Employers
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
