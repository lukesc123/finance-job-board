import { NextRequest } from 'next/server'
import crypto from 'crypto'

function getAdminPassword(): string {
    const pw = process.env.ADMIN_PASSWORD
    if (!pw) throw new Error('ADMIN_PASSWORD environment variable is required')
    return pw
}

function getJwtSecret(): string {
    const secret = process.env.JWT_SECRET
    if (!secret) throw new Error('JWT_SECRET environment variable is required')
    return secret
}

export function generateToken(): string {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
    const payload = Buffer.from(
          JSON.stringify({
                  role: 'admin',
                  iat: Math.floor(Date.now() / 1000),
                  exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 24 hours
          })
        ).toString('base64url')
    const signature = crypto
      .createHmac('sha256', getJwtSecret())
      .update(`${header}.${payload}`)
      .digest('base64url')
    return `${header}.${payload}.${signature}`
}

export function verifyToken(token: string): boolean {
    try {
          const parts = token.split('.')
          if (parts.length !== 3) return false

      const [header, payload, signature] = parts
          const expectedSig = crypto
            .createHmac('sha256', getJwtSecret())
            .update(`${header}.${payload}`)
            .digest('base64url')

      if (signature !== expectedSig) return false

      const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString())
          if (!decoded.exp || typeof decoded.exp !== 'number' || decoded.exp < Math.floor(Date.now() / 1000)) return false
          if (decoded.role !== 'admin') return false

      return true
    } catch {
          return false
    }
}

export function verifyPassword(password: string): boolean {
    const adminPw = getAdminPassword()
    if (password.length !== adminPw.length) return false
    return crypto.timingSafeEqual(Buffer.from(password), Buffer.from(adminPw))
}

/**
 * Validates that a mutation request originates from our own site.
 * Provides basic CSRF protection by checking Origin/Referer headers.
 */
function validateOrigin(request: Request | NextRequest): void {
    const origin = request.headers.get('origin')
    const referer = request.headers.get('referer')
    const host = request.headers.get('host')

    // In development, skip origin check
    if (process.env.NODE_ENV === 'development') return

    // Accept if Origin header matches host
    if (origin && host) {
        try {
            const originHost = new URL(origin).host
            if (originHost === host) return
        } catch { /* invalid URL, continue checking */ }
    }

    // Accept if Referer header matches host
    if (referer && host) {
        try {
            const refererHost = new URL(referer).host
            if (refererHost === host) return
        } catch { /* invalid URL, continue checking */ }
    }

    // If neither Origin nor Referer match, reject
    if (origin || referer) {
        throw new Error('Forbidden')
    }
    // If no Origin/Referer at all (e.g. same-origin fetch), allow
    // Browser-based CSRF attacks always send Origin/Referer
}

export function requireAdmin(request: Request | NextRequest): void {
    // Validate request origin for CSRF protection
    validateOrigin(request)

    const authHeader =
          request.headers.get('authorization') || request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
          throw new Error('Unauthorized')
    }
    const token = authHeader.split(' ')[1]
    if (!verifyToken(token)) {
          throw new Error('Unauthorized')
    }
}
