import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Application Tracker | FinanceJobs',
  description: 'Track your job applications, saved positions, and application history in one place.',
  robots: { index: false, follow: true },
  openGraph: {
    title: 'Application Tracker | FinanceJobs',
    description: 'Track your finance job applications and interview progress.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Application Tracker | FinanceJobs',
    description: 'Track your finance job applications and interview progress.',
  },
}

export default function TrackerLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
