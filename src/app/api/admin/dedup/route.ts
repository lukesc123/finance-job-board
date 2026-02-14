import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  // Find duplicate jobs by title + company_id
  const { data: jobs } = await supabaseAdmin
    .from('jobs')
    .select('id, title, company_id, posted_date')
    .eq('is_active', true)
    .order('posted_date', { ascending: true })

  if (!jobs) return NextResponse.json({ error: 'Failed to fetch jobs' })

  const seen = new Map<string, string>()
  const duplicateIds: string[] = []

  for (const job of jobs) {
    const key = `${job.title}::${job.company_id}`
    if (seen.has(key)) {
      duplicateIds.push(job.id)
    } else {
      seen.set(key, job.id)
    }
  }

  if (duplicateIds.length === 0) {
    return NextResponse.json({ message: 'No duplicates found', totalJobs: jobs.length })
  }

  // Deactivate duplicates
  const { error } = await supabaseAdmin
    .from('jobs')
    .update({ is_active: false })
    .in('id', duplicateIds)

  const { count } = await supabaseAdmin
    .from('jobs')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)

  return NextResponse.json({
    deactivated: duplicateIds.length,
    totalActive: count,
  })
}
