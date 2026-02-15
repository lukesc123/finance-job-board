import type { Metadata } from 'next'
import Link from 'next/link'
import { SITE_URL } from "@/lib/constants"


export const revalidate = 3600 // Static content, revalidate hourly

export const metadata: Metadata = {
  title: 'Career Resources | FinanceJobs',
  description: 'Essential guides, tips, and resources for landing your first finance job. Interview prep, resume advice, and career path guides for entry-level finance professionals.',
  alternates: { canonical: `${SITE_URL}/resources` },
  openGraph: {
    title: 'Finance Career Resources | FinanceJobs',
    description: 'Essential guides for landing your first finance job.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Career Resources | FinanceJobs',
    description: 'Essential guides for landing your first finance job.',
  },
}

const GUIDES = [
  {
    title: 'Investment Banking Interview Prep',
    slug: 'investment-banking-interview',
    category: 'Interview Prep',
    description: 'Master technical questions, behavioral interviews, and case studies for IB roles. Covers valuation methods, DCF modeling, and M&A concepts.',
    topics: ['DCF Modeling', 'Valuation Methods', 'M&A Concepts', 'Behavioral Questions', 'Case Studies'],
    difficulty: 'Advanced',
    readTime: '15 min read',
  },
  {
    title: 'Breaking Into Corporate Finance',
    slug: 'corporate-finance-career',
    category: 'Career Guide',
    description: 'A comprehensive roadmap for starting your career in corporate finance. From FP&A analyst to CFO, understand the typical career progression and skills needed.',
    topics: ['FP&A', 'Financial Modeling', 'Budgeting', 'Forecasting', 'Career Path'],
    difficulty: 'Beginner',
    readTime: '10 min read',
  },
  {
    title: 'Finance Resume That Gets Interviews',
    slug: 'finance-resume-guide',
    category: 'Resume Tips',
    description: 'How to craft a finance resume that stands out. Learn what recruiters look for, how to quantify your achievements, and format best practices.',
    topics: ['Action Verbs', 'Quantified Results', 'ATS Optimization', 'Format Tips', 'Common Mistakes'],
    difficulty: 'Beginner',
    readTime: '8 min read',
  },
  {
    title: 'CFA vs CPA vs Series Licenses',
    slug: 'finance-certifications',
    category: 'Certifications',
    description: 'Compare the top finance certifications. Understand which license or designation is right for your career goals and how to prepare for each exam.',
    topics: ['CFA Program', 'CPA Exam', 'Series 7 & 66', 'SIE Exam', 'ROI Analysis'],
    difficulty: 'Intermediate',
    readTime: '12 min read',
  },
  {
    title: 'Accounting Career Paths Explained',
    slug: 'accounting-career-paths',
    category: 'Career Guide',
    description: 'From Big 4 audit to industry accounting, explore the many career paths available to accounting graduates. Salary expectations and growth opportunities.',
    topics: ['Big 4 Firms', 'Public vs Private', 'Tax vs Audit', 'Advisory', 'Salary Ranges'],
    difficulty: 'Beginner',
    readTime: '10 min read',
  },
  {
    title: 'Sales & Trading Interview Guide',
    slug: 'sales-trading-interview',
    category: 'Interview Prep',
    description: 'Prepare for sales and trading interviews with this guide covering market knowledge, mental math, brainteasers, and the "pitch me a stock" question.',
    topics: ['Market Knowledge', 'Mental Math', 'Stock Pitches', 'Brainteasers', 'Current Events'],
    difficulty: 'Advanced',
    readTime: '12 min read',
  },
  {
    title: 'Networking in Finance: A Practical Guide',
    slug: 'networking-guide',
    category: 'Career Tips',
    description: 'Build a professional network in finance even without connections. Learn cold email templates, informational interview tips, and LinkedIn strategies.',
    topics: ['Cold Emails', 'Informational Interviews', 'LinkedIn Tips', 'Coffee Chats', 'Follow-Up'],
    difficulty: 'Beginner',
    readTime: '8 min read',
  },
  {
    title: 'Private Equity & Venture Capital 101',
    slug: 'pe-vc-guide',
    category: 'Career Guide',
    description: 'Understand the private equity and venture capital landscape. Learn about deal flow, due diligence, portfolio management, and how to break into these competitive fields.',
    topics: ['Deal Sourcing', 'Due Diligence', 'LBO Modeling', 'Fund Structure', 'Career Entry Points'],
    difficulty: 'Intermediate',
    readTime: '14 min read',
  },
]

const DIFFICULTY_COLORS: Record<string, string> = {
  Beginner: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Intermediate: 'bg-amber-50 text-amber-700 border-amber-200',
  Advanced: 'bg-red-50 text-red-700 border-red-200',
}

const CATEGORY_ICONS: Record<string, string> = {
  'Interview Prep': 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z',
  'Career Guide': 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7',
  'Resume Tips': 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  'Certifications': 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z',
  'Career Tips': 'M13 10V3L4 14h7v7l9-11h-7z',
}

export default function ResourcesPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Finance Career Resources',
    description: 'Essential guides, tips, and resources for landing your first finance job.',
    url: `${SITE_URL}/resources`,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: GUIDES.map((guide, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: guide.title,
        description: guide.description,
      })),
    },
  }

  return (
    <div className="min-h-screen bg-navy-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {/* Hero */}
      <section className="bg-gradient-to-b from-navy-950 to-navy-900 text-white py-14 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">
            Career Resources
          </h1>
          <p className="text-base sm:text-lg text-navy-300 max-w-2xl mx-auto">
            Essential guides, tips, and resources to help you land your first finance job and build a successful career.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Quick stats */}
        <div className="flex items-center gap-6 mb-8 text-sm text-navy-500">
          <span><span className="font-semibold text-navy-900">{GUIDES.length}</span> guides</span>
          <span><span className="font-semibold text-navy-900">4</span> categories</span>
          <Link href="/" className="ml-auto text-navy-600 hover:text-navy-900 transition font-medium">
            Browse Jobs &rarr;
          </Link>
        </div>

        {/* Guides Grid */}
        <div className="grid gap-4 sm:grid-cols-2">
          {GUIDES.map((guide) => (
            <article
              key={guide.slug}
              className="rounded-xl border border-navy-200 bg-white p-5 hover:shadow-md hover:border-navy-300 transition-all group"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy-100 text-navy-600 flex-shrink-0 group-hover:bg-navy-900 group-hover:text-white transition-colors">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={CATEGORY_ICONS[guide.category] || CATEGORY_ICONS['Career Guide']} />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-navy-400">{guide.category}</span>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${DIFFICULTY_COLORS[guide.difficulty]}`}>
                      {guide.difficulty}
                    </span>
                  </div>
                  <h2 className="font-bold text-navy-900 group-hover:text-navy-700 transition leading-snug">
                    {guide.title}
                  </h2>
                </div>
              </div>

              <p className="text-sm text-navy-600 leading-relaxed mb-3">
                {guide.description}
              </p>

              <div className="flex flex-wrap gap-1.5 mb-3">
                {guide.topics.map((topic) => (
                  <span
                    key={topic}
                    className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-navy-50 text-navy-500 border border-navy-100"
                  >
                    {topic}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-navy-400">{guide.readTime}</span>
                <span className="text-xs font-semibold text-navy-500 group-hover:text-navy-700 transition">
                  Coming Soon
                </span>
              </div>
            </article>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-10 rounded-xl border border-navy-200 bg-white p-6 sm:p-8 text-center">
          <h2 className="text-lg font-bold text-navy-900 mb-2">Ready to start your finance career?</h2>
          <p className="text-sm text-navy-600 mb-4 max-w-lg mx-auto">
            Browse curated entry-level positions from top financial institutions. Every listing links directly to the company's career page.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-lg bg-navy-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-navy-800 transition"
            >
              Browse Jobs
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
            <Link
              href="/companies"
              className="inline-flex items-center gap-2 rounded-lg border border-navy-200 bg-white px-5 py-2.5 text-sm font-semibold text-navy-700 hover:bg-navy-50 transition"
            >
              View Companies
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
