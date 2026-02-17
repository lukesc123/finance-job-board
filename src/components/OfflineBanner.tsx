'use client'

import { useState, useEffect, memo } from 'react'

export default memo(function OfflineBanner() {
  const [offline, setOffline] = useState(false)

  useEffect(() => {
    const goOffline = () => setOffline(true)
    const goOnline = () => setOffline(false)

    // Check initial state
    if (!navigator.onLine) setOffline(true)

    window.addEventListener('offline', goOffline)
    window.addEventListener('online', goOnline)
    return () => {
      window.removeEventListener('offline', goOffline)
      window.removeEventListener('online', goOnline)
    }
  }, [])

  if (!offline) return null

  return (
    <div
      role="alert"
      className="fixed top-0 left-0 right-0 z-[70] bg-amber-500 text-amber-950 text-center text-sm font-medium py-2 px-4 shadow-md"
    >
      <span className="inline-flex items-center gap-2">
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m-2.829-2.829a5 5 0 000-7.07m-2.828 2.828a1 1 0 010 1.414" />
        </svg>
        You appear to be offline. Some features may not work.
      </span>
    </div>
  )
})
