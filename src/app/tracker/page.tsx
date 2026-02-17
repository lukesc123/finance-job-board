'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { Job } from '@/types'
import { formatSalary, timeAgo, safeUrl } from '@/lib/formatting'
import { STORAGE_KEYS, STORAGE_EVENTS } from '@/lib/constants'
import { fetchRetry } from '@/lib/fetchRetry'
import { useAuth } from '@/hooks/useAuth'
import ConfirmDialog from '@/components/ConfirmDialog'
import { useToast } from '@/components/Toast'

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
  const { user, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const [trackedJobs, setTrackedJobs] = useState<TrackedJob[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'company' | 'status'>('newest')
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null)
  const migrationAttempted = useRef(false)

  // Migrate localStorage data to Supabase on first authenticated load
  const migrateLocalStorage = useCallback(async () => {
    if (migrationAttempted.current) return
    migrationAttempted.current = true
    try {
      const appliedIds: string[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.APPLIED) || '[]')
      const trackerData: Record<string, { status?: string; notes?: string; appliedAt?: number }> =
        JSON.parse(localStorage.getItem(STORAGE_KEYS.TRACKER) || '{}')

      if (appliedIds.length === 0) return

      const applications = appliedIds.map(id => ({
        job_id: id,
        status: trackerData[id]?.status || 'applied',
        notes: trackerData[id]?.notes || '',
        applied_date: trackerData[id]?.appliedAt
          ? new Date(trackerData[id].appliedAt).toISOString()
          : new Date().toISOString(),
      }))

      const res = await fetchRetry('/api/tracker/migrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applications }),
      })

      if (res.ok) {
        localStorage.removeItem(STORAGE_KEYS.APPLIED)
        localStorage.removeItem(STORAGE_KEYS.TRACKER)
        window.dispatchEvent(new Event(STORAGE_EVENTS.APPLIED))
      } else {
        // Allow retry on next page load if server rejected the migration
        migrationAttempted.current = false
      }
    } catch {
      // Allow retry on next page load
      migrationAttempted.current = false
    }
  }, [])

  const loadTrackedJobs = useCallback(async () => {
    if (authLoading) return

    try {
      if (user) {
        await migrateLocalStorage()

        const res = await fetchRetry('/api/tracker')
        if (!res.ok) throw new Error('Failed to load')
        const applications = await res.json()

        if (applications.length === 0) {
          setTrackedJobs([])
          setLoading(false)
          return
        }

        const jobIds = applications.map((a: { job_id: string }) => a.job_id)
        const params = new URLSearchParams()
        jobIds.forEach((id: string) => params.append('ids', id))
        params.append('fields', 'slim')
        const jobsRes = await fetchRetry(`/api/jobs?${params.toString()}`)
        const allJobs: Job[] = await jobsRes.json()

        const tracked: TrackedJob[] = applications
          .map((app: { job_id: string; status: string; notes: string; applied_date: string }) => {
            const job = allJobs.find(j => j.id === app.job_id)
            if (!job) return null
            return {
              job,
              appliedAt: new Date(app.applied_date).getTime(),
              status: app.status as TrackedJob['status'],
              notes: app.notes || '',
            }
          })
          .filter(Boolean) as TrackedJob[]

        tracked.sort((a, b) => b.appliedAt - a.appliedAt)
        setTrackedJobs(tracked)
      } else {
        // Fallback: load from localStorage for anonymous users
        const appliedIds: string[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.APPLIED) || '[]')
        const trackerData: Record<string, { status: string; notes: string; appliedAt: number }> =
          JSON.parse(localStorage.getItem(STORAGE_KEYS.TRACKER) || '{}')

        if (appliedIds.length === 0) {
          setTrackedJobs([])
          setLoading(false)
          return
        }

        const params = new URLSearchParams()
        appliedIds.forEach(id => params.append('ids', id))
        params.append('fields', 'slim')
        const res = await fetchRetry(`/api/jobs?${params.toString()}`)
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

        tracked.sort((a, b) => b.appliedAt - a.appliedAt)
        setTrackedJobs(tracked)
      }
    } catch {
      setTrackedJobs([])
    } finally {
      setLoading(false)
    }
  }, [user, authLoading, migrateLocalStorage])

  useEffect(() => {
    const controller = new AbortController()
    loadTrackedJobs()
    return () => controller.abort()
  }, [loadTrackedJobs])

  const updateStatus = async (jobId: string, status: TrackedJob['status']) => {
    const snapshot = trackedJobs
    setTrackedJobs(cur => cur.map(t => t.job.id === jobId ? { ...t, status } : t))

    if (user) {
      try {
        const res = await fetchRetry('/api/tracker', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ job_id: jobId, status }),
          retries: 1,
        })
        if (!res.ok) throw new Error('Failed to update status')
        toast(`Status updated to ${status}`)
      } catch {
        setTrackedJobs(snapshot)
        toast('Failed to update status', 'error')
      }
    } else {
      try {
        const trackerData = JSON.parse(localStorage.getItem(STORAGE_KEYS.TRACKER) || '{}')
        trackerData[jobId] = { ...trackerData[jobId], status, appliedAt: trackerData[jobId]?.appliedAt || Date.now() }
        localStorage.setItem(STORAGE_KEYS.TRACKER, JSON.stringify(trackerData))
        toast(`Status updated to ${status}`)
      } catch { /* ignore */ }
    }
  }

  const updateNotes = async (jobId: string, notes: string) => {
    const snapshot = trackedJobs
    setTrackedJobs(cur => cur.map(t => t.job.id === jobId ? { ...t, notes } : t))

    if (user) {
      try {
        const res = await fetchRetry('/api/tracker', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ job_id: jobId, notes }),
          retries: 1,
        })
        if (!res.ok) throw new Error('Failed to update notes')
      } catch {
        setTrackedJobs(snapshot)
      }
    } else {
      try {
        const trackerData = JSON.parse(localStorage.getItem(STORAGE_KEYS.TRACKER) || '{}')
        trackerData[jobId] = { ...trackerData[jobId], notes }
        localStorage.setItem(STORAGE_KEYS.TRACKER, JSON.stringify(trackerData))
      } catch { /* ignore */ }
    }
  }

  const removeJob = async (jobId: string) => {
    const snapshot = trackedJobs
    setTrackedJobs(cur => cur.filter(t => t.job.id !== jobId))

    if (user) {
      try {
        const res = await fetchRetry(`/api/tracker?job_id=${jobId}`, { method: 'DELETE', retries: 1 })
        if (!res.ok) throw new Error('Failed to remove')
        toast('Removed from tracker')
      } catch {
        setTrackedJobs(snapshot)
        toast('Failed to remove', 'error')
      }
    } else {
      try {
        const appliedJobs: string[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.APPLIED) || '[]')
        localStorage.setItem(STORAGE_KEYS.APPLIED, JSON.stringify(appliedJobs.filter(id => id !== jobId)))
        window.dispatchEvent(new Event(STORAGE_EVENTS.APPLIED))
        const trackerData = JSON.parse(localStorage.getItem(STORAGE_KEYS.TRACKER) || '{}')
        delete trackerData[jobId]
        localStorage.setItem(STORAGE_KEYS.TRACKER, JSON.stringify(trackerData))
        toast('Removed from tracker')
      } catch { /* ignore */ }
    }
  }

  const buildCSVData = () => {
    const headers = ['Title', 'Company', 'Location', 'Category', 'Salary', 'Status', 'Applied Date', 'Notes', 'Apply URL']
    const escapeCSV = (s: string) => s.replace(/"/g, '""')
    const rows = trackedJobs.map(t => [
      escapeCSV(t.job.title),
      escapeCSV(t.job.company?.name || ''),
      escapeCSV(t.job.location),
      escapeCSV(t.job.category),
      formatSalary(t.job.salary_min, t.job.salary_max) || '',
      STATUS_CONFIG[t.status].label,
      new Date(t.appliedAt).toLocaleDateString(),
      escapeCSV(t.notes),
      escapeCSV(t.job.apply_url || ''),
    ])
    return [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n')
  }

  const exportCSV = () => {
    if (trackedJobs.length === 0) return
    const csv = buildCSVData()
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `job-applications-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const [copied, setCopied] = useState(false)
  const copyToClipboard = async () => {
    if (trackedJobs.length === 0) return
    // Build tab-separated for easy paste into spreadsheets/Notion
    const headers = ['Title', 'Company', 'Location', 'Salary', 'Status', 'Applied', 'Notes']
    const rows = trackedJobs.map(t => [
      t.job.title,
      t.job.company?.name || '',
      t.job.location,
      formatSalary(t.job.salary_min, t.job.salary_max) || '',
      STATUS_CONFIG[t.status].label,
      new Date(t.appliedAt).toLocaleDateString(),
      t.notes.replace(/\t/g, ' ').replace(/\n/g, ' '),
    ])
    const tsv = [headers, ...rows].map(r => r.join('\t')).join('\n')
    try {
      await navigator.clipboard.writeText(tsv)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* ignore */ }
  }

  const STATUS_ORDER = { applied: 0, interviewing: 1, offered: 2, rejected: 3, withdrawn: 4 }

  const filteredJobs = (() => {
    const base = filter === 'all' ? trackedJobs : trackedJobs.filter(t => t.status === filter)
    return [...base].sort((a, b) => {
      switch (sortBy) {
        case 'oldest': return a.appliedAt - b.appliedAt
        case 'company': return (a.job.company?.name || '').localeCompare(b.job.company?.name || '')
        case 'status': return (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9)
        default: return b.appliedAt - a.appliedAt // newest
      }
    })
  })()

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
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold">Application Tracker</h1>
          </div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-navy-300 text-sm">
              {user
                ? 'Your applications are synced to your account.'
                : 'Track the status of jobs you\'ve applied to. Sign in to sync across devices.'}
            </p>
            {trackedJobs.length > 0 && (
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={copyToClipboard}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-navy-800/60 px-3 py-2 text-xs font-medium text-navy-300 hover:bg-navy-700 hover:text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                  aria-label="Copy applications to clipboard"
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    {copied ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    )}
                  </svg>
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                <button
                  onClick={exportCSV}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-navy-800/60 px-3 py-2 text-xs font-medium text-navy-300 hover:bg-navy-700 hover:text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                  aria-label="Export applications as CSV"
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export CSV
                </button>
              </div>
            )}
          </div>

          {trackedJobs.length > 0 && (
            <div className="flex items-center gap-3 mt-5 flex-wrap">
              <button
                onClick={() => setFilter('all')}
                aria-pressed={filter === 'all'}
                className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 ${
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
                    aria-pressed={filter === key}
                    className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 ${
                      filter === key ? 'bg-white text-navy-900' : 'bg-navy-800/60 text-navy-300 hover:bg-navy-700'
                    }`}
                  >
                    {config.label} ({statusCounts[key]})
                  </button>
                ) : null
              ))}
              <div className="ml-auto flex-shrink-0">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  aria-label="Sort applications"
                  className="rounded-lg bg-navy-800/60 border-none text-navy-300 text-xs font-medium px-3 py-1.5 hover:bg-navy-700 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 cursor-pointer appearance-none"
                  style={{ backgroundImage: 'none', paddingRight: '0.75rem' }}
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="company">By company</option>
                  <option value="status">By status</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {/* Sign-in nudge for users with 3+ tracked jobs */}
        {!authLoading && !user && !loading && trackedJobs.length >= 3 && (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <svg className="h-5 w-5 text-amber-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <p className="text-sm text-amber-800">
                You have <span className="font-semibold">{trackedJobs.length} applications</span> stored only in this browser. Sign in to keep them safe.
              </p>
            </div>
            <Link
              href="/login?redirect=/tracker"
              className="flex-shrink-0 rounded-lg bg-amber-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2"
            >
              Sign In
            </Link>
          </div>
        )}

        {/* Insights Panel */}
        {!loading && !authLoading && trackedJobs.length >= 2 && (() => {
          const now = Date.now()
          const weekAgo = now - 7 * 24 * 60 * 60 * 1000
          const monthAgo = now - 30 * 24 * 60 * 60 * 1000
          const thisWeek = trackedJobs.filter(t => t.appliedAt >= weekAgo).length
          const thisMonth = trackedJobs.filter(t => t.appliedAt >= monthAgo).length
          const activeCount = trackedJobs.filter(t => t.status === 'applied' || t.status === 'interviewing').length
          const responseRate = trackedJobs.length > 0
            ? Math.round(((statusCounts['interviewing'] || 0) + (statusCounts['offered'] || 0) + (statusCounts['rejected'] || 0)) / trackedJobs.length * 100)
            : 0
          const topCompanies = Object.entries(
            trackedJobs.reduce((acc, t) => {
              const name = t.job.company?.name || 'Unknown'
              acc[name] = (acc[name] || 0) + 1
              return acc
            }, {} as Record<string, number>)
          ).sort((a, b) => b[1] - a[1]).slice(0, 3)

          return (
            <div className="mb-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white rounded-xl border border-navy-200 p-4 text-center">
                <p className="text-2xl font-bold text-navy-900">{thisWeek}</p>
                <p className="text-[11px] text-navy-500 font-medium mt-0.5">This Week</p>
              </div>
              <div className="bg-white rounded-xl border border-navy-200 p-4 text-center">
                <p className="text-2xl font-bold text-navy-900">{thisMonth}</p>
                <p className="text-[11px] text-navy-500 font-medium mt-0.5">This Month</p>
              </div>
              <div className="bg-white rounded-xl border border-navy-200 p-4 text-center">
                <p className="text-2xl font-bold text-emerald-600">{activeCount}</p>
                <p className="text-[11px] text-navy-500 font-medium mt-0.5">Active</p>
              </div>
              <div className="bg-white rounded-xl border border-navy-200 p-4 text-center">
                <p className="text-2xl font-bold text-navy-900">{responseRate}%</p>
                <p className="text-[11px] text-navy-500 font-medium mt-0.5">Response Rate</p>
              </div>
              {topCompanies.length > 1 && (
                <div className="col-span-2 sm:col-span-4 bg-white rounded-xl border border-navy-200 px-4 py-3">
                  <p className="text-[11px] text-navy-400 font-medium mb-1.5 uppercase tracking-wider">Top Companies</p>
                  <div className="flex flex-wrap gap-2">
                    {topCompanies.map(([name, count]) => (
                      <span key={name} className="inline-flex items-center gap-1.5 rounded-full bg-navy-50 border border-navy-200 px-3 py-1 text-xs font-medium text-navy-700">
                        {name}
                        <span className="text-navy-400">{count}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })()}

        {loading || authLoading ? (
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
            <svg className="mx-auto h-10 w-10 text-navy-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <p className="text-navy-700 font-semibold mb-1">No applications tracked yet</p>
            <p className="text-sm text-navy-500 mb-4">Mark jobs as "Applied" to start tracking them here.</p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-lg bg-navy-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-navy-800 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-400 focus-visible:ring-offset-2"
            >
              Browse Jobs
            </Link>
          </div>
        ) : (
          <>
          <p className="sr-only" aria-live="polite" aria-atomic="true">
            Showing {filteredJobs.length} {filteredJobs.length === 1 ? 'application' : 'applications'}{filter !== 'all' ? ` with status ${filter}` : ''}
          </p>
          <div className="space-y-3">
            {filteredJobs.map(({ job, status, notes, appliedAt }) => {
              const salary = formatSalary(job.salary_min, job.salary_max)
              const config = STATUS_CONFIG[status]
              const daysAgo = Math.floor((Date.now() - appliedAt) / (1000 * 60 * 60 * 24))
              const daysLabel = daysAgo === 0 ? 'Today' : daysAgo === 1 ? '1 day ago' : `${daysAgo}d ago`
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
                        <span className="text-xs text-navy-400">Applied {daysLabel}</span>
                        {status === 'applied' && daysAgo >= 7 && (
                          <span className="text-[10px] text-amber-600 font-medium bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                            Consider following up
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={status}
                        onChange={(e) => updateStatus(job.id, e.target.value as TrackedJob['status'])}
                        aria-label={`Application status for ${job.title}`}
                        className="rounded-lg border border-navy-200 bg-white px-2.5 py-2 text-xs font-medium text-navy-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-navy-500/20"
                      >
                        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                          <option key={key} value={key}>{cfg.label}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => setConfirmRemoveId(job.id)}
                        className="p-2.5 rounded-lg text-navy-300 hover:text-red-500 hover:bg-red-50 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/50"
                        aria-label={`Remove ${job.title} from tracker`}
                        title="Remove from tracker"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 relative">
                    <textarea
                      value={notes}
                      onChange={(e) => updateNotes(job.id, e.target.value)}
                      aria-label={`Notes for ${job.title}`}
                      placeholder="Add notes (interview date, contact info, follow-up reminders...)"
                      maxLength={500}
                      className="w-full rounded-lg border border-navy-200 bg-navy-50/50 px-3 py-2 text-sm text-navy-700 placeholder-navy-400 resize-none focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-400 transition"
                      rows={2}
                    />
                    {notes.length > 0 && (
                      <span className={`absolute bottom-2 right-2 text-[10px] font-medium ${notes.length > 450 ? 'text-amber-500' : 'text-navy-300'}`}>
                        {notes.length}/500
                      </span>
                    )}
                  </div>

                  {(() => {
                    const applyLink = safeUrl(job.apply_url)
                    const careersLink = safeUrl(job.company?.careers_url)
                    if (!applyLink && !careersLink) return null
                    return (
                      <div className="mt-2 flex items-center gap-3">
                        {applyLink && (
                          <a
                            href={applyLink}
                            target="_blank"
                            rel="noopener noreferrer nofollow"
                            aria-label={`Visit ${job.company?.name || 'company'} application page (opens in new tab)`}
                            className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700 transition"
                          >
                            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            Visit application page
                          </a>
                        )}
                        {careersLink && (
                          <a
                            href={careersLink}
                            target="_blank"
                            rel="noopener noreferrer nofollow"
                            aria-label={`${job.company?.name} careers page (opens in new tab)`}
                            className="inline-flex items-center gap-1 text-xs font-medium text-navy-400 hover:text-navy-600 transition"
                          >
                            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            {job.company?.name} careers
                          </a>
                        )}
                      </div>
                    )
                  })()}
                </div>
              )
            })}
          </div>
          </>
        )}
      </div>

      <ConfirmDialog
        open={!!confirmRemoveId}
        title="Remove application"
        message="This will remove the job from your tracker. This action cannot be undone."
        confirmLabel="Remove"
        destructive
        onConfirm={() => {
          if (confirmRemoveId) removeJob(confirmRemoveId)
          setConfirmRemoveId(null)
        }}
        onCancel={() => setConfirmRemoveId(null)}
      />
    </div>
  )
}
