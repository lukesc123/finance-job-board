'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Job } from '@/types'
import { formatSalary, isGenericApplyUrl, slugify, extractHostname, timeAgo, safeUrl } from '@/lib/formatting'
import { useCompareIds } from '@/hooks/useJobActions'
import { fetchRetry } from '@/lib/fetchRetry'
import ConfirmDialog from '@/components/ConfirmDialog'

export default function ComparePage() {
  const { ids: compareIds, remove: removeJob, clearAll: clearCompare } = useCompareIds()
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    async function fetchJobs() {
      if (compareIds.length === 0) {
        setJobs([])
        setLoading(false)
        return
      }
      setLoading(true)
      setError(false)
      try {
        const params = new URLSearchParams()
        compareIds.forEach(id => params.append('ids', id))
        const response = await fetchRetry(`/api/jobs?${params.toString()}`, { signal: controller.signal })
        if (!response.ok) throw new Error('Failed')
        const fetchedJobs: Job[] = await response.json()
        const matched = compareIds.map(id => fetchedJobs.find(j => j.id === id)).filter(Boolean) as Job[]
        setJobs(matched)
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return
        setJobs([])
        setError(true)
      }
      setLoading(false)
    }
    fetchJobs()
    return () => controller.abort()
  }, [compareIds])

  const clearAll = () => {
    setShowClearConfirm(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-navy-50 flex items-center justify-center">
        <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-navy-300 border-t-navy-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-navy-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-24 text-center">
          <div className="rounded-xl bg-white border border-red-200 p-10 shadow-sm">
            <p className="text-sm text-red-600 mb-4">Failed to load comparison data.</p>
            <button onClick={() => window.location.reload()} className="inline-flex items-center gap-2 rounded-lg bg-navy-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-navy-800 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-400 focus-visible:ring-offset-2">
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (jobs.length === 0) {
    return (
      <div className="min-h-screen bg-navy-50">
        <div className="max-w-lg mx-auto px-4 sm:px-6 py-24 text-center">
          <div className="rounded-xl bg-white border border-navy-200 p-8 sm:p-10 shadow-sm">
            <div className="flex items-center justify-center gap-3 mb-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className={`rounded-lg border-2 border-dashed ${i === 2 ? 'border-navy-300' : 'border-navy-200'} w-20 h-24 flex flex-col items-center justify-center gap-1`}>
                  <div className={`w-8 h-1.5 rounded-full ${i === 2 ? 'bg-navy-200' : 'bg-navy-100'}`} />
                  <div className={`w-12 h-1 rounded-full ${i === 2 ? 'bg-navy-200' : 'bg-navy-100'}`} />
                  <div className={`w-6 h-1 rounded-full ${i === 2 ? 'bg-navy-200' : 'bg-navy-100'}`} />
                  {i === 2 && (
                    <svg className="h-4 w-4 text-navy-300 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  )}
                </div>
              ))}
            </div>
            <h1 className="text-xl font-bold text-navy-900 mb-2">Compare jobs side by side</h1>
            <p className="text-sm text-navy-500 mb-2">
              Add up to 4 jobs to compare salaries, locations, requirements, and more.
            </p>
            <div className="flex items-center justify-center gap-2 mb-6">
              <span className="text-xs text-navy-400">Look for the</span>
              <span className="inline-flex items-center gap-1 rounded-md border border-navy-200 bg-navy-50 px-2 py-1 text-xs text-navy-600">
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7" />
                </svg>
                compare
              </span>
              <span className="text-xs text-navy-400">icon on job cards</span>
            </div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-lg bg-navy-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-navy-800 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-400 focus-visible:ring-offset-2"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Browse Jobs
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const rows: { label: string; values: (string | React.ReactNode)[] }[] = [
    {
      label: 'Company',
      values: jobs.map(j => (
        <Link key={j.id} href={`/companies/${slugify(j.company?.name || '')}`} className="font-semibold text-navy-700 hover:text-navy-900 transition underline decoration-navy-200">
          {j.company?.name || 'N/A'}
        </Link>
      )),
    },
    {
      label: 'Location',
      values: jobs.map(j => (
        <Link key={j.id} href={`/location/${slugify(j.location)}`} className="text-navy-700 hover:text-navy-900 transition underline decoration-navy-200">
          {j.location}
        </Link>
      )),
    },
    { label: 'Posted', values: jobs.map(j => timeAgo(j.posted_date)) },
    { label: 'Work Style', values: jobs.map(j => j.remote_type) },
    { label: 'Job Type', values: jobs.map(j => j.job_type) },
    { label: 'Stage', values: jobs.map(j => j.pipeline_stage) },
    {
      label: 'Category',
      values: jobs.map(j => (
        <Link key={j.id} href={`/category/${slugify(j.category)}`} className="text-navy-700 hover:text-navy-900 transition underline decoration-navy-200">
          {j.category}
        </Link>
      )),
    },
    {
      label: 'Salary',
      values: jobs.map(j => {
        const sal = formatSalary(j.salary_min, j.salary_max)
        return sal ? <span className="font-semibold text-emerald-700">{sal}</span> : <span className="text-navy-400">Not listed</span>
      }),
    },
    {
      label: 'Licenses',
      values: jobs.map(j => {
        if (!j.licenses_required || j.licenses_required.length === 0 || j.licenses_required.every(l => l === 'None Required')) {
          return 'None'
        }
        return j.licenses_required.filter(l => l !== 'None Required').join(', ')
      }),
    },
    {
      label: 'Experience',
      values: jobs.map(j => {
        if (j.years_experience_max === null || j.years_experience_max === undefined) return 'Not specified'
        if (j.years_experience_max === 0) return 'No experience required'
        return `Up to ${j.years_experience_max} year${j.years_experience_max > 1 ? 's' : ''}`
      }),
    },
    {
      label: 'Description',
      values: jobs.map(j => {
        const desc = (j.description || '').replace(/#{1,6}\s/g, '').replace(/[*_\[\]<>]/g, '').replace(/\s+/g, ' ').trim()
        if (!desc) return <span className="text-navy-400">No description</span>
        return <span className="line-clamp-4 text-xs leading-relaxed">{desc.substring(0, 200)}{desc.length > 200 ? '...' : ''}</span>
      }),
    },
  ]

  return (
    <div className="min-h-screen bg-navy-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-navy-900">Compare Jobs</h1>
            <p className="text-sm text-navy-500 mt-1">Comparing {jobs.length} {jobs.length === 1 ? 'position' : 'positions'}</p>
          </div>
          <button
            onClick={clearAll}
            className="text-sm font-medium text-navy-500 hover:text-navy-700 transition"
          >
            Clear All
          </button>
        </div>

        {/* Card-based comparison */}
        <div className={`grid gap-4 ${jobs.length === 2 ? 'sm:grid-cols-2' : jobs.length >= 3 ? 'sm:grid-cols-2 lg:grid-cols-3' : ''}`}>
          {jobs.map((job, idx) => {
            const url = job.apply_url ? safeUrl(job.apply_url) : null
            const generic = url ? isGenericApplyUrl(url) : false
            return (
              <div key={job.id} className="rounded-xl border border-navy-200 bg-white shadow-sm overflow-hidden flex flex-col">
                {/* Card header */}
                <div className="p-4 sm:p-5 border-b border-navy-100 bg-navy-50/30">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <Link href={`/jobs/${job.id}`} className="font-bold text-navy-900 hover:text-navy-700 transition text-sm leading-snug block">
                        {job.title}
                      </Link>
                      <Link href={`/companies/${slugify(job.company?.name || '')}`} className="text-xs text-navy-500 hover:text-navy-700 transition mt-0.5 block">
                        {job.company?.name}
                      </Link>
                      {(!job.is_active || job.removal_detected_at) && (
                        <span className="inline-block mt-1.5 text-[10px] font-semibold text-red-600 bg-red-50 border border-red-200 rounded px-1.5 py-0.5">
                          No longer available
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => removeJob(job.id)}
                      className="flex-shrink-0 p-2 rounded-lg hover:bg-navy-100 text-navy-400 hover:text-navy-600 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-400"
                      aria-label={`Remove ${job.title} from comparison`}
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Card body - attribute rows */}
                <div className="flex-1 divide-y divide-navy-50">
                  {rows.map((row) => (
                    <div key={row.label} className="px-4 sm:px-5 py-2.5 flex items-start gap-3">
                      <span className="text-[10px] font-semibold text-navy-400 uppercase tracking-wider w-20 flex-shrink-0 pt-0.5">{row.label}</span>
                      <span className="text-sm text-navy-700 min-w-0 flex-1">{row.values[idx]}</span>
                    </div>
                  ))}
                </div>

                {/* Card footer - apply button */}
                <div className="p-4 sm:p-5 border-t border-navy-100 bg-navy-50/30 mt-auto">
                  {url ? (
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      aria-label={`${generic ? 'Careers' : 'Apply'} at ${job.company?.name} (opens in new tab)`}
                      className="flex items-center justify-center gap-1.5 w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2"
                    >
                      {generic ? `Careers at ${job.company?.name}` : `Apply at ${job.company?.name}`}
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  ) : (
                    <span className="block text-center text-xs text-navy-400 py-2">No link available</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <ConfirmDialog
        open={showClearConfirm}
        title="Clear comparison"
        message="Remove all jobs from comparison? This cannot be undone."
        confirmLabel="Clear all"
        destructive
        onConfirm={() => {
          clearCompare()
          setShowClearConfirm(false)
        }}
        onCancel={() => setShowClearConfirm(false)}
      />
    </div>
  )
}
