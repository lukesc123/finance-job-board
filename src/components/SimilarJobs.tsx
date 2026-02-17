'use client'

import { useState, useEffect, useCallback, memo } from 'react'
import Link from 'next/link'
import { Job } from '@/types'
import CompanyLogo from '@/components/CompanyLogo'
import { fetchRetry } from '@/lib/fetchRetry'
import { formatSalary, getPipelineStageBadgeColor, getPipelineStageAccent } from '@/lib/formatting'

export default memo(function SimilarJobs({ jobId }: { jobId: string }) {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const fetchSimilar = useCallback(async (signal?: AbortSignal) => {
    setLoading(true)
    setError(false)
    try {
      const res = await fetchRetry(`/api/similar-jobs?id=${jobId}`, { signal })
      if (!res.ok) throw new Error('Failed')
      const data: unknown = await res.json()
      if (Array.isArray(data)) setJobs(data as Job[])
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [jobId])

  useEffect(() => {
    const controller = new AbortController()
    fetchSimilar(controller.signal)
    return () => controller.abort()
  }, [fetchSimilar])

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-5 w-32 bg-navy-100 rounded animate-pulse" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse rounded-lg border border-l-4 border-navy-100 border-l-navy-200 bg-white p-4">
            <div className="flex gap-3">
              <div className="h-8 w-8 rounded-lg bg-navy-100 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-navy-100 rounded w-3/4" />
                <div className="h-3 bg-navy-100 rounded w-1/2" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <h2 className="text-lg font-bold text-navy-900 mb-4">Similar Jobs</h2>
        <div className="rounded-lg border border-navy-200 bg-navy-50/50 p-4 text-center">
          <p className="text-sm text-navy-500 mb-2">Couldn&apos;t load similar jobs.</p>
          <button
            onClick={() => fetchSimilar()}
            className="text-sm font-medium text-navy-600 hover:text-navy-900 transition underline underline-offset-2"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  if (jobs.length === 0) return null

  return (
    <div>
      <h2 className="text-lg font-bold text-navy-900 mb-4">Similar Jobs</h2>
      <div className="space-y-2.5">
        {jobs.map((job) => {
          const salary = formatSalary(job.salary_min, job.salary_max)
          return (
            <Link key={job.id} href={`/jobs/${job.id}`} prefetch={false} className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-400 focus-visible:ring-offset-2">
              <div className={`group rounded-lg border border-l-4 border-navy-100 bg-white p-3.5 transition hover:shadow-md hover:border-navy-200 hover:-translate-y-px ${getPipelineStageAccent(job.pipeline_stage)}`}>
                <div className="flex items-start gap-3">
                  <CompanyLogo logoUrl={job.company?.logo_url} name={job.company?.name || '?'} website={job.company?.website} size="sm" />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-navy-900 group-hover:text-navy-700 text-sm leading-snug truncate">
                      {job.title}
                    </h3>
                    <p className="text-xs text-navy-500 mt-0.5">{job.company?.name}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      <span className={`inline-block rounded-md border px-2 py-0.5 text-[10px] font-semibold ${getPipelineStageBadgeColor(job.pipeline_stage)}`}>
                        {job.pipeline_stage}
                      </span>
                      <span className="text-xs text-navy-400">{job.location}</span>
                      {salary && (
                        <span className="text-xs font-semibold text-emerald-600">{salary}</span>
                      )}
                    </div>
                    {job.licenses_required &&
                      job.licenses_required.length > 0 &&
                      !job.licenses_required.every((l: string) => l === 'None Required') && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {job.licenses_required
                            .filter((l: string) => l !== 'None Required')
                            .map((license: string) => (
                              <span
                                key={license}
                                className="inline-flex items-center rounded-md border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700"
                              >
                                {license}
                              </span>
                            ))}
                        </div>
                      )}
                  </div>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
})
