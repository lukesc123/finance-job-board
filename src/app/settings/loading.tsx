export default function SettingsLoading() {
  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-8 animate-pulse">
      <div className="h-8 w-32 bg-navy-100 rounded mb-6" />
      <div className="space-y-6">
        <div className="rounded-xl border border-navy-200 bg-white p-6 space-y-4">
          <div className="h-5 w-40 bg-navy-100 rounded" />
          <div className="space-y-3">
            <div className="h-4 w-full bg-navy-50 rounded" />
            <div className="h-10 w-full bg-navy-100 rounded-lg" />
          </div>
          <div className="space-y-3">
            <div className="h-4 w-48 bg-navy-50 rounded" />
            <div className="flex gap-3">
              <div className="h-10 w-24 bg-navy-100 rounded-lg" />
              <div className="h-10 w-24 bg-navy-100 rounded-lg" />
              <div className="h-10 w-24 bg-navy-100 rounded-lg" />
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-navy-200 bg-white p-6 space-y-4">
          <div className="h-5 w-36 bg-navy-100 rounded" />
          <div className="flex flex-wrap gap-2">
            <div className="h-8 w-28 bg-navy-100 rounded-full" />
            <div className="h-8 w-32 bg-navy-100 rounded-full" />
            <div className="h-8 w-24 bg-navy-100 rounded-full" />
            <div className="h-8 w-36 bg-navy-100 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  )
}
