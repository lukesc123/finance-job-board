import Link from 'next/link'
import { Metadata } from 'next'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { timeAgo, formatSalary, formatDate } from '@/lib/formatting'
import { Job } from '@/types'

interface JobDetailPageProps {
  params: { id: string }
}

function getPipelineStageBadgeColor(stage: string): string {
  if (stage.includes('Internship')) {
    return 'bg-green-50 text-green-700 border-green-200'
  }
  if (stage === 'New Grad') {
    return 'bg-blue-50 text-blue-700 border-blue-200'
  }
  if (stage === 'No Experience Required') {
    return 'bg-purple-50 text-purple-700 border-purple-200'
  }
  if (stage === 'Early Career') {
    return 'bg-orange-50 text-orange-700 border-orange-200'
  }
  return 'bg-navy-50 text-navy-700 border-navy-200'
}

async function getJobData(id: string): Promise<Job | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('jobs')
      .select('*, company:company_id(*)')
      .eq('id', id)
      .single()

    if (error || !data) {
      return null
    }

    return data as Job
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: JobDetailPageProps): Promise<Metadata> {
  const job = await getJobData(params.id)

  if (!job) {
    return {
      title: 'Job Not Found | FinanceJobs',
      description: 'The job listing you are looking for could not be found.',
    }
  }

  const description = job.description.substring(0, 160).trim() + '...'
  const title = `${job.title} at ${job.company?.name || 'Company'} | FinanceJobs`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
    },
  }
}

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const job = await getJobData(params.id)

  if (!job) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h1 className="text-2xl font-bold text-navy-900">Job not found</h1>
          <p className="mt-2 text-navy-600">
            This listing may have been removed or expired.
          </p>
          <Link
            href="/"
            className="mt-6 inline-block rounded-lg bg-navy-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-navy-800 transition"
          >
            Back to Jobs
          </Link>
        </div>
      </div>
    )
  }

  const salary = formatSalary(job.salary_min, job.salary_max)
  const badgeColor = getPipelineStageBadgeColor(job.pipeline_stage)
  const hasLicenseInfo = job.licenses_required && job.licenses_required.length > 0 && !job.licenses_required.every(l => l === 'None Required')

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-navy-600 hover:text-navy-800 transition mb-8"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </Link>

        {/* Job Title and Company Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-navy-900 mb-3">{job.title}</h1>
          <div className="flex items-center gap-2 mb-6">
            {job.company?.website ? (
              <a
                href={job.company.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-lg font-semibold text-navy-700 hover:text-navy-900 transition"
              >
                {job.company.name}
              </a>
            ) : (
              <p className="text-lg font-semibold text-navy-700">{job.company?.name}</p>
            )}
          </div>

          {/* Pipeline Stage Badge */}
          <div className="mb-6">
            <span className={`inline-block rounded-lg border px-3 py-1.5 text-sm font-medium ${badgeColor}`}>
              {job.pipeline_stage}
            </span>
          </div>
        </div>

        {/* Key Metadata Grid */}
        <div className="mb-12 grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-lg bg-navy-50 p-4">
            <p className="text-xs font-semibold text-navy-600 uppercase tracking-wide">Location</p>
            <p className="mt-1 text-sm font-medium text-navy-900">{job.location}</p>
          </div>

          <div className="rounded-lg bg-navy-50 p-4">
            <p className="text-xs font-semibold text-navy-600 uppercase tracking-wide">Remote Type</p>
            <p className="mt-1 text-sm font-medium text-navy-900">{job.remote_type}</p>
          </div>

          <div className="rounded-lg bg-navy-50 p-4">
            <p className="text-xs font-semibold text-navy-600 uppercase tracking-wide">Job Type</p>
            <p className="mt-1 text-sm font-medium text-navy-900">{job.job_type}</p>
          </div>

          {salary && (
            <div className="rounded-lg bg-emerald-50 p-4">
              <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">Salary</p>
              <p className="mt-1 text-sm font-semibold text-emerald-700">{salary}</p>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="space-y-12 mb-12">
          {/* Description */}
          <div>
            <h2 className="text-2xl font-bold text-navy-900 mb-4">About this role</h2>
            <div className="text-navy-700 whitespace-pre-wrap leading-relaxed">
              {job.description}
            </div>
          </div>

          {/* Licenses Required */}
          {hasLicenseInfo && (
            <div>
              <h2 className="text-2xl font-bold text-navy-900 mb-4">Licenses Required</h2>
              <div className="space-y-3">
                {job.licenses_required.map((license) => (
                  license !== 'None Required' && (
                    <div
                      key={license}
                      className="rounded-lg border border-orange-200 bg-orange-50 p-4"
                    >
                      <p className="font-semibold text-orange-900 mb-3">{license}</p>
                      {job.licenses_info && (
                        <div className="text-sm text-orange-800 space-y-2">
                          {job.licenses_info.study_time_days !== null && (
                            <p>
                              <span className="font-medium">Study Time:</span> {job.licenses_info.study_time_days} days
                            </p>
                          )}
                          {job.licenses_info.pass_deadline_days !== null && (
                            <p>
                              <span className="font-medium">Pass Deadline:</span> {job.licenses_info.pass_deadline_days} days
                            </p>
                          )}
                          {job.licenses_info.max_attempts !== null && (
                            <p>
                              <span className="font-medium">Max Attempts:</span> {job.licenses_info.max_attempts}
                            </p>
                          )}
                          {job.licenses_info.prep_materials_paid !== null && (
                            <p>
                              <span className="font-medium">Prep Materials Paid:</span> {job.licenses_info.prep_materials_paid ? 'Yes' : 'No'}
                            </p>
                          )}
                          {job.licenses_info.notes && (
                            <p>
                              <span className="font-medium">Notes:</span> {job.licenses_info.notes}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )
                ))}
              </div>
            </div>
          )}

          {/* Graduation Date Requirements */}
          {job.grad_date_required && (
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
              <h3 className="font-semibold text-yellow-900 mb-3">Graduation Date Requirements</h3>
              <div className="text-sm text-yellow-800 space-y-2">
                {job.grad_date_earliest && (
                  <p>
                    <span className="font-medium">Earliest Graduation Date:</span>{' '}
                    {formatDate(job.grad_date_earliest)}
                  </p>
                )}
                {job.grad_date_latest && (
                  <p>
                    <span className="font-medium">Latest Graduation Date:</span>{' '}
                    {formatDate(job.grad_date_latest)}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Years Experience */}
          {job.years_experience_max !== null && (
            <div className="rounded-lg border border-navy-200 bg-navy-50 p-4">
              <p className="text-sm font-medium text-navy-900">
                Maximum Years Experience: {job.years_experience_max} years
              </p>
            </div>
          )}

          {/* Company Info */}
          {job.company?.description && (
            <div>
              <h2 className="text-2xl font-bold text-navy-900 mb-4">
                About {job.company.name}
              </h2>
              <p className="text-navy-700 leading-relaxed">
                {job.company.description}
              </p>
            </div>
          )}
        </div>

        {/* CTA Button */}
        <div className="mb-12">
          <a
            href={job.apply_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-8 py-4 text-base font-semibold text-white hover:bg-emerald-700 transition"
          >
            Apply on Company Site
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>

        {/* Metadata Footer */}
        <div className="text-sm text-navy-600 space-y-1 border-t border-navy-200 pt-6">
          <p>Posted {timeAgo(job.posted_date)}</p>
          {job.last_verified_at && (
            <p>Last verified {timeAgo(job.last_verified_at)}</p>
          )}
        </div>
      </div>
    </div>
  )
}
