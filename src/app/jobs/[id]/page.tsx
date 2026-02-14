import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { timeAgo, formatSalary, formatDate } from '@/lib/formatting'
import { Job } from '@/types'
import SimilarJobs from '@/components/SimilarJobs'
import JobDetailActions from '@/components/JobDetailActions'
import TrackView from '@/components/TrackView'

// Revalidate every 5 minutes for ISR
export const revalidate = 300

interface JobDetailPageProps {
    params: Promise<{ id: string }>
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
    const { id } = await params
    const job = await getJobData(id)

  if (!job) {
        return {
                title: 'Job Not Found | FinanceJobs',
                description: 'The job listing you are looking for could not be found.',
        }
  }

  const description = (job.description || '').substring(0, 160).trim() + '...'
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
    const { id } = await params
    const job = await getJobData(id)

  if (!job) {
        notFound()
  }

  const salary = formatSalary(job.salary_min, job.salary_max)
    const applyUrl = job.apply_url
      ? (job.apply_url.startsWith('http') ? job.apply_url : 'https://' + job.apply_url)
          : null
    const badgeColor = getPipelineStageBadgeColor(job.pipeline_stage)
    const hasLicenseInfo = job.licenses_required && job.licenses_required.length > 0 && !job.licenses_required.every(l => l === 'None Required')

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://finance-job-board-luke-schindlers-projects.vercel.app'

  const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'JobPosting',
        title: job.title,
        description: job.description,
        datePosted: job.posted_date,
        employmentType: job.job_type === 'Full-time' ? 'FULL_TIME' : job.job_type === 'Part-time' ? 'PART_TIME' : job.job_type === 'Internship' ? 'INTERN' : 'OTHER',
        hiringOrganization: {
                '@type': 'Organization',
                name: job.company?.name || 'Company',
                ...(job.company?.website && { sameAs: job.company.website }),
                ...(job.company?.logo_url && { logo: job.company.logo_url }),
        },
        jobLocation: {
                '@type': 'Place',
                address: {
                          '@type': 'PostalAddress',
                          addressLocality: job.location,
                },
        },
        ...(job.remote_type === 'Remote' && { jobLocationType: 'TELECOMMUTE' }),
        ...(job.salary_min && job.salary_max && {
                baseSalary: {
                          '@type': 'MonetaryAmount',
                          currency: 'USD',
                          value: {
                                      '@type': 'QuantitativeValue',
                                      minValue: job.salary_min,
                                      maxValue: job.salary_max,
                                      unitText: 'YEAR',
                          },
                },
        }),
        directApply: false,
        url: `${siteUrl}/jobs/${job.id}`,
  }

  return (
        <div className="min-h-screen bg-navy-50">
              <script
                        type="application/ld+json"
                        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                      />
              <TrackView
                          jobId={job.id}
                          jobTitle={job.title}
                          companyName={job.company?.name || 'Company'}
                          location={job.location}
                          salary={salary || ''}
                          pipelineStage={job.pipeline_stage}
                        />
        
          {/* Top bar with back navigation */}
              <div className="bg-white border-b border-navy-200">
                      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                                <Link
                                              href="/"
                                              className="inline-flex items-center gap-1.5 text-sm font-medium text-navy-600 hover:text-navy-900 transition"
                                            >
                                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                            </svg>svg>
                                            Back to Jobs
                                </Link>Link>
                      </div>div>
              </div>div>
        
              <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Main Card */}
                      <div className="bg-white rounded-xl border border-navy-200 overflow-hidden">
                        {/* Header Section */}
                                <div className="p-6 sm:p-8 border-b border-navy-100">
                                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                                                          <div className="flex-1">
                                                            {/* Pipeline Stage Badge */}
                                                                          <span className={`inline-block rounded-lg border px-3 py-1 text-xs font-semibold mb-4 ${badgeColor}`}>
                                                                            {job.pipeline_stage}
                                                                          </span>span>
                                                          
                                                                          <h1 className="text-2xl sm:text-3xl font-bold text-navy-900 mb-2">{job.title}</h1>h1>
                                                          
                                                                          <div className="flex items-center gap-2 flex-wrap">
                                                                            {job.company?.website ? (
                              <a
                                                      href={job.company.website}
                                                      target="_blank"
                                                      rel="noopener noreferrer"
                                                      className="text-lg font-semibold text-navy-700 hover:text-navy-900 transition underline decoration-navy-200 hover:decoration-navy-400"
                                                    >
                                {job.company.name}
                              </a>a>
                            ) : (
                              <p className="text-lg font-semibold text-navy-700">{job.company?.name}</p>p>
                                                                                            )}
                                                                          </div>div>
                                                            {/* Posted time */}
                                                                          <p className="text-sm text-navy-500 mt-3">
                                                                                            Posted {timeAgo(job.posted_date)}
                                                                            {job.last_verified_at && (
                              <span className="text-navy-300 mx-1.5">{'|'}</span>span>
                                                                                            )}
                                                                            {job.last_verified_at && (
                              <span>Verified {timeAgo(job.last_verified_at)}</span>span>
                                                                                            )}
                                                                          </p>p>
                                                          </div>div>
                                            
                                              {/* Apply Button - Desktop */}
                                              {applyUrl && (
                          <div className="hidden sm:block shrink-0">
                                            <a
                                                                  href={applyUrl}
                                                                  target="_blank"
                                                                  rel="noopener noreferrer"
                                                                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-700 transition shadow-sm"
                                                                >
                                                                Apply Now
                                                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                                </svg>svg>
                                            </a>a>
                          </div>div>
                                                          )}
                                            </div>div>
                                </div>div>
                      
                        {/* Action Buttons */}
                                <div className="px-6 sm:px-8 py-4 border-b border-navy-100 bg-navy-50/30">
                                            <JobDetailActions
                                                            jobId={job.id}
                                                            jobTitle={job.title}
                                                            companyName={job.company?.name || 'Company'}
                                                            postedDate={job.posted_date}
                                                          />
                                </div>div>
                      
                        {/* Key Metadata Strip */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-navy-100 border-b border-navy-100">
                                            <div className="p-4 sm:p-5 text-center">
                                                          <p className="text-xs font-medium text-navy-500 uppercase tracking-wide mb-1">Location</p>p>
                                                          <p className="text-sm font-semibold text-navy-900">{job.location}</p>p>
                                            </div>div>
                                            <div className="p-4 sm:p-5 text-center">
                                                          <p className="text-xs font-medium text-navy-500 uppercase tracking-wide mb-1">Work Style</p>p>
                                                          <p className="text-sm font-semibold text-navy-900">{job.remote_type}</p>p>
                                            </div>div>
                                            <div className="p-4 sm:p-5 text-center">
                                                          <p className="text-xs font-medium text-navy-500 uppercase tracking-wide mb-1">Job Type</p>p>
                                                          <p className="text-sm font-semibold text-navy-900">{job.job_type}</p>p>
                                            </div>div>
                                  {salary ? (
                        <div className="p-4 sm:p-5 text-center bg-emerald-50/50">
                                        <p className="text-xs font-medium text-emerald-600 uppercase tracking-wide mb-1">Salary</p>p>
                                        <p className="text-sm font-bold text-emerald-700">{salary}</p>p>
                        </div>div>
                      ) : (
                        <div className="p-4 sm:p-5 text-center">
                                        <p className="text-xs font-medium text-navy-500 uppercase tracking-wide mb-1">Category</p>p>
                                        <p className="text-sm font-semibold text-navy-900">{job.category}</p>p>
                        </div>div>
                                            )}
                                </div>div>
                      
                        {/* Content Body */}
                                <div className="p-6 sm:p-8 space-y-8">
                                  {/* Description */}
                                            <div>
                                                          <h2 className="text-lg font-bold text-navy-900 mb-3">About this role</h2>h2>
                                                          <div className="text-navy-700 whitespace-pre-wrap leading-relaxed">
                                                            {job.description}
                                                          </div>div>
                                            </div>div>
                                
                                  {/* Licenses Required */}
                                  {hasLicenseInfo && (
                        <div>
                                        <h2 className="text-lg font-bold text-navy-900 mb-3">Licenses Required</h2>h2>
                                        <div className="space-y-3">
                                          {job.licenses_required.map((license) => (
                                              license !== 'None Required' && (
                                                                      <div
                                                                                                key={license}
                                                                                                className="rounded-lg border border-amber-200 bg-amber-50 p-4"
                                                                                              >
                                                                                              <div className="flex items-center gap-2 mb-1">
                                                                                                                        <svg className="h-4 w-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                                                                                                          </svg>svg>
                                                                                                                        <p className="font-semibold text-amber-900">{license}</p>p>
                                                                                                </div>div>
                                                                        {job.licenses_info && typeof job.licenses_info === 'object' && (
                                                                                                                          <div className="text-sm text-amber-800 mt-2 space-y-1">
                                                                                                                            {job.licenses_info.study_time_days !== null && (
                                                                                                                                                          <p><span className="font-medium">Study Time:</span>span> {job.licenses_info.study_time_days} days</p>p>
                                                                                                                                                      )}
                                                                                                                            {job.licenses_info.pass_deadline_days !== null && (
                                                                                                                                                          <p><span className="font-medium">Pass Deadline:</span>span> {job.licenses_info.pass_deadline_days} days</p>p>
                                                                                                                                                      )}
                                                                                                                            {job.licenses_info.max_attempts !== null && (
                                                                                                                                                          <p><span className="font-medium">Max Attempts:</span>span> {job.licenses_info.max_attempts}</p>p>
                                                                                                                                                      )}
                                                                                                                            {job.licenses_info.prep_materials_paid !== null && (
                                                                                                                                                          <p><span className="font-medium">Prep Materials Paid:</span>span> {job.licenses_info.prep_materials_paid ? 'Yes' : 'No'}</p>p>
                                                                                                                                                      )}
                                                                                                                            {job.licenses_info.notes && (
                                                                                                                                                          <p><span className="font-medium">Notes:</span>span> {job.licenses_info.notes}</p>p>
                                                                                                                                                      )}
                                                                                                                            </div>div>
                                                                                              )}
                                                                      </div>div>
                                                                    )
                                            ))}
                                        </div>div>
                        </div>div>
                                            )}
                                
                                  {/* Graduation Date + Experience in a grid */}
                                  {(job.grad_date_required || job.years_experience_max !== null) && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {job.grad_date_required && (job.grad_date_earliest || job.grad_date_latest) && (
                                            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                                                                <h3 className="font-semibold text-yellow-900 mb-2 text-sm">Graduation Date</h3>h3>
                                                                <div className="text-sm text-yellow-800 space-y-1">
                                                                  {job.grad_date_earliest && (
                                                                      <p>Earliest: {formatDate(job.grad_date_earliest)}</p>p>
                                                                                      )}
                                                                  {job.grad_date_latest && (
                                                                      <p>Latest: {formatDate(job.grad_date_latest)}</p>p>
                                                                                      )}
                                                                </div>div>
                                            </div>div>
                                        )}
                          {job.years_experience_max !== null && (
                                            <div className="rounded-lg border border-navy-200 bg-navy-50 p-4">
                                                                <h3 className="font-semibold text-navy-900 mb-2 text-sm">Experience</h3>h3>
                                                                <p className="text-sm text-navy-700">
                                                                  {job.years_experience_max === 0 ? 'No experience required' : `Up to ${job.years_experience_max} year${job.years_experience_max > 1 ? 's' : ''}`}
                                                                </p>p>
                                            </div>div>
                                        )}
                        </div>div>
                                            )}
                                
                                  {/* Company Info */}
                                  {job.company?.description && (
                        <div className="rounded-lg border border-navy-200 bg-navy-50/50 p-6">
                                        <h2 className="text-lg font-bold text-navy-900 mb-3">
                                                          About {job.company.name}
                                        </h2>h2>
                                        <p className="text-navy-700 leading-relaxed text-sm">
                                          {job.company.description}
                                        </p>p>
                          {job.company.careers_url && (
                                            <a
                                                                  href={job.company.careers_url}
                                                                  target="_blank"
                                                                  rel="noopener noreferrer"
                                                                  className="inline-flex items-center gap-1 mt-4 text-sm font-medium text-navy-600 hover:text-navy-900 transition"
                                                                >
                                                                View all jobs at {job.company.name}
                                                                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                                </svg>svg>
                                            </a>a>
                                        )}
                        </div>div>
                                            )}
                                </div>div>
                      
                        {/* Similar Jobs */}
                                <div className="p-6 sm:p-8 border-t border-navy-100">
                                            <SimilarJobs jobId={job.id} />
                                </div>div>
                      
                        {/* Apply Footer */}
                                <div className="p-6 sm:p-8 bg-navy-50 border-t border-navy-200">
                                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                                          <div className="text-sm text-navy-600 space-y-0.5 text-center sm:text-left">
                                                                          <p>Posted {timeAgo(job.posted_date)}</p>p>
                                                            {job.last_verified_at && (
                            <p>Last verified {timeAgo(job.last_verified_at)}</p>p>
                                                                          )}
                                                          </div>div>
                                              {applyUrl && (
                          <a
                                              href={applyUrl}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg bg-emerald-600 px-8 py-3.5 text-base font-semibold text-white hover:bg-emerald-700 transition shadow-sm"
                                            >
                                            Apply on Company Site
                                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                            </svg>svg>
                          </a>a>
                                                          )}
                                            </div>div>
                                </div>div>
                      </div>div>
              </div>div>
        </div>div>
      )
}</div>
