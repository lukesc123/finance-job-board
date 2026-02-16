import type { Metadata } from 'next'
import Link from 'next/link'
import { SITE_URL, CONTACT_EMAIL } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'Privacy Policy | Entry Level Finance Jobs',
  description: 'Entry Level Finance Jobs privacy policy. Learn how we handle your data, what we collect, and your rights.',
  alternates: { canonical: `${SITE_URL}/privacy` },
  robots: { index: true, follow: true },
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-navy-50">
      <section className="bg-gradient-to-b from-navy-950 to-navy-900 text-white py-12 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">Privacy Policy</h1>
          <p className="text-navy-300 text-sm">Last updated: February 2026</p>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="rounded-xl border border-navy-200 bg-white p-6 sm:p-8 space-y-6 text-sm text-navy-700 leading-relaxed">
          <div>
            <h2 className="text-lg font-bold text-navy-900 mb-2">Overview</h2>
            <p>
              Entry Level Finance Jobs is a curated job board for entry-level finance and accounting positions. We are committed to protecting your privacy. This policy explains what data we collect, how we use it, and your rights regarding that data.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-navy-900 mb-2">Information We Collect</h2>
            <p className="mb-2">Entry Level Finance Jobs is designed to be privacy-friendly. We do not require account creation to browse or use most features.</p>
            <p className="font-semibold text-navy-800 mb-1">Data stored in your browser (localStorage):</p>
            <p className="mb-2">
              Saved jobs, applied jobs, compare lists, application tracker entries, and job alert preferences are stored locally in your browser. This data never leaves your device and is not transmitted to our servers.
            </p>
            <p className="font-semibold text-navy-800 mb-1">Data we may collect:</p>
            <p>
              If you submit your email for job alerts, we store your email address and category preferences to send relevant notifications. Standard web server logs may record your IP address, browser type, and pages visited for security and analytics purposes.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-navy-900 mb-2">How We Use Your Data</h2>
            <p>
              We use collected data solely to operate and improve the job board. Email addresses submitted for alerts are used only to send job notifications and are never sold or shared with third parties. We do not serve ads or use tracking cookies for advertising purposes.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-navy-900 mb-2">Third-Party Links</h2>
            <p>
              Job listings on Entry Level Finance Jobs link to external company career pages. When you click an apply link, you leave our site and are subject to that company's privacy policy. We are not responsible for the privacy practices of external sites.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-navy-900 mb-2">Data Retention</h2>
            <p>
              Browser-stored data persists until you clear your browser data. Email alert subscriptions are retained until you unsubscribe. Server logs are retained for up to 90 days.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-navy-900 mb-2">Your Rights</h2>
            <p>
              You can clear all locally stored data at any time through your browser settings. To request deletion of any server-side data or to unsubscribe from alerts, contact us at{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-navy-900 underline hover:text-navy-700">{CONTACT_EMAIL}</a>.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-navy-900 mb-2">Changes to This Policy</h2>
            <p>
              We may update this privacy policy from time to time. Changes will be posted on this page with an updated date.
            </p>
          </div>

          <div className="pt-4 border-t border-navy-100">
            <p className="text-navy-500">
              Questions? Contact us at{' '}
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
