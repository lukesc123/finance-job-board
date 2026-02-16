import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { timeAgo, formatSalary, formatDate, isGenericApplyUrl, slugify, getPipelineStageBadgeColor, extractHostname } from '@/lib/formatting'
import { Job } from '@/types'
import dynamic from 'next/dynamic'

const SimilarJobs = dynamic(() => import('@/components/SimilarJobs'), {
  loading: () => (
    <div className="animate-pulse space-y-3">
      <div className="h-5 w-32 bg-navy-100 rounded" />
      <div className="grid grid-cols-2 gap-3">
        {[1,2,3,4].map(i => <div key={i} className="h-24 bg-navy-100 rounded-lg" />)}
      </div>
    </div>
  ),
})
import JobDetailActions from '@/components/JobDetailActions'
import TrackView from '@/components/TrackView'
import JobDescription from '@/components/JobDescription'
import { SITE_URL, CONTACT_EMAIL } from "@/lib/constants"

export const revalidate = 300

interface JobDetailPageProps {
  params: Promise<{ id: string }>
}


async function getJobData(id: string): Promise<Job | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('jobs')
      .select('*, company:company_id(*)')
      .eq('id', id)
      .single()

    if (error || !data) return null
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
      robots: { index: false, follow: false },
    }
  }

  const companyName = job.company?.name || 'Company'
  const salaryMeta = job.salary_min && job.salary_max
    ? ` ${formatSalary(job.salary_min, job.salary_max)}.`
    : ''
  const locationMeta = job.location ? ` in ${job.location}` : ''
  const rawDesc = (job.description || '').replace(/[#*_\[\]<>]/g, '').replace(/\s+/g, ' ').trim()
  const snippet = rawDesc.length > 80 ? rawDesc.substring(0, 80).trim() + '...' : rawDesc
  const fallback = !snippet ? ` ${job.pipeline_stage} ${job.job_type} position. Apply now on FinanceJobs.` : ''
  const description = `${job.title} at ${companyName}${locationMeta}.${salaryMeta}${snippet ? ` ${snippet}` : fallback}`
  const title = `${job.title} at ${companyName} | FinanceJobs`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      url: `${SITE_URL}/jobs/${id}`,
      siteName: 'FinanceJobs',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
    alternates: { canonical: `${SITE_URL}/jobs/${id}` },
  }
}

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const { id } = await params
  const job = await getJobData(id)

  if (!job) notFound()

  const salary = formatSalary(job.salary_min, job.salary_max)
  const applyUrl = job.apply_url
    ? (job.apply_url.startsWith('http') ? job.apply_url : 'https://' + job.apply_url)
    : null
  const applyDomain = applyUrl ? extractHostname(applyUrl) : ''
  const badgeColor = getPipelineStageBadgeColor(job.pipeline_stage)
  const hasLicenseInfo = job.licenses_required && job.licenses_required.length > 0 && !job.licenses_required.every(l => l === 'None Required')


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
    ...(job.remote_type === 'Remote' && {
      jobLocationType: 'TELECOMMUTE',
      applicantLocationRequirements: { '@type': 'Country', name: 'US' },
    }),
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
    url: `${SITE_URL}/jobs/${job.id}`,
    validThrough: new Date(new Date(job.posted_date).getTime() + 90 * 86400000).toISOString(),
    industry: 'Financial Services',
  }

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Jobs', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: job.category, item: `${SITE_URL}/category/${slugify(job.category)}` },
      { '@type': 'ListItem', position: 3, name: job.title },
    ],
  }

  return (
    <div className="min-h-screen bg-navy-50 pb-16 sm:pb-0">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <TrackView
        jobId={job.id}
        jobTitle={job.title}
        companyName={job.company?.name || 'Company'}
        location={job.location}
        salary={salary || ''}
        pipelineStage={job.pipeline_stage}
      />

      {/* Breadcrumb navigation */}
      <div className="bg-white border-b border-navy-200/60">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center gap-1.5 text-sm" aria-label="Breadcrumb">
            <Link href="/" className="font-medium text-navy-500 hover:text-navy-800 transition inline-flex items-center gap-1">
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Jobs
            </Link>
            <svg className="h-3.5 w-3.5 text-navy-300" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <Link href={`/category/${slugify(job.category)}`} className="font-medium text-navy-500 hover:text-navy-800 transition">
              {job.category}
            </Link>
            <svg className="h-3.5 w-3.5 text-navy-300" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-navy-400 truncate max-w-[200px] sm:max-w-none" aria-current="page">{job.title}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="bg-white rounded-xl border border-navy-200 overflow-hidden shadow-sm">
          {/* Header */}
          <div className="p-5 sm:p-8 border-b border-navy-100">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-3">
                  <span className={`inline-block rounded-lg border px-2.5 py-1 text-xs font-semibold ${badgeColor}`}>
                    {job.pipeline_stage}
                  </span>
                  <span className="text-xs text-navy-400">
                    Posted {timeAgo(job.posted_date)}
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-bold text-navy-900 mb-1.5 leading-tight">{job.title}</h1>

                <div className="flex items-center gap-2 flex-wrap">
                  {job.company?.logo_url && (
                    <Image src={job.company.logo_url} alt={`${job.company.name} logo`} width={20} height={20} className="h-5 w-5 rounded object-contain" />
                  )}
                  <Link
                    href={`/companies/${slugify(job.company?.name || '')}`}
                    className="text-base font-semibold text-navy-700 hover:text-navy-900 transition underline decoration-navy-200 hover:decoration-navy-400"
                  >
                    {job.company?.name}
                  </Link>
                  {job.company?.website && (
                    <a
                      href={job.company.website}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="text-navy-400 hover:text-navy-600 transition"
                      title={`Visit ${job.company.name} website`}
                      aria-label={`Visit ${job.company.name} website (opens in new tab)`}
                    >
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  )}
                </div>
              </div>

              {/* Apply Button - Desktop */}
              {applyUrl && (
                <div className="hidden sm:flex flex-col items-end gap-1.5 shrink-0">
                  <a
                    href={applyUrl}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    aria-label={`${isGenericApplyUrl(applyUrl) ? 'Careers' : 'Apply'} at ${job.company?.name || 'Company'} (opens in new tab)`}
                    className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-700 transition shadow-sm"
                  >
                    {isGenericApplyUrl(applyUrl) ? `Careers at ${job.company?.name || 'Company'}` : `Apply at ${job.company?.name || 'Company'}`}
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                  <span className="text-[11px] text-navy-400 flex items-center gap-1">
                    {isGenericApplyUrl(applyUrl) ? (
                      <>
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        Opens {job.company?.name} careers page
                      </>
                    ) : applyDomain ? (
                      <>
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        {applyDomain}
                      </>
                    ) : null}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="px-5 sm:px-8 py-3 border-b border-navy-100 bg-navy-50/30">
            <JobDetailActions
              jobId={job.id}
              jobTitle={job.title}
              companyName={job.company?.name || 'Company'}
              postedDate={job.posted_date}
            />
          </div>

          {/* Key Metadata Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-navy-100 border-b border-navy-100">
            <div className="p-3.5 sm:p-4 text-center">
              <p className="text-[10px] font-semibold text-navy-400 uppercase tracking-wider mb-0.5">Location</p>
              <Link href={`/location/${slugify(job.location)}`} className="text-sm font-semibold text-navy-900 hover:text-navy-700 hover:underline transition">
                {job.location}
              </Link>
            </div>
            <div className="p-3.5 sm:p-4 text-center">
              <p className="text-[10px] font-semibold text-navy-400 uppercase tracking-wider mb-0.5">Work Style</p>
              <p className="text-sm font-semibold text-navy-900">{job.remote_type}</p>
            </div>
            <div className="p-3.5 sm:p-4 text-center">
              <p className="text-[10px] font-semibold text-navy-400 uppercase tracking-wider mb-0.5">Job Type</p>
              <p className="text-sm font-semibold text-navy-900">{job.job_type}</p>
            </div>
            {salary ? (
              <div className="p-3.5 sm:p-4 text-center bg-emerald-50/50">
                <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider mb-0.5">Salary</p>
                <p className="text-sm font-bold text-emerald-700">{salary}</p>
              </div>
            ) : (
              <div className="p-3.5 sm:p-4 text-center">
                <p className="text-[10px] font-semibold text-navy-400 uppercase tracking-wider mb-0.5">Category</p>
                <Link href={`/category/${slugify(job.category)}`} className="text-sm font-semibold text-navy-900 hover:text-navy-700 hover:underline transition">
                  {job.category}
                </Link>
              </div>
            )}
          </div>

          {/* Content Body */}
          <div className="p-5 sm:p-8 space-y-8">
            {/* Description */}
            <div>
              <h2 className="text-lg font-bold text-navy-900 mb-3">About this role</h2>
              <JobDescription text={job.description} />
            </div>

            {/* Licenses Required */}
            {hasLicenseInfo && (
              <div>
                <h2 className="text-lg font-bold text-navy-900 mb-3">Licenses Required</h2>
                <div className="space-y-3">
                  {job.licenses_required.map((license) => (
                    license !== 'None Required' && (
                      <div key={license} className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <svg className="h-4 w-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                          <p className="font-semibold text-amber-900">{license}</p>
                        </div>
                        {job.licenses_info && typeof job.licenses_info === 'object' && (
                          <div className="text-sm text-amber-800 mt-2 space-y-1">
                            {job.licenses_info.study_time_days !== null && (
                              <p><span className="font-medium">Study Time:</span> {job.licenses_info.study_time_days} days</p>
                            )}
                            {job.licenses_info.pass_deadline_days !== null && (
                              <p><span className="font-medium">Pass Deadline:</span> {job.licenses_info.pass_deadline_days} days</p>
                            )}
                            {job.licenses_info.max_attempts !== null && (
                              <p><span className="font-medium">Max Attempts:</span> {job.licenses_info.max_attempts}</p>
                            )}
                            {job.licenses_info.prep_materials_paid !== null && (
                              <p><span className="font-medium">Prep Materials Paid:</span> {job.licenses_info.prep_materials_paid ? 'Yes' : 'No'}</p>
                            )}
                            {job.licenses_info.notes && (
                              <p><span className="font-medium">Notes:</span> {job.licenses_info.notes}</p>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  ))}
                </div>
              </div>
            )}

            {/* Graduation Date + Experience */}
            {(job.grad_date_required || job.years_experience_max !== null) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {job.grad_date_required && (job.grad_date_earliest || job.grad_date_latest) && (
                  <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                    <h3 className="font-semibold text-yellow-900 mb-2 text-sm">Graduation Date</h3>
                    <div className="text-sm text-yellow-800 space-y-1">
                      {job.grad_date_earliest && <p>Earliest: {formatDate(job.grad_date_earliest)}</p>}
                      {job.grad_date_latest && <p>Latest: {formatDate(job.grad_date_latest)}</p>}
                    </div>
                  </div>
                )}
                {job.years_experience_max !== null && (
                  <div className="rounded-lg border border-navy-200 bg-navy-50 p-4">
                    <h3 className="font-semibold text-navy-900 mb-2 text-sm">Experience</h3>
                    <p className="text-sm text-navy-700">
                      {job.years_experience_max === 0 ? 'No experience required' : `Up to ${job.years_experience_max} year${job.years_experience_max > 1 ? 's' : ''}`}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Company Info */}
            {job.company?.description && (
              <div className="rounded-lg border border-navy-200 bg-navy-50/50 p-5">
                <h2 className="text-lg font-bold text-navy-900 mb-2">About {job.company.name}</h2>
                <p className="text-navy-700 leading-relaxed text-sm">{job.company.description}</p>
                <div className="flex items-center gap-4 mt-3">
                  <Link
                    href={`/companies/${slugify(job.company.name)}`}
                    className="inline-flex items-center gap-1 text-sm font-medium text-navy-600 hover:text-navy-900 transition"
                  >
                    View all {job.company.name} jobs on FinanceJobs
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                  {job.company.careers_url && (
                    <a
                      href={job.company.careers_url}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      aria-label={`${job.company.name} careers page (opens in new tab)`}
                      className="inline-flex items-center gap-1 text-sm font-medium text-navy-400 hover:text-navy-600 transition"
                    >
                      {job.company.name} Careers
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Similar Jobs */}
          <div className="p-5 sm:p-8 border-t border-navy-100">
            <SimilarJobs jobId={job.id} />
          </div>

          {/* Browse More Links */}
          <div className="px-5 sm:px-8 py-5 border-t border-navy-100">
            <h3 className="text-sm font-bold text-navy-900 mb-3">Browse More</h3>
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/category/${slugify(job.category)}`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-navy-200 bg-white px-3 py-2 text-xs font-medium text-navy-700 hover:bg-navy-50 hover:border-navy-300 transition"
              >
                <svg className="h-3.5 w-3.5 text-navy-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                All {job.category} Jobs
              </Link>
              <Link
                href={`/location/${slugify(job.location)}`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-navy-200 bg-white px-3 py-2 text-xs font-medium text-navy-700 hover:bg-navy-50 hover:border-navy-300 transition"
              >
                <svg className="h-3.5 w-3.5 text-navy-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                Jobs in {job.location}
              </Link>
              {job.company?.name && (
                <Link
                  href={`/companies/${slugify(job.company.name)}`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-navy-200 bg-white px-3 py-2 text-xs font-medium text-navy-700 hover:bg-navy-50 hover:border-navy-300 transition"
                >
                  <svg className="h-3.5 w-3.5 text-navy-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                  All {job.company.name} Jobs
                </Link>
              )}
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 rounded-lg border border-navy-200 bg-white px-3 py-2 text-xs font-medium text-navy-700 hover:bg-navy-50 hover:border-navy-300 transition"
              >
                <svg className="h-3.5 w-3.5 text-navy-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                Browse All Jobs
              </Link>
            </div>
          </div>

          {/* Apply Footer */}
          <div className="p-5 sm:p-8 bg-navy-50 border-t border-navy-200">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-navy-500 space-y-1 text-center sm:text-left">
                <p>Posted {timeAgo(job.posted_date)}</p>
                {job.last_verified_at && <p>Verified {timeAgo(job.last_verified_at)}</p>}
                <a
                  href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(`Issue with listing: ${job.title} at ${job.company?.name || 'Company'}`)}&body=${encodeURIComponent(`Job URL: ${SITE_URL}/jobs/${job.id}\n\nPlease describe the issue:\n`)}`}
                  className="text-xs text-navy-400 hover:text-navy-600 transition underline underline-offset-2 inline-flex items-center gap-1"
                >
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  Report an issue with this listing
                </a>
              </div>
              {applyUrl && (
                <div className="flex flex-col items-center sm:items-end gap-1">
                  <a
                    href={applyUrl}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    aria-label={`${isGenericApplyUrl(applyUrl) ? 'Careers' : 'Apply'} at ${job.company?.name || 'Company'} (opens in new tab)`}
                    className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg bg-emerald-600 px-8 py-3 text-sm font-semibold text-white hover:bg-emerald-700 transition shadow-sm"
                  >
                    {isGenericApplyUrl(applyUrl) ? `Careers at ${job.company?.name || 'Company'}` : `Apply at ${job.company?.name || 'Company'}`}
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                  <span className="text-[11px] text-navy-400 flex items-center gap-1">
                    {isGenericApplyUrl(applyUrl) ? (
                      <>
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        Opens {job.company?.name} careers page
                      </>
                    ) : applyDomain ? (
                      <>
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        Opens {applyDomain}
                      </>
                    ) : null}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Mobile Apply Bar */}
      {applyUrl && (
        <div className="fixed bottom-0 left-0 right-0 z-40 sm:hidden bg-white border-t border-navy-200 px-4 py-3 shadow-[0_-4px_12px_rgba(0,0,0,0.08)]">
          <a
            href={applyUrl}
            target="_blank"
            rel="noopener noreferrer nofollow"
            aria-label={`${isGenericApplyUrl(applyUrl) ? 'Careers' : 'Apply'} at ${job.company?.name || 'Company'} (opens in new tab)`}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-700 transition shadow-sm"
          >
            {isGenericApplyUrl(applyUrl) ? (
              <>
                <svg className="h-4 w-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Careers at {job.company?.name || 'Company'}
              </>
            ) : (
              <>Apply at {job.company?.name || 'Company'}</>
            )}
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      )}
    </div>
  )
}
