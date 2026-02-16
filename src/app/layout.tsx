import type { Metadata, Viewport } from 'next'
import './globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ScrollToTop from '@/components/ScrollToTop'
import { SITE_URL, CONTACT_EMAIL } from "@/lib/constants"


export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#0a1628',
}

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
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
    url: SITE_URL,
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
    canonical: SITE_URL,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'FinanceJobs',
  },
}

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'FinanceJobs',
  url: SITE_URL,
  logo: `${SITE_URL}/icon`,
  description: 'Curated entry-level finance and accounting jobs sourced directly from company career pages.',
  contactPoint: {
    '@type': 'ContactPoint',
    email: CONTACT_EMAIL,
    contactType: 'customer service',
  },
}

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'FinanceJobs',
  url: SITE_URL,
  description: 'Curated entry-level finance and accounting jobs sourced directly from company career pages.',
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${SITE_URL}/?search={search_term_string}`,
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
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="alternate" type="application/rss+xml" title="FinanceJobs RSS Feed" href="/feed.xml" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href={process.env.NEXT_PUBLIC_SUPABASE_URL || ''} />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </head>
      <body className="bg-navy-50 text-navy-900 antialiased" suppressHydrationWarning>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:rounded-lg focus:bg-navy-900 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:shadow-lg"
        >
          Skip to content
        </a>
        <Navbar />
        <main id="main-content" className="min-h-screen">{children}</main>
        <Footer />
        <ScrollToTop />
      </body>
    </html>
  )
}
