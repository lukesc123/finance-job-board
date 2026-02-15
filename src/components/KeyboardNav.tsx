'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Keyboard navigation for the job list:
 * - j / ArrowDown: next job
 * - k / ArrowUp: previous job
 * - Enter: open focused job
 * - s: toggle save on focused job
 * - ?: show keyboard shortcuts help
 * - Esc: close help / deselect
 */

export default function KeyboardNav() {
  const router = useRouter()
  const [focusIndex, setFocusIndex] = useState(-1)
  const [showHelp, setShowHelp] = useState(false)

  const getJobCards = useCallback(() => {
    return Array.from(document.querySelectorAll<HTMLElement>('[data-job-card]'))
  }, [])

  const scrollToCard = useCallback((card: HTMLElement) => {
    card.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    // Add focus ring
    document.querySelectorAll('[data-job-card]').forEach(c => c.classList.remove('ring-2', 'ring-navy-400', 'ring-offset-1'))
    card.classList.add('ring-2', 'ring-navy-400', 'ring-offset-1')
  }, [])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't trigger when typing in inputs
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

      const cards = getJobCards()
      if (cards.length === 0 && e.key !== '?') return

      switch (e.key) {
        case 'j':
        case 'ArrowDown': {
          e.preventDefault()
          const next = Math.min(focusIndex + 1, cards.length - 1)
          setFocusIndex(next)
          scrollToCard(cards[next])
          break
        }
        case 'k':
        case 'ArrowUp': {
          e.preventDefault()
          const prev = Math.max(focusIndex - 1, 0)
          setFocusIndex(prev)
          scrollToCard(cards[prev])
          break
        }
        case 'Enter': {
          if (focusIndex >= 0 && focusIndex < cards.length) {
            e.preventDefault()
            const link = cards[focusIndex].closest('a')
            if (link) router.push(link.getAttribute('href') || '/')
          }
          break
        }
        case 's': {
          if (focusIndex >= 0 && focusIndex < cards.length) {
            const saveBtn = cards[focusIndex].querySelector<HTMLButtonElement>('[aria-label*="ave"]')
            if (saveBtn) saveBtn.click()
          }
          break
        }
        case '?': {
          e.preventDefault()
          setShowHelp(prev => !prev)
          break
        }
        case 'Escape': {
          setShowHelp(false)
          setFocusIndex(-1)
          document.querySelectorAll('[data-job-card]').forEach(c => c.classList.remove('ring-2', 'ring-navy-400', 'ring-offset-1'))
          break
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [focusIndex, getJobCards, scrollToCard, router])

  if (!showHelp) {
    return (
      <button
        onClick={() => setShowHelp(true)}
        className="fixed bottom-6 left-6 z-50 hidden sm:flex h-8 w-8 items-center justify-center rounded-lg bg-navy-900/80 text-white text-xs font-mono hover:bg-navy-800 transition-all shadow-lg backdrop-blur-sm"
        aria-label="Keyboard shortcuts"
        title="Press ? for keyboard shortcuts"
      >
        ?
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowHelp(false)} role="dialog" aria-modal="true" aria-label="Keyboard shortcuts">
      <div
        className="bg-white rounded-xl shadow-2xl border border-navy-200 p-6 max-w-sm w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-navy-900">Keyboard Shortcuts</h3>
          <button
            onClick={() => setShowHelp(false)}
            className="text-navy-400 hover:text-navy-600 transition"
            aria-label="Close shortcuts"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="space-y-2.5">
          {[
            { keys: ['j', '↓'], desc: 'Next job' },
            { keys: ['k', '↑'], desc: 'Previous job' },
            { keys: ['Enter'], desc: 'Open selected job' },
            { keys: ['s'], desc: 'Save / unsave job' },
            { keys: ['/'], desc: 'Focus search bar' },
            { keys: ['?'], desc: 'Toggle this help' },
            { keys: ['Esc'], desc: 'Close / deselect' },
          ].map(({ keys, desc }) => (
            <div key={desc} className="flex items-center justify-between">
              <span className="text-sm text-navy-600">{desc}</span>
              <div className="flex items-center gap-1">
                {keys.map((key) => (
                  <kbd key={key} className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded-md bg-navy-100 text-navy-700 text-xs font-mono font-medium border border-navy-200">
                    {key}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-[11px] text-navy-400 text-center">
          Press <kbd className="px-1 py-0.5 rounded bg-navy-100 border border-navy-200 text-navy-600 font-mono text-[10px]">?</kbd> anytime to toggle
        </p>
      </div>
    </div>
  )
}
