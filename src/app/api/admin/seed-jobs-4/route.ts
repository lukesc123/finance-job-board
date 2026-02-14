import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const NEW_COMPANIES = [
  { name: 'Moelis & Company', website: 'https://moelis.com', careers_url: 'https://moelis.com/careers', description: 'Global independent investment bank providing M&A, restructuring, and capital markets advisory.' },
  { name: 'William Blair', website: 'https://williamblair.com', careers_url: 'https://williamblair.com/careers', description: 'Investment banking and investment management firm focused on growth companies.' },
  { name: 'Dimensional Fund Advisors', website: 'https://dimensional.com', careers_url: 'https://dimensional.com/careers', description: 'Systematic investment firm applying academic research to portfolio management.' },
  { name: 'AQR Capital Management', website: 'https://aqr.com', careers_url: 'https://aqr.com/careers', description: 'Quantitative investment management firm combining academic research with practical application.' },
  { name: 'Protiviti', website: 'https://protiviti.com', careers_url: 'https://protiviti.com/careers', description: 'Global consulting firm specializing in internal audit, risk management, and technology consulting.' },
  { name: 'Marsh McLennan', website: 'https://marshmclennan.com', careers_url: 'https://marshmclennan.com/careers', description: 'Global leader in risk, strategy, and people advisory, including Marsh, Mercer, and Oliver Wyman.' },
]

const NEW_JOBS = [
  // Venture Capital
  { title: 'Venture Capital Analyst', category: 'Venture Capital', location: 'San Francisco, CA', remote_type: 'Hybrid', salary_min: 85000, salary_max: 110000, job_type: 'Full-time', pipeline_stage: 'New Grad', description: 'Join our early-stage venture fund as an analyst. Evaluate startup pitches, build financial models, conduct market research, and support portfolio company operations. Work alongside partners on deal sourcing and due diligence across fintech and enterprise software.', apply_url: 'https://a16z.com/careers', company_name: 'William Blair', licenses: ['None Required'], years_exp: 1 },
  { title: 'VC Associate - Life Sciences', category: 'Venture Capital', location: 'Boston, MA', remote_type: 'On-site', salary_min: 90000, salary_max: 120000, job_type: 'Full-time', pipeline_stage: 'Early Career', description: 'Seeking an associate to join our life sciences investment team. Evaluate biotech and medtech investment opportunities, build deal models, prepare investment memos, and support existing portfolio companies. Strong science background preferred.', apply_url: 'https://williamblair.com/careers', company_name: 'William Blair', licenses: ['None Required'], years_exp: 2 },

  // Private Equity
  { title: 'Private Equity Analyst - Growth Equity', category: 'Private Equity', location: 'New York, NY', remote_type: 'On-site', salary_min: 100000, salary_max: 130000, job_type: 'Full-time', pipeline_stage: 'New Grad', description: 'Analyst role on our growth equity team. Build LBO models, create investment committee presentations, conduct industry research, and support deal execution. Exposure to tech-enabled services and healthcare sectors.', apply_url: 'https://moelis.com/careers', company_name: 'Moelis & Company', licenses: ['None Required'], years_exp: 0 },
  { title: 'PE Fund Operations Analyst', category: 'Private Equity', location: 'Chicago, IL', remote_type: 'Hybrid', salary_min: 70000, salary_max: 90000, job_type: 'Full-time', pipeline_stage: 'New Grad', description: 'Support PE fund operations including capital calls, distributions, investor reporting, and NAV calculations. Maintain fund accounting records and assist with audit preparation. Excellent opportunity to learn PE fund mechanics.', apply_url: 'https://williamblair.com/careers', company_name: 'William Blair', licenses: ['None Required'], years_exp: 0 },

  // Research
  { title: 'Equity Research Associate - Technology', category: 'Research', location: 'New York, NY', remote_type: 'On-site', salary_min: 85000, salary_max: 115000, job_type: 'Full-time', pipeline_stage: 'New Grad', description: 'Join the technology equity research team covering software and internet companies. Build and maintain financial models, write research notes, analyze earnings, and support the senior analyst with industry channel checks and client interactions.', apply_url: 'https://moelis.com/careers', company_name: 'Moelis & Company', licenses: ['Series 7', 'Series 63'], years_exp: 0 },
  { title: 'Fixed Income Research Analyst', category: 'Research', location: 'Boston, MA', remote_type: 'Hybrid', salary_min: 80000, salary_max: 105000, job_type: 'Full-time', pipeline_stage: 'Early Career', description: 'Conduct credit research on investment-grade and high-yield corporate bonds. Analyze financial statements, industry trends, and covenant structures. Prepare research reports and present findings to portfolio managers.', apply_url: 'https://dimensional.com/careers', company_name: 'Dimensional Fund Advisors', licenses: ['None Required'], years_exp: 1 },
  { title: 'Quantitative Research Intern', category: 'Research', location: 'Greenwich, CT', remote_type: 'On-site', salary_min: 50000, salary_max: 70000, job_type: 'Internship', pipeline_stage: 'Junior Internship', description: 'Summer internship on the quantitative research team. Develop and test trading signals using statistical methods, clean and analyze large datasets, and present findings to senior researchers. Python and statistics skills required.', apply_url: 'https://aqr.com/careers', company_name: 'AQR Capital Management', licenses: ['None Required'], years_exp: 0 },

  // Risk Management
  { title: 'Market Risk Analyst', category: 'Risk Management', location: 'New York, NY', remote_type: 'Hybrid', salary_min: 75000, salary_max: 95000, job_type: 'Full-time', pipeline_stage: 'New Grad', description: 'Calculate and monitor VaR, stress test results, and risk limits for equity and fixed income portfolios. Develop risk reports for senior management and regulators. Validate pricing models and investigate P&L discrepancies.', apply_url: 'https://aqr.com/careers', company_name: 'AQR Capital Management', licenses: ['None Required'], years_exp: 0 },
  { title: 'Enterprise Risk Management Associate', category: 'Risk Management', location: 'Charlotte, NC', remote_type: 'Hybrid', salary_min: 65000, salary_max: 85000, job_type: 'Full-time', pipeline_stage: 'New Grad', description: 'Support the ERM framework by identifying, assessing, and monitoring enterprise risks. Prepare risk reports for the board and management committees. Assist with risk appetite development and key risk indicator tracking.', apply_url: 'https://protiviti.com/careers', company_name: 'Protiviti', licenses: ['None Required'], years_exp: 0 },
  { title: 'Operational Risk Intern', category: 'Risk Management', location: 'Houston, TX', remote_type: 'On-site', salary_min: 35000, salary_max: 45000, job_type: 'Internship', pipeline_stage: 'Senior Internship', description: 'Assist the operational risk team with RCSA facilitation, loss event analysis, and risk reporting. Help develop and maintain risk control assessments and scenario analyses for key business processes.', apply_url: 'https://marshmclennan.com/careers', company_name: 'Marsh McLennan', licenses: ['None Required'], years_exp: 0 },

  // Operations
  { title: 'Trade Operations Analyst', category: 'Operations', location: 'New York, NY', remote_type: 'On-site', salary_min: 65000, salary_max: 80000, job_type: 'Full-time', pipeline_stage: 'New Grad', description: 'Process and settle equity, fixed income, and derivative trades. Investigate and resolve trade breaks and fails. Manage corporate actions and ensure accurate position reconciliation across internal and external systems.', apply_url: 'https://dimensional.com/careers', company_name: 'Dimensional Fund Advisors', licenses: ['None Required'], years_exp: 0 },
  { title: 'Fund Administration Associate', category: 'Operations', location: 'Austin, TX', remote_type: 'Hybrid', salary_min: 60000, salary_max: 78000, job_type: 'Full-time', pipeline_stage: 'New Grad', description: 'Calculate daily NAVs for mutual funds and ETFs. Reconcile portfolio positions, process corporate actions, and ensure compliance with fund prospectus requirements. Prepare regulatory filings and shareholder reports.', apply_url: 'https://dimensional.com/careers', company_name: 'Dimensional Fund Advisors', licenses: ['None Required'], years_exp: 0 },
  { title: 'Client Operations Specialist', category: 'Operations', location: 'Denver, CO', remote_type: 'Remote', salary_min: 55000, salary_max: 72000, job_type: 'Full-time', pipeline_stage: 'No Experience Required', description: 'Manage client onboarding and account maintenance processes. Process account transfers, handle client documentation requirements, and coordinate with custodians. Provide operational support for wealth management advisors.', apply_url: 'https://dimensional.com/careers', company_name: 'Dimensional Fund Advisors', licenses: ['None Required'], years_exp: 0 },

  // Insurance
  { title: 'Actuarial Analyst', category: 'Insurance', location: 'Hartford, CT', remote_type: 'Hybrid', salary_min: 70000, salary_max: 90000, job_type: 'Full-time', pipeline_stage: 'New Grad', description: 'Perform actuarial analyses for property & casualty insurance lines. Develop loss reserves, pricing models, and experience studies. Prepare rate filings and support the actuarial exam program. Exam support provided.', apply_url: 'https://marshmclennan.com/careers', company_name: 'Marsh McLennan', licenses: ['None Required'], years_exp: 0 },
  { title: 'Insurance Underwriting Trainee', category: 'Insurance', location: 'Philadelphia, PA', remote_type: 'On-site', salary_min: 55000, salary_max: 70000, job_type: 'Full-time', pipeline_stage: 'No Experience Required', description: 'Structured training program covering commercial lines underwriting. Learn to evaluate risk, analyze financial statements, determine coverage terms, and price policies. Rotate through property, casualty, and specialty lines.', apply_url: 'https://marshmclennan.com/careers', company_name: 'Marsh McLennan', licenses: ['None Required'], years_exp: 0 },
  { title: 'Claims Analyst Intern', category: 'Insurance', location: 'Dallas, TX', remote_type: 'Hybrid', salary_min: 30000, salary_max: 40000, job_type: 'Internship', pipeline_stage: 'Junior Internship', description: 'Summer internship in claims operations. Assist claims adjusters with investigation, documentation, and resolution of commercial insurance claims. Gain exposure to coverage analysis and loss reserving processes.', apply_url: 'https://marshmclennan.com/careers', company_name: 'Marsh McLennan', licenses: ['None Required'], years_exp: 0 },

  // Financial Planning
  { title: 'Financial Planning Associate', category: 'Financial Planning', location: 'Scottsdale, AZ', remote_type: 'Hybrid', salary_min: 55000, salary_max: 75000, job_type: 'Full-time', pipeline_stage: 'New Grad', description: 'Create comprehensive financial plans for high-net-worth clients. Prepare retirement projections, tax optimization strategies, estate planning analyses, and investment policy statements. CFP exam support provided.', apply_url: 'https://williamblair.com/careers', company_name: 'William Blair', licenses: ['Series 65'], years_exp: 0 },
  { title: 'Paraplanner', category: 'Financial Planning', location: 'Minneapolis, MN', remote_type: 'Hybrid', salary_min: 50000, salary_max: 65000, job_type: 'Full-time', pipeline_stage: 'No Experience Required', description: 'Support senior financial advisors by preparing financial plans, gathering client data, and maintaining CRM records. Analyze insurance needs, college funding strategies, and Social Security optimization scenarios.', apply_url: 'https://protiviti.com/careers', company_name: 'Protiviti', licenses: ['None Required'], years_exp: 0 },

  // Commercial Banking
  { title: 'Commercial Credit Analyst', category: 'Commercial Banking', location: 'Atlanta, GA', remote_type: 'On-site', salary_min: 60000, salary_max: 78000, job_type: 'Full-time', pipeline_stage: 'New Grad', description: 'Underwrite commercial loans by spreading financial statements, analyzing cash flows, and assessing collateral. Prepare credit memos for loan committee approval. Monitor existing portfolio credits and identify early warning signals.', apply_url: 'https://protiviti.com/careers', company_name: 'Protiviti', licenses: ['None Required'], years_exp: 0 },
  { title: 'Treasury Management Analyst', category: 'Commercial Banking', location: 'Charlotte, NC', remote_type: 'On-site', salary_min: 58000, salary_max: 75000, job_type: 'Full-time', pipeline_stage: 'New Grad', description: 'Support commercial banking clients with treasury management solutions including cash concentration, ACH processing, wire transfers, and merchant services. Analyze client payment flows and recommend efficiency improvements.', apply_url: 'https://protiviti.com/careers', company_name: 'Protiviti', licenses: ['None Required'], years_exp: 0 },
]

export async function GET() {
  const results: string[] = []
  const errors: string[] = []

  // Upsert companies
  for (const company of NEW_COMPANIES) {
    const { error } = await supabaseAdmin
      .from('companies')
      .upsert(company, { onConflict: 'name' })
    if (error) errors.push(`Company ${company.name}: ${error.message}`)
    else results.push(`Company: ${company.name}`)
  }

  // Get company name->id map
  const { data: allCompanies } = await supabaseAdmin.from('companies').select('id, name')
  const companyMap = new Map((allCompanies || []).map((c: any) => [c.name, c.id]))

  // Insert jobs
  let jobsAdded = 0
  for (const job of NEW_JOBS) {
    const companyId = companyMap.get(job.company_name)
    if (!companyId) {
      errors.push(`${job.title}: company "${job.company_name}" not found`)
      continue
    }

    const { error } = await supabaseAdmin.from('jobs').insert({
      company_id: companyId,
      title: job.title,
      category: job.category,
      location: job.location,
      remote_type: job.remote_type,
      salary_min: job.salary_min,
      salary_max: job.salary_max,
      job_type: job.job_type,
      pipeline_stage: job.pipeline_stage,
      description: job.description,
      apply_url: job.apply_url,
      source_url: job.apply_url,
      is_active: true,
      is_verified: true,
      posted_date: new Date(Date.now() - Math.random() * 14 * 86400000).toISOString(),
      licenses_required: job.licenses,
      years_experience_max: job.years_exp,
    })
    if (error) errors.push(`${job.title}: ${error.message}`)
    else jobsAdded++
  }

  // Get total counts
  const { count: totalJobs } = await supabaseAdmin.from('jobs').select('*', { count: 'exact', head: true }).eq('is_active', true)
  const { count: totalCompanies } = await supabaseAdmin.from('companies').select('*', { count: 'exact', head: true })

  return NextResponse.json({
    success: true,
    jobsAdded,
    companiesProcessed: NEW_COMPANIES.length,
    totalJobs,
    totalCompanies,
    errors: errors.length > 0 ? errors : undefined,
  })
}
