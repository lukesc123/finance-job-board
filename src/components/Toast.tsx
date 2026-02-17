'use client'

import { useState, useEffect, useCallback, createContext, useContext, useRef, type ReactNode } from 'react'

interface ToastItem {
  id: number
  message: string
  type: 'success' | 'error' | 'info'
}

interface ToastContextType {
  toast: (message: string, type?: 'success' | 'error' | 'info') => void
}

const ToastContext = createContext<ToastContextType>({ toast: () => {} })

export function useToast() {
  return useContext(ToastContext)
}

let nextId = 0

const SWIPE_THRESHOLD = 80

function SwipeableToast({ item, icon, onDismiss }: { item: ToastItem; icon: ReactNode; onDismiss: (id: number) => void }) {
  const startX = useRef(0)
  const currentX = useRef(0)
  const elRef = useRef<HTMLDivElement>(null)

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX
    currentX.current = 0
  }, [])

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    const dx = e.touches[0].clientX - startX.current
    // Only allow swiping right (positive direction)
    currentX.current = Math.max(0, dx)
    if (elRef.current) {
      elRef.current.style.transform = `translateX(${currentX.current}px)`
      elRef.current.style.opacity = `${1 - currentX.current / 200}`
    }
  }, [])

  const onTouchEnd = useCallback(() => {
    if (currentX.current > SWIPE_THRESHOLD) {
      onDismiss(item.id)
    } else if (elRef.current) {
      elRef.current.style.transform = ''
      elRef.current.style.opacity = ''
    }
  }, [item.id, onDismiss])

  return (
    <div
      ref={elRef}
      role="status"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      className="pointer-events-auto flex items-center gap-2 rounded-lg bg-white border border-navy-200 shadow-lg px-4 py-3 text-sm text-navy-800 animate-fade-in-up max-w-xs transition-[transform,opacity] duration-150"
    >
      {icon}
      <span className="flex-1">{item.message}</span>
      <button
        onClick={() => onDismiss(item.id)}
        className="p-0.5 text-navy-400 hover:text-navy-600 transition"
        aria-label="Dismiss notification"
      >
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const timersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map())

  const toast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = nextId++
    setToasts(prev => [...prev, { id, message, type }])
    const timer = setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
      timersRef.current.delete(id)
    }, 3000)
    timersRef.current.set(id, timer)
  }, [])

  const dismiss = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id))
    const timer = timersRef.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timersRef.current.delete(id)
    }
  }, [])

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      timersRef.current.forEach(timer => clearTimeout(timer))
    }
  }, [])

  const iconMap = {
    success: (
      <svg className="h-4 w-4 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    error: (
      <svg className="h-4 w-4 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    info: (
      <svg className="h-4 w-4 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  }

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        className="fixed bottom-4 right-4 z-[60] flex flex-col-reverse gap-2 pointer-events-none"
        aria-live="polite"
        aria-atomic="false"
      >
        {toasts.map(t => (
          <SwipeableToast key={t.id} item={t} icon={iconMap[t.type]} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}
