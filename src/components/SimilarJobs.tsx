'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Job } from '@/types'
import { formatSalary, timeAgo } from '@/lib/formatting'

function getPipelineStageBadgeColor(stage: string): string {
  if (stage.includes('Internship')) return 'bg-green-50 text-green-700 border border-green-200'
  if (stage === 'New Grad') return 'bg-blue-50 text-blue-700 border border-blue-200'
  if (stage === 'Early Career') return 'bg-orange-50 text-orange-700 border border-orange-200'
  if (stage === 'No Experience Required') return 'bg-purple-50 text-purple-700 border border-purple-200'
  return 'bg-navy-50 text-navy-700 border border-navy-200'
}

export default function SimilarJobs({ jobId }: { jobId: string }) {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchSimilar() {
      try {
        const res = await fetch(`/api/similar-jobs?id=${jobId}`)
        const data = await res.json()
        if (Array.isArray(data)) setJobs(data)
      } catch {} finally { setLoading(false) }
    }
    fetchSimilar()
  }, [jobId])

  if (loading) return <div className="space-y-3">{[1,2,3].map(i=><div key={i} className="animate-pulse rounded-lg border border-navy-100 p-4"><div className="h-4 bg-navy-100 rounded w-3/4 mb-2"/><div className="h-3 bg-navy-100 rounded w-1/2"/></div>)}</div>
  if (jobs.length===0) return null

  return (<div><h2 className="text-lg font-bold text-navy-900 mb-4">Similar Jobs</h2><div className="space-y-3">{jobs.map(job=>{const salary=formatSalary(job.salary_min,job.salary_max);return(<Link key={job.id} href={`/jobs/${job.id}`}><div className="group rounded-lg border border-navy-100 bg-white p-4 transition hover:shadow-md hover:border-navy-300 hover:-translate-y-0.5"><div className="flex items-start gap-3">{job.company?.logo_url?(<img src={job.company.logo_url} alt={job.company.name} className="h-8 w-8 rounded-lg object-contain flex-shrink-0 border border-navy-100"/>):(<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy-900 text-xs font-bold text-white flex-shrink-0">{job.company?.name?.charAt(0)||'?'}</div>)}<div className="min-w-0 flex-1"><h3 className="font-semibold text-navy-900 group-hover:text-navy-700 text-sm leading-snug truncate">{job.title}</h3><p className="text-xs text-navy-500 mt-0.5">{job.company?.name}</p><div className="flex flex-wrap items-center gap-2 mt-2"><span className={`inline-block rounded px-2 py-0.5 text-[10px] font-semibold ${getPipelineStageBadgeColor(job.pipeline_stage)}`}>{job.pipeline_stage}</span><span className="text-xs text-navy-400">{job.location}</span>{salary&&<span className="text-xs font-semibold text-emerald-600">{salary}</span>}</div></div></div></div></Link>)})}</div></div>)
}
