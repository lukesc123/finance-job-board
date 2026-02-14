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
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
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
          position: 'relative',
        }}
      >
        {/* Subtle grid pattern overlay */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(255,255,255,0.02) 0%, transparent 50%)',
            display: 'flex',
          }}
        />

        {/* Logo mark */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '80px',
            height: '80px',
            borderRadius: '20px',
            background: 'white',
            marginBottom: '30px',
          }}
        >
          <span style={{ fontSize: 44, fontWeight: 'bold', color: '#0f172a' }}>F</span>
        </div>

        {/* Brand name */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 'bold',
            marginBottom: '16px',
            letterSpacing: '-2px',
            display: 'flex',
          }}
        >
          <span style={{ color: 'white' }}>Finance</span>
          <span style={{ color: '#94a3b8' }}>Jobs</span>
        </div>

        {/* Main headline */}
        <div
          style={{
            fontSize: 36,
            fontWeight: '600',
            color: '#cbd5e1',
            marginBottom: '24px',
            lineHeight: '1.3',
            letterSpacing: '-0.5px',
          }}
        >
          Entry-Level Finance & Accounting Positions
        </div>

        {/* Stats bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '32px',
            marginTop: '16px',
            fontSize: 22,
            color: '#64748b',
          }}
        >
          <span>Curated from company career pages</span>
          <span style={{ color: '#334155' }}>|</span>
          <span>No easy apply</span>
          <span style={{ color: '#334155' }}>|</span>
          <span>Real opportunities</span>
        </div>

        {/* Bottom accent */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(90deg, #f59e0b, #eab308, #f59e0b)',
            display: 'flex',
          }}
        />
      </div>
    ),
    {
      ...size,
    }
  )
}
