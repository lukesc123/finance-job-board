import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'About Entry Level Finance Jobs'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '60px 80px',
          background: 'linear-gradient(135deg, #0a1929 0%, #102a43 50%, #243b53 100%)',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: '#60a5fa',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '28px',
              fontWeight: 800,
            }}
          >
            F
          </div>
          <span style={{ color: '#829ab1', fontSize: '20px', fontWeight: 600 }}>
            Entry Level Finance Jobs
          </span>
        </div>

        <h1
          style={{
            fontSize: '56px',
            fontWeight: 800,
            color: 'white',
            lineHeight: 1.15,
            marginBottom: '16px',
            letterSpacing: '-0.02em',
          }}
        >
          Real jobs. No noise.
        </h1>

        <p
          style={{
            fontSize: '24px',
            color: '#9fb3c8',
            lineHeight: 1.5,
            maxWidth: '700px',
          }}
        >
          Curated entry-level positions sourced directly from company career pages across finance and accounting.
        </p>

        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '6px',
            background: 'linear-gradient(90deg, #34d399 0%, #60a5fa 100%)',
          }}
        />
      </div>
    ),
    { ...size }
  )
}
