export default function ResourcesLoading() {
  return (
    <div className="min-h-screen bg-navy-50 animate-pulse">
      <div className="bg-navy-950 py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="h-4 w-32 bg-navy-800 rounded mb-6" />
          <div className="h-8 w-56 bg-navy-800 rounded mb-3" />
          <div className="h-4 w-80 bg-navy-800 rounded" />
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-navy-200 bg-white p-5">
              <div className="h-4 w-20 bg-navy-100 rounded mb-3" />
              <div className="h-5 w-48 bg-navy-100 rounded mb-2" />
              <div className="h-3 w-full bg-navy-100 rounded mb-1" />
              <div className="h-3 w-3/4 bg-navy-100 rounded mb-4" />
              <div className="flex gap-2">
                <div className="h-5 w-16 bg-navy-50 rounded-md" />
                <div className="h-5 w-20 bg-navy-50 rounded-md" />
                <div className="h-5 w-14 bg-navy-50 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
