export default function TrackerLoading() {
  return (
    <div className="min-h-screen bg-navy-50">
      <div className="bg-gradient-to-b from-navy-950 to-navy-900 text-white py-10 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-5 w-5 bg-navy-700 rounded" />
              <div className="h-8 w-56 bg-navy-700 rounded" />
            </div>
            <div className="h-4 w-80 bg-navy-800 rounded" />
            <div className="flex gap-3 mt-5">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-7 w-20 bg-navy-800/60 rounded-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="animate-pulse bg-white rounded-xl border border-navy-200 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="h-5 w-3/4 bg-navy-100 rounded mb-2" />
                  <div className="h-4 w-1/2 bg-navy-100 rounded mb-3" />
                  <div className="flex gap-2">
                    <div className="h-6 w-20 bg-navy-100 rounded-full" />
                    <div className="h-6 w-16 bg-navy-100 rounded" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="h-8 w-24 bg-navy-100 rounded-lg" />
                  <div className="h-8 w-8 bg-navy-100 rounded-lg" />
                </div>
              </div>
              <div className="mt-3 h-16 w-full bg-navy-50 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
