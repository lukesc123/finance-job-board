import { ImageResponse } from 'next/og'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export const runtime = 'edge'
export const alt = 'Browse Finance Jobs by Location'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  const { data: jobs } = await supabaseAdmin
    .from('jobs')
    .select('location')
    .eq('is_active', true)
    .limit(5000)

  const locations = [...new Set((jobs || []).map((j: { location: string }) => j.location))].filter(Boolean)
  const jobCount = jobs?.length || 0
  const cityCount = locations.length

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
        <div
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '40px',
            color: 'white',
            marginBottom: '24px',
          }}
        >
          📍
        </div>

        <div
          style={{
            fontSize: '52px',
            fontWeight: 800,
            color: 'white',
            textAlign: 'center',
            display: 'flex',
          }}
        >
          Browse Jobs by Location
        </div>

        <div
          style={{
            fontSize: '22px',
            color: '#94a3b8',
            textAlign: 'center',
            marginTop: '12px',
            display: 'flex',
          }}
        >
          Entry-Level Finance Positions Across the U.S.
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '48px',
            marginTop: '40px',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <div style={{ fontSize: '36px', fontWeight: 800, color: '#10b981', display: 'flex' }}>
              {cityCount}
            </div>
            <div style={{ fontSize: '13px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, display: 'flex' }}>
              Cities
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <div style={{ fontSize: '36px', fontWeight: 800, color: 'white', display: 'flex' }}>
              {jobCount}+
            </div>
            <div style={{ fontSize: '13px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, display: 'flex' }}>
              Open Positions
            </div>
          </div>
        </div>

        <div
          style={{
            position: 'absolute',
            bottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <div
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '6px',
              background: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: 800,
              color: '#0a1628',
            }}
          >
            F
          </div>
          <div style={{ fontSize: '14px', color: '#64748b', fontWeight: 600, display: 'flex' }}>
            Entry Level Finance Jobs
          </div>
        </div>

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
