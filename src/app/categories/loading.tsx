export default function CategoriesLoading() {
  return (
    <div className="min-h-screen bg-navy-50 animate-pulse">
      {/* Hero skeleton */}
      <div className="bg-navy-950">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
          <div className="h-4 w-40 bg-navy-800 rounded mb-6" />
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-navy-800 rounded-lg" />
            <div className="h-8 w-56 bg-navy-800 rounded" />
          </div>
          <div className="h-4 w-80 bg-navy-800 rounded" />
          <div className="flex gap-6 mt-6">
            <div className="h-10 w-20 bg-navy-800 rounded" />
            <div className="h-10 w-24 bg-navy-800 rounded" />
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-navy-200 bg-white p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 bg-navy-100 rounded" />
                  <div className="h-4 w-32 bg-navy-100 rounded" />
                </div>
                <div className="h-5 w-8 bg-navy-100 rounded-full" />
              </div>
              <div className="h-3 w-full bg-navy-100 rounded mb-2" />
              <div className="h-3 w-3/4 bg-navy-100 rounded mb-4" />
              <div className="flex gap-4">
                <div className="h-3 w-20 bg-navy-100 rounded" />
                <div className="h-3 w-16 bg-navy-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
