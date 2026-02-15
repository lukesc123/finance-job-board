import Link from 'next/link'

export default function LocationNotFound() {
  return (
    <div className="min-h-screen bg-navy-50">
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-24 text-center">
        <div className="rounded-xl bg-white border border-navy-200 p-10 shadow-sm">
          <div className="flex items-center justify-center mb-4">
            <svg className="h-12 w-12 text-navy-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-navy-900 mb-2">Location not found</h1>
          <p className="text-sm text-navy-600 mb-6">
            We couldn't find jobs for that location. Browse our available locations below.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
            <Link
              href="/locations"
              className="inline-flex items-center gap-2 rounded-lg bg-navy-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-navy-800 transition w-full sm:w-auto justify-center"
            >
              Browse Locations
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-lg border border-navy-200 bg-white px-5 py-2.5 text-sm font-semibold text-navy-700 hover:bg-navy-50 transition w-full sm:w-auto justify-center"
            >
              Browse All Jobs
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
