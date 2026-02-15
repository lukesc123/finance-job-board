/**
 * Simple in-memory rate limiter for API routes.
 * Uses a sliding window approach with automatic cleanup.
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Clean up expired entries every 60 seconds
let lastCleanup = Date.now()
function cleanup() {
  const now = Date.now()
  if (now - lastCleanup < 60_000) return
  lastCleanup = now
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key)
  }
}

/**
 * Check if a request should be rate limited.
 * @param key - Unique identifier (e.g. IP + route)
 * @param limit - Max requests per window
 * @param windowMs - Window size in milliseconds
 * @returns { limited: boolean, remaining: number }
 */
export function rateLimit(
  key: string,
  limit: number = 60,
  windowMs: number = 60_000
): { limited: boolean; remaining: number } {
  cleanup()

  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { limited: false, remaining: limit - 1 }
  }

  entry.count++
  const remaining = Math.max(0, limit - entry.count)

  if (entry.count > limit) {
    return { limited: true, remaining: 0 }
  }

  return { limited: false, remaining }
}

/**
 * Get client IP from request headers (works with Vercel/Cloudflare).
 */
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  const real = request.headers.get('x-real-ip')
  if (real) return real
  return 'unknown'
}
