'use client'

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
      <div className="group relative rounded-xl border border-navy-100 bg-white p-5 transition-all duration-200 hover:shadow-lg hover:shadow-navy-100/50 hover:-translate-y-0.5 hover:border-navy-300">
        <div className="flex flex-col gap-3">
          {/* Top Row: Badge + Verified */}
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
                {job.title}
              </h3>
              <p className="text-sm text-navy-500 mt-0.5">{job.company?.name}</p>
            </div>
          </div>

          {/* Metadata Row */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-navy-500">
            <span className="inline-flex items-center gap-1">
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {job.location}
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
