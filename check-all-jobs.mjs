import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkUrl(url, timeout = 15000) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)

  try {
    let resp
    try {
      resp = await fetch(url, {
        method: 'HEAD',
        redirect: 'follow',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      })
    } catch {
      resp = await fetch(url, {
        method: 'GET',
        redirect: 'follow',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      })
    }

    clearTimeout(timer)
    const finalUrl = resp.url || ''

    if (resp.status === 404 || resp.status === 410) {
      return { status: 'dead', code: resp.status, finalUrl }
    }

    if (resp.status >= 200 && resp.status < 400) {
      const originalPath = new URL(url).pathname
      const finalPath = finalUrl ? new URL(finalUrl).pathname : ''

      if (finalUrl && finalPath !== originalPath) {
        const isGenericRedirect =
          finalPath === '/' ||
          /\/careers?\/?$/i.test(finalPath) ||
          /\/search-jobs\/?$/i.test(finalPath) ||
          /\/job-search\/?$/i.test(finalPath) ||
          /\/404\/?$/i.test(finalPath) ||
          /\/not-found\/?$/i.test(finalPath)

        if (isGenericRedirect) {
          return { status: 'dead-redirect', code: resp.status, finalUrl }
        }
        return { status: 'redirect', code: resp.status, finalUrl }
      }
      return { status: 'alive', code: resp.status, finalUrl }
    }

    return { status: 'error', code: resp.status, finalUrl }
  } catch (err) {
    clearTimeout(timer)
    if (err.name === 'AbortError') {
      return { status: 'timeout', code: null, finalUrl: null }
    }
    return { status: 'fetch-error', code: null, finalUrl: null, error: err.message }
  }
}

async function main() {
  // Get ALL active jobs
  const { data: jobs, error } = await supabase
    .from('jobs')
    .select('id, title, apply_url, company:companies(name)')
    .eq('is_active', true)
    .order('posted_date', { ascending: false })

  if (error) { console.error('DB error:', error); process.exit(1) }

  console.log(`\nTotal active jobs: ${jobs.length}\n`)

  const dead = []
  const errors = []
  const timeouts = []
  const redirects = []
  let alive = 0

  // Process in batches of 10
  for (let i = 0; i < jobs.length; i += 10) {
    const batch = jobs.slice(i, i + 10)
    const results = await Promise.all(batch.map(async (job) => {
      const url = job.apply_url?.startsWith('http') ? job.apply_url : `https://${job.apply_url}`
      const result = await checkUrl(url)
      const company = job.company?.name || 'Unknown'
      return { ...job, company, url, ...result }
    }))

    for (const r of results) {
      const prefix = `[${i + results.indexOf(r) + 1}/${jobs.length}]`
      if (r.status === 'alive') {
        alive++
      } else if (r.status === 'dead' || r.status === 'dead-redirect') {
        dead.push(r)
        console.log(`${prefix} DEAD: ${r.company} - ${r.title} (${r.code}) ${r.url}`)
        if (r.finalUrl && r.finalUrl !== r.url) console.log(`       -> Redirected to: ${r.finalUrl}`)
      } else if (r.status === 'timeout') {
        timeouts.push(r)
        console.log(`${prefix} TIMEOUT: ${r.company} - ${r.title} ${r.url}`)
      } else if (r.status === 'error' || r.status === 'fetch-error') {
        errors.push(r)
        console.log(`${prefix} ERROR: ${r.company} - ${r.title} (${r.code || r.error}) ${r.url}`)
      } else if (r.status === 'redirect') {
        redirects.push(r)
      }
    }

    // Small delay between batches
    if (i + 10 < jobs.length) await new Promise(r => setTimeout(r, 500))
  }

  console.log(`\n${'='.repeat(60)}`)
  console.log(`SUMMARY:`)
  console.log(`  Alive: ${alive}`)
  console.log(`  Dead: ${dead.length}`)
  console.log(`  Redirects (non-generic): ${redirects.length}`)
  console.log(`  Errors: ${errors.length}`)
  console.log(`  Timeouts: ${timeouts.length}`)
  console.log(`  TOTAL: ${jobs.length}`)

  if (dead.length > 0) {
    console.log(`\nDEAD JOBS (need deactivation):`)
    for (const d of dead) {
      console.log(`  - [${d.id}] ${d.company}: ${d.title} (${d.status}, HTTP ${d.code})`)
      console.log(`    URL: ${d.url}`)
      if (d.finalUrl && d.finalUrl !== d.url) console.log(`    Redirected to: ${d.finalUrl}`)
    }
  }

  if (errors.length > 0) {
    console.log(`\nERROR JOBS (may need manual check):`)
    for (const e of errors) {
      console.log(`  - [${e.id}] ${e.company}: ${e.title} (HTTP ${e.code || 'N/A'})`)
      console.log(`    URL: ${e.url}`)
    }
  }

  if (timeouts.length > 0) {
    console.log(`\nTIMEOUT JOBS (may need manual check):`)
    for (const t of timeouts) {
      console.log(`  - [${t.id}] ${t.company}: ${t.title}`)
      console.log(`    URL: ${t.url}`)
    }
  }

  // Output dead IDs for easy SQL
  if (dead.length > 0) {
    console.log(`\nSQL to deactivate dead jobs:`)
    const ids = dead.map(d => `'${d.id}'`).join(', ')
    console.log(`UPDATE jobs SET is_active = false, updated_at = NOW(), removal_detected_at = NOW() WHERE id IN (${ids});`)
  }
}

main().catch(console.error)
