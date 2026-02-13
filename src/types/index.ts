// === Company ===

export interface Company {
  id: string
  name: string
  website: string
  careers_url: string
  logo_url: string | null
  description: string | null
  created_at: string
}

// === Job Listing ===

export interface Job {
  id: string
  company_id: string
  title: string
  category: JobCategory
  location: string
  remote_type: RemoteType
  salary_min: number | null
  salary_max: number | null
  job_type: JobType
  pipeline_stage: PipelineStage
  description: string
  apply_url: string
  source_url: string
  is_active: boolean
  is_verified: boolean
  grad_date_required: boolean
  grad_date_earliest: string | null
  grad_date_latest: string | null
  years_experience_max: number | null
  licenses_required: FinanceLicense[]
  licenses_info: LicenseInfo | null
  posted_date: string
  last_verified_at: string
  removal_detected_at: string | null
  verification_count: number
  created_at: string
  updated_at: string
  company?: Company
}
export interface LicenseInfo {
  study_time_days: number | null
  pass_deadline_days: number | null
  max_attempts: number | null
  prep_materials_paid: boolean | null
  notes: string | null
}
export type JobCategory = 'Investment Banking'|'Private Wealth'|'Accounting'|'Private Equity'|'Venture Capital'|'Corporate Finance'|'Consulting'|'Financial Planning'|'Insurance'|'Commercial Banking'|'Sales & Trading'|'Research'|'Risk Management'|'Operations'|'Other'
export type JobType = 'Full-time'|'Internship'|'Contract'|'Part-time'
export type PipelineStage = 'Sophomore Internship'|'Junior Internship'|'Senior Internship'|'New Grad'|'No Experience Required'|'Early Career'
export type RemoteType = 'On-site'|'Remote'|'Hybrid'
export type FinanceLicense = 'SIE'|'Series 6'|'Series 7'|'Series 63'|'Series 65'|'Series 66'|'Series 79'|'Series 3'|'CPA'|'CPA Track'|'CFA Level 1'|'None Required'
export interface JobFilters { category: JobCategory|''; job_type: JobType|''; pipeline_stage: PipelineStage|''; remote_type: RemoteType|''; license: FinanceLicense|''; search: string; grad_date: string; salary_min: string; salary_max: string }
export const JOB_CATEGORIES: JobCategory[] = ['Investment Banking','Private Wealth','Accounting','Private Equity','Venture Capital','Corporate Finance','Consulting','Financial Planning','Insurance','Commercial Banking','Sales & Trading','Research','Risk Management','Operations','Other']
export const JOB_TYPES: JobType[] = ['Full-time','Internship','Contract','Part-time']
export const PIPELINE_STAGES: PipelineStage[] = ['Sophomore Internship','Junior Internship','Senior Internship','New Grad','No Experience Required','Early Career']
export const REMOTE_TYPES: RemoteType[] = ['On-site','Remote','Hybrid']
export const FINANCE_LICENSES: FinanceLicense[] = ['SIE','Series 6','Series 7','Series 63','Series 65','Series 66','Series 79','Series 3','CPA','CPA Track','CFA Level 1','None Required']
