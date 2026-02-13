export default function JobDetailLoading() {
  return (
    <div className="min-h-screen bg-navy-50 animate-pulse">
      {/* Back bar */}
      <div className="bg-white border-b border-navy-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="h-4 w-28 bg-navy-100 rounded" />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl border border-navy-200 overflow-hidden">
          {/* Header */}
          <div className="p-6 sm:p-8 border-b border-navy-100">
            <div className="space-y-4">
              <div className="h-6 w-32 bg-navy-100 rounded-lg" />
              <div className="h-8 w-3/4 bg-navy-100 rounded-lg" />
              <div className="h-5 w-48 bg-navy-100 rounded" />
            </div>
          </div>

          {/* Metadata strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-navy-100 border-b border-navy-100">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-4 sm:p-5 flex flex-col items-center gap-2">
                <div className="h-3 w-16 bg-navy-100 rounded" />
                <div className="h-4 w-24 bg-navy-100 rounded" />
              </div>
            ))}
          </div>

          {/* Content */}
          <div className="p-6 sm:p-8 space-y-4">
            <div className="h-5 w-36 bg-navy-100 rounded" />
            <div className="space-y-2">
              <div className="h-4 w-full bg-navy-100 rounded" />
              <div className="h-4 w-full bg-navy-100 rounded" />
              <div className="h-4 w-5/6 bg-navy-100 rounded" />
              <div className="h-4 w-full bg-navy-100 rounded" />
              <div className="h-4 w-3/4 bg-navy-100 rounded" />
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 sm:p-8 bg-navy-50 border-t border-navy-200">
            <div className="flex items-center justify-between">
              <div className="h-4 w-32 bg-navy-100 rounded" />
              <div className="h-12 w-48 bg-navy-200 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
