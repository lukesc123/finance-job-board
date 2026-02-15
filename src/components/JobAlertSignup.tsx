'use client'

import { useState, useEffect, memo } from 'react'
import { JOB_CATEGORIES } from '@/lib/constants'

export default memo(function JobAlertSignup() {
  const [email, setEmail] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showCategories, setShowCategories] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    try {
      const alert = JSON.parse(localStorage.getItem('jobAlert') || 'null')
      if (alert?.email) setSubmitted(true)
      if (localStorage.getItem('jobAlertDismissed') === '1') setDismissed(true)
    } catch { /* ignore */ }
  }, [])

  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    const alertData = {
      email,
      categories: selectedCategories.length > 0 ? selectedCategories : 'all',
      subscribedAt: new Date().toISOString(),
    }
    try { localStorage.setItem('jobAlert', JSON.stringify(alertData)) } catch { /* ignore */ }
    await new Promise(resolve => setTimeout(resolve, 600))
    setSubmitted(true)
    setLoading(false)
  }

  const handleDismiss = () => {
    setDismissed(true)
    try { localStorage.setItem('jobAlertDismissed', '1') } catch { /* ignore */ }
  }

  if (dismissed) return null

  if (submitted) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 flex-shrink-0">
              <svg className="h-5 w-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-emerald-900">You're subscribed!</p>
              <p className="text-sm text-emerald-700">We'll email you when new finance jobs are posted.</p>
            </div>
          </div>
          <button onClick={handleDismiss} className="text-emerald-400 hover:text-emerald-600 transition p-1" aria-label="Dismiss notification">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-navy-200 bg-gradient-to-r from-navy-900 to-navy-800 p-5 sm:p-6 text-white relative">
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 text-navy-500 hover:text-navy-300 transition p-1"
        aria-label="Dismiss"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="flex flex-col gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <svg className="h-5 w-5 text-amber-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <h3 className="font-bold text-base">Get Job Alerts</h3>
          </div>
          <p className="text-sm text-navy-300">New finance jobs delivered to your inbox. No spam, unsubscribe anytime.</p>
        </div>

        {/* Category selector */}
        <div>
          <button
            type="button"
            onClick={() => setShowCategories(!showCategories)}
            className="text-xs font-medium text-navy-400 hover:text-navy-200 transition flex items-center gap-1"
          >
            <svg className={`h-3 w-3 transition-transform ${showCategories ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            {selectedCategories.length > 0 ? `${selectedCategories.length} categories selected` : 'Select categories (optional)'}
          </button>
          {showCategories && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {JOB_CATEGORIES.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleCategory(cat)}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-all ${
                    selectedCategories.includes(cat)
                      ? 'bg-amber-500 text-navy-900'
                      : 'bg-navy-700 text-navy-300 hover:bg-navy-600 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2 w-full">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            autoComplete="email"
            aria-label="Email address for job alerts"
            className="flex-1 rounded-lg border border-navy-600 bg-navy-800/50 px-3.5 py-2.5 text-sm text-white placeholder-navy-400 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400"
          />
          <button
            type="submit"
            disabled={loading}
            className="flex-shrink-0 rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-semibold text-navy-900 hover:bg-amber-400 transition disabled:opacity-70"
          >
            {loading ? (
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : 'Subscribe'}
          </button>
        </form>
      </div>
    </div>
  )
})
