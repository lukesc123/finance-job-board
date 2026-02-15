export default function CompareLoading() {
  return (
    <div className="min-h-screen bg-navy-50">
      <div className="bg-gradient-to-b from-navy-950 to-navy-900 text-white py-10 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-4 w-16 bg-navy-700 rounded mb-3" />
            <div className="h-8 w-64 bg-navy-700 rounded mb-2" />
            <div className="h-4 w-96 bg-navy-800 rounded" />
          </div>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="animate-pulse">
          <div className="overflow-x-auto rounded-xl border border-navy-200 bg-white">
            <div className="min-w-[600px]">
              {/* Table header */}
              <div className="flex border-b border-navy-100 bg-navy-50/50 px-4 py-3">
                <div className="w-32 h-4 bg-navy-200 rounded" />
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex-1 px-4">
                    <div className="h-4 w-24 bg-navy-200 rounded" />
                  </div>
                ))}
              </div>
              {/* Table rows */}
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="flex border-b border-navy-100 px-4 py-4">
                  <div className="w-32 h-4 bg-navy-100 rounded" />
                  {[1, 2, 3].map(j => (
                    <div key={j} className="flex-1 px-4">
                      <div className="h-4 bg-navy-100 rounded" style={{ width: `${50 + (j * 10)}%` }} />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
