import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Application Tracker | FinanceJobs',
  description: 'Track your job applications, saved positions, and application history in one place.',
  robots: { index: false },
}

export default function TrackerLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
