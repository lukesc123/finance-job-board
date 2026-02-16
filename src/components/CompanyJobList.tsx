'use client'

import { useState, useMemo, memo } from 'react'
import Link from 'next/link'
import { stageColors, timeAgo, formatSalary, isGenericApplyUrl } from '@/lib/formatting'
import { trackApplyClick } from '@/hooks/useJobActions'

interface CompanyJob {
  id: string
  title: string
  category: string
  location: string
  remote_type: string
  salary_min: number | null
  salary_max: number | null
  job_type: string
  pipeline_stage: string
  licenses_required: string[]
  posted_date: string
  apply_url: string | null
}

export default memo(function CompanyJobList({
  jobs,
  companyName,
}: {
  jobs: CompanyJob[]
  companyName: string
}) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  const categories = useMemo(() => [...new Set(jobs.map((j) => j.category))].sort(), [jobs])

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const j of jobs) counts.set(j.category, (counts.get(j.category) || 0) + 1)
    return counts
  }, [jobs])

  const filtered = activeCategory
    ? jobs.filter((j) => j.category === activeCategory)
    : jobs

  return (
    <>
      <h2 className="text-lg font-bold text-navy-900 mb-4">
        Open Positions at {companyName}
        {activeCategory && (
          <span className="text-navy-400 font-normal text-sm ml-2">
            in {activeCategory}
          </span>
        )}
      </h2>

      {categories.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-5">
          <button
            onClick={() => setActiveCategory(null)}
            aria-pressed={activeCategory === null}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
              activeCategory === null
                ? 'bg-navy-900 border-navy-900 text-white'
                : 'bg-white border-navy-200 text-navy-600 hover:bg-navy-50 hover:border-navy-300'
            }`}
          >
            All ({jobs.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() =>
                setActiveCategory(activeCategory === cat ? null : cat)
              }
              aria-pressed={activeCategory === cat}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                activeCategory === cat
                  ? 'bg-navy-900 border-navy-900 text-white'
                  : 'bg-white border-navy-200 text-navy-600 hover:bg-navy-50 hover:border-navy-300'
              }`}
            >
              {cat} ({categoryCounts.get(cat) || 0})
            </button>
          ))}
        </div>
      )}

      <div className="space-y-3">
        {filtered.map((job) => {
          const salary = formatSalary(job.salary_min, job.salary_max)
          return (
            <Link
              key={job.id}
              href={`/jobs/${job.id}`}
              className="block rounded-xl border border-navy-200 bg-white p-4 sm:p-5 hover:shadow-md hover:border-navy-300 transition group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-bold text-navy-900 group-hover:text-navy-700 transition truncate text-sm sm:text-base">
                    {job.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-navy-500">
                    <span className="inline-flex items-center gap-1">
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      {job.location}
                    </span>
                    <span>{job.remote_type}</span>
                    <span>{job.job_type}</span>
                    <span className="text-navy-400">{timeAgo(job.posted_date)}</span>
                  </div>
                </div>
                {salary && (
                  <span className="text-sm font-bold text-emerald-600 whitespace-nowrap flex-shrink-0">
                    {salary}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${stageColors[job.pipeline_stage] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                  {job.pipeline_stage}
                </span>
                <span className="rounded-full bg-navy-50 px-2 py-0.5 text-[10px] font-medium text-navy-600">
                  {job.category}
                </span>
                {job.licenses_required?.filter((l: string) => l !== 'None Required').map((lic: string) => (
                  <span key={lic} className="rounded-full bg-orange-50 border border-orange-200 px-2 py-0.5 text-[10px] font-medium text-orange-700">
                    {lic}
                  </span>
                ))}
                {job.apply_url && (() => {
                  const url = job.apply_url!.startsWith('http') ? job.apply_url! : `https://${job.apply_url}`
                  const generic = isGenericApplyUrl(url)
                  return (
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      aria-label={`${generic ? 'Careers' : 'Apply'} at ${companyName} (opens in new tab)`}
                      onClick={(e) => {
                        e.stopPropagation()
                        trackApplyClick({ id: job.id, title: job.title, company: { name: companyName }, apply_url: job.apply_url })
                      }}
                      className="ml-auto inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2.5 py-1 text-[10px] font-semibold text-white hover:bg-emerald-700 transition"
                    >
                      {generic ? `Careers at ${companyName}` : `Apply at ${companyName}`}
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  )
                })()}
              </div>
            </Link>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-navy-400">
          <p className="text-lg font-semibold mb-2">No positions in this category</p>
          <button
            onClick={() => setActiveCategory(null)}
            className="text-sm text-navy-600 hover:text-navy-800 underline transition"
          >
            View all positions
          </button>
        </div>
      )}
    </>
  )
})
