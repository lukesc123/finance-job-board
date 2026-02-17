import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, getClientIP } from '@/lib/rateLimit'

// Server-side favicon proxy with aggressive caching.
// Avoids client-side 404 chains when Google favicons fail.
// Falls back to a 1x1 transparent PNG if the favicon isn't found.

const TRANSPARENT_1X1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64'
)

export async function GET(request: NextRequest) {
  const ip = getClientIP(request)
  const { limited } = rateLimit(`favicon:${ip}`, 120, 60_000)
  if (limited) {
    return new NextResponse(TRANSPARENT_1X1, {
      status: 429,
      headers: { 'Content-Type': 'image/png', 'Retry-After': '60' },
    })
  }

  const domain = request.nextUrl.searchParams.get('domain')
  if (!domain || !/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(domain)) {
    return new NextResponse(TRANSPARENT_1X1, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=86400',
      },
    })
  }

  try {
    const res = await fetch(
      `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`,
      { signal: AbortSignal.timeout(3000) }
    )

    if (!res.ok) throw new Error('Favicon fetch failed')

    const buffer = Buffer.from(await res.arrayBuffer())
    const contentType = res.headers.get('content-type') || 'image/png'

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, s-maxage=604800, stale-while-revalidate=86400', // 7 days server cache
      },
    })
  } catch {
    // Return transparent pixel on any failure
    return new NextResponse(TRANSPARENT_1X1, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600', // Short cache on failures so retries happen
      },
    })
  }
}
