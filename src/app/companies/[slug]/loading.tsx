export default function CompanyLoading() {
  return (
    <div className="min-h-screen bg-navy-50 animate-pulse">
      {/* Hero skeleton */}
      <div className="bg-navy-950">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
          <div className="h-4 w-32 bg-navy-800 rounded mb-6" />
          <div className="flex items-center gap-4 mb-4">
            <div className="h-14 w-14 bg-navy-800 rounded-xl" />
            <div>
              <div className="h-7 w-48 bg-navy-800 rounded mb-2" />
              <div className="h-4 w-64 bg-navy-800 rounded" />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <div className="h-9 w-32 bg-navy-800 rounded-lg" />
            <div className="h-9 w-28 bg-navy-800 rounded-lg" />
          </div>
        </div>
      </div>

      {/* Content skeleton */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="h-6 w-40 bg-navy-200 rounded mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="rounded-xl border border-navy-200 bg-white p-5">
              <div className="flex gap-3">
                <div className="h-11 w-11 bg-navy-100 rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-navy-100 rounded w-3/4" />
                  <div className="h-3 bg-navy-100 rounded w-1/2" />
                  <div className="flex gap-2">
                    <div className="h-5 bg-navy-100 rounded-md w-20" />
                    <div className="h-5 bg-navy-100 rounded-md w-16" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
