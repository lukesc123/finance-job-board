import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { requireAdmin } from '@/lib/auth'

export async function POST(request: Request) {
    try {
          requireAdmin(request)
    } catch {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

  const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'fix-urls'
    const results: string[] = []

        if (action === 'deactivate') {
              // Deactivate non-entry-level associate positions
      const ids = [
              'b1c2d3e4-0005-4000-8000-000000000004', // KKR VC Associate
              'b1c2d3e4-0007-4000-8000-000000000006', // PwC Senior Associate
              '0261a496-8dcc-43eb-93e1-d8125d641b9e', // Grant Thornton Senior Tax
            ]
              for (const id of ids) {
                      const { error } = await supabaseAdmin
                        .from('jobs')
                        .update({ is_active: false })
                        .eq('id', id)
                      results.push(error ? 'Error ' + id + ': ' + error.message : 'Deactivated ' + id)
              }
        } else {
              const { data: jobs } = await supabaseAdmin
                .from('jobs')
                .select('id, title, apply_url, pipeline_stage')

      if (jobs) {
              for (const job of jobs) {
                        const updates: Record<string, string> = {}
                                  if (job.apply_url && !job.apply_url.startsWith('http')) {
                                              updates.apply_url = 'https://' + job.apply_url
                                  }
                        if (
                                    job.title &&
                                    (job.title.toLowerCase().includes('summer') || job.title.toLowerCase().includes('intern')) &&
                                    !job.title.match(/20\d{2}/)
                                  ) {
                                    if (job.title.toLowerCase().includes('summer')) {
                                                  updates.title = job.title.replace(/Summer/i, '2026 Summer')
                                    }
                        }
                        if (Object.keys(updates).length > 0) {
                                    const { error } = await supabaseAdmin.from('jobs').update(updates).eq('id', job.id)
                                    results.push(error ? 'Error ' + job.id : 'Updated ' + job.id + ': ' + JSON.stringify(updates))
                        }
              }
      }
        }

  return NextResponse.json({ action, results, count: results.length })
}
