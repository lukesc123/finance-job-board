import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

const companyUrls: Record<string, string> = {
  'BNY Mellon': 'https://www.bny.com/corporate/global/en/about-us/careers/students/internship-program.html',
  'Fidelity Investments': 'https://jobs.fidelity.com/en/students/internships/',
  'Charles Schwab': 'https://www.schwabjobs.com/early-careers-overview',
  'Ameriprise Financial': 'https://www.ameriprise.com/careers',
  'Northern Trust': 'https://www.northerntrust.com/united-states/about-us/careers/students-and-graduates',
  'Vanguard': 'https://www.vanguardjobs.com/job-search-results/',
  'State Street': 'https://careers.statestreet.com/global/en/c/compliance-risk-and-legal-jobs',
  'Raymond James': 'https://www.raymondjames.com/careers',
  'T. Rowe Price': 'https://troweprice.wd5.myworkdayjobs.com/en-US/TRowePrice',
  'Edward Jones': 'https://careers.edwardjones.com/',
  'Deloitte': 'https://apply.deloitte.com/en_US/careers/SearchJobs',
  'Blackstone': 'https://blackstone.wd1.myworkdayjobs.com/Blackstone_Campus_Careers',
  'Goldman Sachs': 'https://www.goldmansachs.com/careers/students/programs-and-internships/americas/2026-summer-analyst-program',
  'JPMorgan Chase': 'https://www.jpmorganchase.com/careers/explore-opportunities/students-and-graduates',
  'Morgan Stanley': 'https://morganstanley.tal.net/vx/mobile-0/brand-0/candidate/so/pm/1/pl/1/opp/19163-2026-Wealth-Management-Summer-Analyst-Program-New-York/en-GB',
  'Lazard': 'https://lazard-careers.tal.net/vx/lang-en-GB/mobile-0/appcentre-1/brand-4/candidate/jobboard/vacancy/2/adv/',
  'PwC': 'https://jobs.us.pwc.com/entry-level',
  'EY': 'https://usearlycareers.ey.com/search-jobs',
  'Evercore': 'https://www.evercore.com/careers/students-graduates/',
  'KKR': 'https://www.kkr.com/careers/student-careers',
  'Wells Fargo': 'https://www.wellsfargojobs.com/en/early-careers/',
  'Citi': 'https://jobs.citi.com/early-careers',
  'KPMG': 'https://www.kpmguscareers.com/early-career/',
  'Houlihan Lokey': 'https://hl.wd1.myworkdayjobs.com/Campus',
  'RBC Capital Markets': 'https://www.rbccm.com/en/careers/full-time.page',
}

const jobSpecificUrls: Record<string, string> = {
  'dcda8fe3-3d15-4a46-b6d6-e4a847d22488': 'https://blackstone.wd1.myworkdayjobs.com/en-US/Blackstone_Campus_Careers/job/New-York/XMLNAME-2026-Blackstone-Private-Equity-Summer-Analyst_38214',
  '581749bf-5e5f-4054-b949-8d93d135f56f': 'https://jobs.citi.com/job/new-york/banking-corporate-banking-full-time-analyst-new-york-usa-2026/287/84181764784',
  'efc351b8-d88e-47a8-9a00-ff3a76e81bea': 'https://www.jpmorganchase.com/careers/explore-opportunities/programs/investment-banking-fulltime-analyst',
  '36bdd90b-1b65-4c38-ac2f-1a71d8f53bb4': 'https://www.kpmguscareers.com/jobdetail/?jobId=125871',
  'ff8241e0-03c0-4032-b38f-8bbfff4599de': 'https://apply.deloitte.com/en_US/careers/JobDetail/Audit-Assurance-Analyst-Technology-Controls-Advisory-Summer-Fall-2026-Winter-2027/308095',
  '27f5941f-3d70-4615-9d7c-85584b7a9a6c': 'https://careers.statestreet.com/global/en/job/STSTGLOBALR779160EXTERNALENGLOBAL/Compliance-Analyst-State-Street-Investment-Management-Officer',
  'f6cbb362-1e81-4302-b75c-2e473bc661b3': 'https://careers.statestreet.com/global/en/job/STSTGLOBALR761399EXTERNALENGLOBAL/Compliance-Risk-Testing-Analyst-Officer-Hybrid',
  'ba201b61-fa94-4fd0-a7c7-38f299f109ec': 'https://morganstanley.tal.net/vx/mobile-0/brand-0/candidate/so/pm/1/pl/1/opp/19163-2026-Wealth-Management-Summer-Analyst-Program-New-York/en-GB',
  'b1c2d3e4-0013-4000-8000-000000000012': 'https://www.jpmorganchase.com/careers/explore-opportunities/students-and-graduates',
  'b1c2d3e4-0003-4000-8000-000000000002': 'https://www.jpmorganchase.com/careers/explore-opportunities/students-and-graduates',
  'b70e4452-1797-4ac5-9ed5-6058b7b94370': 'https://www.jpmorganchase.com/careers/explore-opportunities/students-and-graduates',
  'da67e2ea-8fdd-4674-8568-1dc07853f6f4': 'https://campus.bankofamerica.com/careers/Global-Banking-Markets-Analyst-Program-Full-Time.html',
  '9cee017c-e4a6-4376-a9f5-4128db3280f5': 'https://campus.bankofamerica.com/careers/Global-Banking-Markets-Analyst-Program-Full-Time.html',
  'f17d8473-4737-4060-be55-b2cb851fbce6': 'https://campus.bankofamerica.com/careers/',
  '090760c2-11e2-492b-953e-d80df0d2fed0': 'https://campus.bankofamerica.com/careers/',
  '40c43676-dde3-49db-b155-0c76ff669855': 'https://www.citadel.com/careers/open-opportunities/',
  'a47e9bb8-5dda-4ef1-81f8-2e7d2c016fb6': 'https://www.citadel.com/careers/open-opportunities/',
  '304d6789-f817-40b2-9ae8-94485bfdb0e7': 'https://www.grantthornton.com/careers',
  'f05c2864-7054-4c81-bc09-3f8faec7a53a': 'https://www.jefferies.com/careers',
  '9fcc856b-ff77-4de5-a59e-f747af6a9a78': 'https://www.bridgewater.com/careers',
  'b21e5f6a-cd23-4f18-88b0-7e1dd2a89c45': 'https://careers.sig.com/',
}

export async function POST() {
  try {
    const { data: jobs, error: fetchError } = await supabaseAdmin
      .from('jobs')
      .select('id, title, company:companies(name)')

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    let updated = 0
    let skipped = 0
    const results: Array<{ id: string; title: string; company: string; newUrl: string; source: string }> = []

    for (const job of jobs) {
      const companyName = (job.company as any)?.name || ''
      
      if (jobSpecificUrls[job.id]) {
        const { error } = await supabaseAdmin
          .from('jobs')
          .update({ apply_url: jobSpecificUrls[job.id] })
          .eq('id', job.id)
        if (!error) {
          updated++
          results.push({ id: job.id, title: job.title, company: companyName, newUrl: jobSpecificUrls[job.id], source: 'job-specific' })
        }
        continue
      }

      if (companyUrls[companyName]) {
        const { error } = await supabaseAdmin
          .from('jobs')
          .update({ apply_url: companyUrls[companyName] })
          .eq('id', job.id)
        if (!error) {
          updated++
          results.push({ id: job.id, title: job.title, company: companyName, newUrl: companyUrls[companyName], source: 'company' })
        }
        continue
      }

      skipped++
    }

    return NextResponse.json({ success: true, updated, skipped, total: jobs.length, results })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
