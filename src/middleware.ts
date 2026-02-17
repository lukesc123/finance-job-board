import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  // Block direct browser access to admin API routes without auth header
  if (request.nextUrl.pathname.startsWith('/api/admin')) {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  return await updateSession(request)
}

export const config = {
  matcher: [
    // Match tracker, settings, and auth routes
    '/tracker/:path*',
    '/settings/:path*',
    '/auth/:path*',
    '/login',
    // Protect admin API routes at middleware level
    '/api/admin/:path*',
    // Admin pages
    '/admin/:path*',
  ],
}
