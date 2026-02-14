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

const VALUE_PROPS = [
  {
    title: 'Targeted Audience',
    description: 'Every visitor actively searches for finance and accounting opportunities. Reach qualified candidates with no wasted spend.',
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    title: 'Direct to Your Career Page',
    description: 'Candidates apply directly through your system. No "easy apply" spam, just qualified submissions using your own ATS.',
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    ),
  },
  {
    title: 'Clean & Simple',
    description: 'Curated job board focused exclusively on entry-level finance positions. Professional environment for serious candidates.',
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
]

const STATS = [
  { value: '66+', label: 'Active Listings' },
  { value: '30+', label: 'Companies' },
  { value: '15', label: 'Categories' },
]

export default function EmployersPage() {
  return (
    <div className="min-h-screen bg-navy-50">
      {/* Hero */}
      <section className="bg-gradient-to-b from-navy-950 to-navy-900 text-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-4">
            Reach Top Entry-Level Finance Talent
          </h1>
          <p className="text-base sm:text-lg text-navy-300 max-w-2xl mx-auto mb-8">
            Connect directly with candidates actively seeking finance and accounting careers. Every listing links to your career page.
          </p>
          <a
            href="mailto:luke.schindler@me.com"
            className="inline-flex items-center gap-2 rounded-lg bg-white text-navy-900 px-6 py-3 text-sm font-semibold hover:bg-navy-100 transition shadow-sm"
          >
            Get Started
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </a>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-white border-b border-navy-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-3 divide-x divide-navy-100">
            {STATS.map((stat) => (
              <div key={stat.label} className="py-6 sm:py-8 text-center">
                <p className="text-2xl sm:text-3xl font-extrabold text-navy-900">{stat.value}</p>
                <p className="text-xs sm:text-sm text-navy-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Value Props */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid gap-6 sm:grid-cols-3">
          {VALUE_PROPS.map((prop) => (
            <div key={prop.title} className="rounded-xl border border-navy-200 bg-white p-6 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-navy-50 text-navy-700 mx-auto mb-4">
                {prop.icon}
              </div>
              <h3 className="text-base font-bold text-navy-900 mb-2">{prop.title}</h3>
              <p className="text-sm text-navy-600 leading-relaxed">{prop.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-white border-y border-navy-200 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-navy-900 text-center mb-10">How It Works</h2>
          <div className="space-y-6">
            {[
              { step: '1', title: 'Get in touch', desc: 'Email us with your company details and the roles you want to feature.' },
              { step: '2', title: 'We curate your listing', desc: 'We verify the role and create a detailed listing that links directly to your career page.' },
              { step: '3', title: 'Candidates apply directly', desc: 'Interested candidates click through to your ATS. No middleman, no easy apply.' },
            ].map((item) => (
              <div key={item.step} className="flex gap-4 items-start">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-navy-900 text-white text-sm font-bold flex-shrink-0">
                  {item.step}
                </div>
                <div>
                  <h3 className="font-semibold text-navy-900">{item.title}</h3>
                  <p className="text-sm text-navy-600 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-navy-900 mb-3">Ready to recruit?</h2>
          <p className="text-navy-600 mb-8">
            Get in touch to post your opportunities and connect with talented entry-level finance professionals.
          </p>
          <a
            href="mailto:luke.schindler@me.com"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-navy-900 px-8 py-3 text-sm font-semibold text-white hover:bg-navy-800 transition shadow-sm"
          >
            Contact Us
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </a>
          <p className="mt-3 text-sm text-navy-500">luke.schindler@me.com</p>
        </div>
      </section>
    </div>
  )
}
