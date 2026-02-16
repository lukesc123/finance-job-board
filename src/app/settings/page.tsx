'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { JOB_CATEGORIES } from '@/lib/constants'

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [trackedCategories, setTrackedCategories] = useState<string[]>([])
  const [emailDigestEnabled, setEmailDigestEnabled] = useState(false)
  const [emailDigestFrequency, setEmailDigestFrequency] = useState<'daily' | 'weekly'>('daily')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.push('/login?redirect=/settings')
      return
    }

    const loadPreferences = async () => {
      try {
        const res = await fetch('/api/preferences')
        if (res.ok) {
          const data = await res.json()
          setTrackedCategories(data.tracked_categories || [])
          setEmailDigestEnabled(data.email_digest_enabled || false)
          setEmailDigestFrequency(data.email_digest_frequency || 'daily')
        }
      } catch (err) {
        console.error('Failed to load preferences:', err)
        setError('Could not load your preferences. Using defaults.')
      } finally {
        setLoading(false)
      }
    }

    loadPreferences()
  }, [user, authLoading, router])

  const toggleCategory = (category: string) => {
    setTrackedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    )
    setSaved(false)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tracked_categories: trackedCategories,
          email_digest_enabled: emailDigestEnabled,
          email_digest_frequency: emailDigestFrequency,
        }),
      })
      if (res.ok) {
        setSaved(true)
        setError(null)
        setTimeout(() => setSaved(false), 3000)
      } else {
        setError('Failed to save. Please try again.')
      }
    } catch (err) {
      console.error('Failed to save preferences:', err)
      setError('Network error. Check your connection and try again.')
    } finally {
      setSaving(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-navy-50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 bg-navy-200 rounded" />
            <div className="h-4 w-72 bg-navy-100 rounded" />
            <div className="h-40 bg-white rounded-xl border border-navy-200" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-navy-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/tracker" className="text-navy-400 hover:text-navy-700 transition" aria-label="Back to tracker">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-navy-900">Preferences</h1>
            <p className="text-sm text-navy-500 mt-0.5">Manage your job alert categories and notification settings</p>
          </div>
        </div>

        {/* Category Preferences */}
        <div className="bg-white rounded-xl border border-navy-200 p-5 sm:p-6 mb-4">
          <h2 className="text-base font-semibold text-navy-900 mb-1">Job Categories</h2>
          <p className="text-sm text-navy-500 mb-4">
            Select the categories you want to track. You'll get notified when new jobs are posted in these areas.
          </p>
          <div className="flex flex-wrap gap-2">
            {JOB_CATEGORIES.map(category => {
              const isSelected = trackedCategories.includes(category)
              return (
                <button
                  key={category}
                  onClick={() => toggleCategory(category)}
                  className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition border ${
                    isSelected
                      ? 'bg-navy-900 text-white border-navy-900'
                      : 'bg-white text-navy-600 border-navy-200 hover:border-navy-400 hover:text-navy-800'
                  }`}
                  aria-pressed={isSelected}
                >
                  {isSelected && (
                    <svg className="inline-block h-3.5 w-3.5 mr-1 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {category}
                </button>
              )
            })}
          </div>
        </div>

        {/* Email Digest Settings */}
        <div className="bg-white rounded-xl border border-navy-200 p-5 sm:p-6 mb-6">
          <h2 className="text-base font-semibold text-navy-900 mb-1">Email Digest</h2>
          <p className="text-sm text-navy-500 mb-4">
            Get a summary of new job postings in your tracked categories delivered to your inbox.
          </p>

          <div className="flex items-center justify-between py-3 border-b border-navy-100">
            <div>
              <p className="text-sm font-medium text-navy-700">Enable email digest</p>
              <p className="text-xs text-navy-400">Receive notifications for new jobs in your categories</p>
            </div>
            <button
              onClick={() => { setEmailDigestEnabled(!emailDigestEnabled); setSaved(false) }}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                emailDigestEnabled ? 'bg-navy-900' : 'bg-navy-200'
              }`}
              role="switch"
              aria-checked={emailDigestEnabled}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  emailDigestEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {emailDigestEnabled && (
            <div className="pt-3">
              <p className="text-sm font-medium text-navy-700 mb-2">Frequency</p>
              <div className="flex gap-2">
                {(['daily', 'weekly'] as const).map(freq => (
                  <button
                    key={freq}
                    onClick={() => { setEmailDigestFrequency(freq); setSaved(false) }}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition border ${
                      emailDigestFrequency === freq
                        ? 'bg-navy-50 text-navy-900 border-navy-300'
                        : 'bg-white text-navy-500 border-navy-200 hover:border-navy-300'
                    }`}
                  >
                    {freq.charAt(0).toUpperCase() + freq.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 flex items-center justify-between gap-3">
            <p className="text-sm text-red-700">{error}</p>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 transition" aria-label="Dismiss error">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Save Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-navy-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-navy-800 transition disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>
          {saved && (
            <span className="text-sm text-emerald-600 font-medium flex items-center gap-1">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Saved
            </span>
          )}
        </div>

        {/* Account Info */}
        <div className="mt-8 pt-6 border-t border-navy-200">
          <p className="text-xs text-navy-400">
            Signed in as <span className="text-navy-600">{user?.email}</span>
          </p>
        </div>
      </div>
    </div>
  )
}
