'use client'

import { useState, useEffect, memo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { JOB_CATEGORIES } from '@/lib/constants'

export default memo(function JobAlertSignup() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [step, setStep] = useState<'form' | 'verify' | 'done'>('form')
  const [loading, setLoading] = useState(false)
  const [showCategories, setShowCategories] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setIsLoggedIn(true)
        // Check if already subscribed
        fetch('/api/preferences').then(r => r.json()).then(data => {
          if (data?.email_digest_enabled) setStep('done')
        }).catch(() => {})
      }
    })
    try {
      if (localStorage.getItem('jobAlertDismissed') === '1') setDismissed(true)
    } catch { /* ignore */ }
  }, [supabase.auth])

  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    )
  }

  const validateEmail = (value: string) => {
    if (!value) { setEmailError(''); return false }
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
    setEmailError(valid ? '' : 'Please enter a valid email address')
    return valid
  }

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isLoggedIn) {
      // Already logged in: just enable the digest
      setLoading(true)
      await fetch('/api/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email_digest_enabled: true,
          email_digest_frequency: 'daily',
          ...(selectedCategories.length > 0 && { tracked_categories: selectedCategories }),
        }),
      })
      setStep('done')
      setLoading(false)
      return
    }

    // Not logged in: send OTP
    if (!email || !validateEmail(email)) return
    setLoading(true)
    setEmailError('')

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: true },
    })

    setLoading(false)
    if (error) {
      setEmailError(error.message)
    } else {
      setStep('verify')
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!otp.trim()) return
    setLoading(true)
    setEmailError('')

    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otp.trim(),
      type: 'email',
    })

    if (error) {
      setEmailError(error.message)
      setLoading(false)
      return
    }

    // Now signed in — enable digest and save categories
    await fetch('/api/preferences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email_digest_enabled: true,
        email_digest_frequency: 'daily',
        ...(selectedCategories.length > 0 && { tracked_categories: selectedCategories }),
      }),
    })

    setStep('done')
    setLoading(false)
    router.refresh()
  }

  const handleDismiss = () => {
    setDismissed(true)
    try { localStorage.setItem('jobAlertDismissed', '1') } catch { /* ignore */ }
  }

  if (dismissed) return null

  if (step === 'done') {
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
              <p className="font-semibold text-emerald-900">You&apos;re subscribed!</p>
              <p className="text-sm text-emerald-700">We&apos;ll notify you when new finance jobs are posted.</p>
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
            <h3 className="font-bold text-base">Get Daily Updates</h3>
          </div>
          <p className="text-sm text-navy-300">New entry-level finance postings delivered to your inbox daily. No spam, unsubscribe anytime.</p>
        </div>

        {step === 'form' && (
          <>
            {/* Category selector */}
            {!isLoggedIn && (
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
                        aria-pressed={selectedCategories.includes(cat)}
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
            )}

            <form onSubmit={handleSubscribe} className="flex flex-col gap-1.5 w-full">
              {isLoggedIn ? (
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-semibold text-navy-900 hover:bg-amber-400 transition disabled:opacity-70"
                >
                  {loading ? 'Enabling...' : 'Enable Daily Digest'}
                </button>
              ) : (
                <>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); if (emailError) validateEmail(e.target.value) }}
                      onBlur={(e) => validateEmail(e.target.value)}
                      placeholder="your@email.com"
                      required
                      autoComplete="email"
                      aria-label="Email address for daily updates"
                      aria-invalid={emailError ? 'true' : undefined}
                      aria-describedby={emailError ? 'email-error' : undefined}
                      className={`flex-1 rounded-lg border bg-navy-800/50 px-3.5 py-2.5 text-sm text-white placeholder-navy-400 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 ${emailError ? 'border-red-400' : 'border-navy-600'}`}
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
                  </div>
                  <p className="text-[11px] text-navy-500">Creates a free account to manage your alerts.</p>
                </>
              )}
              {emailError && <p id="email-error" className="text-xs text-red-300" role="alert">{emailError}</p>}
            </form>
          </>
        )}

        {step === 'verify' && (
          <form onSubmit={handleVerify} className="flex flex-col gap-2 w-full">
            <p className="text-sm text-navy-300">We sent a code to <span className="text-white font-medium">{email}</span></p>
            <div className="flex gap-2">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                required
                autoFocus
                className="flex-1 rounded-lg border border-navy-600 bg-navy-800/50 px-3.5 py-2.5 text-sm text-white text-center tracking-[0.3em] font-mono placeholder-navy-400 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400"
              />
              <button
                type="submit"
                disabled={loading || otp.length < 6}
                className="flex-shrink-0 rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-semibold text-navy-900 hover:bg-amber-400 transition disabled:opacity-70"
              >
                {loading ? 'Verifying...' : 'Verify'}
              </button>
            </div>
            {emailError && <p className="text-xs text-red-300" role="alert">{emailError}</p>}
            <button
              type="button"
              onClick={() => { setStep('form'); setOtp(''); setEmailError('') }}
              className="text-xs text-navy-400 hover:text-navy-200 transition"
            >
              Use a different email
            </button>
          </form>
        )}
      </div>
    </div>
  )
})
