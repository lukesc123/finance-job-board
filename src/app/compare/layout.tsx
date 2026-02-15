import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Compare Jobs | FinanceJobs',
  description: 'Compare salary, location, and details across multiple finance job listings side by side.',
  robots: { index: false, follow: true },
  openGraph: {
    title: 'Compare Jobs | FinanceJobs',
    description: 'Compare salary, location, and details across multiple finance job listings.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Compare Jobs | FinanceJobs',
    description: 'Compare salary, location, and details across multiple finance job listings.',
  },
}

export default function CompareLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
