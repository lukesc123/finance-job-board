export default function Loading() {
  return (
    <div className="min-h-screen bg-navy-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy-900 text-white font-extrabold text-sm animate-pulse">
          F
        </div>
        <div className="h-1 w-24 rounded-full bg-navy-200 overflow-hidden">
          <div className="h-full w-1/2 rounded-full bg-navy-600 animate-[loading_1s_ease-in-out_infinite]" />
        </div>
      </div>
    </div>
  )
}
