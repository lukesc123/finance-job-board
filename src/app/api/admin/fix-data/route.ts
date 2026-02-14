import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

// Maps every job ID to its most specific career URL
const jobUrls: Record<string, string> = {
  // === T. Rowe Price ===
  '4307b30e-3cca-4b8e-aad6-80ad6e0d27c1': 'https://troweprice.wd5.myworkdayjobs.com/en-US/TRowePrice',
  '8ddb4c4e-1732-4695-b561-60380ff5ade8': 'https://troweprice.wd5.myworkdayjobs.com/TRowePrice/job/Baltimore-MD/Equity-Research-Associate-Analyst-Internship---Summer-2026_75759',
  // === Edward Jones ===
  '00026101-b512-4d01-8f09-53145d3f0757': 'https://careers.edwardjones.com/opportunity/branch-team-associate/',
  'ba201b61-fa94-4fd0-a7c7-38f299f109ec': 'https://careers.edwardjones.com/opportunity/financial-advisor/',
  // === Ameriprise ===
  '81e0da79-ac70-4103-8ed5-bb8288ff6011': 'https://www.ameriprise.com/financial-goals-priorities/financial-advisor-careers',
  'd412c832-6117-4a09-b517-c60b3c07089f': 'https://www.ameriprise.com/financial-goals-priorities/financial-advisor-careers',
  // === Raymond James ===
  '22efd76e-91f1-4d5f-ac4e-3dd1905e21de': 'https://www.raymondjames.com/corporations-and-institutions/global-equities-and-investment-banking/career-opportunities/career-path-equity-research',
  'fdf4c804-5861-4820-97c4-110f4acf7e84': 'https://www.raymondjames.com/corporations-and-institutions/global-equities-and-investment-banking/career-opportunities/career-path-investment-banking',
  'fdf4c804-5861-4820-97c4-1146ae84d61d': 'https://www.raymondjames.com/corporations-and-institutions/global-equities-and-investment-banking/career-opportunities/career-path-investment-banking',
  '5751c635-eec7-465d-952b-060bc6e7769d': 'https://www.raymondjames.com/corporations-and-institutions/global-equities-and-investment-banking/career-opportunities',
  '486ae624-fa3d-49e0-b10f-bb0f729e9132': 'https://www.raymondjames.com/corporations-and-institutions/global-equities-and-investment-banking/career-opportunities/career-path-investment-banking',
  // === State Street ===
  '27f5941f-3d70-4615-9d7c-85584b7a9a6c': 'https://careers.statestreet.com/global/en/job/R-769134/GCS-Compliance-Assurance-Analyst-AVP-1',
  'f6cbb362-1e81-4302-b75c-2e473bc661b3': 'https://careers.statestreet.com/global/en/job/STSTGLOBALR774045EXTERNALENGLOBAL/Treasury-Risk-Analyst-Assistant-Vice-President',
  // === Northern Trust ===
  'fdc2aeee-e2c2-400f-982d-ce85cf976f97': 'https://www.northerntrust.com/united-states/about-us/careers/students-and-graduates/analyst-program',
  '3b025734-cae8-4d63-bfb2-348706a268fe': 'https://www.northerntrust.com/united-states/about-us/careers/students-and-graduates/analyst-program',
  '1a805671-323e-455c-b22d-315c18ba9bcb': 'https://www.northerntrust.com/united-states/about-us/careers/students-and-graduates/analyst-program',
  'cbe37214-4bda-4444-b9cd-dffd0db4b649': 'https://www.northerntrust.com/united-states/about-us/careers/wealth-management',
  // === BNY Mellon ===
  'cbfa6784-c0fa-4246-b9fd-d8c28be23dc6': 'https://www.bny.com/corporate/global/en/about-us/careers/students/internship-program.html',
  '44fe7de9-a093-4d9c-abc4-bc1cdb0106be': 'https://www.bny.com/corporate/global/en/about-us/careers/students/analyst-program.html',
  '1f52bd67-8b35-4049-a4df-8d72cdaacc88': 'https://www.bny.com/corporate/global/en/about-us/careers/students/analyst-program.html',
  'ce4fe7b0-5963-434a-b977-dbb50c94eae2': 'https://www.bny.com/corporate/global/en/about-us/careers/students/analyst-program.html',
  // === Fidelity ===
  '41901a41-7882-423f-852b-cf2ce1e9e265': 'https://jobs.fidelity.com/en/students/career-discovery-programs/',
  '5ffb205d-19f1-4422-a2e8-348ab4691f3e': 'https://jobs.fidelity.com/en/students/career-discovery-programs/',
  // === Vanguard ===
  '8e5d05fa-0b01-4062-9455-bde8957559d4': 'https://vanguard.wd5.myworkdayjobs.com/vanguard_external',
  'ff8241e0-03c0-4032-b38f-8bbfff4599de': 'https://vanguard.wd5.myworkdayjobs.com/vanguard_external',
  '93cc187b-4ab0-4673-86b7-e96d6b23f2cd': 'https://vanguard.wd5.myworkdayjobs.com/en-US/vanguard_external/job/Client-Relationship-Associate_163707',
  '3360c28a-af84-4bd8-aa88-a89e489d91a8': 'https://vanguard.wd5.myworkdayjobs.com/vanguard_external',
  // === Charles Schwab ===
  'db694bd0-04d6-4bf4-b914-3807380b0c97': 'https://www.schwabjobs.com/search-jobs/corporate-finance',
  'b8e6e6a2-5bdf-4ee3-8dad-d5a0fd33f3c8': 'https://www.schwabjobs.com/search-jobs/corporate-finance',
  'f05aefa9-2ec1-4fa6-b510-4f028d7f9dde': 'https://www.schwabjobs.com/search-jobs/financial-services-representative',
  '8290119f-4f07-40c3-91e3-75a2c43b4315': 'https://www.schwabjobs.com/search-jobs/client-service',
  '9618d68b-c473-4d6f-abf3-bb12f5f46095': 'https://www.schwabjobs.com/search-jobs/financial-consultant',
  // === EY ===
  '87a72a95-a9e3-4c3d-bd1a-a1c59e6fc1ac': 'https://www.ey.com/en_us/careers/what-its-like-to-work-here/students/assurance',
  '6d0c9e17-58aa-44fe-83ab-8e86cb2ed155': 'https://www.ey.com/en_us/careers/what-its-like-to-work-here/students/consulting',
  'b1c2d3e4-0017-4000-8000-000000000016': 'https://www.ey.com/en_us/careers/what-its-like-to-work-here/students/strategy-and-transactions',
  'b1c2d3e4-0008-4000-8000-000000000007': 'https://www.ey.com/en_us/careers/what-its-like-to-work-here/students/consulting',
  'd3f5ad36-b2df-4b14-9996-47ed476d5bfe': 'https://www.ey.com/en_us/careers/what-its-like-to-work-here/students/assurance',
  '17ee1357-193b-469f-952f-612e5a674eee': 'https://www.ey.com/en_us/careers/what-its-like-to-work-here/students/strategy-and-transactions',
  '53f9d6f9-e611-4009-8f6d-17911848d9f1': 'https://www.ey.com/en_us/careers/what-its-like-to-work-here/students/assurance',
  '57171687-b4fe-4ba1-9ed4-9991ddacbfae': 'https://www.ey.com/en_us/careers/what-its-like-to-work-here/students/tax',
  'e04ae6c7-29d0-4cd5-8178-52c0fbb640dc': 'https://www.ey.com/en_us/careers/what-its-like-to-work-here/students/consulting',
  'ec285dc0-3547-49a5-80c1-e7aab18f2095': 'https://www.ey.com/en_us/careers/what-its-like-to-work-here/students/strategy-and-transactions',
  // === Morgan Stanley ===
  'b1c2d3e4-0011-4000-8000-000000000010': 'https://morganstanley.tal.net/vx/mobile-0/brand-0/candidate/so/pm/1/pl/1/opp/19045-2026-Investment-Banking-Summer-Analyst-Program-United-States/en-GB',
  'b1c2d3e4-0007-4000-8000-000000000006': 'https://morganstanley.tal.net/vx/mobile-0/brand-0/candidate/so/pm/1/pl/1/opp/19163-2026-Wealth-Management-Summer-Analyst-Program-New-York/en-GB',
  'b1c2d3e4-0009-4000-8000-000000000008': 'https://www.morganstanley.com/people/financial-advisors/financial-advisor-associate',
  'efc351b8-d88e-47a8-9a00-ff3a76e81bea': 'https://morganstanley.tal.net/vx/mobile-0/brand-0/candidate/so/pm/1/pl/1/opp/19045-2026-Investment-Banking-Summer-Analyst-Program-United-States/en-GB',
  '35138720-5daf-4ff3-8f0c-6277ee5405bc': 'https://www.morganstanley.com/people/financial-advisors/financial-advisor-associate',
  // === J.P. Morgan ===
  'b1c2d3e4-0013-4000-8000-000000000012': 'https://jpmc.fa.oraclecloud.com/hcmUI/CandidateExperience/en/sites/CX_1001/job/210691110',
  'b1c2d3e4-0003-4000-8000-000000000002': 'https://jpmc.fa.oraclecloud.com/hcmUI/CandidateExperience/en/sites/CX_1001/job/210703741',
  'b70e4452-1797-4ac5-9ed5-6058b7b94370': 'https://jpmc.fa.oraclecloud.com/hcmUI/CandidateExperience/en/sites/CX_1001/job/210696092',
  'b1c2d3e4-0005-4000-8000-000000000004': 'https://jpmc.fa.oraclecloud.com/hcmUI/CandidateExperience/en/sites/CX_1001/job/210700240',
  // === Goldman Sachs ===
  'b1c2d3e4-0001-4000-8000-000000000001': 'https://www.goldmansachs.com/careers/students/programs-and-internships/americas/new-analyst-program',
  'b1c2d3e4-0014-4000-8000-000000000013': 'https://www.goldmansachs.com/careers/students/programs-and-internships/americas/2026-summer-analyst-program',
  '442eae7f-8559-4a31-b5c6-0fa17c0a149a': 'https://higher.gs.com/results?q=FP%26A+analyst',
  '2d97e381-f3a6-4c0c-b7c2-3a0c2b91c0e2': 'https://www.goldmansachs.com/careers/students/programs-and-internships/americas/new-analyst-program',
  '82c5a73e-078d-44ac-9581-5aa5caf0b588': 'https://higher.gs.com/results?q=operations+analyst',
  'b1c2d3e4-0002-4000-8000-000000000001': 'https://higher.gs.com/results?q=investment+banking+summer+analyst',
  // === Lazard ===
  'b1c2d3e4-0012-4000-8000-000000000011': 'https://lazard-careers.tal.net/vx/lang-en-GB/mobile-0/appcentre-1/brand-4/candidate/jobboard/vacancy/2/adv/',
  'eaa2feb3-ea00-4f31-91c9-b38e424aa999': 'https://lazard-careers.tal.net/vx/lang-en-GB/mobile-1/appcentre-1/brand-4/candidate/so/pm/1/pl/2/opp/2842-2026-Financial-Advisory-Summer-Analyst-Program-New-York-M-A-Restructuring-Generalist/en-GB',
  'fea30f4c-43aa-41d4-a8bf-563fc3c58930': 'https://lazard-careers.tal.net/vx/lang-en-GB/mobile-0/appcentre-1/brand-4/candidate/jobboard/vacancy/2/adv/',
  '4b1500d4-d1b6-4c8c-8118-0d07b7097a10': 'https://lazard-careers.tal.net/vx/lang-en-GB/mobile-0/appcentre-1/brand-4/candidate/jobboard/vacancy/2/adv/',
  // === Blackstone ===
  'dcda8fe3-3d15-4a46-b6d6-e4a847d22488': 'https://blackstone.wd1.myworkdayjobs.com/Blackstone_Campus_Careers',
  'b1c2d3e4-0010-4000-8000-000000000009': 'https://blackstone.wd1.myworkdayjobs.com/Blackstone_Campus_Careers',
  'b1c2d3e4-0015-4000-8000-000000000014': 'https://blackstone.wd1.myworkdayjobs.com/Blackstone_Campus_Careers',
  'b1c2d3e4-0004-4000-8000-000000000003': 'https://blackstone.wd1.myworkdayjobs.com/Blackstone_Campus_Careers',
  // === KKR ===
  'e9fe3baf-398a-4a64-b202-f7fd3b27bbfb': 'https://www.kkr.com/careers/student-careers',
  // === Evercore ===
  'b1c2d3e4-0018-4000-8000-000000000017': 'https://www.evercore.com/careers/students-graduates/',
  'b1c2d3e4-0004-4000-8000-000000000003': 'https://www.evercore.com/careers/students-graduates/',
  '4f7e1ab5-8f08-4702-a6c4-8c868c9adf48': 'https://www.evercore.com/careers/students-graduates/',
  '49774dd5-1883-4be4-86ec-89fe31b1eeb0': 'https://www.evercore.com/careers/students-graduates/',
  // === PwC ===
  'b1c2d3e4-0016-4000-8000-000000000015': 'https://jobs.us.pwc.com/search-jobs/deals',
  '40601ada-f05c-470e-a040-ab41e16eb55c': 'https://jobs.us.pwc.com/search-jobs/deals/932/1',
  // === Deloitte ===
  'b1c2d3e4-0019-4000-8000-000000000018': 'https://apply.deloitte.com/en_US/careers/SearchJobs/?altJe=Undergraduate&altJo=Consulting',
  'b1c2d3e4-0006-4000-8000-000000000005': 'https://apply.deloitte.com/en_US/careers/JobDetail/Audit-Assurance-Analyst-Technology-Controls-Advisory-Summer-Fall-2026-Winter-2027/308095',
  'b1c2d3e4-0008-4000-8000-000000000007': 'https://apply.deloitte.com/en_US/careers/SearchJobs/?altJe=Undergraduate&altJo=Consulting',
  '0987c9a1-4f53-4d3b-9a5c-f17755d17361': 'https://apply.deloitte.com/en_US/careers/SearchJobs/?altJe=Undergraduate&altJo=Advisory',
  'f3c13737-89df-4357-a22b-43e0e8690062': 'https://apply.deloitte.com/en_US/careers/SearchJobs/?altJe=Undergraduate&altJo=Advisory',
  // === Wells Fargo ===
  '9b7ed3fb-66de-4ff8-b855-e71e036e9d00': 'https://www.wellsfargojobs.com/en/jobs/?q=commercial+banking+analyst&pg=1',
  'ca190ac5-2183-4278-ac5b-fb493b9f09c9': 'https://www.wellsfargojobs.com/en/jobs/?q=credit+risk+analyst&pg=1',
  'fc213394-7b6b-47b5-93de-311fbebceb2e': 'https://www.wellsfargojobs.com/en/jobs/?q=private+client+associate&pg=1',
  'b1c2d3e4-0002-4000-8000-000000000001': 'https://www.wellsfargojobs.com/en/jobs/?q=investment+banking+summer+analyst&pg=1',
  '522f2ae4-b863-49a2-bde8-2d7f71ce2682': 'https://www.wellsfargojobs.com/en/jobs/?q=commercial+banking+associate&pg=1',
  'e2674c7d-5473-4ad4-aec4-ea4a8c89f931': 'https://www.wellsfargojobs.com/en/jobs/?q=sales+trading+fixed+income&pg=1',
  // === Citi ===
  '8964fcf9-0164-4e92-ad3b-ab60e8d53b63': 'https://jobs.citi.com/job/new-york/banking-corporate-banking-full-time-analyst-new-york-usa-2026/287/84133355920',
  '581749bf-5e5f-4054-b949-8d93d135f56f': 'https://jobs.citi.com/job/new-york/banking-investment-banking-financial-institutions-group-full-time-analyst-new-york-north-america-20/287/84165053424',
  '8bbf5235-32cd-4330-86bd-8c4dcfdcf431': 'https://jobs.citi.com/search-jobs/wealth+advisor',
  'a27cb077-14ff-4b38-867e-77a53c706b2f': 'https://jobs.citi.com/search-jobs/finance+accounting+analyst',
  'f5082c51-6dde-4483-8f63-db611a929e36': 'https://jobs.citi.com/search-jobs/risk+management+analyst',
  '4baffef1-08cf-4010-95ea-33e966cac674': 'https://jobs.citi.com/search-jobs/treasury+trade+solutions',
  '73e1394b-b5cc-4ef2-90a9-7572b1061ee9': 'https://jobs.citi.com/search-jobs/operations+analyst+global+markets',
  // === KPMG ===
  '36bdd90b-1b65-4c38-ac2f-1a71d8f53bb4': 'https://www.kpmguscareers.com/jobdetail/?jobId=118176',
  'dc27ef0d-e1a1-4b32-8c60-fae740db074b': 'https://www.kpmguscareers.com/early-career/advisory/',
  '628dca18-0fcb-4570-aa25-dcaf2eb609d7': 'https://www.kpmguscareers.com/early-career/advisory/',
  // === Houlihan Lokey ===
  'bf7a81ad-cac7-4aff-bf7e-2c6d78a89d44': 'https://hl.wd1.myworkdayjobs.com/en-US/Campus',
  'ec3ac356-c681-44b2-b733-764d56a4e321': 'https://hl.wd1.myworkdayjobs.com/en-US/Campus',
  'dc25c61c-0930-4882-969b-4596b1fe75a3': 'https://hl.wd1.myworkdayjobs.com/en-US/Campus',
  'a80931a0-a1bc-4c59-9cc4-43728cfdde32': 'https://hl.wd1.myworkdayjobs.com/en-US/Campus',
  '860e54b3-63bd-459a-a893-f58bb3125604': 'https://hl.wd1.myworkdayjobs.com/en-US/Campus',
  'ec3ac356-c681-44b2-b733-764d56386322': 'https://hl.wd1.myworkdayjobs.com/en-US/Campus',
  // === Bank of America ===
  'da67e2ea-8fdd-4674-8568-1dc07853f6f4': 'https://campus.bankofamerica.com/careers/Global-Banking-Markets-Analyst-Program-Full-Time.html',
  '9cee017c-e4a6-4376-a9f5-4128db3280f5': 'https://campus.bankofamerica.com/careers/Global-Banking-Markets-Analyst-Program-Full-Time.html',
  'f17d8473-4737-4060-be55-b2cb851fbce6': 'https://campus.bankofamerica.com/careers/technology-analyst-program.html',
  '090760c2-11e2-492b-953e-d80df0d2fed0': 'https://campus.bankofamerica.com/careers/audit-internship.html',
  '57a18704-53b5-4f2b-9d9e-ec16e09cb98f': 'https://campus.bankofamerica.com/careers/merrill-wealth-management.html',
  // === Citadel ===
  '40c43676-dde3-49db-b155-0c76ff669855': 'https://www.citadel.com/careers/details/equities-citadel-associate-program-full-time-program-2026-us/',
  'a47e9bb8-5dda-4ef1-81f8-2e7d2c016fb6': 'https://www.citadel.com/careers/details/equities-citadel-associate-program-full-time-program-2026-us/',
  'e6b63188-2a4e-472b-9a5a-7cdd16c26fa6': 'https://www.citadel.com/careers/open-positions/students/internships/',
  '189ee10f-4d4c-4c49-8630-5111f6b01763': 'https://www.citadelsecurities.com/careers/details/software-engineer-intern-us/',
  // === RBC ===
  'da319947-1eb8-4d02-9afc-cfd98da63946': 'https://www.rbccm.com/en/careers/full-time.page',
  'd8a05948-9481-4aa2-af0a-7ecacfdc7cfb': 'https://jobs.rbc.com/ca/en/job/R-0000151947/2027-Capital-Markets-Global-Investment-Banking-Summer-Analyst-4-Months',
  // === Grant Thornton ===
  '304d6789-f817-40b2-9ae8-94485bfdb0e7': 'https://ehzq.fa.us2.oraclecloud.com/hcmUI/CandidateExperience/en/sites/CX_1/requisitions?keyword=restructuring',
  'f1a16d67-98c3-4a8b-a8a8-f362b9dd2148': 'https://ehzq.fa.us2.oraclecloud.com/hcmUI/CandidateExperience/en/sites/CX_1/requisitions?keyword=audit+associate',
  // === Jefferies ===
  'f05c2864-7054-4c81-bc09-3f8faec7a53a': 'https://www.jefferies.com/careers/students-and-graduates/',
  'efc351b8-d88e-47a8-9a00-ff3a76e81beb': 'https://www.jefferies.com/careers/students-and-graduates/',
  '6d1556b8-f9ed-4e5f-af10-1b29c8b1d2b5': 'https://www.jefferies.com/careers/students-and-graduates/',
  '68fdd887-7b05-4796-aecb-80c408fb5f33': 'https://www.jefferies.com/careers/students-and-graduates/',
  // === Bridgewater ===
  '9fcc856b-ff77-4de5-a59e-f747af6a9a78': 'https://www.bridgewater.com/working-at-bridgewater/job-openings',
  '08e69b81-a9d1-4503-b764-97827112243e': 'https://www.bridgewater.com/working-at-bridgewater/job-openings',
  'c2bebc28-4253-4def-8f93-acb4f966f759': 'https://www.bridgewater.com/working-at-bridgewater/job-openings',
  // === SIG ===
  'b21e5f6a-cd23-4f18-88b0-7e1dd2a89c45': 'https://careers.sig.com/',
  // === Moelis ===
  'a7a946a2-3b7b-46c4-a5a0-2efcb8f2898e': 'https://moelis.wd1.myworkdayjobs.com/en-US/Experienced-Hires?q=investment+banking+analyst',
  '2001107e-3545-4cc0-8b2a-26197aa60b7c': 'https://moelis.wd1.myworkdayjobs.com/en-US/Experienced-Hires',
  '97972ce4-a51c-417c-966d-e028996f309b': 'https://moelis.wd1.myworkdayjobs.com/en-US/Experienced-Hires',
  // === Dimensional Fund Advisors ===
  '579329e8-2e89-42a8-ba47-6bd0f4eacac3': 'https://www.dimensional.com/us-en/careers/open-positions',
  '6d6d71c3-8a2f-41a1-80da-bc2dec78a845': 'https://www.dimensional.com/us-en/careers/open-positions',
  'dbd10a0b-203e-41d0-99a4-0b58afec93b3': 'https://www.dimensional.com/us-en/careers/open-positions',
  '376938c9-9236-4ef0-b044-6d98d18c4784': 'https://www.dimensional.com/us-en/careers/open-positions',
  // === Marsh McLennan ===
  'fe313759-2628-45ab-bb9e-6b424cf7474e': 'https://careers.marshmclennan.com/global/en/search-results?keywords=claims+analyst+intern',
  '9f4b5d8a-e192-436a-97e9-a77625c205f7': 'https://careers.marshmclennan.com/global/en/search-results?keywords=actuarial+analyst',
  '076a792d-32a9-4fee-9475-1894412d467a': 'https://careers.marshmclennan.com/global/en/search-results?keywords=insurance+underwriting',
  'a74e2da5-3985-4ef1-818c-15356546bc54': 'https://careers.marshmclennan.com/global/en/search-results?keywords=operational+risk+intern',
  // === Protiviti ===
  '332771c2-e0e2-4b3d-8d0c-24c4de2f4974': 'https://www.protiviti.com/us-en/careers/search-jobs?keyword=treasury',
  'c42c2a5e-8cf6-464c-8e46-0eaeef16a92f': 'https://www.protiviti.com/us-en/careers/search-jobs?keyword=financial+planning',
  '2e8f510e-05a0-4d6e-b01a-395721d7b16f': 'https://www.protiviti.com/us-en/careers/search-jobs?keyword=enterprise+risk',
  'ed3a3e87-e8f9-4a5c-b138-98cb84b8f7db': 'https://www.protiviti.com/us-en/careers/search-jobs?keyword=credit+analyst',
  // === William Blair ===
  'bde90ec9-acfe-4a67-80d9-1782a0aec5c8': 'https://www.williamblair.com/about-william-blair/careers/current-openings',
  'ec8d7c2f-d3cb-4d1f-b8fa-720bca0b6de0': 'https://www.williamblair.com/about-william-blair/careers/current-openings',
  '00616b46-3026-43c0-9b12-f74076af00e7': 'https://www.williamblair.com/about-william-blair/careers/current-openings',
  'c226296d-cdc7-4f98-bf0e-fdf16c834a11': 'https://www.williamblair.com/about-william-blair/careers/current-openings',
  // === Stifel ===
  '7a51b8ad-4166-465b-9a63-4406ce2c2272': 'https://www.stifel.com/institutional/investment-banking/careers',
  '30fb6900-a065-4093-af91-0c08786b6cf7': 'https://www.stifel.com/wealth-management/careers',
  // === Piper Sandler ===
  'fcc415f0-4f96-46f0-ba8a-36b34eee81b1': 'https://www.pipersandler.com/join-piper-sandler/students-recent-graduates',
  'b3996171-4d27-450a-b04f-4a0cd014828b': 'https://www.pipersandler.com/join-piper-sandler/students-recent-graduates',
  // === AQR ===
  '9f0d7899-c60d-4873-9235-8812602c984b': 'https://careers.aqr.com/jobs/search?query=market+risk+analyst',
  'd2cc0a5c-aa1b-4173-9310-f6da2ba2a332': 'https://careers.aqr.com/jobs/search?query=quantitative+research+intern',
  // === Two Sigma ===
  '8d64d05d-6388-4e7b-90f6-bc443c0574a5': 'https://www.twosigma.com/careers/open-positions/?search=quantitative+research+intern',
  // === Guggenheim ===
  '6e2f3fa9-9f70-46c3-86d1-59ee86bafb68': 'https://www.guggenheimpartners.com/firm/careers/open-positions',
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
