'use client'

import { useState, useEffect } from 'react'

interface JobDetailActionsProps {
  jobId: string
  jobTitle: string
  companyName: string
  postedDate: string
}

export default function JobDetailActions({ jobId, jobTitle, companyName, postedDate }: JobDetailActionsProps) {
  const [saved, setSaved] = useState(false)
  const [applied, setApplied] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    try {
      const savedJobs = JSON.parse(localStorage.getItem('savedJobs') || '[]')
      setSaved(savedJobs.includes(jobId))
      const appliedJobs = JSON.parse(localStorage.getItem('appliedJobs') || '[]')
      setApplied(appliedJobs.includes(jobId))
    } catch { /* ignore */ }
  }, [jobId])

  const toggleSave = () => {
    try {
      const savedJobs: string[] = JSON.parse(localStorage.getItem('savedJobs') || '[]')
      let updated: string[]
      if (savedJobs.includes(jobId)) {
        updated = savedJobs.filter(id => id !== jobId)
        setSaved(false)
      } else {
        updated = [...savedJobs, jobId]
        setSaved(true)
      }
      localStorage.setItem('savedJobs', JSON.stringify(updated))
      window.dispatchEvent(new Event('savedJobsChanged'))
    } catch { /* ignore */ }
  }

  const toggleApplied = () => {
    try {
      const appliedJobs: string[] = JSON.parse(localStorage.getItem('appliedJobs') || '[]')
      let updated: string[]
      if (appliedJobs.includes(jobId)) {
        updated = appliedJobs.filter(id => id !== jobId)
        setApplied(false)
      } else {
        updated = [...appliedJobs, jobId]
        setApplied(true)
      }
      localStorage.setItem('appliedJobs', JSON.stringify(updated))
      window.dispatchEvent(new Event('appliedJobsChanged'))
    } catch { /* ignore */ }
  }

  const shareJob = async () => {
    const url = window.location.href
    const text = jobTitle + ' at ' + companyName

    if (navigator.share) {
      try {
        await navigator.share({ title: text, url })
        return
      } catch { /* user cancelled or not supported */ }
    }

    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* ignore */ }
  }

  const btnBase = "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-all"

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={toggleSave}
          className={`${btnBase} ${
            saved
              ? 'border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100'
              : 'border-navy-200 bg-white text-navy-600 hover:bg-navy-50 hover:border-navy-300'
          }`}
          aria-label={saved ? 'Unsave job' : 'Save job'}
        >
          <svg className="h-4 w-4" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
          {saved ? 'Saved' : 'Save'}
        </button>

        <button
          onClick={toggleApplied}
          className={`${btnBase} ${
            applied
              ? 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              : 'border-navy-200 bg-white text-navy-600 hover:bg-navy-50 hover:border-navy-300'
          }`}
          aria-label={applied ? 'Mark as not applied' : 'Mark as applied'}
        >
          <svg className="h-4 w-4" fill={applied ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {applied ? 'Applied' : 'Mark Applied'}
        </button>

        <button
          onClick={shareJob}
          className={`${btnBase} border-navy-200 bg-white text-navy-600 hover:bg-navy-50 hover:border-navy-300`}
          aria-label="Copy link"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          {copied ? 'Copied!' : 'Copy Link'}
        </button>

        <a
          href={`mailto:?subject=${encodeURIComponent(jobTitle + ' at ' + companyName)}&body=${encodeURIComponent('Check out this job:\n\n' + jobTitle + ' at ' + companyName + '\n\n' + (typeof window !== 'undefined' ? window.location.href : ''))}`}
          className={`${btnBase} border-navy-200 bg-white text-navy-600 hover:bg-navy-50 hover:border-navy-300`}
          aria-label="Share via email"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          Email
        </a>
      </div>

      {applied && (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2">
          <svg className="h-4 w-4 text-emerald-600 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm font-medium text-emerald-700">You marked this job as applied</span>
        </div>
      )}
    </div>
  )
}
