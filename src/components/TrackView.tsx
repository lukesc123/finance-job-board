'use client'

import { useEffect } from 'react'

interface TrackViewProps {
  jobId: string
  jobTitle: string
  companyName: string
  location: string
  salary: string
  pipelineStage: string
}

export default function TrackView({ jobId, jobTitle, companyName, location, salary, pipelineStage }: TrackViewProps) {
  useEffect(() => {
    try {
      const MAX_RECENT = 10
      const viewed: Array<{
        id: string
        title: string
        company: string
        location: string
        salary: string
        stage: string
        viewedAt: number
      }> = JSON.parse(localStorage.getItem('recentlyViewed') || '[]')

      // Remove if already in list
      const filtered = viewed.filter(v => v.id !== jobId)

      // Add to front
      filtered.unshift({
        id: jobId,
        title: jobTitle,
        company: companyName,
        location: location,
        salary: salary,
        stage: pipelineStage,
        viewedAt: Date.now()
      })

      // Keep only MAX_RECENT
      localStorage.setItem('recentlyViewed', JSON.stringify(filtered.slice(0, MAX_RECENT)))
    } catch { /* ignore */ }
  }, [jobId, jobTitle, companyName, location, salary, pipelineStage])

  return null
}
