'use client'

import { useState, useEffect, useCallback, useRef, memo } from 'react'
import { STORAGE_KEYS, STORAGE_EVENTS } from '@/lib/constants'

const TOAST_DELAY = 3000 // Show toast 3 seconds after apply click

interface ApplyClick {
  jobId: string
  company: string
  title: string
  url: string
  at: string
}

export default memo(function ApplyToast() {
  const [visible, setVisible] = useState(false)
  const [currentClick, setCurrentClick] = useState<ApplyClick | null>(null)
  const [tracked, setTracked] = useState(false)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  // Track timers for cleanup on unmount
  const safeTimeout = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms)
    timersRef.current.push(id)
    return id
  }, [])

  // Clear all pending timers on unmount
  useEffect(() => {
    return () => {
      timersRef.current.forEach(clearTimeout)
    }
  }, [])

  const checkForNewClick = useCallback(() => {
    try {
      const clicks: ApplyClick[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.CLICKS) || '[]')
      if (clicks.length === 0) return

      const latest = clicks[0]
      const clickTime = new Date(latest.at).getTime()
      const now = Date.now()

      // Only show for clicks within the last 10 seconds
      if (now - clickTime > 10000) return

      // Don't show if already applied
      const applied: string[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.APPLIED) || '[]')
      if (applied.includes(latest.jobId)) return

      // Check if we already showed toast for this click
      const shownKey = `toast_shown_${latest.jobId}_${latest.at}`
      if (sessionStorage.getItem(shownKey)) return
      sessionStorage.setItem(shownKey, '1')

      setCurrentClick(latest)
      setTracked(false)
      safeTimeout(() => setVisible(true), TOAST_DELAY)
    } catch { /* ignore */ }
  }, [safeTimeout])

  useEffect(() => {
    // Poll briefly after focus returns (user comes back from apply page)
    const onFocus = () => {
      safeTimeout(checkForNewClick, 500)
    }

    window.addEventListener('focus', onFocus)

    // Also check on mount in case user just clicked apply and came back
    safeTimeout(checkForNewClick, 1000)

    return () => {
      window.removeEventListener('focus', onFocus)
    }
  }, [checkForNewClick, safeTimeout])

  const trackApplication = () => {
    if (!currentClick) return
    try {
      const applied: string[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.APPLIED) || '[]')
      if (!applied.includes(currentClick.jobId)) {
        applied.push(currentClick.jobId)
        localStorage.setItem(STORAGE_KEYS.APPLIED, JSON.stringify(applied))
        window.dispatchEvent(new Event(STORAGE_EVENTS.APPLIED))
      }
    } catch { /* ignore */ }
    setTracked(true)
    safeTimeout(() => {
      setVisible(false)
      setCurrentClick(null)
    }, 1500)
  }

  const dismiss = () => {
    setVisible(false)
    safeTimeout(() => setCurrentClick(null), 300)
  }

  if (!currentClick) return null

  return (
    <div
      className={`fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:bottom-4 sm:w-96 z-50 transition-all duration-300 ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'
      }`}
      role="status"
      aria-live="polite"
    >
      <div className="rounded-xl border border-navy-200 bg-white shadow-lg overflow-hidden">
        {tracked ? (
          <div className="p-4 flex items-center gap-3">
            <div className="rounded-full bg-emerald-100 p-1.5 flex-shrink-0">
              <svg className="h-4 w-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-sm font-medium text-emerald-700">Application tracked! View it in your <a href="/tracker" className="underline">tracker</a>.</p>
          </div>
        ) : (
          <>
            <div className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-navy-900">Did you apply?</p>
                  <p className="text-xs text-navy-500 mt-0.5 truncate">
                    {currentClick.title} at {currentClick.company}
                  </p>
                </div>
                <button
                  onClick={dismiss}
                  className="text-navy-400 hover:text-navy-600 transition flex-shrink-0 p-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-400 rounded"
                  aria-label="Dismiss application toast"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={trackApplication}
                  className="flex-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2"
                >
                  Yes, track it
                </button>
                <button
                  onClick={dismiss}
                  className="flex-1 rounded-lg border border-navy-200 bg-white px-3 py-2 text-xs font-semibold text-navy-600 hover:bg-navy-50 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-400 focus-visible:ring-offset-2"
                >
                  Not yet
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
})
