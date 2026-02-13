export default function JobCardSkeleton() {
  return (
    <div className="rounded-xl border border-navy-100 bg-white p-5 animate-pulse">
      <div className="mb-3">
        <div className="h-6 w-24 rounded-lg bg-navy-100" />
      </div>
      <div className="flex items-start gap-3 mb-3">
        <div className="h-10 w-10 rounded-lg bg-navy-100 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-5 w-3/4 rounded bg-navy-100" />
          <div className="h-4 w-1/3 rounded bg-navy-100" />
        </div>
      </div>
      <div className="flex gap-2 mb-3">
        <div className="h-4 w-32 rounded bg-navy-100" />
        <div className="h-4 w-16 rounded bg-navy-100" />
        <div className="h-4 w-20 rounded bg-navy-100" />
      </div>
      <div className="h-5 w-28 rounded bg-navy-100 mb-3" />
      <div className="flex gap-2 mb-3">
        <div className="h-6 w-20 rounded-lg bg-navy-100" />
        <div className="h-6 w-28 rounded-lg bg-navy-100" />
      </div>
      <div className="h-3 w-24 rounded bg-navy-100" />
    </div>
  )
}
