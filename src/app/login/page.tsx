'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type AuthStep = 'email' | 'otp' | 'success'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/tracker'
  const errorParam = searchParams.get('error')

  const [step, setStep] = useState<AuthStep>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(errorParam === 'auth_failed' ? 'Authentication failed. Please try again.' : '')

  const supabase = createClient()

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError('')

    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        shouldCreateUser: true,
      },
    })

    setLoading(false)
    if (otpError) {
      setError(otpError.message)
    } else {
      setStep('otp')
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!otp.trim()) return
    setLoading(true)
    setError('')

    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: otp.trim(),
      type: 'email',
    })

    setLoading(false)
    if (verifyError) {
      setError(verifyError.message)
    } else {
      setStep('success')
      router.push(redirect)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-navy-900 font-bold text-xl mb-2">
            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-navy-900 text-white text-sm font-bold">F</span>
            FinanceJobs
          </Link>
          <h1 className="text-2xl font-bold text-navy-900 mt-4">
            {step === 'email' ? 'Sign in to your account' : step === 'otp' ? 'Check your email' : 'Welcome back'}
          </h1>
          <p className="text-sm text-navy-500 mt-1">
            {step === 'email'
              ? 'Track applications and save your job search progress'
              : step === 'otp'
                ? `We sent a verification code to ${email}`
                : 'Redirecting you now...'}
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {step === 'email' && (
          <div className="space-y-4">
            {/* Email OTP */}
            <form onSubmit={handleSendOtp} className="space-y-3">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-navy-700 mb-1">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoFocus
                  className="w-full rounded-lg border border-navy-200 bg-white px-3.5 py-2.5 text-sm text-navy-900 placeholder:text-navy-400 focus:border-navy-400 focus:ring-2 focus:ring-navy-200 focus:outline-none transition"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="w-full rounded-lg bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending code...' : 'Send verification code'}
              </button>
            </form>
          </div>
        )}

        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-navy-700 mb-1">
                Verification code
              </label>
              <input
                id="otp"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                required
                autoFocus
                className="w-full rounded-lg border border-navy-200 bg-white px-3.5 py-2.5 text-sm text-navy-900 text-center tracking-[0.3em] font-mono text-lg placeholder:text-navy-400 placeholder:tracking-[0.3em] focus:border-navy-400 focus:ring-2 focus:ring-navy-200 focus:outline-none transition"
              />
            </div>
            <button
              type="submit"
              disabled={loading || otp.length < 6}
              className="w-full rounded-lg bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Verifying...' : 'Verify and sign in'}
            </button>
            <button
              type="button"
              onClick={() => { setStep('email'); setOtp(''); setError('') }}
              className="w-full text-sm text-navy-500 hover:text-navy-700 transition"
            >
              Use a different email
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-xs text-navy-400">
          By signing in, you agree to our{' '}
          <Link href="/terms" className="underline hover:text-navy-600">Terms</Link>
          {' '}and{' '}
          <Link href="/privacy" className="underline hover:text-navy-600">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  )
}
