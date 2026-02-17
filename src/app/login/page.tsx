'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type AuthStep = 'email' | 'otp' | 'success'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  // Validate redirect is a relative path to prevent open redirect attacks
  const rawRedirect = searchParams.get('redirect') || '/tracker'
  const redirect = rawRedirect.startsWith('/') && !rawRedirect.startsWith('//') ? rawRedirect : '/tracker'
  const errorParam = searchParams.get('error')

  const [step, setStep] = useState<AuthStep>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(errorParam === 'auth_failed' ? 'Authentication failed. Please try again.' : '')
  const [resendCooldown, setResendCooldown] = useState(0)
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (resendCooldown <= 0) {
      if (cooldownRef.current) clearInterval(cooldownRef.current)
      return
    }
    cooldownRef.current = setInterval(() => {
      setResendCooldown(prev => prev - 1)
    }, 1000)
    return () => { if (cooldownRef.current) clearInterval(cooldownRef.current) }
  }, [resendCooldown > 0]) // eslint-disable-line react-hooks/exhaustive-deps

  const supabase = useMemo(() => createClient(), [])

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError('')
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirect)}`,
      },
    })
    if (oauthError) {
      setError(oauthError.message)
      setLoading(false)
    }
  }

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
      setResendCooldown(60)
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
            Entry Level Finance Jobs
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
            {/* Google OAuth */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 rounded-lg border border-navy-200 bg-white px-4 py-2.5 text-sm font-medium text-navy-700 hover:bg-navy-50 transition disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-400 focus-visible:ring-offset-2"
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-navy-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-2 text-navy-400">or</span>
              </div>
            </div>

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
                className="w-full rounded-lg bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy-800 transition disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-400 focus-visible:ring-offset-2"
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
                className="w-full rounded-lg border border-navy-200 bg-white px-3.5 py-3 text-navy-900 text-center tracking-[0.3em] font-mono text-xl placeholder:text-navy-400 placeholder:tracking-[0.3em] focus:border-navy-400 focus:ring-2 focus:ring-navy-200 focus:outline-none transition"
              />
            </div>
            <button
              type="submit"
              disabled={loading || otp.length < 6}
              className="w-full rounded-lg bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy-800 transition disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-400 focus-visible:ring-offset-2"
            >
              {loading ? 'Verifying...' : 'Verify and sign in'}
            </button>
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => { setStep('email'); setOtp(''); setError(''); setResendCooldown(0) }}
                className="rounded-lg text-sm text-navy-500 hover:text-navy-700 transition py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-400 focus-visible:ring-offset-2"
              >
                Use a different email
              </button>
              <button
                type="button"
                disabled={resendCooldown > 0 || loading}
                onClick={async () => {
                  setLoading(true)
                  setError('')
                  const { error: resendError } = await supabase.auth.signInWithOtp({ email: email.trim(), options: { shouldCreateUser: true } })
                  setLoading(false)
                  if (resendError) { setError(resendError.message) }
                  else { setResendCooldown(60) }
                }}
                className="rounded-lg text-sm text-navy-500 hover:text-navy-700 transition py-2 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-400 focus-visible:ring-offset-2"
              >
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
              </button>
            </div>
          </form>
        )}

        <p className="mt-6 text-center text-xs text-navy-400">
          By signing in, you agree to our{' '}
          <Link href="/terms" className="underline hover:text-navy-600 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-400">Terms</Link>
          {' '}and{' '}
          <Link href="/privacy" className="underline hover:text-navy-600 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-400">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  )
}
