'use client'

import { useState, useEffect } from 'react'
import { getPipelineStageBadgeColor, getPipelineStageAccent } from '@/lib/formatting'
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



function timeAgoShort(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return minutes + 'm ago'
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return hours + 'h ago'
  const days = Math.floor(hours / 24)
  return days + 'd ago'
}

export default function RecentlyViewed() {
  const [recentJobs, setRecentJobs] = useState<RecentJob[]>([])

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('recentlyViewed') || '[]')
      setRecentJobs(stored.slice(0, 5))
    } catch { /* ignore */ }
  }, [])

  if (recentJobs.length === 0) return null

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-navy-600 flex items-center gap-2">
          <svg className="h-4 w-4 text-navy-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Recently Viewed
        </h2>
        <button
          onClick={() => {
            localStorage.removeItem('recentlyViewed')
            setRecentJobs([])
          }}
          className="text-xs text-navy-400 hover:text-navy-600 transition underline underline-offset-2"
        >
          Clear
        </button>
      </div>
      <div className="flex gap-2.5 overflow-x-auto pb-2 -mx-1 px-1">
        {recentJobs.map((job) => (
          <Link
            key={job.id}
            href={'/jobs/' + job.id}
            className={`flex-shrink-0 w-60 rounded-lg border border-t-[3px] bg-white p-3 hover:border-navy-200 hover:shadow-md transition-all group ${getPipelineStageAccent(job.stage)}`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className={'inline-block rounded-md border px-1.5 py-0.5 text-[10px] font-semibold ' + getPipelineStageBadgeColor(job.stage)}>
                {job.stage}
              </span>
              <span className="text-[10px] text-navy-400">{timeAgoShort(job.viewedAt)}</span>
            </div>
            <p className="text-sm font-semibold text-navy-900 group-hover:text-navy-700 truncate">{job.title}</p>
            <p className="text-xs text-navy-500 truncate mt-0.5">{job.company}</p>
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-[11px] text-navy-400 truncate">{job.location}</span>
              {job.salary && <span className="text-[11px] font-semibold text-emerald-600 ml-2 flex-shrink-0">{job.salary}</span>}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
