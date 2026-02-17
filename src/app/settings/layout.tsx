import { Metadata } from 'next'
import { SITE_URL } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'Preferences | Entry Level Finance Jobs',
  description: 'Manage your job alert preferences, notification settings, and account details.',
  alternates: { canonical: `${SITE_URL}/settings` },
  robots: { index: false, follow: true },
}

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
