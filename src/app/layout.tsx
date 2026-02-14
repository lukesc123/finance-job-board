import type { Metadata, Viewport } from 'next'
import './globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ScrollToTop from '@/components/ScrollToTop'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://finance-job-board.vercel.app'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
}

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
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
        <link rel="alternate" type="application/rss+xml" title="FinanceJobs RSS Feed" href="/feed.xml" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
      </head>
      <body className="bg-navy-50 text-navy-900 antialiased">
        <Navbar />
        <main className="min-h-screen">{children}</main>
        <Footer />
        <ScrollToTop />
      </body>
    </html>
  )
}
