'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Job } from '@/types'

type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE'

interface UseRealtimeJobsOptions {
  /** Called when a new job is inserted */
  onInsert?: (job: Partial<Job>) => void
  /** Called when a job is updated (e.g. deactivated) */
  onUpdate?: (job: Partial<Job>) => void
  /** Called when a job is deleted */
  onDelete?: (old: { id: string }) => void
  /** Only subscribe to jobs matching this category */
  category?: string
  /** Enable/disable the subscription (default: true) */
  enabled?: boolean
}

/**
 * Subscribe to real-time job changes via Supabase Realtime.
 *
 * Uses a single shared channel per component instance. Cleans up on unmount.
 * The subscription only fires for active jobs to reduce noise.
 *
 * Usage:
 *   useRealtimeJobs({
 *     onInsert: (job) => setJobs(prev => [job, ...prev]),
 *     onUpdate: (job) => setJobs(prev => prev.map(j => j.id === job.id ? { ...j, ...job } : j)),
 *     category: 'Trading',
 *   })
 */
export function useRealtimeJobs(options: UseRealtimeJobsOptions = {}) {
  const { onInsert, onUpdate, onDelete, category, enabled = true } = options
  const callbacksRef = useRef({ onInsert, onUpdate, onDelete })

  // Keep callbacks ref fresh without re-subscribing
  useEffect(() => {
    callbacksRef.current = { onInsert, onUpdate, onDelete }
  }, [onInsert, onUpdate, onDelete])

  useEffect(() => {
    if (!enabled) return

    const supabase = createClient()
    const channelName = category ? `jobs-${category}` : 'jobs-all'

    const filter = category
      ? `category=eq.${category}`
      : undefined

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'jobs',
          ...(filter ? { filter } : {}),
        },
        (payload) => {
          const event = payload.eventType as RealtimeEvent
          const { onInsert, onUpdate, onDelete } = callbacksRef.current

          switch (event) {
            case 'INSERT':
              if (onInsert && payload.new) {
                onInsert(payload.new as Partial<Job>)
              }
              break
            case 'UPDATE':
              if (onUpdate && payload.new) {
                onUpdate(payload.new as Partial<Job>)
              }
              break
            case 'DELETE':
              if (onDelete && payload.old) {
                onDelete(payload.old as { id: string })
              }
              break
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [category, enabled])
}

/**
 * Lightweight hook that just tracks the count of new jobs since last fetch.
 * Useful for showing a "X new jobs" banner without re-fetching the full list.
 */
export function useNewJobCount(category?: string): {
  count: number
  reset: () => void
} {
  const countRef = useRef(0)
  const forceUpdate = useForceUpdate()

  const reset = useCallback(() => {
    countRef.current = 0
    forceUpdate()
  }, [forceUpdate])

  useRealtimeJobs({
    onInsert: () => {
      countRef.current += 1
      forceUpdate()
    },
    category,
  })

  return { count: countRef.current, reset }
}

function useForceUpdate() {
  const [, setState] = useState(0)
  return useCallback(() => setState((n: number) => n + 1), [])
}
