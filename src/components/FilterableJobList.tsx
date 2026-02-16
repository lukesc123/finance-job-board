'use client'

import { useState, useMemo, memo } from 'react'
import Link from 'next/link'
import { stageColors, timeAgo, formatSalary, isGenericApplyUrl } from '@/lib/formatting'
import { trackApplyClick } from '@/hooks/useJobActions'
import { CATEGORY_COLORS } from '@/lib/constants'
import CompanyLogo from '@/components/CompanyLogo'

interface FilterableJob {
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
  company: { name: string; logo_url: string | null; website?: string | null } | null
}


interface FilterableJobListProps {
  jobs: FilterableJob[]
  filterBy: 'category' | 'stage' | 'company'
  emptyLabel?: string
}

export default memo(function FilterableJobList({
  jobs,
  filterBy,
  emptyLabel = 'No positions found',
}: FilterableJobListProps) {
  const [activeFilter, setActiveFilter] = useState<string | null>(null)

  const filterValues = useMemo(() => [...new Set(
    jobs.map((j) => {
      if (filterBy === 'category') return j.category
      if (filterBy === 'stage') return j.pipeline_stage
      if (filterBy === 'company') return j.company?.name || ''
      return ''
    }).filter(Boolean)
  )].sort(), [jobs, filterBy])

  const filtered = activeFilter
    ? jobs.filter((j) => {
        if (filterBy === 'category') return j.category === activeFilter
        if (filterBy === 'stage') return j.pipeline_stage === activeFilter
        if (filterBy === 'company') return j.company?.name === activeFilter
        return true
      })
    : jobs

  function getFilterColor(value: string): string {
    if (filterBy === 'category') return CATEGORY_COLORS[value] || 'bg-gray-50 text-gray-600 border-gray-200'
    if (filterBy === 'stage') return stageColors[value] || 'bg-gray-50 text-gray-600 border-gray-200'
    return 'bg-white text-navy-600 border-navy-200'
  }

  return (
    <>
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {filtered.length} {filtered.length === 1 ? 'job' : 'jobs'} shown{activeFilter ? ` for ${activeFilter}` : ''}
      </div>
      {filterValues.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-5">
          <button
            onClick={() => setActiveFilter(null)}
            aria-pressed={activeFilter === null}
            className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
              activeFilter === null
                ? 'bg-navy-900 border-navy-900 text-white'
                : 'bg-white border-navy-200 text-navy-600 hover:bg-navy-50 hover:border-navy-300'
            }`}
          >
            All ({jobs.length})
          </button>
          {filterValues.map((val) => {
            const isActive = activeFilter === val
            const count = jobs.filter((j) => {
              if (filterBy === 'category') return j.category === val
              if (filterBy === 'stage') return j.pipeline_stage === val
              if (filterBy === 'company') return j.company?.name === val
              return false
            }).length
            return (
              <button
                key={val}
                onClick={() => setActiveFilter(isActive ? null : val)}
                aria-pressed={isActive}
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                  isActive
                    ? 'bg-navy-900 border-navy-900 text-white'
                    : getFilterColor(val)
                } hover:shadow-sm`}
              >
                {val} ({count})
              </button>
            )
          })}
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
                <div className="flex gap-3 min-w-0">
                  <CompanyLogo logoUrl={job.company?.logo_url} name={job.company?.name || '?'} website={job.company?.website} className="mt-0.5" />
                  <div className="min-w-0">
                    <h3 className="font-bold text-navy-900 group-hover:text-navy-700 transition truncate text-sm sm:text-base">
                      {job.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5 text-xs text-navy-500">
                      <span className="font-medium">{job.company?.name}</span>
                      <span className="text-navy-200">|</span>
                      <span className="inline-flex items-center gap-1">
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        {job.location}
                      </span>
                      <span className="text-navy-200">|</span>
                      <span>{job.remote_type}</span>
                      <span className="text-navy-200">|</span>
                      <span>{job.job_type}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  {salary && (
                    <span className="text-sm font-bold text-emerald-600 whitespace-nowrap">{salary}</span>
                  )}
                  <span className="text-[11px] text-navy-400">{timeAgo(job.posted_date)}</span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${stageColors[job.pipeline_stage] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                  {job.pipeline_stage}
                </span>
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${CATEGORY_COLORS[job.category] || 'bg-navy-50 text-navy-600 border-navy-200'}`}>
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
                      aria-label={`${generic ? 'Careers' : 'Apply'} at ${job.company?.name || 'Company'} (opens in new tab)`}
                      onClick={(e) => {
                        e.stopPropagation()
                        trackApplyClick({ id: job.id, title: job.title, company: job.company, apply_url: job.apply_url })
                      }}
                      className="ml-auto inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2.5 py-1 text-[10px] font-semibold text-white hover:bg-emerald-700 transition"
                    >
                      {generic ? `Careers at ${job.company?.name || 'Company'}` : `Apply at ${job.company?.name || 'Company'}`}
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
          <p className="text-lg font-semibold mb-2">{emptyLabel}</p>
          {activeFilter && (
            <button
              onClick={() => setActiveFilter(null)}
              className="text-sm text-navy-600 hover:text-navy-800 underline transition"
            >
              View all positions
            </button>
          )}
        </div>
      )}
    </>
  )
})
