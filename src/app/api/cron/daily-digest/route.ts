import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// This endpoint is called by Vercel Cron daily
// It sends email digests to users who have opted in

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: Request) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get users with email digest enabled
    const { data: preferences, error: prefError } = await supabaseAdmin
      .from('user_preferences')
      .select('user_id, tracked_categories, email_digest_frequency, last_digest_sent_at')
      .eq('email_digest_enabled', true)

    if (prefError) {
      return NextResponse.json({ error: prefError.message }, { status: 500 })
    }

    if (!preferences || preferences.length === 0) {
      return NextResponse.json({ message: 'No users with digest enabled', sent: 0 })
    }

    let sentCount = 0

    for (const pref of preferences) {
      // Skip if no tracked categories
      if (!pref.tracked_categories || pref.tracked_categories.length === 0) continue

      // Check frequency - skip weekly users if not Monday
      if (pref.email_digest_frequency === 'weekly') {
        const today = new Date()
        if (today.getUTCDay() !== 1) continue // Only send weekly on Mondays
      }

      // Determine cutoff date for new jobs
      const cutoff = pref.last_digest_sent_at
        ? new Date(pref.last_digest_sent_at)
        : new Date(Date.now() - 24 * 60 * 60 * 1000) // Default: last 24 hours

      // Find new jobs in tracked categories since last digest
      const { data: newJobs, error: jobsError } = await supabaseAdmin
        .from('jobs')
        .select('id, title, location, category, salary_min, salary_max, posted_date, company:companies(name)')
        .in('category', pref.tracked_categories)
        .gte('created_at', cutoff.toISOString())
        .order('created_at', { ascending: false })
        .limit(20)

      if (jobsError || !newJobs || newJobs.length === 0) continue

      // Get user email from auth
      const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserById(pref.user_id)
      if (userError || !user?.email) continue

      // Send email digest
      const emailSent = await sendDigestEmail(user.email, newJobs, pref.tracked_categories)

      if (emailSent) {
        // Update last_digest_sent_at
        await supabaseAdmin
          .from('user_preferences')
          .update({ last_digest_sent_at: new Date().toISOString() })
          .eq('user_id', pref.user_id)

        sentCount++
      }
    }

    return NextResponse.json({ message: 'Digest sent', sent: sentCount })
  } catch (err) {
    console.error('Daily digest error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

interface DigestJob {
  id: string
  title: string
  location: string
  category: string
  salary_min: number | null
  salary_max: number | null
  posted_date: string
  company: { name: string }[] | { name: string } | null
}

async function sendDigestEmail(email: string, jobs: DigestJob[], categories: string[]): Promise<boolean> {
  // If RESEND_API_KEY is configured, use Resend; otherwise log and skip
  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) {
    console.log(`[Digest] Would send to ${email}: ${jobs.length} jobs in ${categories.join(', ')}`)
    return true // Return true in dev to update last_digest_sent_at
  }

  const jobListHtml = jobs.map(job => {
    const salary = formatSalaryRange(job.salary_min, job.salary_max)
    return `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
          <a href="https://finance-job-board.vercel.app/jobs/${job.id}" style="color: #1e293b; font-weight: 600; text-decoration: none; font-size: 15px;">${job.title}</a>
          <br>
          <span style="color: #64748b; font-size: 13px;">${Array.isArray(job.company) ? job.company[0]?.name : job.company?.name || 'Unknown'} &middot; ${job.location}</span>
          ${salary ? `<br><span style="color: #059669; font-size: 13px; font-weight: 500;">${salary}</span>` : ''}
        </td>
      </tr>`
  }).join('')

  const html = `
    <div style="max-width: 560px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <div style="padding: 24px 0; border-bottom: 2px solid #1e293b;">
        <h1 style="margin: 0; font-size: 20px; color: #1e293b;">Entry Level Finance Jobs Daily Digest</h1>
        <p style="margin: 4px 0 0; color: #64748b; font-size: 14px;">${jobs.length} new position${jobs.length !== 1 ? 's' : ''} in ${categories.join(', ')}</p>
      </div>
      <table style="width: 100%; border-collapse: collapse;">
        ${jobListHtml}
      </table>
      <div style="padding: 20px 0; text-align: center;">
        <a href="https://finance-job-board.vercel.app" style="display: inline-block; background: #1e293b; color: white; padding: 10px 24px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600;">Browse All Jobs</a>
      </div>
      <div style="padding: 16px 0; border-top: 1px solid #e5e7eb; text-align: center;">
        <p style="margin: 0; color: #94a3b8; font-size: 12px;">
          You're receiving this because you enabled email digests.
          <a href="https://finance-job-board.vercel.app/settings" style="color: #64748b;">Manage preferences</a>
        </p>
      </div>
    </div>`

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: 'Entry Level Finance Jobs <digest@finance-job-board.vercel.app>',
        to: email,
        subject: `${jobs.length} new finance job${jobs.length !== 1 ? 's' : ''} matching your interests`,
        html,
      }),
    })

    return res.ok
  } catch {
    console.error(`[Digest] Failed to send to ${email}`)
    return false
  }
}

function formatSalaryRange(min: number | null, max: number | null): string {
  if (!min && !max) return ''
  const fmt = (n: number) => n >= 1000 ? `$${Math.round(n / 1000)}K` : `$${n}`
  if (min && max) return `${fmt(min)} - ${fmt(max)}`
  if (min) return `${fmt(min)}+`
  if (max) return `Up to ${fmt(max)}`
  return ''
}
