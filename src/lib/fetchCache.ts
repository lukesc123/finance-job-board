/**
 * Client-side SWR (stale-while-revalidate) cache for fetch requests.
 *
 * Stores the last successful response for each URL in memory.
 * When fetching, returns stale data immediately while revalidating
 * in the background. This gives instant UI for repeat visits.
 *
 * Usage:
 *   const { data, stale } = await fetchWithCache<Job[]>('/api/jobs?category=trading')
 *   // data is always present (either fresh or stale)
 *   // stale is true if the data came from cache and is being refreshed
 */

import { fetchRetry } from './fetchRetry'

interface CacheEntry<T> {
  data: T
  timestamp: number
  url: string
}

// In-memory cache, survives navigation within SPA
const cache = new Map<string, CacheEntry<unknown>>()

/** Maximum age of a cache entry before it's discarded entirely (10 min) */
const MAX_STALE_MS = 10 * 60 * 1000

/** Time within which cache is considered fresh (no revalidation needed) */
const FRESH_MS = 30 * 1000

interface FetchCacheOptions extends RequestInit {
  /** Max age for "fresh" data in ms (default: 30s). Within this window, no network request is made. */
  freshMs?: number
  /** Max age for "stale" data in ms (default: 10min). Beyond this, cache is discarded. */
  maxStaleMs?: number
  /** fetchRetry options */
  retries?: number
  timeout?: number
}

interface FetchCacheResult<T> {
  data: T
  /** True if data came from cache and a background revalidation is in progress */
  stale: boolean
}

export async function fetchWithCache<T>(
  url: string,
  options?: FetchCacheOptions,
): Promise<FetchCacheResult<T>> {
  const {
    freshMs = FRESH_MS,
    maxStaleMs = MAX_STALE_MS,
    retries,
    timeout,
    ...fetchInit
  } = options || {}

  const now = Date.now()
  const cached = cache.get(url) as CacheEntry<T> | undefined

  // If we have fresh data, return immediately (no network)
  if (cached && (now - cached.timestamp) < freshMs) {
    return { data: cached.data, stale: false }
  }

  // If we have stale-but-usable data, return it and revalidate in background
  if (cached && (now - cached.timestamp) < maxStaleMs) {
    // Fire-and-forget revalidation
    revalidate<T>(url, { ...fetchInit, retries, timeout })
    return { data: cached.data, stale: true }
  }

  // No cache or too stale: fetch fresh
  const data = await doFetch<T>(url, { ...fetchInit, retries, timeout })
  return { data, stale: false }
}

/** Clear the entire cache or a specific URL */
export function clearFetchCache(url?: string): void {
  if (url) {
    cache.delete(url)
  } else {
    cache.clear()
  }
}

async function doFetch<T>(
  url: string,
  init?: { retries?: number; timeout?: number } & RequestInit,
): Promise<T> {
  const { retries, timeout, ...fetchInit } = init || {}
  const res = await fetchRetry(url, { ...fetchInit, retries, timeout })
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`)
  const data = (await res.json()) as T
  cache.set(url, { data, timestamp: Date.now(), url })
  return data
}

// Prevent duplicate revalidations for the same URL
const revalidating = new Set<string>()

async function revalidate<T>(
  url: string,
  init?: { retries?: number; timeout?: number } & RequestInit,
): Promise<void> {
  if (revalidating.has(url)) return
  revalidating.add(url)
  try {
    await doFetch<T>(url, init)
  } catch {
    // Silently fail: stale data is still being shown
  } finally {
    revalidating.delete(url)
  }
}
