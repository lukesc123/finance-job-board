'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Job,
  Company,
  JobCategory,
  JobType,
  PipelineStage,
  RemoteType,
  FinanceLicense,
  LicenseInfo,
  JOB_CATEGORIES,
  JOB_TYPES,
  PIPELINE_STAGES,
  REMOTE_TYPES,
  FINANCE_LICENSES,
} from '@/types'

function getToken() {
  return localStorage.getItem('admin_token') || ''
}

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getToken()}`,
  }
}

interface JobFormData {
  company_id: string
  title: string
  category: JobCategory
  location: string
  remote_type: RemoteType
  salary_min: string
  salary_max: string
  job_type: JobType
  pipeline_stage: PipelineStage
  grad_date_required: boolean
  grad_date_earliest: string
  grad_date_latest: string
  years_experience_max: string
  licenses_required: FinanceLicense[]
  licenses_info: {
    study_time_days: string
    pass_deadline_days: string
    max_attempts: string
    prep_materials_paid: boolean
    notes: string
  }
  description: string
  apply_url: string
  source_url: string
  posted_date: string
}

interface CompanyFormData {
  name: string
  website: string
  careers_url: string
  logo_url: string
  description: string
}

const emptyJob: JobFormData = {
  company_id: '',
  title: '',
  category: 'Investment Banking',
  location: '',
  remote_type: 'On-site',
  salary_min: '',
  salary_max: '',
  job_type: 'Full-time',
  pipeline_stage: 'New Grad',
  grad_date_required: false,
  grad_date_earliest: '',
  grad_date_latest: '',
  years_experience_max: '',
  licenses_required: [],
  licenses_info: {
    study_time_days: '',
    pass_deadline_days: '',
    max_attempts: '',
    prep_materials_paid: false,
    notes: '',
  },
  description: '',
  apply_url: '',
  source_url: '',
  posted_date: new Date().toISOString().split('T')[0],
}

const emptyCompany: CompanyFormData = {
  name: '',
  website: '',
  careers_url: '',
  logo_url: '',
  description: '',
}

type Tab = 'jobs' | 'companies'

export default function AdminDashboard() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('jobs')
  const [jobs, setJobs] = useState<Job[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)

  // Job form
  const [jobForm, setJobForm] = useState<JobFormData>(emptyJob)
  const [editingJobId, setEditingJobId] = useState<string | null>(null)
  const [showJobForm, setShowJobForm] = useState(false)

  // Company form
  const [companyForm, setCompanyForm] = useState<CompanyFormData>(emptyCompany)
  const [editingCompanyId, setEditingCompanyId] = useState<string | null>(null)
  const [showCompanyForm, setShowCompanyForm] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [jobsRes, companiesRes] = await Promise.all([
        fetch('/api/jobs'),
        fetch('/api/companies'),
      ])
      const [jobsData, companiesData] = await Promise.all([
        jobsRes.json(),
        companiesRes.json(),
      ])
      setJobs(Array.isArray(jobsData) ? jobsData : [])
      setCompanies(Array.isArray(companiesData) ? companiesData : [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('admin_token')
    router.push('/admin/login')
  }

  // ---- Jobs CRUD ----
  const handleSaveJob = async () => {
    try {
      const method = editingJobId ? 'PUT' : 'POST'
      const payload = {
        ...jobForm,
        salary_min: jobForm.salary_min ? parseInt(jobForm.salary_min) : null,
        salary_max: jobForm.salary_max ? parseInt(jobForm.salary_max) : null,
        years_experience_max: jobForm.years_experience_max
          ? parseInt(jobForm.years_experience_max)
          : null,
        grad_date_earliest: jobForm.grad_date_earliest || null,
        grad_date_latest: jobForm.grad_date_latest || null,
        licenses_info: jobForm.licenses_info.study_time_days ||
          jobForm.licenses_info.pass_deadline_days ||
          jobForm.licenses_info.notes ? {
          study_time_days: jobForm.licenses_info.study_time_days
            ? parseInt(jobForm.licenses_info.study_time_days)
            : null,
          pass_deadline_days: jobForm.licenses_info.pass_deadline_days
            ? parseInt(jobForm.licenses_info.pass_deadline_days)
            : null,
          max_attempts: jobForm.licenses_info.max_attempts
            ? parseInt(jobForm.licenses_info.max_attempts)
            : null,
          prep_materials_paid: jobForm.licenses_info.prep_materials_paid,
          notes: jobForm.licenses_info.notes || null,
        } : null,
        ...(editingJobId && { id: editingJobId }),
      }

      const res = await fetch('/api/jobs', {
        method,
        headers: authHeaders(),
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error('Failed to save job')

      setShowJobForm(false)
      setEditingJobId(null)
      setJobForm(emptyJob)
      fetchData()
    } catch (error) {
      console.error('Error saving job:', error)
      alert('Failed to save job')
    }
  }

  const handleEditJob = (job: Job) => {
    setEditingJobId(job.id)
    setJobForm({
      company_id: job.company_id,
      title: job.title,
      category: job.category,
      location: job.location,
      remote_type: job.remote_type,
      salary_min: job.salary_min?.toString() || '',
      salary_max: job.salary_max?.toString() || '',
      job_type: job.job_type,
      pipeline_stage: job.pipeline_stage,
      grad_date_required: job.grad_date_required,
      grad_date_earliest: job.grad_date_earliest || '',
      grad_date_latest: job.grad_date_latest || '',
      years_experience_max: job.years_experience_max?.toString() || '',
      licenses_required: job.licenses_required || [],
      licenses_info: job.licenses_info
        ? {
            study_time_days: job.licenses_info.study_time_days?.toString() || '',
            pass_deadline_days: job.licenses_info.pass_deadline_days?.toString() || '',
            max_attempts: job.licenses_info.max_attempts?.toString() || '',
            prep_materials_paid: job.licenses_info.prep_materials_paid || false,
            notes: job.licenses_info.notes || '',
          }
        : {
            study_time_days: '',
            pass_deadline_days: '',
            max_attempts: '',
            prep_materials_paid: false,
            notes: '',
          },
      description: job.description,
      apply_url: job.apply_url,
      source_url: job.source_url,
      posted_date: job.posted_date?.split('T')[0] || '',
    })
    setShowJobForm(true)
  }

  const handleDeleteJob = async (id: string) => {
    if (!confirm('Delete this job listing?')) return
    try {
      const res = await fetch(`/api/jobs?id=${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })
      if (!res.ok) throw new Error('Failed to delete')
      fetchData()
    } catch (error) {
      console.error('Error deleting job:', error)
    }
  }

  // ---- Companies CRUD ----
  const handleSaveCompany = async () => {
    try {
      const method = editingCompanyId ? 'PUT' : 'POST'
      const payload = editingCompanyId
        ? { ...companyForm, id: editingCompanyId }
        : companyForm

      const res = await fetch('/api/companies', {
        method,
        headers: authHeaders(),
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Failed to save company')
      setShowCompanyForm(false)
      setEditingCompanyId(null)
      setCompanyForm(emptyCompany)
      fetchData()
    } catch (error) {
      console.error('Error saving company:', error)
      alert('Failed to save company')
    }
  }

  const handleEditCompany = (company: Company) => {
    setEditingCompanyId(company.id)
    setCompanyForm({
      name: company.name,
      website: company.website,
      careers_url: company.careers_url,
      logo_url: company.logo_url || '',
      description: company.description || '',
    })
    setShowCompanyForm(true)
  }

  const handleDeleteCompany = async (id: string) => {
    if (!confirm('Delete this company?')) return
    try {
      const res = await fetch(`/api/companies?id=${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })
      if (!res.ok) throw new Error('Failed to delete')
      fetchData()
    } catch (error) {
      console.error('Error deleting company:', error)
    }
  }

  const toggleLicense = (license: FinanceLicense) => {
    const updated = jobForm.licenses_required.includes(license)
      ? jobForm.licenses_required.filter((l) => l !== license)
      : [...jobForm.licenses_required, license]
    setJobForm({ ...jobForm, licenses_required: updated })
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-navy-200 border-t-navy-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-navy-50">
      {/* Header */}
      <div className="border-b border-navy-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <h1 className="text-xl font-bold text-navy-900">Admin Dashboard</h1>
          <button
            onClick={handleLogout}
            className="text-sm text-navy-600 hover:text-navy-900 transition"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        {/* Tabs */}
        <div className="mb-6 flex gap-1 rounded-lg bg-navy-100 p-1">
          {(['jobs', 'companies'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 rounded-md py-2 text-sm font-medium capitalize transition ${
                tab === t
                  ? 'bg-white text-navy-900 shadow-sm'
                  : 'text-navy-700 hover:text-navy-900'
              }`}
            >
              {t} ({t === 'jobs' ? jobs.length : companies.length})
            </button>
          ))}
        </div>

        {/* Jobs Tab */}
        {tab === 'jobs' && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-navy-900">Job Listings</h2>
              <button
                onClick={() => {
                  setEditingJobId(null)
                  setJobForm(emptyJob)
                  setShowJobForm(true)
                }}
                className="rounded-lg bg-navy-900 px-4 py-2 text-sm font-medium text-white hover:bg-navy-800 transition"
              >
                + Add Job
              </button>
            </div>

            {/* Job Form Modal */}
            {showJobForm && (
              <div className="mb-6 rounded-lg border border-navy-200 bg-white p-6">
                <h3 className="mb-4 text-base font-semibold text-navy-900">
                  {editingJobId ? 'Edit Job' : 'New Job'}
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* Company */}
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs font-medium text-navy-700">
                      Company
                    </label>
                    <select
                      value={jobForm.company_id}
                      onChange={(e) =>
                        setJobForm({ ...jobForm, company_id: e.target.value })
                      }
                      className="w-full rounded-lg border border-navy-200 px-3 py-2 text-sm text-navy-900 focus:border-navy-500 focus:outline-none focus:ring-2 focus:ring-navy-500/20"
                    >
                      <option value="">Select company...</option>
                      {companies.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Title */}
                  <div>
                    <label className="mb-1 block text-xs font-medium text-navy-700">
                      Job Title
                    </label>
                    <input
                      value={jobForm.title}
                      onChange={(e) =>
                        setJobForm({ ...jobForm, title: e.target.value })
                      }
                      placeholder="Financial Analyst"
                      className="w-full rounded-lg border border-navy-200 px-3 py-2 text-sm text-navy-900 focus:border-navy-500 focus:outline-none focus:ring-2 focus:ring-navy-500/20"
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="mb-1 block text-xs font-medium text-navy-700">
                      Category
                    </label>
                    <select
                      value={jobForm.category}
                      onChange={(e) =>
                        setJobForm({ ...jobForm, category: e.target.value as JobCategory })
                      }
                      className="w-full rounded-lg border border-navy-200 px-3 py-2 text-sm text-navy-900 focus:border-navy-500 focus:outline-none focus:ring-2 focus:ring-navy-500/20"
                    >
                      {JOB_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Location */}
                  <div>
                    <label className="mb-1 block text-xs font-medium text-navy-700">
                      Location
                    </label>
                    <input
                      value={jobForm.location}
                      onChange={(e) =>
                        setJobForm({ ...jobForm, location: e.target.value })
                      }
                      placeholder="New York, NY"
                      className="w-full rounded-lg border border-navy-200 px-3 py-2 text-sm text-navy-900 focus:border-navy-500 focus:outline-none focus:ring-2 focus:ring-navy-500/20"
                    />
                  </div>

                  {/* Remote Type */}
                  <div>
                    <label className="mb-1 block text-xs font-medium text-navy-700">
                      Remote Type
                    </label>
                    <select
                      value={jobForm.remote_type}
                      onChange={(e) =>
                        setJobForm({ ...jobForm, remote_type: e.target.value as RemoteType })
                      }
                      className="w-full rounded-lg border border-navy-200 px-3 py-2 text-sm text-navy-900 focus:border-navy-500 focus:outline-none focus:ring-2 focus:ring-navy-500/20"
                    >
                      {REMOTE_TYPES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Job Type */}
                  <div>
                    <label className="mb-1 block text-xs font-medium text-navy-700">
                      Job Type
                    </label>
                    <select
                      value={jobForm.job_type}
                      onChange={(e) =>
                        setJobForm({ ...jobForm, job_type: e.target.value as JobType })
                      }
                      className="w-full rounded-lg border border-navy-200 px-3 py-2 text-sm text-navy-900 focus:border-navy-500 focus:outline-none focus:ring-2 focus:ring-navy-500/20"
                    >
                      {JOB_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Pipeline Stage */}
                  <div>
                    <label className="mb-1 block text-xs font-medium text-navy-700">
                      Pipeline Stage
                    </label>
                    <select
                      value={jobForm.pipeline_stage}
                      onChange={(e) =>
                        setJobForm({ ...jobForm, pipeline_stage: e.target.value as PipelineStage })
                      }
                      className="w-full rounded-lg border border-navy-200 px-3 py-2 text-sm text-navy-900 focus:border-navy-500 focus:outline-none focus:ring-2 focus:ring-navy-500/20"
                    >
                      {PIPELINE_STAGES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Salary Min */}
                  <div>
                    <label className="mb-1 block text-xs font-medium text-navy-700">
                      Salary Min
                    </label>
                    <input
                      type="number"
                      value={jobForm.salary_min}
                      onChange={(e) =>
                        setJobForm({ ...jobForm, salary_min: e.target.value })
                      }
                      placeholder="60000"
                      className="w-full rounded-lg border border-navy-200 px-3 py-2 text-sm text-navy-900 focus:border-navy-500 focus:outline-none focus:ring-2 focus:ring-navy-500/20"
                    />
                  </div>

                  {/* Salary Max */}
                  <div>
                    <label className="mb-1 block text-xs font-medium text-navy-700">
                      Salary Max
                    </label>
                    <input
                      type="number"
                      value={jobForm.salary_max}
                      onChange={(e) =>
                        setJobForm({ ...jobForm, salary_max: e.target.value })
                      }
                      placeholder="85000"
                      className="w-full rounded-lg border border-navy-200 px-3 py-2 text-sm text-navy-900 focus:border-navy-500 focus:outline-none focus:ring-2 focus:ring-navy-500/20"
                    />
                  </div>

                  {/* Graduation Date Required */}
                  <div className="sm:col-span-2 flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="grad_date_required"
                      checked={jobForm.grad_date_required}
                      onChange={(e) =>
                        setJobForm({ ...jobForm, grad_date_required: e.target.checked })
                      }
                      className="h-4 w-4 rounded border-navy-300 text-navy-600"
                    />
                    <label
                      htmlFor="grad_date_required"
                      className="text-sm font-medium text-navy-700"
                    >
                      Graduation Date Required
                    </label>
                  </div>

                  {/* Graduation Date Range */}
                  {jobForm.grad_date_required && (
                    <>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-navy-700">
                          Earliest Grad Date
                        </label>
                        <input
                          type="date"
                          value={jobForm.grad_date_earliest}
                          onChange={(e) =>
                            setJobForm({ ...jobForm, grad_date_earliest: e.target.value })
                          }
                          className="w-full rounded-lg border border-navy-200 px-3 py-2 text-sm text-navy-900 focus:border-navy-500 focus:outline-none focus:ring-2 focus:ring-navy-500/20"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-navy-700">
                          Latest Grad Date
                        </label>
                        <input
                          type="date"
                          value={jobForm.grad_date_latest}
                          onChange={(e) =>
                            setJobForm({ ...jobForm, grad_date_latest: e.target.value })
                          }
                          className="w-full rounded-lg border border-navy-200 px-3 py-2 text-sm text-navy-900 focus:border-navy-500 focus:outline-none focus:ring-2 focus:ring-navy-500/20"
                        />
                      </div>
                    </>
                  )}

                  {/* Years Experience Max */}
                  <div>
                    <label className="mb-1 block text-xs font-medium text-navy-700">
                      Years Experience Max
                    </label>
                    <input
                      type="number"
                      value={jobForm.years_experience_max}
                      onChange={(e) =>
                        setJobForm({ ...jobForm, years_experience_max: e.target.value })
                      }
                      placeholder="2"
                      className="w-full rounded-lg border border-navy-200 px-3 py-2 text-sm text-navy-900 focus:border-navy-500 focus:outline-none focus:ring-2 focus:ring-navy-500/20"
                    />
                  </div>

                  {/* Licenses Required */}
                  <div className="sm:col-span-2">
                    <label className="mb-2 block text-xs font-medium text-navy-700">
                      Licenses Required
                    </label>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {FINANCE_LICENSES.map((license) => (
                        <label
                          key={license}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={jobForm.licenses_required.includes(license)}
                            onChange={() => toggleLicense(license)}
                            className="h-4 w-4 rounded border-navy-300 text-navy-600"
                          />
                          <span className="text-sm text-navy-700">{license}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* License Info */}
                  {jobForm.licenses_required.length > 0 && (
                    <>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-navy-700">
                          Study Time (days)
                        </label>
                        <input
                          type="number"
                          value={jobForm.licenses_info.study_time_days}
                          onChange={(e) =>
                            setJobForm({
                              ...jobForm,
                              licenses_info: {
                                ...jobForm.licenses_info,
                                study_time_days: e.target.value,
                              },
                            })
                          }
                          placeholder="30"
                          className="w-full rounded-lg border border-navy-200 px-3 py-2 text-sm text-navy-900 focus:border-navy-500 focus:outline-none focus:ring-2 focus:ring-navy-500/20"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-navy-700">
                          Pass Deadline (days)
                        </label>
                        <input
                          type="number"
                          value={jobForm.licenses_info.pass_deadline_days}
                          onChange={(e) =>
                            setJobForm({
                              ...jobForm,
                              licenses_info: {
                                ...jobForm.licenses_info,
                                pass_deadline_days: e.target.value,
                              },
                            })
                          }
                          placeholder="90"
                          className="w-full rounded-lg border border-navy-200 px-3 py-2 text-sm text-navy-900 focus:border-navy-500 focus:outline-none focus:ring-2 focus:ring-navy-500/20"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-navy-700">
                          Max Attempts
                        </label>
                        <input
                          type="number"
                          value={jobForm.licenses_info.max_attempts}
                          onChange={(e) =>
                            setJobForm({
                              ...jobForm,
                              licenses_info: {
                                ...jobForm.licenses_info,
                                max_attempts: e.target.value,
                              },
                            })
                          }
                          placeholder="2"
                          className="w-full rounded-lg border border-navy-200 px-3 py-2 text-sm text-navy-900 focus:border-navy-500 focus:outline-none focus:ring-2 focus:ring-navy-500/20"
                        />
                      </div>
                      <div className="sm:col-span-2 flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="prep_materials_paid"
                          checked={jobForm.licenses_info.prep_materials_paid}
                          onChange={(e) =>
                            setJobForm({
                              ...jobForm,
                              licenses_info: {
                                ...jobForm.licenses_info,
                                prep_materials_paid: e.target.checked,
                              },
                            })
                          }
                          className="h-4 w-4 rounded border-navy-300 text-navy-600"
                        />
                        <label
                          htmlFor="prep_materials_paid"
                          className="text-sm font-medium text-navy-700"
                        >
                          Prep Materials Paid
                        </label>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="mb-1 block text-xs font-medium text-navy-700">
                          Notes
                        </label>
                        <textarea
                          value={jobForm.licenses_info.notes}
                          onChange={(e) =>
                            setJobForm({
                              ...jobForm,
                              licenses_info: {
                                ...jobForm.licenses_info,
                                notes: e.target.value,
                              },
                            })
                          }
                          rows={2}
                          placeholder="Any additional licensing notes..."
                          className="w-full rounded-lg border border-navy-200 px-3 py-2 text-sm text-navy-900 focus:border-navy-500 focus:outline-none focus:ring-2 focus:ring-navy-500/20"
                        />
                      </div>
                    </>
                  )}

                  {/* Apply URL */}
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs font-medium text-navy-700">
                      Apply URL
                    </label>
                    <input
                      value={jobForm.apply_url}
                      onChange={(e) =>
                        setJobForm({ ...jobForm, apply_url: e.target.value })
                      }
                      placeholder="https://company.com/careers/..."
                      className="w-full rounded-lg border border-navy-200 px-3 py-2 text-sm text-navy-900 focus:border-navy-500 focus:outline-none focus:ring-2 focus:ring-navy-500/20"
                    />
                  </div>

                  {/* Source URL */}
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs font-medium text-navy-700">
                      Source URL (Career Page)
                    </label>
                    <input
                      value={jobForm.source_url}
                      onChange={(e) =>
                        setJobForm({ ...jobForm, source_url: e.target.value })
                      }
                      placeholder="https://company.com/careers"
                      className="w-full rounded-lg border border-navy-200 px-3 py-2 text-sm text-navy-900 focus:border-navy-500 focus:outline-none focus:ring-2 focus:ring-navy-500/20"
                    />
                  </div>

                  {/* Posted Date */}
                  <div>
                    <label className="mb-1 block text-xs font-medium text-navy-700">
                      Posted Date
                    </label>
                    <input
                      type="date"
                      value={jobForm.posted_date}
                      onChange={(e) =>
                        setJobForm({ ...jobForm, posted_date: e.target.value })
                      }
                      className="w-full rounded-lg border border-navy-200 px-3 py-2 text-sm text-navy-900 focus:border-navy-500 focus:outline-none focus:ring-2 focus:ring-navy-500/20"
                    />
                  </div>

                  {/* Description */}
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs font-medium text-navy-700">
                      Description
                    </label>
                    <textarea
                      value={jobForm.description}
                      onChange={(e) =>
                        setJobForm({ ...jobForm, description: e.target.value })
                      }
                      rows={4}
                      placeholder="Brief description of the role..."
                      className="w-full rounded-lg border border-navy-200 px-3 py-2 text-sm text-navy-900 focus:border-navy-500 focus:outline-none focus:ring-2 focus:ring-navy-500/20"
                    />
                  </div>
                </div>

                {/* Buttons */}
                <div className="mt-4 flex gap-3">
                  <button
                    onClick={handleSaveJob}
                    className="rounded-lg bg-navy-900 px-4 py-2 text-sm font-medium text-white hover:bg-navy-800 transition"
                  >
                    {editingJobId ? 'Update' : 'Create'} Job
                  </button>
                  <button
                    onClick={() => {
                      setShowJobForm(false)
                      setEditingJobId(null)
                    }}
                    className="rounded-lg border border-navy-200 px-4 py-2 text-sm text-navy-700 hover:bg-navy-50 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Job List */}
            <div className="space-y-2">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between rounded-lg border border-navy-200 bg-white p-4"
                >
                  <div>
                    <p className="font-medium text-navy-900">{job.title}</p>
                    <p className="text-sm text-navy-600">
                      {job.company?.name} · {job.location} · {job.category}
                    </p>
                    <p className="text-xs text-navy-500 mt-1">
                      {job.pipeline_stage} · {job.job_type}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditJob(job)}
                      className="rounded px-3 py-1 text-sm text-navy-600 hover:bg-navy-50 transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteJob(job.id)}
                      className="rounded px-3 py-1 text-sm text-red-600 hover:bg-red-50 transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
              {jobs.length === 0 && (
                <p className="py-8 text-center text-sm text-navy-500">
                  No jobs yet. Add your first listing.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Companies Tab */}
        {tab === 'companies' && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-navy-900">Companies</h2>
              <button
                onClick={() => {
                  setEditingCompanyId(null)
                  setCompanyForm(emptyCompany)
                  setShowCompanyForm(true)
                }}
                className="rounded-lg bg-navy-900 px-4 py-2 text-sm font-medium text-white hover:bg-navy-800 transition"
              >
                + Add Company
              </button>
            </div>

            {/* Company Form Modal */}
            {showCompanyForm && (
              <div className="mb-6 rounded-lg border border-navy-200 bg-white p-6">
                <h3 className="mb-4 text-base font-semibold text-navy-900">
                  {editingCompanyId ? 'Edit Company' : 'New Company'}
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-navy-700">
                      Name
                    </label>
                    <input
                      value={companyForm.name}
                      onChange={(e) =>
                        setCompanyForm({ ...companyForm, name: e.target.value })
                      }
                      placeholder="Goldman Sachs"
                      className="w-full rounded-lg border border-navy-200 px-3 py-2 text-sm text-navy-900 focus:border-navy-500 focus:outline-none focus:ring-2 focus:ring-navy-500/20"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-navy-700">
                      Website
                    </label>
                    <input
                      value={companyForm.website}
                      onChange={(e) =>
                        setCompanyForm({ ...companyForm, website: e.target.value })
                      }
                      placeholder="https://goldmansachs.com"
                      className="w-full rounded-lg border border-navy-200 px-3 py-2 text-sm text-navy-900 focus:border-navy-500 focus:outline-none focus:ring-2 focus:ring-navy-500/20"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-navy-700">
                      Careers URL
                    </label>
                    <input
                      value={companyForm.careers_url}
                      onChange={(e) =>
                        setCompanyForm({ ...companyForm, careers_url: e.target.value })
                      }
                      placeholder="https://goldmansachs.com/careers"
                      className="w-full rounded-lg border border-navy-200 px-3 py-2 text-sm text-navy-900 focus:border-navy-500 focus:outline-none focus:ring-2 focus:ring-navy-500/20"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-navy-700">
                      Logo URL
                    </label>
                    <input
                      value={companyForm.logo_url}
                      onChange={(e) =>
                        setCompanyForm({ ...companyForm, logo_url: e.target.value })
                      }
                      placeholder="https://..."
                      className="w-full rounded-lg border border-navy-200 px-3 py-2 text-sm text-navy-900 focus:border-navy-500 focus:outline-none focus:ring-2 focus:ring-navy-500/20"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs font-medium text-navy-700">
                      Description
                    </label>
                    <textarea
                      value={companyForm.description}
                      onChange={(e) =>
                        setCompanyForm({
                          ...companyForm,
                          description: e.target.value,
                        })
                      }
                      rows={3}
                      placeholder="Brief company description..."
                      className="w-full rounded-lg border border-navy-200 px-3 py-2 text-sm text-navy-900 focus:border-navy-500 focus:outline-none focus:ring-2 focus:ring-navy-500/20"
                    />
                  </div>
                </div>
                <div className="mt-4 flex gap-3">
                  <button
                    onClick={handleSaveCompany}
                    className="rounded-lg bg-navy-900 px-4 py-2 text-sm font-medium text-white hover:bg-navy-800 transition"
                  >
                    {editingCompanyId ? 'Update' : 'Create'} Company
                  </button>
                  <button
                    onClick={() => {
                      setShowCompanyForm(false)
                      setEditingCompanyId(null)
                    }}
                    className="rounded-lg border border-navy-200 px-4 py-2 text-sm text-navy-700 hover:bg-navy-50 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Company List */}
            <div className="space-y-2">
              {companies.map((company) => (
                <div
                  key={company.id}
                  className="flex items-center justify-between rounded-lg border border-navy-200 bg-white p-4"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    {company.logo_url ? (
                      <img
                        src={company.logo_url}
                        alt={company.name}
                        className="h-10 w-10 rounded-lg object-contain flex-shrink-0"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy-100 text-sm font-bold text-navy-700 flex-shrink-0">
                        {company.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-navy-900">{company.name}</p>
                      <a
                        href={company.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-navy-600 hover:text-navy-800 transition truncate"
                      >
                        {company.website}
                      </a>
                      {company.careers_url && (
                        <a
                          href={company.careers_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-navy-500 hover:text-navy-700 transition block truncate"
                        >
                          Careers
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleEditCompany(company)}
                      className="rounded px-3 py-1 text-sm text-navy-600 hover:bg-navy-50 transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteCompany(company.id)}
                      className="rounded px-3 py-1 text-sm text-red-600 hover:bg-red-50 transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
              {companies.length === 0 && (
                <p className="py-8 text-center text-sm text-navy-500">
                  No companies yet. Add your first company before creating jobs.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
