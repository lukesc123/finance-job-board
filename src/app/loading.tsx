export default function Loading() {
  return (
    <div className="min-h-screen bg-navy-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Search bar skeleton */}
        <div className="h-12 bg-navy-100 rounded-xl animate-pulse mb-6" />

        {/* Filter pills skeleton */}
        <div className="flex gap-2 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-8 w-24 bg-navy-100 rounded-full animate-pulse" />
          ))}
        </div>

        {/* Job card skeletons */}
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="rounded-xl border border-l-4 border-navy-100 border-l-navy-200 bg-white p-5 animate-pulse">
              <div className="flex gap-3.5">
                <div className="h-11 w-11 rounded-lg bg-navy-100 flex-shrink-0" />
                <div className="flex-1 space-y-2.5">
                  <div className="h-5 bg-navy-100 rounded w-2/3" />
                  <div className="h-4 bg-navy-100 rounded w-1/3" />
                  <div className="flex gap-3">
                    <div className="h-3 bg-navy-100 rounded w-24" />
                    <div className="h-3 bg-navy-100 rounded w-16" />
                    <div className="h-3 bg-navy-100 rounded w-20" />
                  </div>
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
