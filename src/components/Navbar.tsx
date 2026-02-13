'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'

export default function Navbar() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Close menu on navigation
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  if (pathname?.startsWith('/admin')) return null

  return (
    <nav className="border-b border-navy-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link
          href="/"
          className="text-xl font-bold text-navy-900 hover:text-navy-800 transition"
        >
          Finance<span className="text-navy-600">Jobs</span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden sm:flex items-center gap-6">
          <Link
            href="/"
            className="text-sm font-medium text-navy-700 transition hover:text-navy-900"
          >
            Browse Jobs
          </Link>
          <Link
            href="/employers"
            className="rounded-lg bg-navy-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-navy-800"
          >
            For Employers
          </Link>
        </div>

        {/* Mobile Hamburger Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="sm:hidden flex flex-col items-center justify-center gap-1.5 p-2"
          aria-label="Toggle mobile menu"
          aria-expanded={mobileMenuOpen}
        >
          <span
            className={`block h-0.5 w-6 bg-navy-900 transition-all duration-300 ${
              mobileMenuOpen ? 'rotate-45 translate-y-2' : ''
            }`}
          />
          <span
            className={`block h-0.5 w-6 bg-navy-900 transition-all duration-300 ${
              mobileMenuOpen ? 'opacity-0' : ''
            }`}
          />
          <span
            className={`block h-0.5 w-6 bg-navy-900 transition-all duration-300 ${
              mobileMenuOpen ? '-rotate-45 -translate-y-2' : ''
            }`}
          />
        </button>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-t border-navy-200 bg-white">
          <div className="flex flex-col px-4 py-3 gap-3">
            <Link
              href="/"
              className="rounded px-3 py-2 text-sm font-medium text-navy-700 transition hover:bg-navy-50 hover:text-navy-900"
            >
              Browse Jobs
            </Link>
            <Link
              href="/employers"
              className="rounded-lg bg-navy-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-navy-800"
            >
              For Employers
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}
