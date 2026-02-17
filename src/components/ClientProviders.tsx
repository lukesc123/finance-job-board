'use client'

import dynamic from 'next/dynamic'
import { ToastProvider } from '@/components/Toast'

const ApplyToast = dynamic(() => import('@/components/ApplyToast'), { ssr: false })
const OfflineBanner = dynamic(() => import('@/components/OfflineBanner'), { ssr: false })

export default function ClientProviders({ children }: { children?: React.ReactNode }) {
  return (
    <ToastProvider>
      <OfflineBanner />
      {children}
      <ApplyToast />
    </ToastProvider>
  )
}
