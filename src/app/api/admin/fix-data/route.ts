import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(request: Request) {
  // Simple auth check
  const { searchParams } = new URL(request.url)
  const key = searchParams.get('key')
  if (key !== 'fix-data-2026') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results: string[] = []

  // 1. Fix apply URLs missing https://
  const { data: jobs } = await supabaseAdmin
    .from('jobs')
    .select('id, title, apply_url, pipeline_stage')

  if (jobs) {
    for (const job of jobs) {
      const updates: Record<string, string> = {}

      // Fix URLs missing protocol
      if (job.apply_url && !job.apply_url.startsWith('http')) {
        updates.apply_url = 'https://' + job.apply_url
      }

      // Add "2026" to summer internship titles that don't have a year
      if (
        job.title &&
        (job.title.toLowerCase().includes('summer') || job.title.toLowerCase().includes('intern')) &&
        !job.title.match(/20\d{2}/)
      ) {
        // Add "2026" before "Summer" or at the start if it's just "intern"
        if (job.title.toLowerCase().includes('summer')) {
          updates.title = job.title.replace(/Summer/i, '2026 Summer')
        }
      }

      if (Object.keys(updates).length > 0) {
        const { error } = await supabaseAdmin
          .from('jobs')
          .update(updates)
          .eq('id', job.id)

        if (error) {
          results.push('Error updating ' + job.id + ': ' + error.message)
        } else {
          results.push('Updated ' + job.id + ': ' + JSON.stringify(updates))
        }
      }
    }
  }

  return NextResponse.json({ results, count: results.length })
}
