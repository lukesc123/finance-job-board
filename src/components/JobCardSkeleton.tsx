'use client'

import { memo } from 'react'

export default memo(function JobCardSkeleton() {
  return (
    <div className="rounded-xl border border-l-4 border-navy-100 border-l-navy-200 bg-white p-4 sm:p-5 animate-pulse" role="status" aria-label="Loading job listing">
      <div className="flex gap-3.5">
        <div className="h-11 w-11 rounded-lg bg-navy-100 flex-shrink-0" />
        <div className="flex-1 space-y-3">
          <div>
            <div className="h-4 bg-navy-100 rounded w-3/4" />
            <div className="h-3 bg-navy-100 rounded w-1/3 mt-2" />
          </div>
          <div className="flex gap-3">
            <div className="h-3 bg-navy-100 rounded w-24" />
            <div className="h-3 bg-navy-100 rounded w-16" />
            <div className="h-3 bg-navy-100 rounded w-16" />
          </div>
          <div className="flex gap-2">
            <div className="h-5 bg-navy-100 rounded-md w-24" />
            <div className="flex-1" />
            <div className="h-4 bg-navy-100 rounded w-20" />
          </div>
        </div>
      </div>
    </div>
  )
})
