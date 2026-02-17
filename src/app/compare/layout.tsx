import { Metadata } from 'next'
import { SITE_URL } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'Compare Jobs | Entry Level Finance Jobs',
  description: 'Compare salary, location, and details across multiple finance job listings side by side.',
  alternates: { canonical: `${SITE_URL}/compare` },
  robots: { index: false, follow: true },
  openGraph: {
    title: 'Compare Jobs | Entry Level Finance Jobs',
    description: 'Compare salary, location, and details across multiple finance job listings.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Compare Jobs | Entry Level Finance Jobs',
    description: 'Compare salary, location, and details across multiple finance job listings.',
  },
}

export default function CompareLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
