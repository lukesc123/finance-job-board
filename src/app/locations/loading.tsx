export default function LocationsLoading() {
  return (
    <div className="min-h-screen bg-navy-50 animate-pulse">
      {/* Hero skeleton */}
      <div className="bg-navy-950">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
          <div className="h-4 w-40 bg-navy-800 rounded mb-6" />
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-navy-800 rounded-lg" />
            <div className="h-8 w-64 bg-navy-800 rounded" />
          </div>
          <div className="h-4 w-80 bg-navy-800 rounded" />
          <div className="flex gap-6 mt-6">
            <div className="h-10 w-20 bg-navy-800 rounded" />
            <div className="h-10 w-24 bg-navy-800 rounded" />
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Top Locations heading */}
        <div className="h-5 w-32 bg-navy-200 rounded mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-navy-200 bg-white p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="h-4 w-36 bg-navy-100 rounded mb-1.5" />
                  <div className="h-3 w-24 bg-navy-100 rounded" />
                </div>
                <div className="h-5 w-14 bg-navy-100 rounded-full" />
              </div>
              <div className="flex gap-1.5">
                <div className="h-4 w-16 bg-navy-50 rounded-md" />
                <div className="h-4 w-20 bg-navy-50 rounded-md" />
                <div className="h-4 w-14 bg-navy-50 rounded-md" />
              </div>
            </div>
          ))}
        </div>

        {/* All Locations heading */}
        <div className="h-5 w-48 bg-navy-200 rounded mb-4" />
        <div className="rounded-xl border border-navy-200 bg-white overflow-hidden">
          {[1, 2, 3].map(g => (
            <div key={g} className={g > 1 ? 'border-t border-navy-100' : ''}>
              <div className="px-5 py-3 bg-navy-50/50">
                <div className="h-4 w-24 bg-navy-200 rounded" />
              </div>
              <div className="divide-y divide-navy-50">
                {[1, 2, 3].map(r => (
                  <div key={r} className="flex items-center justify-between px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-4 w-4 bg-navy-100 rounded-full" />
                      <div className="h-4 w-40 bg-navy-100 rounded" />
                    </div>
                    <div className="h-3 w-14 bg-navy-100 rounded" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
