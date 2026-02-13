'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Job } from '@/types'
import { timeAgo, formatSalary } from '@/lib/formatting'

function getPipelineStageBadgeColor(stage: string): string {
  if (stage.includes('Internship')) return 'bg-green-50 text-green-700 border border-green-200'
  if (stage === 'New Grad') return 'bg-blue-50 text-blue-700 border border-blue-200'
  if (stage === 'Early Career') return 'bg-orange-50 text-orange-700 border border-orange-200'
  if (stage === 'No Experience Required') return 'bg-purple-50 text-purple-700 border border-purple-200'
  return 'bg-navy-50 text-navy-700 border border-navy-200'
}

function HighlightText({ text, highlight }: { text: string; highlight: string }) {
  if (!highlight || highlight.length < 2) return <>{text}</>
  const regex = new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  const parts = text.split(regex)
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-yellow-100 text-inherit rounded-sm px-0.5">{part}</mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  )
}

interface JobCardProps {
  job: Job
  searchQuery?: string
}

export default function JobCard({ job, searchQuery = '' }: JobCardProps) {
  const salary = formatSalary(job.salary_min, job.salary_max)
  const companyInitial = job.company?.name?.charAt(0).toUpperCase() || '?'
  const timePosted = timeAgo(job.posted_date)

  const hasNonRequiredLicenses = job.licenses_required &&
    job.licenses_required.length > 0 &&
    !job.licenses_required.every(l => l === 'None Required')

  const [saved, setSaved] = useState(false)
  const [applied, setApplied] = useState(false)

  useEffect(() => {
    try {
      const savedJobs = JSON.parse(localStorage.getItem('savedJobs') || '[]')
      setSaved(savedJobs.includes(job.id))
      const appliedJobs = JSON.parse(localStorage.getItem('appliedJobs') || '[]')
      setApplied(appliedJobs.includes(job.id))
    } catch { /* ignore */ }
  }, [job.id])

  const toggleSave = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      const savedJobs: string[] = JSON.parse(localStorage.getItem('savedJobs') || '[]')
      let updated: string[]
      if (savedJobs.includes(job.id)) {
        updated = savedJobs.filter(id => id !== job.id)
        setSaved(false)
      } else {
        updated = [...savedJobs, job.id]
        setSaved(true)
      }
      localStorage.setItem('savedJobs', JSON.stringify(updated))
      window.dispatchEvent(new Event('savedJobsChanged'))
    } catch { /* ignore */ }
  }

  const toggleApplied = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      const appliedJobs: string[] = JSON.parse(localStorage.getItem('appliedJobs') || '[]')
      let updated: string[]
      if (appliedJobs.includes(job.id)) {
        updated = appliedJobs.filter(id => id !== job.id)
        setApplied(false)
      } else {
        updated = [...appliedJobs, job.id]
        setApplied(true)
      }
      localStorage.setItem('appliedJobs', JSON.stringify(updated))
      window.dispatchEvent(new Event('appliedJobsChanged'))
    } catch { /* ignore */ }
  }

  return (
    <Link href={`/jobs/${job.id}`}>
      <div className={`group relative rounded-xl border bg-white p-5 transition-all duration-200 hover:shadow-lg hover:shadow-navy-100/50 hover:-translate-y-0.5 ${
        applied
          ? 'border-emerald-200 bg-emerald-50/30'
          : 'border-navy-100 hover:border-navy-300'
      }`}>
        {/* Action Buttons */}
        <div className="absolute top-4 right-4 flex items-center gap-1">
          {/* Applied Button */}
          <button
            onClick={toggleApplied}
            className={`p-1.5 rounded-lg transition-all text-xs font-medium ${
              applied
                ? 'text-emerald-600 bg-emerald-100'
                : 'text-navy-300 opacity-0 group-hover:opacity-100 hover:text-emerald-600 hover:bg-emerald-50'
            }`}
            aria-label={applied ? 'Mark as not applied' : 'Mark as applied'}
          >
            <svg className="h-4.5 w-4.5" fill={applied ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          {/* Save/Bookmark Button */}
          <button
            onClick={toggleSave}
            className={`p-1.5 rounded-lg transition-all ${
              saved
                ? 'text-amber-500 hover:text-amber-600'
                : 'text-navy-300 opacity-0 group-hover:opacity-100 hover:text-navy-500'
            }`}
            aria-label={saved ? 'Unsave job' : 'Save job'}
          >
            <svg className="h-5 w-5" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </button>
        </div>

        <div className="flex flex-col gap-3 pr-16">
          {/* Top Row: Badge + Verified + Applied Tag */}
          <div className="flex items-center gap-2">
            <span className={`inline-block rounded-lg px-2.5 py-1 text-xs font-semibold ${getPipelineStageBadgeColor(job.pipeline_stage)}`}>
              {job.pipeline_stage}
            </span>
            {job.is_verified && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
                <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Verified
              </span>
            )}
            {applied && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
                Applied
              </span>
            )}
          </div>

          {/* Company Logo + Title + Company Name */}
          <div className="flex items-start gap-3">
            {job.company?.logo_url ? (
              <img
                src={job.company.logo_url}
                alt={job.company.name}
                className="h-10 w-10 rounded-lg object-contain flex-shrink-0 border border-navy-100"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy-900 text-sm font-bold text-white flex-shrink-0">
                {companyInitial}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-navy-900 group-hover:text-navy-700 transition text-base leading-snug">
                <HighlightText text={job.title} highlight={searchQuery} />
              </h3>
              <p className="text-sm text-navy-500 mt-0.5">
                <HighlightText text={job.company?.name || ''} highlight={searchQuery} />
              </p>
            </div>
          </div>

          {/* Metadata Row */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-navy-500">
            <span className="inline-flex items-center gap-1">
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <HighlightText text={job.location} highlight={searchQuery} />
            </span>
            <span>·</span>
            <span>{job.remote_type}</span>
            <span>·</span>
            <span>{job.job_type}</span>
          </div>

          {/* Salary */}
          {salary && (
            <p className="text-sm font-bold text-emerald-600">{salary}</p>
          )}

          {/* License & Grad Date Badges */}
          {(hasNonRequiredLicenses || job.grad_date_required) && (
            <div className="flex flex-wrap items-center gap-1.5">
              {hasNonRequiredLicenses && job.licenses_required!.map((license) => (
                license !== 'None Required' && (
                  <span key={license} className="inline-flex items-center rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                    {license}
                  </span>
                )
              ))}
              {job.grad_date_required && (
                <span className="inline-flex items-center rounded-md border border-yellow-200 bg-yellow-50 px-2 py-0.5 text-xs font-medium text-yellow-700">
                  Grad Date Required
                </span>
              )}
            </div>
          )}

          {/* Posted Time */}
          <span className="text-xs text-navy-400">Posted {timePosted}</span>
        </div>
      </div>
    </Link>
  )
}
