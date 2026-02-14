import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Application Tracker | FinanceJobs',
  description: 'Track your finance job applications in one place. Monitor application status, deadlines, and follow-ups for your entry-level finance job search.',
  robots: { index: false },
}

export default function TrackerLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
