'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Job } from '@/types'
import { slugify } from '@/lib/formatting'

function formatK(n: number): string {
  return n >= 1000 ? `$${Math.round(n / 1000)}k` : `$${n}`
}

export default function SalaryInsights({ jobs }: { jobs: Job[] }) {
  const [expanded, setExpanded] = useState(false)

  const insights = useMemo(() => {
    const byCategory: Record<string, { min: number[]; max: number[]; count: number }> = {}

    jobs.forEach(job => {
      if (!job.salary_min && !job.salary_max) return
      if (!byCategory[job.category]) {
        byCategory[job.category] = { min: [], max: [], count: 0 }
      }
      if (job.salary_min) byCategory[job.category].min.push(job.salary_min)
      if (job.salary_max) byCategory[job.category].max.push(job.salary_max)
      byCategory[job.category].count++
    })

    return Object.entries(byCategory)
      .filter(([, v]) => v.count >= 2)
      .map(([category, v]) => {
        const avgMin = Math.round(v.min.reduce((a, b) => a + b, 0) / v.min.length)
        const avgMax = Math.round(v.max.reduce((a, b) => a + b, 0) / v.max.length)
        const overallMin = Math.min(...v.min)
        const overallMax = Math.max(...v.max)
        return { category, avgMin, avgMax, overallMin, overallMax, count: v.count }
      })
      .sort((a, b) => b.avgMax - a.avgMax)
  }, [jobs])

  if (insights.length === 0) return null

  const globalMax = Math.max(...insights.map(i => i.overallMax))
  const shown = expanded ? insights : insights.slice(0, 5)

  return (
    <div className="rounded-xl border border-navy-200 bg-white p-5 mb-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-navy-900 text-sm flex items-center gap-2">
          <svg className="h-4 w-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Salary Insights
        </h3>
        <span className="text-[10px] text-navy-400 uppercase tracking-wider font-semibold">Avg. Range by Category</span>
      </div>

      <div className="space-y-2.5">
        {shown.map((insight) => {
          const barLeft = (insight.avgMin / globalMax) * 100
          const barWidth = ((insight.avgMax - insight.avgMin) / globalMax) * 100

          return (
            <Link
              key={insight.category}
              href={`/category/${slugify(insight.category)}`}
              className="block group"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-navy-700 group-hover:text-navy-900 transition">
                  {insight.category}
                  <span className="text-navy-400 ml-1.5">({insight.count} jobs)</span>
                </span>
                <span className="text-xs font-bold text-emerald-700">
                  {formatK(insight.avgMin)} - {formatK(insight.avgMax)}
                </span>
              </div>
              <div className="h-2 bg-navy-100 rounded-full overflow-hidden relative">
                <div
                  className="absolute h-full bg-emerald-400 rounded-full group-hover:bg-emerald-500 transition-colors"
                  style={{ left: `${barLeft}%`, width: `${Math.max(barWidth, 2)}%` }}
                />
              </div>
            </Link>
          )
        })}
      </div>

      {insights.length > 5 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 text-xs font-medium text-navy-500 hover:text-navy-700 transition"
        >
          {expanded ? 'Show less' : `Show all ${insights.length} categories`}
        </button>
      )}
    </div>
  )
}
