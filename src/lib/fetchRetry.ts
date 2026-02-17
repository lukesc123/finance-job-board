/**
 * Resilient fetch with automatic retry on network errors and 5xx responses.
 *
 * Features:
 * - Exponential backoff with +-25% jitter (prevents thundering herd)
 * - Configurable retry count and per-request timeout
 * - AbortController-aware (respects caller cancellation)
 * - Only retries on transient failures (5xx, network), never 4xx
 * - Request deduplication: identical in-flight GET requests are coalesced
 */

interface FetchRetryInit extends RequestInit {
  /** Number of retry attempts (default: 2, meaning 3 total tries) */
  retries?: number
  /** Per-attempt timeout in ms (default: 10000). Set 0 to disable. */
  timeout?: number
  /** Disable deduplication for this request (default: false) */
  skipDedup?: boolean
}

// In-flight GET request deduplication map
// Key: URL string, Value: pending promise
const inflightGETs = new Map<string, Promise<Response>>()

export async function fetchRetry(
  input: RequestInfo | URL,
  init?: FetchRetryInit,
): Promise<Response> {
  const { retries = 2, timeout = 10_000, skipDedup = false, ...fetchInit } = init || {}
  const method = (fetchInit.method || 'GET').toUpperCase()

  // Dedup identical in-flight GET requests (safe since GETs are idempotent)
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
  if (method === 'GET' && !skipDedup) {
    const existing = inflightGETs.get(url)
    if (existing) {
      // Clone the response so each consumer gets their own body stream
      return existing.then(r => r.clone())
    }

    const promise = doFetch(input, { retries, timeout, ...fetchInit })
    inflightGETs.set(url, promise)

    try {
      const response = await promise
      return response
    } finally {
      inflightGETs.delete(url)
    }
  }

  return doFetch(input, { retries, timeout, ...fetchInit })
}

async function doFetch(
  input: RequestInfo | URL,
  init: { retries: number; timeout: number } & RequestInit,
): Promise<Response> {
  const { retries, timeout, ...fetchInit } = init
  let lastError: unknown

  for (let attempt = 0; attempt <= retries; attempt++) {
    let timeoutId: ReturnType<typeof setTimeout> | undefined

    try {
      // Wire up per-attempt timeout while respecting caller's AbortSignal
      let signal = fetchInit.signal
      const callerSignal = fetchInit.signal

      if (timeout > 0 && !callerSignal?.aborted) {
        const controller = new AbortController()
        timeoutId = setTimeout(() => controller.abort(), timeout)

        // Forward caller abort to our controller
        if (callerSignal) {
          callerSignal.addEventListener(
            'abort',
            () => controller.abort(callerSignal.reason),
            { once: true },
          )
        }

        signal = controller.signal
      }

      const res = await fetch(input, { ...fetchInit, signal })

      if (timeoutId) clearTimeout(timeoutId)

      // Don't retry client errors (4xx), only server errors (5xx)
      if (res.ok || (res.status >= 400 && res.status < 500)) {
        return res
      }

      // Server error: retry if attempts remain
      if (attempt < retries) {
        await backoff(attempt)
        continue
      }
      return res
    } catch (err) {
      if (timeoutId) clearTimeout(timeoutId)

      // Caller-initiated aborts should never be retried
      if (err instanceof DOMException && err.name === 'AbortError') {
        if (fetchInit.signal?.aborted) throw err
        // Our timeout fired: treat as transient, retry if possible
      }

      lastError = err
      if (attempt < retries) {
        await backoff(attempt)
        continue
      }
    }
  }

  throw lastError
}

/** Exponential backoff with +-25% jitter to decorrelate retries */
function backoff(attempt: number): Promise<void> {
  const base = 500 * Math.pow(2, attempt)
  const jitter = base * 0.25 * (Math.random() * 2 - 1) // +-25%
  return new Promise(resolve => setTimeout(resolve, Math.max(0, base + jitter)))
}
