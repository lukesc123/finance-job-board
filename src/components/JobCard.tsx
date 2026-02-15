'use client'

import { memo } from 'react'
import Link from 'next/link'
import { Job } from '@/types'
import CompanyLogo from '@/components/CompanyLogo'
import { timeAgo, formatSalary, getPipelineStageDisplay, getGradYearText, isGenericApplyUrl, slugify, getPipelineStageBadgeColor, getPipelineStageAccent } from '@/lib/formatting'
import { useJobActions, trackApplyClick } from '@/hooks/useJobActions'



function isNewJob(postedDate: string): boolean {
  const posted = new Date(postedDate)
  const now = new Date()
  const diffMs = now.getTime() - posted.getTime()
  const diffHours = diffMs / (1000 * 60 * 60)
  return diffHours <= 48
}

const HighlightText = memo(function HighlightText({ text, highlight }: { text: string; highlight: string }) {
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
})

interface JobCardProps {
  job: Job
  searchQuery?: string
  onPreview?: (job: Job) => void
  isActive?: boolean
}

export default function JobCard({ job, searchQuery = '', onPreview, isActive = false }: JobCardProps) {
  const salary = formatSalary(job.salary_min, job.salary_max)
  const companyInitial = job.company?.name?.charAt(0).toUpperCase() || '?'
  const timePosted = timeAgo(job.posted_date)
  const isNew = isNewJob(job.posted_date)

  const hasNonRequiredLicenses = job.licenses_required &&
    job.licenses_required.length > 0 &&
    !job.licenses_required.every(l => l === 'None Required')

  const { saved, applied, comparing, toggleSave, toggleApplied, toggleCompare, markApplied } = useJobActions(job.id)

  const handleApplyClick = (j: Job) => {
    markApplied()
    trackApplyClick(j)
  }

  const handleClick = (e: React.MouseEvent) => {
    if (onPreview) {
      e.preventDefault()
      onPreview(job)
    }
  }

  return (
    <Link href={`/jobs/${job.id}`} onClick={handleClick}>
      <div data-job-card className={`group relative rounded-xl border-l-4 bg-white transition-all duration-200 hover:shadow-md hover:-translate-y-px ${getPipelineStageAccent(job.pipeline_stage)} ${
        isActive
          ? 'border border-l-4 border-navy-400 bg-navy-50/50 shadow-md ring-1 ring-navy-200'
          : applied
            ? 'border border-l-4 border-emerald-200 bg-emerald-50/20'
            : 'border border-l-4 border-navy-100 hover:border-navy-200'
      }`}>
        <div className="p-4 sm:p-5">
          {/* Action Buttons - top right */}
          <div className="absolute top-3 right-3 flex items-center gap-0.5">
            {isNew && (
              <span className="mr-1 inline-flex items-center gap-1 rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wide">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-300 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white" />
                </span>
                New
              </span>
            )}
            <button
              onClick={toggleCompare}
              className={`p-1.5 rounded-lg transition-all text-xs font-medium ${
                comparing
                  ? 'text-blue-600 bg-blue-100'
                  : 'text-navy-300 opacity-0 group-hover:opacity-100 hover:text-blue-600 hover:bg-blue-50'
              }`}
              aria-label={comparing ? 'Remove from compare' : 'Add to compare'}
              title={comparing ? 'Remove from compare' : 'Compare'}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7" />
              </svg>
            </button>
            <button
              onClick={toggleApplied}
              className={`p-1.5 rounded-lg transition-all text-xs font-medium ${
                applied
                  ? 'text-emerald-600 bg-emerald-100'
                  : 'text-navy-300 opacity-0 group-hover:opacity-100 hover:text-emerald-600 hover:bg-emerald-50'
              }`}
              aria-label={applied ? 'Mark as not applied' : 'Mark as applied'}
            >
              <svg className="h-4 w-4" fill={applied ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            <button
              onClick={toggleSave}
              className={`p-1.5 rounded-lg transition-all ${
                saved
                  ? 'text-amber-500 hover:text-amber-600'
                  : 'text-navy-300 opacity-0 group-hover:opacity-100 hover:text-navy-600'
              }`}
              aria-label={saved ? 'Unsave job' : 'Save job'}
            >
              <svg className="h-4.5 w-4.5" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </button>
          </div>

          <div className="flex gap-3.5 pr-16 sm:pr-20">
            {/* Company Logo */}
            <div className="flex-shrink-0 mt-0.5">
              <CompanyLogo logoUrl={job.company?.logo_url} name={job.company?.name || '?'} />
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1 space-y-2">
              {/* Title + Company */}
              <div>
                <h3 className="font-semibold text-navy-900 group-hover:text-navy-700 transition text-[15px] leading-snug">
                  <HighlightText text={job.title} highlight={searchQuery} />
                </h3>
                <p className="text-sm text-navy-500 mt-0.5">
                  <span
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      if (job.company?.name) {
                        window.location.href = `/companies/${slugify(job.company.name)}`
                      }
                    }}
                    className="hover:text-navy-700 hover:underline cursor-pointer transition"
                  >
                    <HighlightText text={job.company?.name || ''} highlight={searchQuery} />
                  </span>
                </p>
              </div>

              {/* Metadata Row */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-navy-500">
                <span
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    const locSlug = slugify(job.location)
                    window.location.href = `/location/${locSlug}`
                  }}
                  className="inline-flex items-center gap-1 hover:text-navy-700 hover:underline cursor-pointer transition"
                >
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <HighlightText text={job.location} highlight={searchQuery} />
                </span>
                <span className="text-navy-200">|</span>
                <span>{job.remote_type}</span>
                <span className="text-navy-200">|</span>
                <span>{job.job_type}</span>
              </div>

              {/* Bottom row: badges + salary + time */}
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-block rounded-md border px-2 py-0.5 text-[11px] font-semibold ${getPipelineStageBadgeColor(job.pipeline_stage)}`}
                  title={getPipelineStageDisplay(job.pipeline_stage).subtitle}
                >
                  {getPipelineStageDisplay(job.pipeline_stage).label}
                </span>

                {getGradYearText(job.grad_date_earliest, job.grad_date_latest) && (
                  <span className="text-[10px] text-navy-400 font-medium">
                    {getGradYearText(job.grad_date_earliest, job.grad_date_latest)}
                  </span>
                )}

                {applied && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-md px-2 py-0.5">
                    Applied
                  </span>
                )}

                {hasNonRequiredLicenses && job.licenses_required!.map((license) => (
                  license !== 'None Required' && (
                    <span key={license} className="inline-flex items-center rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                      {license}
                    </span>
                  )
                ))}

                {job.grad_date_required && (
                  <span className="inline-flex items-center rounded-md border border-yellow-200 bg-yellow-50 px-2 py-0.5 text-[11px] font-medium text-yellow-700">
                    Grad Date Req.
                  </span>
                )}

                {/* Spacer */}
                <div className="flex-1" />

                {/* Salary */}
                {salary && (
                  <span className="text-sm font-bold text-emerald-600">{salary}</span>
                )}

                {/* Posted time */}
                <span className="text-[11px] text-navy-400">{timePosted}</span>

                {/* Quick Apply */}
                {job.apply_url && (() => {
                  const url = job.apply_url!.startsWith('http') ? job.apply_url! : `https://${job.apply_url}`
                  const generic = isGenericApplyUrl(url)
                  return (
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleApplyClick(job)
                      }}
                      className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white sm:opacity-0 sm:group-hover:opacity-100 transition-all hover:bg-emerald-700"
                    >
                      {generic ? (
                        <>
                          <svg className="h-3 w-3 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                          Careers at {job.company?.name || 'Company'}
                        </>
                      ) : (
                        <>
                          Apply at {job.company?.name || 'Company'}
                        </>
                      )}
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  )
                })()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
