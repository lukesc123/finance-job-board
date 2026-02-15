'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Job } from '@/types'
import { formatSalary, isGenericApplyUrl } from '@/lib/formatting'

export default function ComparePage() {
  const [compareIds, setCompareIds] = useState<string[]>([])
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const ids = JSON.parse(localStorage.getItem('compareJobs') || '[]')
      setCompareIds(ids)
    } catch { /* ignore */ }

    const handleChange = () => {
      try {
        const ids = JSON.parse(localStorage.getItem('compareJobs') || '[]')
        setCompareIds(ids)
      } catch { /* ignore */ }
    }
    window.addEventListener('compareJobsChanged', handleChange)
    return () => window.removeEventListener('compareJobsChanged', handleChange)
  }, [])

  useEffect(() => {
    async function fetchJobs() {
      if (compareIds.length === 0) {
        setJobs([])
        setLoading(false)
        return
      }
      setLoading(true)
      try {
        const params = new URLSearchParams()
        compareIds.forEach(id => params.append('ids', id))
        const response = await fetch(`/api/jobs?${params.toString()}`)
        if (!response.ok) throw new Error('Failed')
        const fetchedJobs: Job[] = await response.json()
        // Maintain the order from compareIds
        const matched = compareIds.map(id => fetchedJobs.find(j => j.id === id)).filter(Boolean) as Job[]
        setJobs(matched)
      } catch { setJobs([]) }
      setLoading(false)
    }
    fetchJobs()
  }, [compareIds])

  const removeJob = (id: string) => {
    const updated = compareIds.filter(i => i !== id)
    localStorage.setItem('compareJobs', JSON.stringify(updated))
    window.dispatchEvent(new Event('compareJobsChanged'))
  }

  const clearAll = () => {
    localStorage.setItem('compareJobs', JSON.stringify([]))
    window.dispatchEvent(new Event('compareJobsChanged'))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-navy-50 flex items-center justify-center">
        <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-navy-300 border-t-navy-600" />
      </div>
    )
  }

  if (jobs.length === 0) {
    return (
      <div className="min-h-screen bg-navy-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-24 text-center">
          <div className="rounded-xl bg-white border border-navy-200 p-10 shadow-sm">
            <svg className="h-12 w-12 text-navy-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
            </svg>
            <h1 className="text-xl font-bold text-navy-900 mb-2">No jobs to compare</h1>
            <p className="text-sm text-navy-600 mb-6">
              Add jobs to compare by clicking the compare icon on any job card.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-lg bg-navy-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-navy-800 transition"
            >
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
        <Link key={j.id} href={`/companies/${(j.company?.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`} className="font-semibold text-navy-700 hover:text-navy-900 transition underline decoration-navy-200">
          {j.company?.name || 'N/A'}
        </Link>
      )),
    },
    {
      label: 'Location',
      values: jobs.map(j => (
        <Link key={j.id} href={`/location/${j.location.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`} className="text-navy-700 hover:text-navy-900 transition underline decoration-navy-200">
          {j.location}
        </Link>
      )),
    },
    { label: 'Work Style', values: jobs.map(j => j.remote_type) },
    { label: 'Job Type', values: jobs.map(j => j.job_type) },
    { label: 'Stage', values: jobs.map(j => j.pipeline_stage) },
    {
      label: 'Category',
      values: jobs.map(j => (
        <Link key={j.id} href={`/category/${j.category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`} className="text-navy-700 hover:text-navy-900 transition underline decoration-navy-200">
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

        <div className="rounded-xl border border-navy-200 bg-white overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              {/* Header with job titles */}
              <thead>
                <tr className="border-b border-navy-200 bg-navy-50/50">
                  <th className="p-4 text-left text-xs font-semibold text-navy-400 uppercase tracking-wider w-32">Field</th>
                  {jobs.map(job => (
                    <th key={job.id} className="p-4 text-left">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <Link href={`/jobs/${job.id}`} className="font-bold text-navy-900 hover:text-navy-700 transition text-sm block truncate">
                            {job.title}
                          </Link>
                          <p className="text-xs text-navy-500 mt-0.5">{job.company?.name}</p>
                        </div>
                        <button
                          onClick={() => removeJob(job.id)}
                          className="flex-shrink-0 p-1 rounded hover:bg-navy-100 text-navy-400 hover:text-navy-600 transition"
                          aria-label="Remove from comparison"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={row.label} className={`border-b border-navy-100 ${i % 2 === 0 ? '' : 'bg-navy-50/30'}`}>
                    <td className="p-4 text-xs font-semibold text-navy-500 uppercase tracking-wider">{row.label}</td>
                    {row.values.map((val, j) => (
                      <td key={j} className="p-4 text-sm text-navy-700">{val}</td>
                    ))}
                  </tr>
                ))}
                {/* Apply row */}
                <tr className="bg-navy-50/50">
                  <td className="p-4 text-xs font-semibold text-navy-500 uppercase tracking-wider">Apply</td>
                  {jobs.map(job => (
                    <td key={job.id} className="p-4">
                      {job.apply_url ? (() => {
                        const url = job.apply_url!.startsWith('http') ? job.apply_url! : 'https://' + job.apply_url
                        const generic = isGenericApplyUrl(url)
                        return (
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition"
                          >
                            {generic ? `Careers at ${job.company?.name}` : `Apply at ${job.company?.name}`}
                            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        )
                      })() : (
                        <span className="text-xs text-navy-400">No link available</span>
                      )}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
