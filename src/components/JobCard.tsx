'use client'

import Link from 'next/link'
import { Job } from '@/types'

function timeAgo(dateString: string): string {
  const now = new Date()
  const date = new Date(dateString)
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
  if (seconds < 2592000) return `${Math.floor(seconds / 604800)}w ago`
  return `${Math.floor(seconds / 2592000)}mo ago`
}

function formatSalary(min: number | null, max: number | null): string {
  if (!min && !max) return ''
  if (min && max) {
    return `$${(min / 1000).toFixed(0)}K - $${(max / 1000).toFixed(0)}K`
  }
  if (min) return `$${(min / 1000).toFixed(0)}K+`
  return `up to $${(max! / 1000).toFixed(0)}K`
}

function getPipelineStageBadgeColor(stage: string): string {
  switch (stage) {
    case 'Sophomore Internship':
      return 'bg-blue-100 text-blue-800'
    case 'Junior Internship':
      return 'bg-blue-100 text-blue-800'
    case 'Senior Internship':
      return 'bg-blue-100 text-blue-800'
    case 'New Grad':
      return 'bg-purple-100 text-purple-800'
    case 'Early Career':
      return 'bg-green-100 text-green-800'
    case 'No Experience Required':
      return 'bg-navy-100 text-navy-800'
    default:
      return 'bg-navy-50 text-navy-700'
  }
}

interface JobCardProps {
  job: Job
}

export default function JobCard({ job }: JobCardProps) {
  const salary = formatSalary(job.salary_min, job.salary_max)
  const companyInitial = job.company?.name?.charAt(0).toUpperCase() || '?'
  const timePosted = timeAgo(job.posted_date)
  const lastVerified = job.last_verified_at ? timeAgo(job.last_verified_at) : null

  return (
    <Link href={`/jobs/${job.id}`}>
      <div className="group relative rounded-lg border border-navy-200 bg-white p-5 transition hover:shadow-lg hover:border-navy-300">
        <div className="flex items-start gap-4">
          {/* Company Avatar */}
          {job.company?.logo_url ? (
            <img
              src={job.company.logo_url}
              alt={job.company.name}
              className="h-12 w-12 rounded-lg object-contain flex-shrink-0"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-navy-100 text-sm font-bold text-navy-700 flex-shrink-0">
              {companyInitial}
            </div>
          )}

          <div className="min-w-0 flex-1">
            {/* Title and Company */}
            <h3 className="font-semibold text-navy-900 group-hover:text-navy-700 transition">
              {job.title}
            </h3>
            <p className="mt-0.5 text-sm text-navy-600">{job.company?.name}</p>

            {/* Badges Row 1 */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {/* Location */}
              <span className="inline-flex items-center gap-1 rounded-md bg-navy-50 px-2.5 py-1 text-xs font-medium text-navy-700">
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                {job.location}
              </span>

              {/* Remote Type Badge */}
              <span className="rounded-md bg-navy-50 px-2.5 py-1 text-xs font-medium text-navy-700">
                {job.remote_type}
              </span>

              {/* Pipeline Stage Badge (color-coded) */}
              <span className={`rounded-md px-2.5 py-1 text-xs font-medium ${getPipelineStageBadgeColor(job.pipeline_stage)}`}>
                {job.pipeline_stage}
              </span>

              {/* Job Type Badge */}
              <span className="rounded-md bg-navy-50 px-2.5 py-1 text-xs font-medium text-navy-700">
                {job.job_type}
              </span>
            </div>

            {/* Badges Row 2 */}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {/* Salary */}
              {salary && (
                <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                  {salary}
                </span>
              )}

              {/* Licenses Required */}
              {job.licenses_required && job.licenses_required.length > 0 && (
                <>
                  {job.licenses_required.map((license) => (
                    <span
                      key={license}
                      className="rounded-md bg-orange-50 px-2 py-0.5 text-xs text-orange-700 border border-orange-200"
                    >
                      {license}
                    </span>
                  ))}
                </>
              )}

              {/* Graduation Date Required Indicator */}
              {job.grad_date_required && (
                <span className="rounded-md bg-yellow-50 px-2.5 py-1 text-xs font-medium text-yellow-700">
                  Grad Date
                </span>
              )}
            </div>
          </div>

          {/* Right Column: Time Info */}
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <span className="text-xs font-medium text-navy-600">{timePosted}</span>
            {lastVerified && (
              <span className="text-xs text-navy-400">verified {lastVerified}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
