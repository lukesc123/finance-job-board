'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Job } from '@/types'
import { formatSalary, timeAgo } from '@/lib/formatting'

interface TrackedJob {
  job: Job
  appliedAt: number
  status: 'applied' | 'interviewing' | 'offered' | 'rejected' | 'withdrawn'
  notes: string
}

const STATUS_CONFIG = {
  applied: { label: 'Applied', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: '📨' },
  interviewing: { label: 'Interviewing', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: '💬' },
  offered: { label: 'Offered', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: '🎉' },
  rejected: { label: 'Rejected', color: 'bg-red-50 text-red-700 border-red-200', icon: '✗' },
  withdrawn: { label: 'Withdrawn', color: 'bg-navy-50 text-navy-600 border-navy-200', icon: '↩' },
}

export default function TrackerPage() {
  const [trackedJobs, setTrackedJobs] = useState<TrackedJob[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  const loadTrackedJobs = useCallback(async () => {
    try {
      const appliedIds: string[] = JSON.parse(localStorage.getItem('appliedJobs') || '[]')
      const trackerData: Record<string, { status: string; notes: string; appliedAt: number }> =
        JSON.parse(localStorage.getItem('jobTracker') || '{}')

      if (appliedIds.length === 0) {
        setTrackedJobs([])
        setLoading(false)
        return
      }

      // Fetch job data for applied jobs
      const params = new URLSearchParams()
      appliedIds.forEach(id => params.append('ids', id))
      const res = await fetch(`/api/jobs?${params.toString()}`)
      const allJobs: Job[] = await res.json()

      const tracked: TrackedJob[] = appliedIds
        .map(id => {
          const job = allJobs.find(j => j.id === id)
          if (!job) return null
          const data = trackerData[id] || {}
          return {
            job,
            appliedAt: data.appliedAt || Date.now(),
            status: (data.status as TrackedJob['status']) || 'applied',
            notes: data.notes || '',
          }
        })
        .filter(Boolean) as TrackedJob[]

      // Sort by most recently applied
      tracked.sort((a, b) => b.appliedAt - a.appliedAt)
      setTrackedJobs(tracked)
    } catch {
      setTrackedJobs([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTrackedJobs()
  }, [loadTrackedJobs])

  const updateStatus = (jobId: string, status: TrackedJob['status']) => {
    const trackerData = JSON.parse(localStorage.getItem('jobTracker') || '{}')
    trackerData[jobId] = { ...trackerData[jobId], status, appliedAt: trackerData[jobId]?.appliedAt || Date.now() }
    localStorage.setItem('jobTracker', JSON.stringify(trackerData))
    setTrackedJobs(prev => prev.map(t => t.job.id === jobId ? { ...t, status } : t))
  }

  const updateNotes = (jobId: string, notes: string) => {
    const trackerData = JSON.parse(localStorage.getItem('jobTracker') || '{}')
    trackerData[jobId] = { ...trackerData[jobId], notes }
    localStorage.setItem('jobTracker', JSON.stringify(trackerData))
    setTrackedJobs(prev => prev.map(t => t.job.id === jobId ? { ...t, notes } : t))
  }

  const removeJob = (jobId: string) => {
    // Remove from applied list
    const appliedJobs: string[] = JSON.parse(localStorage.getItem('appliedJobs') || '[]')
    localStorage.setItem('appliedJobs', JSON.stringify(appliedJobs.filter(id => id !== jobId)))
    window.dispatchEvent(new Event('appliedJobsChanged'))
    // Remove tracker data
    const trackerData = JSON.parse(localStorage.getItem('jobTracker') || '{}')
    delete trackerData[jobId]
    localStorage.setItem('jobTracker', JSON.stringify(trackerData))
    // Update state
    setTrackedJobs(prev => prev.filter(t => t.job.id !== jobId))
  }

  const filteredJobs = filter === 'all' ? trackedJobs : trackedJobs.filter(t => t.status === filter)

  const statusCounts = trackedJobs.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="min-h-screen bg-navy-50">
      <div className="bg-gradient-to-b from-navy-950 to-navy-900 text-white py-10 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <Link href="/" className="text-navy-400 hover:text-white transition" aria-label="Back to home">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold">Application Tracker</h1>
          </div>
          <p className="text-navy-300 text-sm">Track the status of jobs you've applied to. All data stored locally in your browser.</p>

          {trackedJobs.length > 0 && (
            <div className="flex gap-3 mt-5 flex-wrap">
              <button
                onClick={() => setFilter('all')}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  filter === 'all' ? 'bg-white text-navy-900' : 'bg-navy-800/60 text-navy-300 hover:bg-navy-700'
                }`}
              >
                All ({trackedJobs.length})
              </button>
              {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                statusCounts[key] ? (
                  <button
                    key={key}
                    onClick={() => setFilter(filter === key ? 'all' : key)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                      filter === key ? 'bg-white text-navy-900' : 'bg-navy-800/60 text-navy-300 hover:bg-navy-700'
                    }`}
                  >
                    {config.label} ({statusCounts[key]})
                  </button>
                ) : null
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse bg-white rounded-xl border border-navy-200 p-5">
                <div className="h-5 w-3/4 bg-navy-100 rounded mb-2" />
                <div className="h-4 w-1/2 bg-navy-100 rounded" />
              </div>
            ))}
          </div>
        ) : trackedJobs.length === 0 ? (
          <div className="rounded-xl border border-navy-200 bg-white px-6 py-16 text-center">
            <svg className="mx-auto h-10 w-10 text-navy-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <p className="text-navy-700 font-semibold mb-1">No applications tracked yet</p>
            <p className="text-sm text-navy-500 mb-4">Mark jobs as "Applied" to start tracking them here.</p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-lg bg-navy-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-navy-800 transition"
            >
              Browse Jobs
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredJobs.map(({ job, status, notes }) => {
              const salary = formatSalary(job.salary_min, job.salary_max)
              const config = STATUS_CONFIG[status]
              return (
                <div key={job.id} className="bg-white rounded-xl border border-navy-200 p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <Link href={`/jobs/${job.id}`} className="text-base font-semibold text-navy-900 hover:text-navy-700 transition">
                        {job.title}
                      </Link>
                      <p className="text-sm text-navy-500 mt-0.5">
                        {job.company?.name} &middot; {job.location}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${config.color}`}>
                          {config.label}
                        </span>
                        {salary && <span className="text-xs font-semibold text-emerald-600">{salary}</span>}
                        <span className="text-xs text-navy-400">Posted {timeAgo(job.posted_date)}</span>
                      </div>
                    </div>

                    {/* Status selector + actions */}
                    <div className="flex items-center gap-2">
                      <select
                        value={status}
                        onChange={(e) => updateStatus(job.id, e.target.value as TrackedJob['status'])}
                        aria-label={`Application status for ${job.title}`}
                        className="rounded-lg border border-navy-200 bg-white px-2 py-1.5 text-xs font-medium text-navy-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-navy-500/20"
                      >
                        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                          <option key={key} value={key}>{cfg.label}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => removeJob(job.id)}
                        className="p-1.5 rounded-lg text-navy-300 hover:text-red-500 hover:bg-red-50 transition"
                        aria-label={`Remove ${job.title} from tracker`}
                        title="Remove from tracker"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="mt-3">
                    <textarea
                      value={notes}
                      onChange={(e) => updateNotes(job.id, e.target.value)}
                      aria-label={`Notes for ${job.title}`}
                      placeholder="Add notes (interview date, contact info, follow-up reminders...)"
                      className="w-full rounded-lg border border-navy-200 bg-navy-50/50 px-3 py-2 text-sm text-navy-700 placeholder-navy-400 resize-none focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-400 transition"
                      rows={2}
                    />
                  </div>

                  {/* Quick actions */}
                  {job.apply_url && (
                    <div className="mt-2 flex items-center gap-3">
                      <a
                        href={job.apply_url.startsWith('http') ? job.apply_url : `https://${job.apply_url}`}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700 transition"
                      >
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        Visit application page
                      </a>
                      {job.company?.careers_url && (
                        <a
                          href={job.company.careers_url}
                          target="_blank"
                          rel="noopener noreferrer nofollow"
                          className="inline-flex items-center gap-1 text-xs font-medium text-navy-400 hover:text-navy-600 transition"
                        >
                          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          {job.company.name} careers
                        </a>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
