import { ImageResponse } from 'next/og'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { formatSalary } from '@/lib/formatting'

export const runtime = 'edge'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  let title = 'Job Not Found'
  let company = ''
  let location = ''
  let salary = ''
  let stage = ''
  let category = ''

  try {
    const { data } = await supabaseAdmin
      .from('jobs')
      .select('title, location, salary_min, salary_max, pipeline_stage, category, company:company_id(name)')
      .eq('id', id)
      .single()

    if (data) {
      title = data.title || 'Untitled'
      const co = Array.isArray(data.company) ? data.company[0] : data.company
      company = (co as { name?: string } | null)?.name || ''
      location = data.location || ''
      salary = formatSalary(data.salary_min, data.salary_max) || ''
      stage = data.pipeline_stage || ''
      category = data.category || ''
    }
  } catch { /* fallback to defaults */ }

  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: '60px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          color: 'white',
          position: 'relative',
        }}
      >
        {/* Top bar: brand + category */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', borderRadius: '12px', background: 'white' }}>
              <span style={{ fontSize: 28, fontWeight: 'bold', color: '#0f172a' }}>F</span>
            </div>
            <div style={{ display: 'flex', fontSize: 28, fontWeight: 'bold' }}>
              <span style={{ color: 'white' }}>Finance</span>
              <span style={{ color: '#94a3b8' }}>Jobs</span>
            </div>
          </div>
          {stage && (
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.1)', borderRadius: '12px', padding: '8px 20px', fontSize: 20, fontWeight: 600, color: '#cbd5e1' }}>
              {stage}
            </div>
          )}
        </div>

        {/* Job title */}
        <div style={{ fontSize: 56, fontWeight: 'bold', letterSpacing: '-1.5px', lineHeight: 1.15, marginBottom: '16px', display: 'flex', flexWrap: 'wrap', maxWidth: '1000px' }}>
          {title}
        </div>

        {/* Company */}
        {company && (
          <div style={{ fontSize: 32, fontWeight: 600, color: '#94a3b8', marginBottom: '24px', display: 'flex' }}>
            at {company}
          </div>
        )}

        {/* Spacer */}
        <div style={{ flex: 1, display: 'flex' }} />

        {/* Bottom metadata */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', fontSize: 22 }}>
          {location && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8' }}>
              <span>📍</span>
              <span>{location}</span>
            </div>
          )}
          {category && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8' }}>
              <span>📂</span>
              <span>{category}</span>
            </div>
          )}
          {salary && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#4ade80', fontWeight: 700 }}>
              <span>💰</span>
              <span>{salary}</span>
            </div>
          )}
        </div>

        {/* Bottom accent */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, #10b981, #34d399, #10b981)', display: 'flex' }} />
      </div>
    ),
    { ...size }
  )
}
