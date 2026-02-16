import type { Metadata } from 'next'
import Link from 'next/link'
import { SITE_URL, CONTACT_EMAIL } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'Terms of Service | Entry Level Finance Jobs',
  description: 'Entry Level Finance Jobs terms of service. Guidelines for using our job board, disclaimers, and user responsibilities.',
  alternates: { canonical: `${SITE_URL}/terms` },
  robots: { index: true, follow: true },
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-navy-50">
      <section className="bg-gradient-to-b from-navy-950 to-navy-900 text-white py-12 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">Terms of Service</h1>
          <p className="text-navy-300 text-sm">Last updated: February 2026</p>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="rounded-xl border border-navy-200 bg-white p-6 sm:p-8 space-y-6 text-sm text-navy-700 leading-relaxed">
          <div>
            <h2 className="text-lg font-bold text-navy-900 mb-2">Acceptance of Terms</h2>
            <p>
              By accessing and using Entry Level Finance Jobs, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the site.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-navy-900 mb-2">Service Description</h2>
            <p>
              Entry Level Finance Jobs is a curated job board that aggregates entry-level finance and accounting positions from company career pages. We provide links to external job listings but do not directly employ, recruit, or make hiring decisions. All applications are submitted through the respective company's career portal.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-navy-900 mb-2">Job Listing Accuracy</h2>
            <p>
              While we make every effort to keep listings current and accurate, we cannot guarantee the availability, accuracy, or completeness of any job posting. Positions may be filled, removed, or modified by the hiring company at any time without notice. Salary ranges shown are estimates and may not reflect the final compensation offered.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-navy-900 mb-2">User Responsibilities</h2>
            <p>
              You agree to use Entry Level Finance Jobs for lawful purposes only. You are responsible for verifying the legitimacy of any job posting before submitting personal information to external sites. We recommend researching companies independently and never paying fees to apply for a job.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-navy-900 mb-2">Intellectual Property</h2>
            <p>
              The Entry Level Finance Jobs name, logo, design, and original content are protected by intellectual property laws. Job listing data is sourced from publicly available company career pages. Company names, logos, and trademarks belong to their respective owners.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-navy-900 mb-2">Limitation of Liability</h2>
            <p>
              Entry Level Finance Jobs is provided "as is" without warranties of any kind. We are not liable for any damages arising from your use of the site, including but not limited to: decisions made based on job listing information, interactions with third-party employer websites, or loss of locally stored data.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-navy-900 mb-2">External Links</h2>
            <p>
              Entry Level Finance Jobs contains links to external websites operated by employers and other third parties. We do not control, endorse, or assume responsibility for the content, privacy policies, or practices of these external sites.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-navy-900 mb-2">Modifications</h2>
            <p>
              We reserve the right to modify these terms at any time. Continued use of the site after changes constitutes acceptance of the updated terms.
            </p>
          </div>

          <div className="pt-4 border-t border-navy-100">
            <p className="text-navy-500">
              Questions about these terms? Contact us at{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-navy-700 underline hover:text-navy-900">{CONTACT_EMAIL}</a>
            </p>
            <Link href="/" className="inline-flex items-center gap-1 mt-3 text-sm font-medium text-navy-600 hover:text-navy-900 transition">
              &larr; Back to Jobs
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
