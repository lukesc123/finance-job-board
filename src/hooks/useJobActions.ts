'use client'

import { useState, useEffect, useCallback } from 'react'

// ── Key constants ────────────────────────────────────────────
const SAVED_KEY = 'savedJobs'
const APPLIED_KEY = 'appliedJobs'
const COMPARE_KEY = 'compareJobs'
const CLICKS_KEY = 'applyClicks'

const SAVED_EVENT = 'savedJobsChanged'
const APPLIED_EVENT = 'appliedJobsChanged'
const COMPARE_EVENT = 'compareJobsChanged'

const MAX_COMPARE = 4
const MAX_CLICKS = 100

// ── Helpers ──────────────────────────────────────────────────
function readList(key: string): string[] {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]')
  } catch {
    return []
  }
}

function writeList(key: string, list: string[], event: string) {
  try { localStorage.setItem(key, JSON.stringify(list)) } catch { /* ignore */ }
  window.dispatchEvent(new Event(event))
}

function toggleInList(key: string, id: string, event: string): boolean {
  const list = readList(key)
  const exists = list.includes(id)
  const updated = exists ? list.filter(i => i !== id) : [...list, id]
  writeList(key, updated, event)
  return !exists
}

// ── useJobActions: per-job save/apply/compare state ──────────
export function useJobActions(jobId: string | undefined) {
  const [saved, setSaved] = useState(false)
  const [applied, setApplied] = useState(false)
  const [comparing, setComparing] = useState(false)

  useEffect(() => {
    if (!jobId) return
    try {
      setSaved(readList(SAVED_KEY).includes(jobId))
      setApplied(readList(APPLIED_KEY).includes(jobId))
      setComparing(readList(COMPARE_KEY).includes(jobId))
    } catch { /* ignore */ }
  }, [jobId])

  const toggleSave = useCallback((e?: React.MouseEvent) => {
    e?.preventDefault()
    e?.stopPropagation()
    if (!jobId) return
    try {
      const now = toggleInList(SAVED_KEY, jobId, SAVED_EVENT)
      setSaved(now)
    } catch { /* ignore */ }
  }, [jobId])

  const toggleApplied = useCallback((e?: React.MouseEvent) => {
    e?.preventDefault()
    e?.stopPropagation()
    if (!jobId) return
    try {
      const now = toggleInList(APPLIED_KEY, jobId, APPLIED_EVENT)
      setApplied(now)
    } catch { /* ignore */ }
  }, [jobId])

  const toggleCompare = useCallback((e?: React.MouseEvent) => {
    e?.preventDefault()
    e?.stopPropagation()
    if (!jobId) return
    try {
      const list = readList(COMPARE_KEY)
      const exists = list.includes(jobId)
      if (!exists && list.length >= MAX_COMPARE) return
      const updated = exists ? list.filter(i => i !== jobId) : [...list, jobId]
      writeList(COMPARE_KEY, updated, COMPARE_EVENT)
      setComparing(!exists)
    } catch { /* ignore */ }
  }, [jobId])

  const markApplied = useCallback(() => {
    if (!jobId) return
    try {
      const list = readList(APPLIED_KEY)
      if (!list.includes(jobId)) {
        writeList(APPLIED_KEY, [...list, jobId], APPLIED_EVENT)
        setApplied(true)
      }
    } catch { /* ignore */ }
  }, [jobId])

  return { saved, applied, comparing, toggleSave, toggleApplied, toggleCompare, markApplied }
}

// ── trackApplyClick: log apply click with metadata ───────────
export function trackApplyClick(job: { id: string; title: string; company?: { name?: string } | null; apply_url?: string | null }) {
  try {
    const clicks: Array<{ jobId: string; company: string; title: string; url: string; at: string }> =
      JSON.parse(localStorage.getItem(CLICKS_KEY) || '[]')
    clicks.unshift({
      jobId: job.id,
      company: job.company?.name || '',
      title: job.title,
      url: job.apply_url || '',
      at: new Date().toISOString(),
    })
    localStorage.setItem(CLICKS_KEY, JSON.stringify(clicks.slice(0, MAX_CLICKS)))
  } catch { /* ignore */ }
}

// ── useListCount: reactive count for navbar/compare bar ──────
export function useListCount(key: 'savedJobs' | 'appliedJobs' | 'compareJobs') {
  const [count, setCount] = useState(0)

  const eventMap: Record<string, string> = {
    savedJobs: SAVED_EVENT,
    appliedJobs: APPLIED_EVENT,
    compareJobs: COMPARE_EVENT,
  }

  useEffect(() => {
    const update = () => {
      try {
        setCount(readList(key).length)
      } catch { setCount(0) }
    }
    update()
    const eventName = eventMap[key]
    window.addEventListener(eventName, update)
    return () => window.removeEventListener(eventName, update)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return count
}

// ── useCompareIds: reactive list of compare IDs ──────────────
export function useCompareIds() {
  const [ids, setIds] = useState<string[]>([])

  useEffect(() => {
    const update = () => setIds(readList(COMPARE_KEY))
    update()
    window.addEventListener(COMPARE_EVENT, update)
    return () => window.removeEventListener(COMPARE_EVENT, update)
  }, [])

  const remove = useCallback((id: string) => {
    const updated = readList(COMPARE_KEY).filter(i => i !== id)
    writeList(COMPARE_KEY, updated, COMPARE_EVENT)
  }, [])

  const clearAll = useCallback(() => {
    writeList(COMPARE_KEY, [], COMPARE_EVENT)
  }, [])

  return { ids, remove, clearAll }
}
