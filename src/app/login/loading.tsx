export default function LoginLoading() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6 animate-pulse">
        <div className="text-center space-y-3">
          <div className="h-6 w-48 bg-navy-100 rounded mx-auto" />
          <div className="h-8 w-64 bg-navy-100 rounded mx-auto" />
          <div className="h-4 w-56 bg-navy-50 rounded mx-auto" />
        </div>
        <div className="h-11 bg-navy-100 rounded-lg" />
        <div className="h-px bg-navy-100" />
        <div className="space-y-3">
          <div className="h-4 w-24 bg-navy-100 rounded" />
          <div className="h-11 bg-navy-100 rounded-lg" />
          <div className="h-11 bg-navy-200 rounded-lg" />
        </div>
      </div>
    </div>
  )
}
