'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect, useRef, useCallback, memo } from 'react'
import { useListCount } from '@/hooks/useJobActions'

export default memo(function Navbar() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const mobileMenuRef = useRef<HTMLDivElement>(null)
  const hamburgerRef = useRef<HTMLButtonElement>(null)
  const savedCount = useListCount('savedJobs')
  const appliedCount = useListCount('appliedJobs')

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  // Close mobile menu on Escape key, lock body scroll, and trap focus
  const handleMenuKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      setMobileMenuOpen(false)
      hamburgerRef.current?.focus()
      return
    }
    if (e.key !== 'Tab') return
    const menu = mobileMenuRef.current
    if (!menu) return
    const focusable = menu.querySelectorAll<HTMLElement>('a, button')
    if (focusable.length === 0) return
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }, [])

  useEffect(() => {
    if (!mobileMenuOpen) return
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleMenuKeyDown)
    // Focus first link in menu
    const menu = mobileMenuRef.current
    if (menu) {
      const firstLink = menu.querySelector<HTMLElement>('a, button')
      firstLink?.focus()
    }
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleMenuKeyDown)
    }
  }, [mobileMenuOpen, handleMenuKeyDown])

  if (pathname?.startsWith('/admin')) return null

  return (
    <nav className="sticky top-0 z-40 border-b border-navy-200/60 bg-white/80 backdrop-blur-xl" aria-label="Main navigation">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3.5 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-xl font-extrabold text-navy-900 hover:text-navy-800 transition"
        >
          <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-navy-900 text-white text-sm font-bold">
            F
          </span>
          Finance<span className="text-navy-500">Jobs</span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden sm:flex items-center gap-1">
          <Link
            href="/"
            className={`rounded-lg px-3.5 py-2 text-sm font-medium transition ${
              pathname === '/'
                ? 'text-navy-900 bg-navy-100'
                : 'text-navy-600 hover:text-navy-900 hover:bg-navy-50'
            }`}
            aria-current={pathname === '/' ? 'page' : undefined}
          >
            Browse Jobs
          </Link>
          {savedCount > 0 && (
            <Link
              href="/?saved=1"
              className="relative rounded-lg px-3.5 py-2 text-sm font-medium text-navy-600 hover:text-navy-900 hover:bg-navy-50 transition"
            >
              Saved
              <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white" aria-label={`${savedCount} saved job${savedCount !== 1 ? 's' : ''}`}>
                {savedCount}
              </span>
            </Link>
          )}
          <Link
            href="/tracker"
            className={`relative rounded-lg px-3.5 py-2 text-sm font-medium transition ${
              pathname === '/tracker'
                ? 'text-navy-900 bg-navy-100'
                : 'text-navy-600 hover:text-navy-900 hover:bg-navy-50'
            }`}
            aria-current={pathname === '/tracker' ? 'page' : undefined}
          >
            Tracker
            {appliedCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-bold text-white" aria-label={`${appliedCount} application${appliedCount !== 1 ? 's' : ''} tracked`}>
                {appliedCount}
              </span>
            )}
          </Link>
          <Link
            href="/companies"
            className={`rounded-lg px-3.5 py-2 text-sm font-medium transition ${
              pathname?.startsWith('/companies')
                ? 'text-navy-900 bg-navy-100'
                : 'text-navy-600 hover:text-navy-900 hover:bg-navy-50'
            }`}
            aria-current={pathname?.startsWith('/companies') ? 'page' : undefined}
          >
            Companies
          </Link>
          <Link
            href="/categories"
            className={`rounded-lg px-3.5 py-2 text-sm font-medium transition ${
              pathname?.startsWith('/categor')
                ? 'text-navy-900 bg-navy-100'
                : 'text-navy-600 hover:text-navy-900 hover:bg-navy-50'
            }`}
            aria-current={pathname?.startsWith('/categor') ? 'page' : undefined}
          >
            Categories
          </Link>
          <Link
            href="/locations"
            className={`rounded-lg px-3.5 py-2 text-sm font-medium transition ${
              pathname?.startsWith('/location')
                ? 'text-navy-900 bg-navy-100'
                : 'text-navy-600 hover:text-navy-900 hover:bg-navy-50'
            }`}
            aria-current={pathname?.startsWith('/location') ? 'page' : undefined}
          >
            Locations
          </Link>
          <Link
            href="/employers"
            className="rounded-lg bg-navy-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-navy-800 ml-2"
          >
            For Employers
          </Link>
        </div>

        {/* Mobile Hamburger */}
        <button
          ref={hamburgerRef}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="sm:hidden flex flex-col items-center justify-center gap-1.5 p-2 rounded-lg hover:bg-navy-50 transition"
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-nav"
        >
          <span className={`block h-0.5 w-5 bg-navy-800 transition-all duration-300 ${mobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`} />
          <span className={`block h-0.5 w-5 bg-navy-800 transition-all duration-300 ${mobileMenuOpen ? 'opacity-0' : ''}`} />
          <span className={`block h-0.5 w-5 bg-navy-800 transition-all duration-300 ${mobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
        </button>
      </div>

      {/* Mobile Dropdown */}
      {mobileMenuOpen && (
        <div ref={mobileMenuRef} id="mobile-nav" className="sm:hidden border-t border-navy-100 bg-white" role="navigation" aria-label="Mobile navigation">
          <div className="flex flex-col px-4 py-2 gap-1">
            <Link href="/" className="rounded-lg px-3 py-2.5 text-sm font-medium text-navy-700 transition hover:bg-navy-50">
              Browse Jobs
            </Link>
            {savedCount > 0 && (
              <Link href="/?saved=1" className="rounded-lg px-3 py-2.5 text-sm font-medium text-navy-700 transition hover:bg-navy-50 flex items-center justify-between">
                Saved Jobs
                <span className="inline-flex items-center justify-center h-5 min-w-5 rounded-full bg-amber-500 px-1.5 text-[11px] font-bold text-white" aria-label={`${savedCount} saved`}>
                  {savedCount}
                </span>
              </Link>
            )}
            <Link href="/tracker" className="rounded-lg px-3 py-2.5 text-sm font-medium text-navy-700 transition hover:bg-navy-50 flex items-center justify-between">
              Application Tracker
              {appliedCount > 0 && (
                <span className="inline-flex items-center justify-center h-5 min-w-5 rounded-full bg-emerald-500 px-1.5 text-[11px] font-bold text-white" aria-label={`${appliedCount} tracked`}>
                  {appliedCount}
                </span>
              )}
            </Link>
            <Link href="/companies" className="rounded-lg px-3 py-2.5 text-sm font-medium text-navy-700 transition hover:bg-navy-50">
              Companies
            </Link>
            <Link href="/categories" className="rounded-lg px-3 py-2.5 text-sm font-medium text-navy-700 transition hover:bg-navy-50">
              Categories
            </Link>
            <Link href="/locations" className="rounded-lg px-3 py-2.5 text-sm font-medium text-navy-700 transition hover:bg-navy-50">
              Locations
            </Link>
            <Link href="/resources" className="rounded-lg px-3 py-2.5 text-sm font-medium text-navy-700 transition hover:bg-navy-50">
              Resources
            </Link>
            <Link href="/employers" className="rounded-lg bg-navy-900 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-navy-800 text-center">
              For Employers
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
})
