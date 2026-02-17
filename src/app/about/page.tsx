import { Metadata } from 'next'
import Link from 'next/link'
import { SITE_URL, CONTACT_EMAIL, JOB_CATEGORIES } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'About | Entry Level Finance Jobs',
  description:
    'Learn how Entry Level Finance Jobs curates real entry-level positions from company career pages across investment banking, accounting, consulting, and more.',
  alternates: { canonical: `${SITE_URL}/about` },
  openGraph: {
    title: 'About | Entry Level Finance Jobs',
    description:
      'Learn how Entry Level Finance Jobs curates real entry-level positions from company career pages.',
    url: `${SITE_URL}/about`,
  },
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-navy-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        {/* Hero */}
        <div className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-navy-900 tracking-tight">
            Real jobs. No noise.
          </h1>
          <p className="mt-3 text-lg text-navy-600 leading-relaxed max-w-2xl">
            Entry Level Finance Jobs is a curated job board built for students and early-career
            professionals breaking into finance. Every listing is sourced directly from company
            career pages, so you can focus on opportunities that are actually open.
          </p>
        </div>

        {/* How It Works */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-navy-900 mb-4">How it works</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              {
                icon: (
                  <svg className="h-6 w-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                ),
                title: 'We find the jobs',
                text: 'Our system crawls career pages from top financial institutions, banks, consulting firms, and asset managers daily.',
              },
              {
                icon: (
                  <svg className="h-6 w-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                ),
                title: 'We filter for entry-level',
                text: 'Each posting is categorized by role type, pipeline stage (internship, new grad, analyst), salary range, and more.',
              },
              {
                icon: (
                  <svg className="h-6 w-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                ),
                title: 'You apply directly',
                text: 'Every apply link goes straight to the company\'s application page. No middleman, no "easy apply" black hole.',
              },
            ].map((step) => (
              <div key={step.title} className="bg-white rounded-xl border border-navy-200 p-5">
                <div className="mb-3">{step.icon}</div>
                <h3 className="text-sm font-bold text-navy-900 mb-1">{step.title}</h3>
                <p className="text-sm text-navy-500 leading-relaxed">{step.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* What We Cover */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-navy-900 mb-4">Categories we cover</h2>
          <div className="flex flex-wrap gap-2">
            {JOB_CATEGORIES.map((cat) => (
              <span
                key={cat}
                className="rounded-full bg-white border border-navy-200 px-3.5 py-1.5 text-sm font-medium text-navy-700"
              >
                {cat}
              </span>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-navy-900 mb-4">Built-in tools</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { title: 'Application Tracker', desc: 'Track every application in one place with status updates, notes, and timeline.' },
              { title: 'Job Comparison', desc: 'Compare up to 4 positions side-by-side on salary, benefits, and requirements.' },
              { title: 'Email Digests', desc: 'Get daily or weekly summaries of new postings in your tracked categories.' },
              { title: 'Saved Searches', desc: 'Save your filter combinations and jump back to them instantly.' },
              { title: 'Salary Insights', desc: 'See salary ranges and averages across roles and locations.' },
              { title: 'Company Profiles', desc: 'Browse hiring companies with job counts, locations, and direct links.' },
            ].map((feature) => (
              <div key={feature.title} className="bg-white rounded-lg border border-navy-200 p-4">
                <h3 className="text-sm font-semibold text-navy-900">{feature.title}</h3>
                <p className="text-sm text-navy-500 mt-0.5">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="bg-navy-900 rounded-xl p-6 sm:p-8 text-center">
          <h2 className="text-xl font-bold text-white mb-2">Start your search</h2>
          <p className="text-navy-300 text-sm mb-5">
            Browse open positions across {JOB_CATEGORIES.length} finance categories.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/"
              className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-navy-900 hover:bg-navy-50 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
            >
              Browse Jobs
            </Link>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="rounded-lg border border-navy-600 px-5 py-2.5 text-sm font-semibold text-navy-300 hover:text-white hover:border-navy-400 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-400"
            >
              Get in Touch
            </a>
          </div>
        </section>
      </div>
    </div>
  )
}
