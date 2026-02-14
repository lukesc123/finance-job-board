import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-navy-50">
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-24 text-center">
        <div className="rounded-xl bg-white border border-navy-200 p-10 shadow-sm">
          <p className="text-6xl font-extrabold text-navy-200 mb-4">404</p>
          <h1 className="text-xl font-bold text-navy-900 mb-2">Page not found</h1>
          <p className="text-sm text-navy-600 mb-6">
            The page you&apos;re looking for doesn&apos;t exist or may have been moved.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 mb-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-lg bg-navy-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-navy-800 transition w-full sm:w-auto justify-center"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Browse All Jobs
            </Link>
            <Link
              href="/employers"
              className="inline-flex items-center gap-2 rounded-lg border border-navy-200 bg-white px-5 py-2.5 text-sm font-semibold text-navy-700 hover:bg-navy-50 transition w-full sm:w-auto justify-center"
            >
              For Employers
            </Link>
          </div>
          <div className="pt-4 border-t border-navy-100">
            <p className="text-xs text-navy-400 mb-3">Try browsing by:</p>
            <div className="flex flex-wrap justify-center gap-2">
              <Link href="/categories" className="text-xs font-medium text-navy-600 bg-navy-50 rounded-full px-3 py-1 hover:bg-navy-100 transition">
                Categories
              </Link>
              <Link href="/locations" className="text-xs font-medium text-navy-600 bg-navy-50 rounded-full px-3 py-1 hover:bg-navy-100 transition">
                Locations
              </Link>
              <Link href="/companies" className="text-xs font-medium text-navy-600 bg-navy-50 rounded-full px-3 py-1 hover:bg-navy-100 transition">
                Companies
              </Link>
              <Link href="/resources" className="text-xs font-medium text-navy-600 bg-navy-50 rounded-full px-3 py-1 hover:bg-navy-100 transition">
                Resources
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
