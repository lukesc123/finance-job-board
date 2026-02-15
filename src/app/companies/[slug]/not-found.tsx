import Link from 'next/link'

export default function CompanyNotFound() {
  return (
    <div className="min-h-screen bg-navy-50">
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-24 text-center">
        <div className="rounded-xl bg-white border border-navy-200 p-10 shadow-sm">
          <div className="flex items-center justify-center mb-4">
            <svg className="h-12 w-12 text-navy-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-navy-900 mb-2">Company not found</h1>
          <p className="text-sm text-navy-600 mb-6">
            We couldn't find that company in our directory. Browse all hiring companies below.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
            <Link
              href="/companies"
              className="inline-flex items-center gap-2 rounded-lg bg-navy-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-navy-800 transition w-full sm:w-auto justify-center"
            >
              Browse Companies
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
