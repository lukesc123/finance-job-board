'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'

export default function Navbar() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  if (pathname?.startsWith('/admin')) return null

  return (
    <nav className="sticky top-0 z-40 border-b border-navy-200/60 bg-white/80 backdrop-blur-xl">
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
          >
            Browse Jobs
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
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="sm:hidden flex flex-col items-center justify-center gap-1.5 p-2 rounded-lg hover:bg-navy-50 transition"
          aria-label="Toggle mobile menu"
          aria-expanded={mobileMenuOpen}
        >
          <span className={`block h-0.5 w-5 bg-navy-800 transition-all duration-300 ${mobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`} />
          <span className={`block h-0.5 w-5 bg-navy-800 transition-all duration-300 ${mobileMenuOpen ? 'opacity-0' : ''}`} />
          <span className={`block h-0.5 w-5 bg-navy-800 transition-all duration-300 ${mobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
        </button>
      </div>

      {/* Mobile Dropdown */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-t border-navy-100 bg-white">
          <div className="flex flex-col px-4 py-2 gap-1">
            <Link href="/" className="rounded-lg px-3 py-2.5 text-sm font-medium text-navy-700 transition hover:bg-navy-50">
              Browse Jobs
            </Link>
            <Link href="/employers" className="rounded-lg bg-navy-900 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-navy-800 text-center">
              For Employers
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}
