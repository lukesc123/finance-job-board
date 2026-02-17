import { NextResponse } from 'next/server'
import { verifyPassword, generateToken } from '@/lib/auth'
import { rateLimit, getClientIP } from '@/lib/rateLimit'

export async function POST(request: Request) {
  try {
    const ip = getClientIP(request)
    const { limited } = rateLimit(`login:${ip}`, 5, 300_000) // 5 attempts per 5 minutes
    if (limited) {
      return NextResponse.json(
        { error: 'Too many login attempts. Try again in 5 minutes.' },
        { status: 429, headers: { 'Retry-After': '300' } }
      )
    }

    const { password } = await request.json()

    if (!password || typeof password !== 'string' || password.length > 256) {
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 })
    }

    if (!verifyPassword(password)) {
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 })
    }

    const token = generateToken()
    return NextResponse.json({ token })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 })
  }
}
