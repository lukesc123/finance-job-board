import { Metadata } from 'next'
import { SITE_URL } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'Sign In | Entry Level Finance Jobs',
  description: 'Sign in to save jobs, track applications, and get personalized job alerts.',
  alternates: { canonical: `${SITE_URL}/login` },
  robots: { index: false, follow: true },
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
