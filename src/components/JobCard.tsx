'use client'

import Link from 'next/link'
import { Job } from '@/types'
import { timeAgo, formatSalary } from '@/lib/formatting'

function getPipelineStageBadgeColor(stage: string): string {
  switch (stage) {
    case 'Sophomore Internship':
      return 'bg-green-100 text-green-800'
    case 'Junior Internship':
      return 'bg-green-100 text-green-800'
    case 'Senior Internship':
      return 'bg-green-100 text-green-800'
    case 'New Grad':
      return 'bg-blue-100 text-blue-800'
    case 'Early Career':
      return 'bg-orange-100 text-orange-800'
    case 'No Experience Required':
      return 'bg-purple-100 text-purple-800'
    default:
      return 'bg-navy-100 text-navy-700'
  }
}

interface JobCardProps {
  job: Job
}

export default function JobCard({ job }: JobCardProps) {
  const salary = formatSalary(job.salary_min, job.salary_max)
  const companyInitial = job.company?.name?.charAt(0).toUpperCase() || '?'
  const timePosted = timeAgo(job.posted_date)

  const hasNonRequiredLicenses = job.licenses_required &&
    job.licenses_required.length > 0 &&
    !job.licenses_required.every(l => l === 'None Required')

  return (
    <Link href={`/jobs/${job.id}`}>
      <div className="group relative rounded-lg border border-navy-200 bg-white p-5 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 hover:border-navy-300">
        <div className="flex flex-col gap-3">
          {/* Pipeline Stage Badge - PRIMARY (Large, Left-aligned) */}
          <div>
            <span className={`inline-block rounded-full px-3 py-1.5 text-sm font-semibold ${getPipelineStageBadgeColor(job.pipeline_stage)}`}>
              {job.pipeline_stage}
            </span>
          </div>

          {/* Company Logo + Title + Company Name */}
          <div className="flex items-start gap-3">
            {/* Company Avatar */}
            {job.company?.logo_url ? (
              <img
                src={job.company.logo_url}
                alt={job.company.name}
                className="h-10 w-10 rounded object-contain flex-shrink-0"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded bg-navy-100 text-xs font-bold text-navy-700 flex-shrink-0">
                {companyInitial}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-navy-900 group-hover:text-blue-600 transition text-base">
                {job.title}
              </h3>
              <p className="text-sm text-navy-600 mt-0.5">{job.company?.name}</p>
            </div>
          </div>

          {/* Metadata Row: Location, Remote, Job Type */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs text-navy-600">
              <svg
                className="h-3.5 w-3.5 text-navy-500"
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

            <span className="text-xs text-navy-500">•</span>

            <span className="text-xs text-navy-600">
              {job.remote_type}
            </span>

            <span className="text-xs text-navy-500">•</span>

            <span className="text-xs text-navy-600">
              {job.job_type}
            </span>
          </div>

          {/* Salary - Own Line, Bolder */}
          {salary && (
            <div>
              <p className="text-base font-bold text-emerald-700">
                {salary}
              </p>
            </div>
          )}

          {/* License Badges + Grad Date - Optional Row */}
          {(hasNonRequiredLicenses || job.grad_date_required) && (
            <div className="flex flex-wrap items-center gap-2">
              {hasNonRequiredLicenses && (
                <>
                  {job.licenses_required!.map((license) => (
                    license !== 'None Required' && (
                      <span
                        key={license}
                        className="inline-flex items-center rounded-full border border-orange-300 bg-white px-2.5 py-0.5 text-xs font-medium text-orange-700"
                      >
                        {license}
                      </span>
                    )
                  ))}
                </>
              )}

              {job.grad_date_required && (
                <span className="inline-flex items-center rounded-full border border-yellow-300 bg-white px-2.5 py-0.5 text-xs font-medium text-yellow-700">
                  Grad Date Required
                </span>
              )}
            </div>
          )}

          {/* Posted Time - Subtle */}
          <div>
            <span className="text-xs text-navy-500">Posted {timePosted}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
