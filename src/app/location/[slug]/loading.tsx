export default function LocationLoading() {
  return (
    <div className="min-h-screen bg-navy-50 animate-pulse">
      {/* Hero skeleton */}
      <div className="bg-navy-950">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
          <div className="h-4 w-48 bg-navy-800 rounded mb-6" />
          <div className="h-8 w-56 bg-navy-800 rounded mb-3" />
          <div className="h-4 w-80 bg-navy-800 rounded mb-6" />
          <div className="flex gap-6">
            <div className="h-10 w-20 bg-navy-800 rounded" />
            <div className="h-10 w-24 bg-navy-800 rounded" />
          </div>
        </div>
      </div>

      {/* Content skeleton */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="space-y-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="rounded-xl border border-l-4 border-navy-100 border-l-navy-200 bg-white p-5">
              <div className="flex gap-3.5">
                <div className="h-11 w-11 bg-navy-100 rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-navy-100 rounded w-3/4" />
                  <div className="h-3 bg-navy-100 rounded w-1/3" />
                  <div className="flex gap-3">
                    <div className="h-3 bg-navy-100 rounded w-24" />
                    <div className="h-3 bg-navy-100 rounded w-16" />
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
