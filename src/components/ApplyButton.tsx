'use client'

import { useState, useEffect, useRef, memo, useCallback } from 'react'
import { fetchRetry } from '@/lib/fetchRetry'

interface LinkCheckResult {
  status: 'alive' | 'dead' | 'soft-404' | 'redirect' | 'resolved' | 'error' | 'timeout'
  finalUrl?: string | null
  resolvedUrl?: string | null
  applyUrl: string | null
  sourceUrl?: string | null
  careersUrl?: string | null
  googleSearchUrl: string
}

interface ApplyButtonProps {
  jobId: string
  applyUrl: string | null
  sourceUrl?: string | null
  companyName: string
  companyWebsite?: string | null
  companyCareersUrl?: string | null
  jobTitle: string
  isGeneric: boolean
  isRemoved: boolean
  /** Visual variant: 'primary' for hero buttons, 'footer' for bottom of page, 'mobile' for sticky bar */
  variant?: 'primary' | 'footer' | 'mobile'
  onApplyClick?: () => void
}

export default memo(function ApplyButton({
  jobId,
  applyUrl,
  sourceUrl,
  companyName,
  companyWebsite,
  companyCareersUrl,
  jobTitle,
  isGeneric,
  isRemoved,
  variant = 'primary',
  onApplyClick,
}: ApplyButtonProps) {
  const [linkStatus, setLinkStatus] = useState<'checking' | 'alive' | 'dead' | 'unknown'>('unknown')
  const [checkResult, setCheckResult] = useState<LinkCheckResult | null>(null)
  const [showFallback, setShowFallback] = useState(false)
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null)
  const checkedRef = useRef(false)

  // Pre-check the URL when the component mounts (only once)
  useEffect(() => {
    if (checkedRef.current || !applyUrl || isRemoved) return
    checkedRef.current = true

    setLinkStatus('checking')
    const controller = new AbortController()

    fetchRetry(`/api/jobs/check-url?id=${jobId}`, {
      signal: controller.signal,
      retries: 0, // Don't retry health checks
    })
      .then(res => {
        if (!res.ok) throw new Error('check failed')
        return res.json()
      })
      .then((data: LinkCheckResult) => {
        setCheckResult(data)
        if (data.status === 'alive' || data.status === 'redirect') {
          setLinkStatus('alive')
        } else if (data.status === 'resolved' && data.resolvedUrl) {
          // ATS resolution found a better URL - treat as alive with the new URL
          setLinkStatus('alive')
          setResolvedUrl(data.resolvedUrl)
        } else if (data.status === 'dead' || data.status === 'soft-404') {
          setLinkStatus('dead')
        } else {
          setLinkStatus('unknown') // timeout/error - don't block
        }
      })
      .catch(() => {
        setLinkStatus('unknown') // Network error - don't block the user
      })

    return () => controller.abort()
  }, [jobId, applyUrl, isRemoved])

  const googleSearchUrl = checkResult?.googleSearchUrl ||
    `https://www.google.com/search?q=${encodeURIComponent(`"${jobTitle}" "${companyName}" apply`)}`

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (linkStatus === 'dead') {
      e.preventDefault()
      setShowFallback(true)
      return
    }
    onApplyClick?.()
  }, [linkStatus, onApplyClick])

  // No URL at all
  if (!applyUrl) {
    return (
      <FallbackLinks
        variant={variant}
        companyName={companyName}
        companyCareersUrl={companyCareersUrl}
        sourceUrl={sourceUrl}
        googleSearchUrl={googleSearchUrl}
      />
    )
  }

  // Link confirmed dead - show fallback
  if (linkStatus === 'dead' && showFallback) {
    return (
      <div className="space-y-2">
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 flex items-center gap-2">
          <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          This apply link appears to be broken. Try these alternatives:
        </div>
        <FallbackLinks
          variant={variant}
          companyName={companyName}
          companyCareersUrl={companyCareersUrl}
          sourceUrl={sourceUrl}
          googleSearchUrl={googleSearchUrl}
          showOriginal={applyUrl}
        />
      </div>
    )
  }

  // Determine button styling based on variant
  const isPrimary = variant === 'primary'
  const isMobile = variant === 'mobile'
  const isFooter = variant === 'footer'

  const baseClasses = isPrimary
    ? 'inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 transition-all hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2'
    : isMobile
    ? 'flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-lg hover:bg-emerald-700 transition flex-1'
    : 'inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 transition-all hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2'

  const label = isGeneric
    ? `Careers at ${companyName}`
    : `Apply at ${companyName}`

  // Status indicator dot
  const statusDot = linkStatus === 'checking' ? (
    <span className="h-2 w-2 rounded-full bg-amber-300 animate-pulse" title="Checking link..." />
  ) : linkStatus === 'dead' ? (
    <span className="h-2 w-2 rounded-full bg-red-400" title="Link may be broken" />
  ) : linkStatus === 'alive' ? (
    <span className="h-2 w-2 rounded-full bg-emerald-300" title="Link verified" />
  ) : null

  const effectiveUrl = resolvedUrl || applyUrl

  return (
    <a
      href={effectiveUrl}
      target="_blank"
      rel="noopener noreferrer nofollow"
      onClick={handleClick}
      className={baseClasses}
      aria-label={`${label} (opens in new tab)`}
    >
      {statusDot}
      <span className="truncate">{label}</span>
      {isGeneric ? (
        <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ) : (
        <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      )}
    </a>
  )
})

/** Fallback links shown when the primary apply URL is dead */
function FallbackLinks({
  variant,
  companyName,
  companyCareersUrl,
  sourceUrl,
  googleSearchUrl,
  showOriginal,
}: {
  variant: string
  companyName: string
  companyCareersUrl?: string | null
  sourceUrl?: string | null
  googleSearchUrl: string
  showOriginal?: string
}) {
  const linkClass = variant === 'mobile'
    ? 'flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition flex-1'
    : 'inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition'

  return (
    <div className="flex flex-wrap gap-2">
      {companyCareersUrl && (
        <a
          href={companyCareersUrl}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className={`${linkClass} bg-navy-900 text-white hover:bg-navy-800`}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          {companyName} Careers
        </a>
      )}

      {sourceUrl && sourceUrl !== showOriginal && (
        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className={`${linkClass} bg-blue-600 text-white hover:bg-blue-700`}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          Source Link
        </a>
      )}

      <a
        href={googleSearchUrl}
        target="_blank"
        rel="noopener noreferrer nofollow"
        className={`${linkClass} border border-navy-200 bg-white text-navy-700 hover:bg-navy-50`}
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        Search Google
      </a>

      {showOriginal && (
        <a
          href={showOriginal}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className={`${linkClass} border border-navy-200 bg-white text-navy-400 hover:text-navy-600 hover:bg-navy-50`}
        >
          Try Original Link Anyway
        </a>
      )}
    </div>
  )
}
