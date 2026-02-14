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
