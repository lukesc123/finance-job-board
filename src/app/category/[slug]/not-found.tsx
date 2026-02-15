import Link from 'next/link'

export default function CategoryNotFound() {
  return (
    <div className="min-h-screen bg-navy-50">
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-24 text-center">
        <div className="rounded-xl bg-white border border-navy-200 p-10 shadow-sm">
          <div className="flex items-center justify-center mb-4">
            <svg className="h-12 w-12 text-navy-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-navy-900 mb-2">Category not found</h1>
          <p className="text-sm text-navy-600 mb-6">
            We couldn't find the job category you're looking for. Browse our available categories below.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
            <Link
              href="/categories"
              className="inline-flex items-center gap-2 rounded-lg bg-navy-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-navy-800 transition w-full sm:w-auto justify-center"
            >
              Browse Categories
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
