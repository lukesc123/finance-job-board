import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { requireAdmin } from '@/lib/auth'

export async function POST(request: Request) {
    try {
          requireAdmin(request)
    } catch {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

  const ids = [
        'b1c2d3e4-0005-4000-8000-000000000004',
        'b1c2d3e4-0007-4000-8000-000000000006',
        '0261a496-8dcc-43eb-93e1-d8125d641b9e',
      ]

  const results = []
      for (const id of ids) {
            const { error } = await supabaseAdmin
              .from('jobs')
              .update({ is_active: false })
              .eq('id', id)
            results.push(error ? 'Error ' + id + ': ' + error.message : 'Deactivated ' + id)
      }

  return NextResponse.json({ ok: true, results, count: results.length })
}
