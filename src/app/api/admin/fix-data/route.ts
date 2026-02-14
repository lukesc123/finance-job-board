import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

// Maps every job ID to its most specific career URL
const jobUrls: Record<string, string> = {
  '4307b30e-3cca-4b8e-aad6-80ad6e0d27c1': 'https://troweprice.wd5.myworkdayjobs.com/en-US/TRowePrice',
  '8ddb4c4e-1732-4695-b561-60380ff5ade8': 'https://troweprice.wd5.myworkdayjobs.com/TRowePrice/job/Baltimore-MD/Equity-Research-Associate-Analyst-Internship---Summer-2026_75759',
  '00026101-b512-4d01-8f09-53145d3f0757': 'https://careers.edwardjones.com/job-search-results/',
  'ba201b61-fa94-4fd0-a7c7-38f299f109ec': 'https://careers.edwardjones.com/job-search-results/',
  '81e0da79-ac70-4103-8ed5-bb8288ff6011': 'https://www.ameriprise.com/careers',
  'd412c832-6117-4a09-b517-c60b3c07089f': 'https://www.ameriprise.com/careers',
  '22efd76e-91f1-4d5f-ac4e-3dd1905e21de': 'https://www.raymondjames.com/corporations-and-institutions/global-equities-and-investment-banking/career-opportunities/career-path-equity-research',
  'fdf4c804-5861-4820-97c4-110f4acf7e84': 'https://www.raymondjames.com/corporations-and-institutions/global-equities-and-investment-banking/career-opportunities/career-path-investment-banking',
  '27f5941f-3d70-4615-9d7c-85584b7a9a6c': 'https://careers.statestreet.com/global/en/job/R-769134/GCS-Compliance-Assurance-Analyst-AVP-1',
  'f6cbb362-1e81-4302-b75c-2e473bc661b3': 'https://careers.statestreet.com/global/en/job/STSTGLOBALR774045EXTERNALENGLOBAL/Treasury-Risk-Analyst-Assistant-Vice-President',
  'fdc2aeee-e2c2-400f-982d-ce85cf976f97': 'https://www.northerntrust.com/united-states/about-us/careers/students-and-graduates',
  '3b025734-cae8-4d63-bfb2-348706a268fe': 'https://www.northerntrust.com/united-states/about-us/careers/students-and-graduates',
  'cbfa6784-c0fa-4246-b9fd-d8c28be23dc6': 'https://www.bny.com/corporate/global/en/about-us/careers/students/internship-program.html',
  '44fe7de9-a093-4d9c-abc4-bc1cdb0106be': 'https://www.bny.com/corporate/global/en/about-us/careers/students.html',
  '41901a41-7882-423f-852b-cf2ce1e9e265': 'https://jobs.fidelity.com/en/students/career-discovery-programs/',
  '8e5d05fa-0b01-4062-9455-bde8957559d4': 'https://www.vanguardjobs.com/job-search-results/',
  'ff8241e0-03c0-4032-b38f-8bbfff4599de': 'https://www.vanguardjobs.com/job-search-results/',
  'db694bd0-04d6-4bf4-b914-3807380b0c97': 'https://www.schwabjobs.com/search-jobs',
  'b8e6e6a2-5bdf-4ee3-8dad-d5a0fd33f3c8': 'https://www.schwabjobs.com/search-jobs',
  '87a72a95-a9e3-4c3d-bd1a-a1c59e6fc1ac': 'https://usearlycareers.ey.com/search-jobs',
  '6d0c9e17-58aa-44fe-83ab-8e86cb2ed155': 'https://usearlycareers.ey.com/search-jobs',
  'b1c2d3e4-0017-4000-8000-000000000016': 'https://usearlycareers.ey.com/search-jobs',
  'b1c2d3e4-0011-4000-8000-000000000010': 'https://morganstanley.tal.net/vx/mobile-0/brand-0/candidate/so/pm/1/pl/1/opp/19045-2026-Investment-Banking-Summer-Analyst-Program-United-States/en-GB',
  'b1c2d3e4-0007-4000-8000-000000000006': 'https://morganstanley.tal.net/vx/mobile-0/brand-0/candidate/so/pm/1/pl/1/opp/19163-2026-Wealth-Management-Summer-Analyst-Program-New-York/en-GB',
  'b1c2d3e4-0009-4000-8000-000000000008': 'https://www.morganstanley.com/people/financial-advisors/financial-advisor-associate',
  'efc351b8-d88e-47a8-9a00-ff3a76e81bea': 'https://morganstanley.tal.net/vx/mobile-0/brand-0/candidate/so/pm/1/pl/1/opp/19045-2026-Investment-Banking-Summer-Analyst-Program-United-States/en-GB',
  'b1c2d3e4-0013-4000-8000-000000000012': 'https://jpmc.fa.oraclecloud.com/hcmUI/CandidateExperience/en/sites/CX_1001/job/210691110',
  'b1c2d3e4-0003-4000-8000-000000000002': 'https://jpmc.fa.oraclecloud.com/hcmUI/CandidateExperience/en/sites/CX_1001/job/210703741',
  'b70e4452-1797-4ac5-9ed5-6058b7b94370': 'https://jpmc.fa.oraclecloud.com/hcmUI/CandidateExperience/en/sites/CX_1001/job/210696092',
  'b1c2d3e4-0005-4000-8000-000000000004': 'https://jpmc.fa.oraclecloud.com/hcmUI/CandidateExperience/en/sites/CX_1001/job/210700240',
  'b1c2d3e4-0001-4000-8000-000000000001': 'https://www.goldmansachs.com/careers/students/programs-and-internships/americas/new-analyst-program',
  'b1c2d3e4-0014-4000-8000-000000000013': 'https://www.goldmansachs.com/careers/students/programs-and-internships/americas/2026-summer-analyst-program',
  '442eae7f-8559-4a31-b5c6-0fa17c0a149a': 'https://www.goldmansachs.com/careers/students/programs-and-internships/americas/new-analyst-program',
  '2d97e381-f3a6-4c0c-b7c2-3a0c2b91c0e2': 'https://www.goldmansachs.com/careers/students/programs-and-internships/americas/new-analyst-program',
  'b1c2d3e4-0012-4000-8000-000000000011': 'https://lazard-careers.tal.net/vx/lang-en-GB/mobile-0/appcentre-1/brand-4/candidate/jobboard/vacancy/2/adv/',
  'eaa2feb3-ea00-4f31-91c9-b38e424aa999': 'https://lazard-careers.tal.net/vx/lang-en-GB/mobile-1/appcentre-1/brand-4/candidate/so/pm/1/pl/2/opp/2842-2026-Financial-Advisory-Summer-Analyst-Program-New-York-M-A-Restructuring-Generalist/en-GB',
  'dcda8fe3-3d15-4a46-b6d6-e4a847d22488': 'https://blackstone.wd1.myworkdayjobs.com/Blackstone_Campus_Careers',
  'b1c2d3e4-0010-4000-8000-000000000009': 'https://blackstone.wd1.myworkdayjobs.com/Blackstone_Campus_Careers',
  'b1c2d3e4-0015-4000-8000-000000000014': 'https://blackstone.wd1.myworkdayjobs.com/Blackstone_Campus_Careers',
  'e9fe3baf-398a-4a64-b202-f7fd3b27bbfb': 'https://www.kkr.com/careers/student-careers',
  'b1c2d3e4-0018-4000-8000-000000000017': 'https://www.evercore.com/careers/students-graduates/',
  'b1c2d3e4-0004-4000-8000-000000000003': 'https://www.evercore.com/careers/students-graduates/',
  'b1c2d3e4-0016-4000-8000-000000000015': 'https://jobs.us.pwc.com/entry-level',
  'b1c2d3e4-0019-4000-8000-000000000018': 'https://apply.deloitte.com/en_US/careers/SearchJobs',
  'b1c2d3e4-0006-4000-8000-000000000005': 'https://apply.deloitte.com/en_US/careers/JobDetail/Audit-Assurance-Analyst-Technology-Controls-Advisory-Summer-Fall-2026-Winter-2027/308095',
  'b1c2d3e4-0008-4000-8000-000000000007': 'https://apply.deloitte.com/en_US/careers/SearchJobs',
  '9b7ed3fb-66de-4ff8-b855-e71e036e9d00': 'https://www.wellsfargojobs.com/en/early-careers/',
  'ca190ac5-2183-4278-ac5b-fb493b9f09c9': 'https://www.wellsfargojobs.com/en/early-careers/',
  'fc213394-7b6b-47b5-93de-311fbebceb2e': 'https://www.wellsfargojobs.com/en/early-careers/',
  'b1c2d3e4-0002-4000-8000-000000000001': 'https://www.wellsfargojobs.com/en/early-careers/',
  '8964fcf9-0164-4e92-ad3b-ab60e8d53b63': 'https://jobs.citi.com/job/new-york/banking-corporate-banking-full-time-analyst-new-york-usa-2026/287/84133355920',
  '8bbf5235-32cd-4330-86bd-8c4dcfdcf431': 'https://jobs.citi.com/early-careers',
  '581749bf-5e5f-4054-b949-8d93d135f56f': 'https://jobs.citi.com/job/new-york/banking-investment-banking-financial-institutions-group-full-time-analyst-new-york-north-america-20/287/84165053424',
  'a27cb077-14ff-4b38-867e-77a53c706b2f': 'https://jobs.citi.com/early-careers',
  'f5082c51-6dde-4483-8f63-db611a929e36': 'https://jobs.citi.com/early-careers',
  '36bdd90b-1b65-4c38-ac2f-1a71d8f53bb4': 'https://www.kpmguscareers.com/jobdetail/?jobId=118176',
  'dc27ef0d-e1a1-4b32-8c60-fae740db074b': 'https://www.kpmguscareers.com/early-career/',
  'bf7a81ad-cac7-4aff-bf7e-2c6d78a89d44': 'https://hl.wd1.myworkdayjobs.com/Campus',
  'ec3ac356-c681-44b2-b733-764d56a4e321': 'https://hl.wd1.myworkdayjobs.com/Campus',
  'da67e2ea-8fdd-4674-8568-1dc07853f6f4': 'https://campus.bankofamerica.com/careers/Global-Banking-Markets-Analyst-Program-Full-Time.html',
  '9cee017c-e4a6-4376-a9f5-4128db3280f5': 'https://campus.bankofamerica.com/careers/Global-Banking-Markets-Analyst-Program-Full-Time.html',
  'f17d8473-4737-4060-be55-b2cb851fbce6': 'https://campus.bankofamerica.com/careers/',
  '090760c2-11e2-492b-953e-d80df0d2fed0': 'https://campus.bankofamerica.com/careers/',
  '40c43676-dde3-49db-b155-0c76ff669855': 'https://www.citadel.com/careers/details/equities-citadel-associate-program-full-time-program-2026-us/',
  'a47e9bb8-5dda-4ef1-81f8-2e7d2c016fb6': 'https://www.citadel.com/careers/details/equities-citadel-associate-program-full-time-program-2026-us/',
  'da319947-1eb8-4d02-9afc-cfd98da63946': 'https://www.rbccm.com/en/careers/full-time.page',
  'd8a05948-9481-4aa2-af0a-7ecacfdc7cfb': 'https://jobs.rbc.com/ca/en/job/R-0000151947/2027-Capital-Markets-Global-Investment-Banking-Summer-Analyst-4-Months',
  '304d6789-f817-40b2-9ae8-94485bfdb0e7': 'https://www.grantthornton.com/careers',
  'f05c2864-7054-4c81-bc09-3f8faec7a53a': 'https://www.jefferies.com/careers/students-and-graduates/',
  'efc351b8-d88e-47a8-9a00-ff3a76e81beb': 'https://www.jefferies.com/careers/students-and-graduates/',
  '9fcc856b-ff77-4de5-a59e-f747af6a9a78': 'https://www.bridgewater.com/careers',
  '08e69b81-a9d1-4503-b764-97827112243e': 'https://www.bridgewater.com/careers',
  'b21e5f6a-cd23-4f18-88b0-7e1dd2a89c45': 'https://careers.sig.com/',
}

export async function POST() {
  try {
    const { data: jobs, error: fetchError } = await supabaseAdmin
      .from('jobs')
      .select('id, title')

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    let updated = 0
    let skipped = 0

    for (const job of jobs) {
      if (jobUrls[job.id]) {
        const { error } = await supabaseAdmin
          .from('jobs')
          .update({ apply_url: jobUrls[job.id] })
          .eq('id', job.id)
        if (!error) updated++
        continue
      }
      skipped++
    }

    return NextResponse.json({ success: true, updated, skipped, total: jobs.length })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
