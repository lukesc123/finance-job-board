import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'FinanceJobs - Entry-Level Finance & Accounting Positions'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #0a1628 0%, #0f2035 50%, #0a1628 100%)',
          fontFamily: 'system-ui, sans-serif',
          position: 'relative',
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '32px',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '14px',
              background: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              fontWeight: 800,
              color: '#0a1628',
            }}
          >
            F
          </div>
          <div
            style={{
              fontSize: '36px',
              fontWeight: 800,
              color: 'white',
              display: 'flex',
            }}
          >
            Finance
            <span style={{ color: '#64748b' }}>Jobs</span>
          </div>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: '52px',
            fontWeight: 800,
            color: 'white',
            textAlign: 'center',
            lineHeight: 1.15,
            maxWidth: '800px',
            display: 'flex',
          }}
        >
          Entry-Level Finance Jobs
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: '22px',
            color: '#94a3b8',
            textAlign: 'center',
            marginTop: '16px',
            maxWidth: '600px',
            display: 'flex',
          }}
        >
          Curated positions from company career pages
        </div>

        {/* Stats */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '40px',
            marginTop: '40px',
          }}
        >
          {(['Active Jobs', 'Companies', 'Categories'] as const).map((label, i) => (
            <div
              key={label}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <div
                style={{
                  fontSize: '32px',
                  fontWeight: 800,
                  color: '#10b981',
                  display: 'flex',
                }}
              >
                {i === 0 ? '195+' : i === 1 ? '45+' : '15'}
              </div>
              <div
                style={{
                  fontSize: '14px',
                  color: '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontWeight: 600,
                  display: 'flex',
                }}
              >
                {label}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom accent */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(90deg, #10b981 0%, #0ea5e9 50%, #10b981 100%)',
            display: 'flex',
          }}
        />
      </div>
    ),
    { ...size }
  )
}
