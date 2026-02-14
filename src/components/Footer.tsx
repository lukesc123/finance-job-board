'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

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
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-2 lg:grid-cols-4">
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
              Categories
            </h3>
            <ul className="space-y-2">
              {JOB_CATEGORIES.map((cat) => (
                <li key={cat}>
                  <Link
                    href={`/?category=${encodeURIComponent(cat)}`}
                    className="text-sm text-navy-400 hover:text-white transition"
                  >
                    {cat}
                  </Link>
                </li>
              ))}
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
                <Link href="/employers" className="text-sm text-navy-400 hover:text-white transition">For Employers</Link>
              </li>
              <li>
                <a href="https://www.finra.org/registration-exams-ce" target="_blank" rel="noopener noreferrer" className="text-sm text-navy-400 hover:text-white transition">
                  FINRA License Info
                </a>
              </li>
              <li>
                <a href="https://www.aicpa-cima.com/resources/landing/cpa-exam" target="_blank" rel="noopener noreferrer" className="text-sm text-navy-400 hover:text-white transition">
                  CPA Exam Guide
                </a>
              </li>
            </ul>
          </div>

          {/* Experience Level */}
          <div>
            <h3 className="text-xs font-semibold text-navy-300 uppercase tracking-wider mb-3">
              Experience Level
            </h3>
            <ul className="space-y-2">
              <li><Link href="/?pipeline_stage=Sophomore+Internship" className="text-sm text-navy-400 hover:text-white transition">Sophomore Internships</Link></li>
              <li><Link href="/?pipeline_stage=Junior+Internship" className="text-sm text-navy-400 hover:text-white transition">Junior Internships</Link></li>
              <li><Link href="/?pipeline_stage=Senior+Internship" className="text-sm text-navy-400 hover:text-white transition">Senior Internships</Link></li>
              <li><Link href="/?pipeline_stage=New+Grad" className="text-sm text-navy-400 hover:text-white transition">New Grad Roles</Link></li>
              <li><Link href="/?pipeline_stage=Early+Career" className="text-sm text-navy-400 hover:text-white transition">Early Career</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 pt-6 border-t border-navy-800/60">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-navy-500">
              &copy; {new Date().getFullYear()} FinanceJobs. All rights reserved.
            </p>
            <p className="text-xs text-navy-600">
              Job listings sourced from company career pages. We do not accept payments for placement.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
