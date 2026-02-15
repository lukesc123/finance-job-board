'use client'

import { useState } from 'react'
import { useJobActions } from '@/hooks/useJobActions'

interface JobDetailActionsProps {
  jobId: string
  jobTitle: string
  companyName: string
  postedDate: string
}

export default function JobDetailActions({ jobId, jobTitle, companyName, postedDate }: JobDetailActionsProps) {
  const { saved, applied, toggleSave, toggleApplied } = useJobActions(jobId)
  const [copied, setCopied] = useState(false)

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

        <a
          href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(jobTitle + ' at ' + companyName)}&url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`}
          target="_blank"
          rel="noopener noreferrer"
          className={`${btnBase} border-navy-200 bg-white text-navy-600 hover:bg-navy-50 hover:border-navy-300`}
          aria-label="Share on Twitter"
        >
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          Tweet
        </a>

        <a
          href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`}
          target="_blank"
          rel="noopener noreferrer"
          className={`${btnBase} border-navy-200 bg-white text-navy-600 hover:bg-navy-50 hover:border-navy-300`}
          aria-label="Share on LinkedIn"
        >
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
          </svg>
          LinkedIn
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
