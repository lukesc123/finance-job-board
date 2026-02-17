import { ImageResponse } from 'next/og'
import { type NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const size = parseInt(searchParams.get('size') || '192', 10)
  const clampedSize = Math.min(Math.max(size, 32), 1024)
  const fontSize = Math.round(clampedSize * 0.55)
  const radius = Math.round(clampedSize * 0.15)

  return new ImageResponse(
    (
      <div
        style={{
          fontSize,
          background: '#0a1628',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 800,
          borderRadius: `${radius}px`,
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        F
      </div>
    ),
    { width: clampedSize, height: clampedSize }
  )
}
