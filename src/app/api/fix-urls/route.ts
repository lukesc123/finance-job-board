import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

// Fix wrong-company URLs and upgrade generic career pages to better URLs
// Run via GET request: /api/fix-urls

// Known wrong-company URL assignments (job ID -> correct URL)
const WRONG_COMPANY_FIXES: Record<string, string> = {
  // Goldman Sachs "2026 Summer Analyst - IB" was pointing to Wells Fargo
  'b1c2d3e4-0002-4000-8000-000000000001': 'https://higher.gs.com/roles?query=summer+analyst+investment+banking',
  // Blackstone "Analyst, Private Equity" was pointing to Evercore
  'b1c2d3e4-0004-4000-8000-000000000003': 'https://blackstone.wd1.myworkdayjobs.com/Blackstone_Campus_Careers',
  // EY "Consultant, Advisory Services" was pointing to Deloitte
  'b1c2d3e4-0008-4000-8000-000000000007': 'https://usearlycareers.ey.com/search-jobs',
  // William Blair "Venture Capital Analyst" was pointing to a16z
  'c226296d-cdc7-4f98-bf0e-fdf16c834a11': 'https://www.williamblair.com/Careers',
}

// Company-specific URL upgrade patterns: map generic careers pages to better entry-level/search URLs
const COMPANY_URL_UPGRADES: Record<string, string> = {
  // EY - generic search page is fine but add early-careers filter
  'https://usearlycareers.ey.com/search-jobs': 'https://usearlycareers.ey.com/search-jobs',
  // Vanguard - add search filter
  'https://www.vanguardjobs.com/job-search-results/': 'https://www.vanguardjobs.com/job-search-results/?keyword=&category=&location=&workstyle=',
  // Fidelity - keep student page
  'https://jobs.fidelity.com/en/students/career-discovery-programs/': 'https://jobs.fidelity.com/en/students/career-discovery-programs/',
  // Bank of America - campus careers is correct
  'https://campus.bankofamerica.com/careers/': 'https://campus.bankofamerica.com/careers/',
  // BNY Mellon - students page is correct
  'https://www.bny.com/corporate/global/en/about-us/careers/students.html': 'https://www.bny.com/corporate/global/en/about-us/careers/students.html',
  'https://www.bny.com/corporate/global/en/about-us/careers/students/internship-program.html': 'https://www.bny.com/corporate/global/en/about-us/careers/students/internship-program.html',
  // Bridgewater
  'https://www.bridgewater.com/careers': 'https://www.bridgewater.com/careers/open-positions',
  // Wells Fargo
  'https://www.wellsfargojobs.com/en/early-careers/': 'https://www.wellsfargojobs.com/en/early-careers/',
  // Grant Thornton
  'https://www.grantthornton.com/careers': 'https://www.grantthornton.com/careers/find-open-positions',
  // Goldman Sachs - analyst program page is reasonable
  'https://www.goldmansachs.com/careers/students/programs-and-internships/americas/new-analyst-program': 'https://higher.gs.com/roles',
  'https://www.goldmansachs.com/careers/students/programs-and-internships/americas/2026-summer-analyst-program': 'https://higher.gs.com/roles',
  // Deloitte
  'https://apply.deloitte.com/en_US/careers/SearchJobs': 'https://apply.deloitte.com/en_US/careers/SearchJobs',
  'https://apply.deloitte.com/careers': 'https://apply.deloitte.com/en_US/careers/SearchJobs',
  // PwC
  'https://jobs.us.pwc.com/entry-level': 'https://jobs.us.pwc.com/entry-level',
  // Charles Schwab
  'https://www.schwabjobs.com/search-jobs': 'https://www.schwabjobs.com/search-jobs',
  'https://www.schwabjobs.com/early-careers-overview': 'https://www.schwabjobs.com/early-careers-overview',
  'https://www.schwab.com/careers': 'https://www.schwabjobs.com/search-jobs',
  // KPMG
  'https://www.kpmguscareers.com/early-career/': 'https://www.kpmguscareers.com/early-career/',
  // Northern Trust
  'https://www.northerntrust.com/united-states/about-us/careers/students-and-graduates': 'https://www.northerntrust.com/united-states/about-us/careers/students-and-graduates',
  'https://www.northerntrust.com/careers': 'https://www.northerntrust.com/united-states/about-us/careers/students-and-graduates',
  // Citi
  'https://jobs.citi.com/early-careers': 'https://jobs.citi.com/early-careers',
  'https://jobs.citi.com/search-jobs': 'https://jobs.citi.com/early-careers',
  // Houlihan Lokey
  'https://hl.wd1.myworkdayjobs.com/Campus': 'https://hl.wd1.myworkdayjobs.com/en-US/Campus',
  'https://www.hl.com/careers': 'https://hl.wd1.myworkdayjobs.com/en-US/Campus',
  // Edward Jones
  'https://careers.edwardjones.com/job-search-results/': 'https://careers.edwardjones.com/job-search-results/',
  // Ameriprise
  'https://www.ameriprise.com/careers': 'https://www.ameriprise.com/careers',
  // Raymond James
  'https://www.raymondjames.com/careers': 'https://www.raymondjames.com/careers/search-jobs',
  // Dimensional
  'https://dimensional.com/careers': 'https://www.dimensional.com/careers#open-positions',
  // Marsh McLennan
  'https://marshmclennan.com/careers': 'https://careers.marshmclennan.com/global/en/search-results',
  // Stifel
  'https://www.stifel.com/careers': 'https://www.stifel.com/careers',
  // Citadel
  'https://www.citadel.com/careers/open-positions/students/': 'https://www.citadel.com/careers/open-positions/students/',
  // Protiviti
  'https://protiviti.com/careers': 'https://www.protiviti.com/us-en/careers',
  // Morgan Stanley
  'https://www.morganstanley.com/careers': 'https://www.morganstanley.com/careers/career-opportunities/results',
  // Evercore
  'https://www.evercore.com/careers/students-graduates/': 'https://www.evercore.com/careers/students-graduates/',
  'https://www.evercore.com/careers/': 'https://www.evercore.com/careers/students-graduates/',
  // Moelis
  'https://www.moelis.com/careers': 'https://www.moelis.com/careers',
  'https://moelis.com/careers': 'https://www.moelis.com/careers',
  // Two Sigma
  'https://www.twosigma.com/careers': 'https://www.twosigma.com/careers/#open-roles',
  // Guggenheim
  'https://www.guggenheimpartners.com/careers': 'https://www.guggenheimpartners.com/careers',
  // Jefferies
  'https://www.jefferies.com/careers': 'https://www.jefferies.com/careers/students-and-graduates/',
  'https://www.jefferies.com/careers/students-and-graduates/': 'https://www.jefferies.com/careers/students-and-graduates/',
  // William Blair
  'https://williamblair.com/careers': 'https://www.williamblair.com/Careers',
  // AQR
  'https://aqr.com/careers': 'https://careers.aqr.com/jobs/department/university',
  // Lazard
  'https://www.lazard.com/careers/': 'https://lazard-careers.tal.net/vx/appcentre-ext/brand-4/spa-1/candidate/jobboard/vacancy/3/adv/',
  // Piper Sandler
  'https://www.pipersandler.com/careers': 'https://www.pipersandler.com/careers',
  // BNY Mellon (alternate)
  'https://www.bnymellon.com/careers': 'https://www.bny.com/corporate/global/en/about-us/careers/students.html',
  // EY (alternate)
  'https://www.ey.com/en_us/careers': 'https://usearlycareers.ey.com/search-jobs',
}

export async function GET() {
  const results: { fixed: number; upgraded: number; errors: string[] } = {
    fixed: 0,
    upgraded: 0,
    errors: [],
  }

  try {
    // Step 1: Fix wrong-company URL assignments
    for (const [jobId, correctUrl] of Object.entries(WRONG_COMPANY_FIXES)) {
      try {
        const { error } = await supabaseAdmin
          .from('jobs')
          .update({ apply_url: correctUrl, updated_at: new Date().toISOString() })
          .eq('id', jobId)

        if (error) {
          results.errors.push(`Fix ${jobId}: ${error.message}`)
        } else {
          results.fixed++
        }
      } catch (err) {
        results.errors.push(`Fix ${jobId}: ${err}`)
      }
    }

    // Step 2: Upgrade generic career page URLs to better alternatives
    const { data: allJobs, error: fetchError } = await supabaseAdmin
      .from('jobs')
      .select('id, apply_url, title')
      .eq('is_active', true)

    if (fetchError) {
      results.errors.push(`Fetch: ${fetchError.message}`)
      return NextResponse.json(results)
    }

    for (const job of allJobs || []) {
      const currentUrl = job.apply_url
      if (!currentUrl) continue

      const upgrade = COMPANY_URL_UPGRADES[currentUrl]
      if (upgrade && upgrade !== currentUrl) {
        try {
          const { error } = await supabaseAdmin
            .from('jobs')
            .update({ apply_url: upgrade, updated_at: new Date().toISOString() })
            .eq('id', job.id)

          if (error) {
            results.errors.push(`Upgrade ${job.id}: ${error.message}`)
          } else {
            results.upgraded++
          }
        } catch (err) {
          results.errors.push(`Upgrade ${job.id}: ${err}`)
        }
      }
    }

    return NextResponse.json(results)
  } catch (error) {
    console.error('Error fixing URLs:', error)
    return NextResponse.json({ ...results, error: 'Failed to fix URLs' }, { status: 500 })
  }
}
