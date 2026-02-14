export default function JobDetailLoading() {
  return (
    <div className="min-h-screen bg-navy-50 animate-pulse">
      <div className="bg-white border-b border-navy-200/60">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="h-4 w-20 bg-navy-100 rounded" />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="bg-white rounded-xl border border-navy-200 overflow-hidden shadow-sm">
          {/* Header */}
          <div className="p-5 sm:p-8 border-b border-navy-100">
            <div className="space-y-3">
              <div className="flex gap-2">
                <div className="h-6 w-28 bg-navy-100 rounded-lg" />
                <div className="h-6 w-16 bg-navy-100 rounded" />
              </div>
              <div className="h-8 w-3/4 bg-navy-100 rounded" />
              <div className="h-5 w-40 bg-navy-100 rounded" />
            </div>
          </div>

          {/* Actions */}
          <div className="px-5 sm:px-8 py-3 border-b border-navy-100 bg-navy-50/30">
            <div className="flex gap-2">
              <div className="h-8 w-20 bg-navy-100 rounded-lg" />
              <div className="h-8 w-28 bg-navy-100 rounded-lg" />
              <div className="h-8 w-20 bg-navy-100 rounded-lg" />
            </div>
          </div>

          {/* Metadata strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-navy-100 border-b border-navy-100">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-3.5 sm:p-4 flex flex-col items-center gap-1.5">
                <div className="h-2.5 w-14 bg-navy-100 rounded" />
                <div className="h-4 w-20 bg-navy-100 rounded" />
              </div>
            ))}
          </div>

          {/* Content */}
          <div className="p-5 sm:p-8 space-y-4">
            <div className="h-5 w-32 bg-navy-100 rounded" />
            <div className="space-y-2.5">
              <div className="h-4 w-full bg-navy-100 rounded" />
              <div className="h-4 w-full bg-navy-100 rounded" />
              <div className="h-4 w-5/6 bg-navy-100 rounded" />
              <div className="h-4 w-full bg-navy-100 rounded" />
              <div className="h-4 w-3/4 bg-navy-100 rounded" />
              <div className="h-4 w-full bg-navy-100 rounded" />
              <div className="h-4 w-2/3 bg-navy-100 rounded" />
            </div>
          </div>

          {/* Footer */}
          <div className="p-5 sm:p-8 bg-navy-50 border-t border-navy-200">
            <div className="flex items-center justify-between">
              <div className="space-y-1.5">
                <div className="h-3 w-28 bg-navy-100 rounded" />
                <div className="h-3 w-24 bg-navy-100 rounded" />
              </div>
              <div className="h-10 w-44 bg-navy-200 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
