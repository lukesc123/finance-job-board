/**
 * Lightweight ETag support for API routes.
 *
 * Generates a weak ETag from JSON-serialized data using a fast hash,
 * and returns a 304 Not Modified response when the client's If-None-Match
 * header matches. This eliminates redundant payload transfers for data
 * that hasn't changed.
 *
 * Usage in API routes:
 *   const { response, notModified } = withETag(request, data, headers)
 *   if (notModified) return response
 *   return response
 */

import { NextRequest, NextResponse } from 'next/server'

/**
 * Fast non-cryptographic hash (FNV-1a 32-bit).
 * Good enough for ETag comparison, much faster than SHA/MD5.
 */
function fnv1a(str: string): string {
  let hash = 0x811c9dc5 // FNV offset basis
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i)
    hash = (hash * 0x01000193) >>> 0 // FNV prime, keep as uint32
  }
  return hash.toString(36)
}

interface ETagResult {
  response: NextResponse
  notModified: boolean
}

/**
 * Generates an ETag for the given data and checks If-None-Match.
 * Returns a 304 response if the ETag matches, otherwise a full JSON response.
 */
export function withETag(
  request: NextRequest,
  data: unknown,
  extraHeaders?: Record<string, string>,
): ETagResult {
  const json = JSON.stringify(data)
  const etag = `W/"${fnv1a(json)}"`

  const ifNoneMatch = request.headers.get('if-none-match')
  if (ifNoneMatch === etag) {
    return {
      response: new NextResponse(null, {
        status: 304,
        headers: { ETag: etag, ...extraHeaders },
      }),
      notModified: true,
    }
  }

  return {
    response: NextResponse.json(data, {
      headers: { ETag: etag, ...extraHeaders },
    }),
    notModified: false,
  }
}
