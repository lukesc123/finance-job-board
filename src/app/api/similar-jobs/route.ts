import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('id')
    if (!jobId) return NextResponse.json({ error: 'Job ID required' }, { status: 400 })
    const { data: src, error: je } = await supabaseAdmin.from('jobs').select('*, company:companies(*)').eq('id', jobId).single()
    if (je || !src) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const { data: cands, error } = await supabaseAdmin.from('jobs').select('*, company:companies(*)').eq('is_active', true).neq('id', jobId).limit(100)
    if (error) throw error
    const scored = (cands||[]).map(j => {
      let s = 0; if (j.category===src.category) s+=3; if (j.pipeline_stage===src.pipeline_stage) s+=2; if (j.company_id===src.company_id) s+=2; if (j.remote_type===src.remote_type) s+=1; if (j.job_type===src.job_type) s+=1;
      const sc=src.location?.split(',')[0]?.trim().toLowerCase(), jc=j.location?.split(',')[0]?.trim().toLowerCase();
      if (sc&&jc&&sc===jc) s+=2; return {...j, _s: s}
    })
    scored.sort((a,b)=>b._s-a._s)
    return NextResponse.json(scored.slice(0,4).filter(j=>j._s>=2).map(({_s,...r})=>r))
  } catch (e) { return NextResponse.json({ error: 'Failed' }, { status: 500 }) }
}
