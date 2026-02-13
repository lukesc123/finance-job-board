import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 60,
          background: 'linear-gradient(to bottom, #0a1929, #132f4c)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          padding: '60px',
          textAlign: 'center',
        }}
      >
        {/* Logo/Brand */}
        <div
          style={{
            fontSize: 80,
            fontWeight: 'bold',
            marginBottom: '30px',
            background: 'linear-gradient(135deg, #60a5fa, #3b82f6)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-2px',
          }}
        >
          FinanceJobs
        </div>

        {/* Main headline */}
        <div
          style={{
            fontSize: 54,
            fontWeight: '700',
            marginBottom: '20px',
            lineHeight: '1.2',
            letterSpacing: '-1px',
          }}
        >
          Entry-Level Finance & Accounting Positions
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 32,
            color: '#94a3b8',
            marginTop: '20px',
            fontWeight: '400',
            letterSpacing: '-0.5px',
          }}
        >
          Curated from company career pages
        </div>

        {/* Accent line */}
        <div
          style={{
            width: '300px',
            height: '4px',
            background: 'linear-gradient(90deg, #60a5fa, #3b82f6, #2563eb)',
            marginTop: '40px',
            borderRadius: '2px',
          }}
        />
      </div>
    ),
    {
      ...size,
    }
  )
}
