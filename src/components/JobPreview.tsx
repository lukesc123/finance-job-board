'use client'

import Link from 'next/link'
import { Job } from '@/types'
import { formatSalary, timeAgo, getPipelineStageDisplay, getGradYearText, isGenericApplyUrl, slugify, getPipelineStageBadgeColor } from '@/lib/formatting'
import { useJobActions, trackApplyClick } from '@/hooks/useJobActions'

interface JobPreviewProps {
  job: Job | null
  onClose: () => void
}

export default function JobPreview({ job, onClose }: JobPreviewProps) {
  const { saved, applied, toggleSave, markApplied } = useJobActions(job?.id)

  if (!job) return null

  const salary = formatSalary(job.salary_min, job.salary_max)
  const applyUrl = job.apply_url
    ? (job.apply_url.startsWith('http') ? job.apply_url : 'https://' + job.apply_url)
    : null
  const companyName = job.company?.name || 'Company'
  const hasLicenseInfo = job.licenses_required &&
    job.licenses_required.length > 0 &&
    !job.licenses_required.every(l => l === 'None Required')

  const handleApplyClick = () => {
    markApplied()
    trackApplyClick(job)
  }

  // Clean description into paragraphs
  const descParagraphs = (job.description || '').split(/\n{2,}|\r\n{2,}/).filter(Boolean)

  return (
    <div className="flex flex-col h-full bg-white border-l border-navy-200">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-navy-100 px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-navy-900 leading-snug">{job.title}</h2>
            <div className="flex items-center gap-2 mt-1">
              <Link
                href={`/companies/${slugify(companyName)}`}
                className="text-sm font-semibold text-navy-700 hover:text-navy-900 hover:underline transition"
              >
                {companyName}
              </Link>
              <span className="text-navy-300">-</span>
              <Link
                href={`/location/${slugify(job.location)}`}
                className="text-sm text-navy-500 hover:text-navy-700 hover:underline transition"
              >
                {job.location}
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Link
              href={`/jobs/${job.id}`}
              className="p-1.5 rounded-lg text-navy-400 hover:text-navy-600 hover:bg-navy-50 transition"
              title="Open full page"
              aria-label="Open full job page"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </Link>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-navy-400 hover:text-navy-600 hover:bg-navy-50 transition"
              aria-label="Close preview"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Meta pills */}
        <div className="flex flex-wrap items-center gap-2 mt-3">
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
          <span className="text-xs text-navy-500">{job.remote_type}</span>
          <span className="text-xs text-navy-500">{job.job_type}</span>
          {salary && <span className="text-sm font-bold text-emerald-600">{salary}</span>}
          <span className="text-xs text-navy-400">{timeAgo(job.posted_date)}</span>
        </div>
        {/* Class year clarification for internships */}
        {job.pipeline_stage.includes('Internship') && (
          <p className="text-[11px] text-navy-400 mt-1.5">
            {getPipelineStageDisplay(job.pipeline_stage).subtitle}
            {getGradYearText(job.grad_date_earliest, job.grad_date_latest) &&
              ` · Target: ${getGradYearText(job.grad_date_earliest, job.grad_date_latest)}`}
          </p>
        )}

        {/* Apply + Save buttons */}
        <div className="flex items-center gap-2 mt-4">
          {applyUrl ? (
            <a
              href={applyUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleApplyClick}
              className="inline-flex flex-col items-center rounded-lg bg-emerald-600 px-5 py-2.5 text-white hover:bg-emerald-700 transition flex-1 group/apply"
            >
              <span className="flex items-center gap-2 font-bold text-sm">
                {isGenericApplyUrl(applyUrl) ? `Careers at ${companyName}` : `Apply at ${companyName}`}
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </span>
              <span className="text-[10px] text-emerald-200 group-hover/apply:text-emerald-100 mt-0.5 flex items-center gap-1">
                {isGenericApplyUrl(applyUrl) && (
                  <span className="inline-flex items-center gap-0.5">
                    <svg className="h-2.5 w-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Careers page
                    <span className="mx-0.5">·</span>
                  </span>
                )}
                {(() => { try { return new URL(applyUrl).hostname.replace('www.', '') } catch { return '' } })()}
              </span>
            </a>
          ) : (
            <span className="text-sm text-navy-400 flex-1 text-center">No apply link available</span>
          )}
          <button
            onClick={toggleSave}
            className={`p-2.5 rounded-lg border transition ${
              saved
                ? 'border-amber-200 bg-amber-50 text-amber-600'
                : 'border-navy-200 text-navy-400 hover:text-navy-600 hover:border-navy-300'
            }`}
            title={saved ? 'Unsave' : 'Save'}
            aria-label={saved ? 'Unsave job' : 'Save job'}
          >
            <svg className="h-5 w-5" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </button>
        </div>

        {applied && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
            <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            You applied to this job
          </div>
        )}
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {/* License Requirements */}
        {hasLicenseInfo && (
          <div className="mb-4 rounded-lg bg-amber-50 border border-amber-200 p-3">
            <p className="text-xs font-semibold text-amber-700 mb-1">License Requirements</p>
            <div className="flex flex-wrap gap-1.5">
              {job.licenses_required!.filter(l => l !== 'None Required').map((license) => (
                <span key={license} className="inline-flex items-center rounded-md border border-amber-300 bg-white px-2 py-0.5 text-[11px] font-medium text-amber-800">
                  {license}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Experience */}
        {job.years_experience_max !== null && job.years_experience_max !== undefined && (
          <div className="mb-4 flex items-center gap-2 text-sm text-navy-600">
            <svg className="h-4 w-4 text-navy-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {job.years_experience_max === 0 ? 'No experience required' : `Up to ${job.years_experience_max} year${job.years_experience_max > 1 ? 's' : ''} experience`}
          </div>
        )}

        {/* Description */}
        <div className="prose prose-sm prose-navy max-w-none">
          <h3 className="text-sm font-bold text-navy-900 mb-2">About this role</h3>
          {descParagraphs.map((p, i) => (
            <p key={i} className="text-sm text-navy-700 leading-relaxed mb-3 whitespace-pre-wrap">{p}</p>
          ))}
        </div>

        {/* Browse more links */}
        <div className="mt-6 pt-4 border-t border-navy-100">
          <p className="text-xs font-semibold text-navy-500 mb-2">Browse more</p>
          <div className="flex flex-wrap gap-2">
            <Link href={`/category/${slugify(job.category)}`} className="text-xs font-medium text-navy-600 bg-navy-50 rounded-full px-3 py-1 hover:bg-navy-100 transition">
              All {job.category} Jobs
            </Link>
            <Link href={`/location/${slugify(job.location)}`} className="text-xs font-medium text-navy-600 bg-navy-50 rounded-full px-3 py-1 hover:bg-navy-100 transition">
              Jobs in {job.location}
            </Link>
            <Link href={`/companies/${slugify(companyName)}`} className="text-xs font-medium text-navy-600 bg-navy-50 rounded-full px-3 py-1 hover:bg-navy-100 transition">
              All {companyName} Jobs
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
