import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'For Employers | FinanceJobs',
  description: 'Reach top entry-level finance and accounting talent. Post your opportunities on FinanceJobs and connect directly with qualified candidates through your career page.',
  openGraph: {
    title: 'For Employers | FinanceJobs',
    description: 'Reach top entry-level finance and accounting talent. Post your opportunities on FinanceJobs.',
    type: 'website',
  },
}

export default function EmployersPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-navy-950 text-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-6">
            Reach Top Entry-Level Finance Talent
          </h1>
          <p className="text-lg text-navy-200 max-w-2xl mx-auto">
            Connect directly with candidates actively seeking finance and accounting careers. Every listing links to your career page—no intermediaries.
          </p>
        </div>
      </section>

      {/* Value Props */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid gap-8 sm:grid-cols-3">
          {/* Targeted Audience */}
          <div className="text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-navy-50 mx-auto mb-4">
              <svg
                className="h-6 w-6 text-navy-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-navy-900">Targeted Audience</h3>
            <p className="mt-3 text-navy-600">
              Every visitor actively searches for finance and accounting opportunities. Reach qualified candidates with no wasted spend.
            </p>
          </div>

          {/* Direct Applications */}
          <div className="text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-navy-50 mx-auto mb-4">
              <svg
                className="h-6 w-6 text-navy-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-navy-900">Direct to Your Career Page</h3>
            <p className="mt-3 text-navy-600">
              Candidates apply directly through your system. No "easy apply" spam, just qualified submissions using your own ATS.
            </p>
          </div>

          {/* Professional Service */}
          <div className="text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-navy-50 mx-auto mb-4">
              <svg
                className="h-6 w-6 text-navy-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-navy-900">Clean & Simple</h3>
            <p className="mt-3 text-navy-600">
              Curated job board focused exclusively on entry-level finance positions. Professional environment for serious candidates.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-navy-200 bg-navy-50 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-navy-900 mb-4">Ready to recruit?</h2>
          <p className="text-lg text-navy-700 mb-8">
            We help companies connect with talented entry-level finance professionals. Get in touch to post your opportunities.
          </p>
          <a
            href="mailto:luke.schindler@me.com"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-navy-900 px-8 py-3 text-base font-semibold text-white hover:bg-navy-800 transition"
          >
            Contact Us
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              />
            </svg>
          </a>
          <p className="mt-4 text-sm text-navy-600">
            Email: luke.schindler@me.com
          </p>
        </div>
      </section>
    </div>
  )
}
