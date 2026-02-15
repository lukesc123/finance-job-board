'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { slugify } from '@/lib/formatting'

const JOB_CATEGORIES = [
  'Investment Banking',
  'Private Wealth',
  'Accounting',
  'Sales & Trading',
  'Corporate Finance',
  'Consulting',
]

export default function Footer() {
  const pathname = usePathname()

  if (pathname?.startsWith('/admin')) return null

  return (
    <footer className="border-t border-navy-800 bg-navy-950 text-white">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-2 lg:grid-cols-4" role="navigation" aria-label="Footer navigation">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-1 space-y-3">
            <Link href="/" className="inline-flex items-center gap-2 text-lg font-bold text-white">
              <span className="flex items-center justify-center w-7 h-7 rounded-md bg-white text-navy-950 text-xs font-bold">
                F
              </span>
              Finance<span className="text-navy-400">Jobs</span>
            </Link>
            <p className="text-sm text-navy-400 leading-relaxed">
              Curated entry-level finance positions sourced directly from company career pages.
            </p>
          </div>

          {/* Browse by Category */}
          <div>
            <h3 className="text-xs font-semibold text-navy-300 uppercase tracking-wider mb-3">
              <Link href="/categories" className="hover:text-white transition">Categories</Link>
            </h3>
            <ul className="space-y-2">
              {JOB_CATEGORIES.map((cat) => (
                <li key={cat}>
                  <Link
                    href={`/category/${slugify(cat)}`}
                    className="text-sm text-navy-400 hover:text-white transition"
                  >
                    {cat}
                  </Link>
                </li>
              ))}
              <li><Link href="/categories" className="text-sm text-navy-300 hover:text-white transition font-medium">View all categories &rarr;</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-xs font-semibold text-navy-300 uppercase tracking-wider mb-3">
              Resources
            </h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-sm text-navy-400 hover:text-white transition">Browse All Jobs</Link>
              </li>
              <li>
                <Link href="/companies" className="text-sm text-navy-400 hover:text-white transition">Companies Hiring</Link>
              </li>
              <li>
                <Link href="/tracker" className="text-sm text-navy-400 hover:text-white transition">Application Tracker</Link>
              </li>
              <li>
                <Link href="/resources" className="text-sm text-navy-400 hover:text-white transition">Career Resources</Link>
              </li>
              <li>
                <Link href="/employers" className="text-sm text-navy-400 hover:text-white transition">For Employers</Link>
              </li>
              <li>
                <a href="https://www.finra.org/registration-exams-ce" target="_blank" rel="noopener noreferrer nofollow" className="text-sm text-navy-400 hover:text-white transition" aria-label="FINRA License Info (opens in new tab)">
                  FINRA License Info
                  <span className="sr-only"> (external link)</span>
                </a>
              </li>
              <li>
                <a href="https://www.aicpa-cima.com/resources/landing/cpa-exam" target="_blank" rel="noopener noreferrer nofollow" className="text-sm text-navy-400 hover:text-white transition" aria-label="CPA Exam Guide (opens in new tab)">
                  CPA Exam Guide
                  <span className="sr-only"> (external link)</span>
                </a>
              </li>
              <li>
                <a href="/feed.xml" className="text-sm text-navy-400 hover:text-white transition inline-flex items-center gap-1.5">
                  <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6.18 15.64a2.18 2.18 0 010 4.36 2.18 2.18 0 010-4.36M4 4.44A15.56 15.56 0 0119.56 20h-2.83A12.73 12.73 0 004 7.27V4.44m0 5.66a9.9 9.9 0 019.9 9.9h-2.83A7.07 7.07 0 004 12.93V10.1z" />
                  </svg>
                  RSS Feed
                </a>
              </li>
            </ul>
          </div>

          {/* Locations & Companies */}
          <div>
            <h3 className="text-xs font-semibold text-navy-300 uppercase tracking-wider mb-3">
              <Link href="/locations" className="hover:text-white transition">Top Locations</Link>
            </h3>
            <ul className="space-y-2">
              <li><Link href="/location/new-york-ny" className="text-sm text-navy-400 hover:text-white transition">New York, NY</Link></li>
              <li><Link href="/location/san-francisco-ca" className="text-sm text-navy-400 hover:text-white transition">San Francisco, CA</Link></li>
              <li><Link href="/location/chicago-il" className="text-sm text-navy-400 hover:text-white transition">Chicago, IL</Link></li>
              <li><Link href="/location/charlotte-nc" className="text-sm text-navy-400 hover:text-white transition">Charlotte, NC</Link></li>
              <li><Link href="/location/boston-ma" className="text-sm text-navy-400 hover:text-white transition">Boston, MA</Link></li>
              <li><Link href="/locations" className="text-sm text-navy-300 hover:text-white transition font-medium">View all locations &rarr;</Link></li>
            </ul>
            <h3 className="text-xs font-semibold text-navy-300 uppercase tracking-wider mb-3 mt-5">
              Top Companies
            </h3>
            <ul className="space-y-2">
              <li><Link href="/companies/goldman-sachs" className="text-sm text-navy-400 hover:text-white transition">Goldman Sachs</Link></li>
              <li><Link href="/companies/j-p-morgan" className="text-sm text-navy-400 hover:text-white transition">J.P. Morgan</Link></li>
              <li><Link href="/companies/morgan-stanley" className="text-sm text-navy-400 hover:text-white transition">Morgan Stanley</Link></li>
              <li><Link href="/companies" className="text-sm text-navy-300 hover:text-white transition font-medium">View all companies &rarr;</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 pt-6 border-t border-navy-800/60">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-navy-500">
              &copy; {new Date().getFullYear()} FinanceJobs. All rights reserved.
            </p>
            <div className="flex items-center gap-4 text-xs text-navy-500">
              <span>Job listings sourced from company career pages.</span>
              <a href="mailto:luke.schindler@me.com" className="hover:text-navy-300 transition">Contact</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
