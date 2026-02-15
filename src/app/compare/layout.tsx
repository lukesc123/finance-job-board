import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Compare Jobs | FinanceJobs',
  description: 'Compare salary, location, and details across multiple finance job listings side by side.',
  robots: { index: false },
}

export default function CompareLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
