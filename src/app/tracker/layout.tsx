import { Metadata } from 'next'
import { SITE_URL } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'Application Tracker | Entry Level Finance Jobs',
  description: 'Track your job applications, saved positions, and application history in one place.',
  alternates: { canonical: `${SITE_URL}/tracker` },
  robots: { index: false, follow: true },
  openGraph: {
    title: 'Application Tracker | Entry Level Finance Jobs',
    description: 'Track your finance job applications and interview progress.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Application Tracker | Entry Level Finance Jobs',
    description: 'Track your finance job applications and interview progress.',
  },
}

export default function TrackerLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
