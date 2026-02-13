import Link from 'next/link'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { Job, LicenseInfo } from '@/types'

interface JobDetailPageProps {
  params: { id: string }
}

function formatSalary(min: number | null, max: number | null): string {
  if (!min && !max) return ''
  if (min && max) {
    return `$${(min / 1000).toFixed(0)}K - $${(max / 1000).toFixed(0)}K`
  }
  if (min) return `$${(min / 1000).toFixed(0)}K+`
  return `up to $${(max! / 1000).toFixed(0)}K`
}

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

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  let job: Job | null = null
  let error = false

  try {
    const { data, error: fetchError } = await supabaseAdmin
      .from('jobs')
      .select('*, company:company_id(*)')
      .eq('id', params.id)
      .single()

    if (fetchError || !data) {
      error = true
    } else {
      job = data as Job
    }
  } catch {
    error = true
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-3xl mx-auto px-4 py-20 text-center">
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

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-navy-600 hover:text-navy-800 transition mb-6"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to jobs
          </Link>

          <div className="flex items-start gap-4">
            {job.company?.logo_url ? (
              <img
                src={job.company.logo_url}
                alt={job.company.name}
                className="h-16 w-16 rounded-lg object-contain flex-shrink-0"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-navy-100 text-lg font-bold text-navy-700 flex-shrink-0">
                {job.company?.name?.charAt(0) || '?'}
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-navy-900">{job.title}</h1>
              <p className="mt-2 text-lg text-navy-700">{job.company?.name}</p>
            </div>
          </div>
        </div>

        {/* Meta Badges */}
        <div className="mb-8 flex flex-wrap gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-navy-50 px-3 py-1.5 text-sm font-medium text-navy-700">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {job.location}
          </span>

          <span className="rounded-lg bg-navy-50 px-3 py-1.5 text-sm font-medium text-navy-700">
            {job.remote_type}
          </span>

          <span className="rounded-lg bg-navy-50 px-3 py-1.5 text-sm font-medium text-navy-700">
            {job.job_type}
          </span>

          <span className="rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700">
            {job.pipeline_stage}
          </span>

          <span className="rounded-lg bg-navy-50 px-3 py-1.5 text-sm font-medium text-navy-700">
            {job.category}
          </span>

          {salary && (
            <span className="rounded-lg bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-700">
              {salary}
            </span>
          )}
        </div>

        {/* Main Content */}
        <div className="space-y-8 mb-12">
          {/* Description */}
          <div>
            <h2 className="text-xl font-semibold text-navy-900 mb-4">About this role</h2>
            <div className="prose prose-navy max-w-none">
              <p className="text-navy-700 whitespace-pre-wrap leading-relaxed">
                {job.description}
              </p>
            </div>
          </div>

          {/* Licenses Required */}
          {job.licenses_required && job.licenses_required.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-navy-900 mb-4">Licenses Required</h2>
              <div className="space-y-3">
                {job.licenses_required.map((license) => (
                  <div
                    key={license}
                    className="rounded-lg border border-orange-200 bg-orange-50 p-4"
                  >
                    <p className="font-medium text-orange-900">{license}</p>
                    {job.licenses_info && (
                      <div className="mt-3 text-sm text-orange-800 space-y-1">
                        {job.licenses_info.study_time_days && (
                          <p>
                            Study Time: {job.licenses_info.study_time_days} days
                          </p>
                        )}
                        {job.licenses_info.pass_deadline_days && (
                          <p>
                            Pass Deadline: {job.licenses_info.pass_deadline_days} days
                          </p>
                        )}
                        {job.licenses_info.max_attempts && (
                          <p>
                            Max Attempts: {job.licenses_info.max_attempts}
                          </p>
                        )}
                        {job.licenses_info.prep_materials_paid !== null && (
                          <p>
                            Prep Materials Paid:{' '}
                            {job.licenses_info.prep_materials_paid ? 'Yes' : 'No'}
                          </p>
                        )}
                        {job.licenses_info.notes && (
                          <p>{job.licenses_info.notes}</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Graduation Date Requirements */}
          {job.grad_date_required && (
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
              <h3 className="font-semibold text-yellow-900 mb-2">Graduation Date Requirements</h3>
              <div className="text-sm text-yellow-800 space-y-1">
                {job.grad_date_earliest && (
                  <p>
                    Earliest Graduation Date:{' '}
                    {formatDate(job.grad_date_earliest)}
                  </p>
                )}
                {job.grad_date_latest && (
                  <p>
                    Latest Graduation Date:{' '}
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
              <h2 className="text-xl font-semibold text-navy-900 mb-4">
                About {job.company.name}
              </h2>
              <p className="text-navy-700 leading-relaxed">
                {job.company.description}
              </p>
            </div>
          )}

          {/* Metadata */}
          <div className="text-sm text-navy-600 space-y-1 border-t border-navy-200 pt-6">
            <p>Posted: {formatDate(job.posted_date)}</p>
            {job.last_verified_at && (
              <p>Last Verified: {formatDate(job.last_verified_at)}</p>
            )}
          </div>
        </div>

        {/* CTA Section */}
        <div className="rounded-lg border border-navy-200 bg-navy-50 p-8 text-center">
          <p className="mb-6 text-navy-700">
            Apply directly on {job.company?.name}&apos;s career page
          </p>
          <a
            href={job.apply_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-8 py-3 text-base font-semibold text-white hover:bg-emerald-700 transition"
          >
            Apply on Company Site
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
          {job.source_url && (
            <div className="mt-4">
              <a
                href={job.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-navy-600 hover:text-navy-800 transition underline"
              >
                View on career page
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
