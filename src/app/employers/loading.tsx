export default function EmployersLoading() {
  return (
    <div className="min-h-screen bg-navy-50 animate-pulse">
      <div className="bg-gradient-to-b from-navy-950 to-navy-900 py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="h-10 w-96 max-w-full bg-navy-800 rounded mx-auto mb-4" />
          <div className="h-5 w-80 max-w-full bg-navy-800 rounded mx-auto mb-8" />
          <div className="h-12 w-36 bg-navy-800 rounded-lg mx-auto" />
        </div>
      </div>
      <div className="bg-white border-b border-navy-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-3 divide-x divide-navy-100">
            {[1, 2, 3].map(i => (
              <div key={i} className="py-8 text-center">
                <div className="h-8 w-16 bg-navy-100 rounded mx-auto mb-2" />
                <div className="h-4 w-24 bg-navy-100 rounded mx-auto" />
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="rounded-xl border border-navy-200 bg-white p-6 text-center">
              <div className="h-12 w-12 bg-navy-100 rounded-xl mx-auto mb-4" />
              <div className="h-5 w-32 bg-navy-100 rounded mx-auto mb-2" />
              <div className="h-3 w-full bg-navy-100 rounded mb-1" />
              <div className="h-3 w-3/4 bg-navy-100 rounded mx-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
