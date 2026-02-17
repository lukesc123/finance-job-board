import { ImageResponse } from 'next/og'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { JOB_CATEGORIES, type JobCategory } from '@/types'

export const runtime = 'edge'
export const alt = 'Category Jobs'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

const CATEGORY_SLUGS: Record<string, JobCategory> = Object.fromEntries(
  JOB_CATEGORIES.map((cat) => [slugify(cat), cat])
)

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const category = CATEGORY_SLUGS[slug]

  if (!category) {
    return new ImageResponse(
      (
        <div style={{ height: '100%', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a1628', color: 'white', fontSize: 48, fontFamily: 'system-ui' }}>
          Category Not Found
        </div>
      ),
      { ...size }
    )
  }

  const { data: jobs } = await supabaseAdmin
    .from('jobs')
    .select('id, company_id')
    .eq('category', category)
    .eq('is_active', true)
    .limit(5000)

  const jobCount = jobs?.length || 0
  const companyCount = new Set((jobs || []).map((j: { company_id: string }) => j.company_id)).size

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
            fontSize: '36px',
            fontWeight: 800,
            color: 'white',
            marginBottom: '24px',
          }}
        >
          {category.charAt(0)}
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
          {category} Jobs
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
          Entry-Level Positions & Internships
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
              {jobCount}
            </div>
            <div style={{ fontSize: '13px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, display: 'flex' }}>
              Open Positions
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <div style={{ fontSize: '36px', fontWeight: 800, color: 'white', display: 'flex' }}>
              {companyCount}
            </div>
            <div style={{ fontSize: '13px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, display: 'flex' }}>
              Companies Hiring
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
