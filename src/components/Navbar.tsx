'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Navbar() {
  const pathname = usePathname()

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
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="text-sm font-medium text-navy-700 transition hover:text-navy-900"
          >
            Browse Jobs
          </Link>
          <button className="rounded-lg bg-navy-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-navy-800">
            For Employers
          </button>
        </div>
      </div>
    </nav>
  )
}
