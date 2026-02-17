'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { STORAGE_KEYS } from '@/lib/constants'

export default function AdminLoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/admin/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      if (!res.ok) {
        setError('Invalid password')
        setLoading(false)
        return
      }

      const { token } = await res.json()
      try {
        localStorage.setItem(STORAGE_KEYS.ADMIN_TOKEN, token)
      } catch {
        setError('Unable to save login token. Check browser privacy settings.')
        setLoading(false)
        return
      }
      router.push('/admin')
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-navy-900">Admin Portal</h1>
          <p className="mt-2 text-navy-600">Sign in to manage the job board</p>
        </div>

        <form onSubmit={handleLogin} className="rounded-lg border border-navy-200 bg-white p-8 shadow-sm">
          <div className="mb-6">
            <label htmlFor="password" className="block text-sm font-medium text-navy-900 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              className="w-full rounded-lg border border-navy-200 bg-white px-4 py-3 text-navy-900 placeholder-navy-400 focus:border-navy-500 focus:outline-none focus:ring-2 focus:ring-navy-500/20 transition"
              autoFocus
              disabled={loading}
            />
          </div>

          {error && (
            <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-navy-900 py-3 text-sm font-semibold text-white transition hover:bg-navy-800 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-400 focus-visible:ring-offset-2"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}
