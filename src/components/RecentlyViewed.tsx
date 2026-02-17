'use client'

import { useState, useEffect, memo } from 'react'
import { getPipelineStageBadgeColor, getPipelineStageAccent, timeAgoFromTimestamp } from '@/lib/formatting'
import { STORAGE_KEYS } from '@/lib/constants'
import Link from 'next/link'

interface RecentJob {
  id: string
  title: string
  company: string
  location: string
  salary: string
  stage: string
  viewedAt: number
}



export default memo(function RecentlyViewed() {
  const [recentJobs, setRecentJobs] = useState<RecentJob[]>([])

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.RECENTLY_VIEWED) || '[]')
      setRecentJobs(stored.slice(0, 5))
    } catch { /* ignore */ }
  }, [])

  if (recentJobs.length === 0) return null

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-navy-600 flex items-center gap-2">
          <svg className="h-4 w-4 text-navy-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Recently Viewed
        </h2>
        <button
          onClick={() => {
            try { localStorage.removeItem(STORAGE_KEYS.RECENTLY_VIEWED) } catch { /* ignore */ }
            setRecentJobs([])
          }}
          className="text-xs text-navy-400 hover:text-navy-600 transition underline underline-offset-2"
          aria-label="Clear recently viewed jobs"
        >
          Clear
        </button>
      </div>
      <div className="relative">
        <div className="flex gap-2.5 overflow-x-auto pb-2 -mx-1 px-1 scroll-smooth snap-x" role="region" aria-label="Recently viewed jobs">
          {recentJobs.map((job) => (
            <Link
              key={job.id}
              href={'/jobs/' + job.id}
              prefetch={false}
              className={`flex-shrink-0 w-60 snap-start rounded-lg border border-t-[3px] bg-white p-3 hover:border-navy-200 hover:shadow-md transition-all group ${getPipelineStageAccent(job.stage)}`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className={'inline-block rounded-md border px-1.5 py-0.5 text-[10px] font-semibold ' + getPipelineStageBadgeColor(job.stage)}>
                  {job.stage}
                </span>
                <span className="text-[10px] text-navy-400">{timeAgoFromTimestamp(job.viewedAt)}</span>
              </div>
              <p className="text-sm font-semibold text-navy-900 group-hover:text-navy-700 truncate">{job.title}</p>
              <p className="text-xs text-navy-500 truncate mt-0.5">{job.company}</p>
              <p className="text-[11px] text-navy-400 truncate mt-1.5">{job.location}</p>
              {job.salary && <p className="text-[11px] font-semibold text-emerald-600 truncate mt-0.5">{job.salary}</p>}
            </Link>
          ))}
        </div>
        {recentJobs.length > 3 && (
          <div className="absolute right-0 top-0 bottom-2 w-10 sm:w-12 bg-gradient-to-l from-navy-50 to-transparent pointer-events-none" aria-hidden="true" />
        )}
      </div>
    </div>
  )
})
