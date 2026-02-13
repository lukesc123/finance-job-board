'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Footer() {
  const pathname = usePathname()

  if (pathname?.startsWith('/admin')) return null

  return (
    <footer className="border-t border-navy-200 bg-white py-8">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-navy-600">
            &copy; {new Date().getFullYear()} FinanceJobs. Curated finance opportunities.
          </p>
          <div className="flex gap-6">
            <Link
              href="/"
              className="text-sm text-navy-600 hover:text-navy-900 transition"
            >
              Jobs
            </Link>
            <Link
              href="/employers"
              className="text-sm text-navy-600 hover:text-navy-900 transition"
            >
              Employers
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
