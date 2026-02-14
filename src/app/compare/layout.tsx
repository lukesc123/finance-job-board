import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Compare Jobs | FinanceJobs',
  description: 'Compare entry-level finance jobs side by side. Evaluate salary, location, benefits, and requirements to find the best fit for your career.',
  robots: { index: false },
}

export default function CompareLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
