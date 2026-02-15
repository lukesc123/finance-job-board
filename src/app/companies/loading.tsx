export default function CompaniesLoading() {
  return (
    <div className="min-h-screen bg-navy-50 animate-pulse">
      <div className="bg-navy-950">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
          <div className="h-4 w-40 bg-navy-800 rounded mb-6" />
          <div className="h-8 w-52 bg-navy-800 rounded mb-3" />
          <div className="h-4 w-80 bg-navy-800 rounded" />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="h-10 w-full bg-navy-200 rounded-xl mb-6" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-navy-200 bg-white p-5">
              <div className="flex flex-col items-center gap-3">
                <div className="h-12 w-12 bg-navy-100 rounded-lg" />
                <div className="h-4 w-24 bg-navy-100 rounded" />
                <div className="h-3 w-16 bg-navy-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
