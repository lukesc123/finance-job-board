import type { Metadata, Viewport } from 'next'
import './globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://finance-job-board-luke-schindlers-projects.vercel.app'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
}

export const metadata: Metadata = {
  title: 'FinanceJobs | Entry-Level Finance & Accounting Positions',
  description:
    'Curated entry-level finance and accounting jobs sourced directly from company career pages. No easy apply. Real opportunities.',
  keywords: [
    'finance jobs',
    'entry-level finance',
    'accounting jobs',
    'investment banking analyst',
    'finance internship',
    'new grad finance',
    'financial services careers',
    'CPA jobs',
    'trading analyst',
    'private equity analyst',
  ],
  authors: [{ name: 'FinanceJobs' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    siteName: 'FinanceJobs',
    title: 'FinanceJobs | Entry-Level Finance & Accounting Positions',
    description:
      'Curated entry-level finance and accounting jobs sourced directly from company career pages. No easy apply. Real opportunities.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FinanceJobs | Entry-Level Finance & Accounting Positions',
    description:
      'Curated entry-level finance and accounting jobs sourced directly from company career pages.',
  },
  alternates: {
    canonical: siteUrl,
  },
}

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'FinanceJobs',
  url: siteUrl,
  description: 'Curated entry-level finance and accounting jobs sourced directly from company career pages.',
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${siteUrl}/?search={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
      </head>
      <body className="bg-white text-gray-900 antialiased">
        <Navbar />
        <main className="min-h-screen">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
