import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST() {
  try {
    // Add new companies that are missing
    const newCompanies = [
      {
        name: 'Piper Sandler',
        website: 'https://www.pipersandler.com',
        careers_url: 'https://www.pipersandler.com/careers',
        description: 'Leading investment bank focused on middle-market advisory, equity research, and capital markets',
      },
      {
        name: 'Houlihan Lokey',
        website: 'https://www.hl.com',
        careers_url: 'https://www.hl.com/careers',
        description: 'Global investment bank specializing in M&A advisory, financial restructuring, and valuation',
      },
      {
        name: 'Guggenheim Securities',
        website: 'https://www.guggenheimpartners.com',
        careers_url: 'https://www.guggenheimpartners.com/careers',
        description: 'Full-service investment banking and advisory firm with expertise in capital markets and M&A',
      },
      {
        name: 'Stifel',
        website: 'https://www.stifel.com',
        careers_url: 'https://www.stifel.com/careers',
        description: 'Full-service brokerage and investment banking firm serving individual investors and institutions',
      },
      {
        name: 'Truist',
        website: 'https://www.truist.com',
        careers_url: 'https://careers.truist.com',
        description: 'Major US financial services company offering banking, investments, insurance, and mortgage services',
      },
      {
        name: 'PNC Financial',
        website: 'https://www.pnc.com',
        careers_url: 'https://careers.pnc.com',
        description: 'One of the largest diversified financial services companies in the US, offering retail and corporate banking',
      },
      {
        name: 'Citadel',
        website: 'https://www.citadel.com',
        careers_url: 'https://www.citadel.com/careers',
        description: 'Leading global financial institution with expertise in capital markets, asset management, and quantitative strategies',
      },
      {
        name: 'Two Sigma',
        website: 'https://www.twosigma.com',
        careers_url: 'https://www.twosigma.com/careers',
        description: 'Technology-driven investment firm using data science and engineering to find connections in the world\'s data',
      },
    ]

    const companyMap: Record<string, string> = {}

    for (const company of newCompanies) {
      const { data: existing } = await supabaseAdmin
        .from('companies')
        .select('id')
        .eq('name', company.name)
        .single()

      if (existing) {
        companyMap[company.name] = existing.id
      } else {
        const { data: inserted } = await supabaseAdmin
          .from('companies')
          .insert(company)
          .select('id')
          .single()
        if (inserted) companyMap[company.name] = inserted.id
      }
    }

    // Get existing company IDs
    const { data: allCompanies } = await supabaseAdmin
      .from('companies')
      .select('id, name')

    for (const c of (allCompanies || [])) {
      companyMap[c.name] = c.id
    }

    const today = new Date().toISOString().split('T')[0]
    const daysAgo = (n: number) => {
      const d = new Date()
      d.setDate(d.getDate() - n)
      return d.toISOString().split('T')[0]
    }

    const newJobs = [
      // Piper Sandler
      {
        title: 'Investment Banking Analyst - Healthcare',
        company_id: companyMap['Piper Sandler'],
        category: 'Investment Banking',
        location: 'New York, NY',
        remote_type: 'On-site',
        job_type: 'Full-time',
        pipeline_stage: 'New Grad',
        salary_min: 95000,
        salary_max: 110000,
        posted_date: daysAgo(3),
        apply_url: 'https://www.pipersandler.com/careers',
        licenses_required: ['SIE', 'Series 79', 'Series 63'],
        description: 'Join Piper Sandler\'s Healthcare Investment Banking team as an Analyst. Execute M&A advisory, capital raising, and strategic advisory transactions for healthcare companies. Collaborate with senior bankers on financial modeling, due diligence, and client presentations.',
      },
      {
        title: 'Equity Research Associate - Technology',
        company_id: companyMap['Piper Sandler'],
        category: 'Research',
        location: 'San Francisco, CA',
        remote_type: 'On-site',
        job_type: 'Full-time',
        pipeline_stage: 'New Grad',
        salary_min: 90000,
        salary_max: 105000,
        posted_date: daysAgo(5),
        apply_url: 'https://www.pipersandler.com/careers',
        licenses_required: ['None Required'],
        description: 'Support senior analysts in covering technology sector equities. Build and maintain financial models, analyze industry trends, and prepare research reports for institutional investors.',
      },
      // Houlihan Lokey
      {
        title: 'Financial Restructuring Analyst',
        company_id: companyMap['Houlihan Lokey'],
        category: 'Investment Banking',
        location: 'New York, NY',
        remote_type: 'On-site',
        job_type: 'Full-time',
        pipeline_stage: 'New Grad',
        salary_min: 100000,
        salary_max: 115000,
        posted_date: daysAgo(2),
        apply_url: 'https://www.hl.com/careers',
        licenses_required: ['None Required'],
        description: 'Join Houlihan Lokey\'s #1-ranked Financial Restructuring practice. Advise distressed companies and creditors on balance sheet solutions, debt restructuring, and bankruptcy proceedings. Develop complex financial models and valuations.',
      },
      {
        title: 'Valuation Advisory Associate',
        company_id: companyMap['Houlihan Lokey'],
        category: 'Consulting',
        location: 'Los Angeles, CA',
        remote_type: 'On-site',
        job_type: 'Full-time',
        pipeline_stage: 'New Grad',
        salary_min: 85000,
        salary_max: 100000,
        posted_date: daysAgo(4),
        apply_url: 'https://www.hl.com/careers',
        licenses_required: ['None Required'],
        description: 'Provide valuation advisory services for M&A transactions, financial reporting, tax compliance, and litigation support. Build DCF, comparable company, and precedent transaction analyses.',
      },
      // Guggenheim Securities
      {
        title: 'Capital Markets Analyst',
        company_id: companyMap['Guggenheim Securities'],
        category: 'Investment Banking',
        location: 'New York, NY',
        remote_type: 'On-site',
        job_type: 'Full-time',
        pipeline_stage: 'New Grad',
        salary_min: 95000,
        salary_max: 110000,
        posted_date: daysAgo(6),
        apply_url: 'https://www.guggenheimpartners.com/careers',
        licenses_required: ['SIE'],
        description: 'Support the Capital Markets team in executing debt and equity offerings. Analyze credit profiles, prepare offering memorandums, and assist in the pricing and marketing of securities.',
      },
      // Stifel
      {
        title: 'Financial Advisor Trainee',
        company_id: companyMap['Stifel'],
        category: 'Private Wealth',
        location: 'St. Louis, MO',
        remote_type: 'On-site',
        job_type: 'Full-time',
        pipeline_stage: 'No Experience Required',
        salary_min: 55000,
        salary_max: 70000,
        posted_date: daysAgo(3),
        apply_url: 'https://www.stifel.com/careers',
        licenses_required: ['Series 7', 'Series 66'],
        description: 'Enter Stifel\'s Financial Advisor training program. Learn wealth management fundamentals, build client relationships, and develop comprehensive financial planning skills. Licensing sponsorship provided.',
      },
      {
        title: 'Investment Banking Summer Analyst 2027',
        company_id: companyMap['Stifel'],
        category: 'Investment Banking',
        location: 'San Francisco, CA',
        remote_type: 'On-site',
        job_type: 'Internship',
        pipeline_stage: 'Junior Internship',
        salary_min: 95000,
        salary_max: 110000,
        posted_date: daysAgo(1),
        apply_url: 'https://www.stifel.com/careers',
        licenses_required: ['None Required'],
        description: 'Join Stifel\'s 10-week Investment Banking Summer Analyst program in the San Francisco Technology group. Gain hands-on experience in M&A advisory and capital raising for technology companies.',
      },
      // Truist
      {
        title: 'Commercial Banking Analyst',
        company_id: companyMap['Truist'],
        category: 'Commercial Banking',
        location: 'Charlotte, NC',
        remote_type: 'On-site',
        job_type: 'Full-time',
        pipeline_stage: 'New Grad',
        salary_min: 65000,
        salary_max: 80000,
        posted_date: daysAgo(5),
        apply_url: 'https://careers.truist.com',
        licenses_required: ['None Required'],
        description: 'Join Truist\'s Commercial Banking team as an Analyst. Support relationship managers in credit analysis, loan structuring, and portfolio management for middle-market companies.',
      },
      {
        title: 'Insurance Underwriting Analyst',
        company_id: companyMap['Truist'],
        category: 'Insurance',
        location: 'Atlanta, GA',
        remote_type: 'Hybrid',
        job_type: 'Full-time',
        pipeline_stage: 'No Experience Required',
        salary_min: 55000,
        salary_max: 68000,
        posted_date: daysAgo(7),
        apply_url: 'https://careers.truist.com',
        licenses_required: ['None Required'],
        description: 'Evaluate and analyze insurance applications for Truist Insurance Holdings. Assess risk factors, review financial data, and make underwriting recommendations for commercial lines.',
      },
      {
        title: 'Financial Planning Associate',
        company_id: companyMap['Truist'],
        category: 'Financial Planning',
        location: 'Charlotte, NC',
        remote_type: 'Hybrid',
        job_type: 'Full-time',
        pipeline_stage: 'No Experience Required',
        salary_min: 58000,
        salary_max: 72000,
        posted_date: daysAgo(4),
        apply_url: 'https://careers.truist.com',
        licenses_required: ['None Required'],
        description: 'Support financial advisors in developing comprehensive financial plans for clients. Prepare retirement projections, investment policy statements, and tax-efficient strategies. CFP study support provided.',
      },
      // PNC Financial
      {
        title: 'Commercial Banking Development Program',
        company_id: companyMap['PNC Financial'],
        category: 'Commercial Banking',
        location: 'Pittsburgh, PA',
        remote_type: 'On-site',
        job_type: 'Full-time',
        pipeline_stage: 'New Grad',
        salary_min: 65000,
        salary_max: 78000,
        posted_date: daysAgo(3),
        apply_url: 'https://careers.pnc.com',
        licenses_required: ['None Required'],
        description: 'PNC\'s rotational development program for Commercial Banking. Rotate through credit analysis, relationship management, and treasury management over 24 months. Build core banking skills.',
      },
      {
        title: 'Corporate Finance Analyst',
        company_id: companyMap['PNC Financial'],
        category: 'Corporate Finance',
        location: 'Pittsburgh, PA',
        remote_type: 'Hybrid',
        job_type: 'Full-time',
        pipeline_stage: 'New Grad',
        salary_min: 68000,
        salary_max: 82000,
        posted_date: daysAgo(6),
        apply_url: 'https://careers.pnc.com',
        licenses_required: ['None Required'],
        description: 'Join PNC\'s Corporate Finance team supporting FP&A, budgeting, forecasting, and strategic analysis. Build financial models and present recommendations to senior management.',
      },
      {
        title: 'Risk Management Associate',
        company_id: companyMap['PNC Financial'],
        category: 'Risk Management',
        location: 'Pittsburgh, PA',
        remote_type: 'On-site',
        job_type: 'Full-time',
        pipeline_stage: 'New Grad',
        salary_min: 65000,
        salary_max: 80000,
        posted_date: daysAgo(8),
        apply_url: 'https://careers.pnc.com',
        licenses_required: ['None Required'],
        description: 'Assess and monitor credit, market, and operational risk across PNC\'s loan portfolio. Develop risk models, perform stress testing, and prepare reports for regulators and management.',
      },
      // Citadel
      {
        title: 'Quantitative Research Analyst',
        company_id: companyMap['Citadel'],
        category: 'Research',
        location: 'Chicago, IL',
        remote_type: 'On-site',
        job_type: 'Full-time',
        pipeline_stage: 'New Grad',
        salary_min: 150000,
        salary_max: 200000,
        posted_date: daysAgo(2),
        apply_url: 'https://www.citadel.com/careers/details/quantitative-research-analyst-full-time/',
        licenses_required: ['None Required'],
        description: 'Develop quantitative models and systematic trading strategies at one of the world\'s leading hedge funds. Apply advanced mathematics, statistics, and machine learning to financial data.',
      },
      {
        title: 'Trading Intern - Summer 2027',
        company_id: companyMap['Citadel'],
        category: 'Sales & Trading',
        location: 'Chicago, IL',
        remote_type: 'On-site',
        job_type: 'Internship',
        pipeline_stage: 'Junior Internship',
        salary_min: 120000,
        salary_max: 150000,
        posted_date: daysAgo(1),
        apply_url: 'https://www.citadel.com/careers/open-positions/students/',
        licenses_required: ['None Required'],
        description: 'Join Citadel\'s summer trading internship. Work alongside experienced portfolio managers and traders, analyze market dynamics, and develop trading strategies across asset classes.',
      },
      {
        title: 'Software Engineer Intern - Citadel Securities',
        company_id: companyMap['Citadel'],
        category: 'Operations',
        location: 'New York, NY',
        remote_type: 'On-site',
        job_type: 'Internship',
        pipeline_stage: 'Sophomore Internship',
        salary_min: 110000,
        salary_max: 140000,
        posted_date: daysAgo(3),
        apply_url: 'https://www.citadel.com/careers/open-positions/students/',
        licenses_required: ['None Required'],
        description: 'Build and optimize the technology that powers Citadel Securities\' market-making operations. Work on ultra-low latency systems, data pipelines, and trading infrastructure.',
      },
      // Two Sigma
      {
        title: 'Quantitative Research Intern',
        company_id: companyMap['Two Sigma'],
        category: 'Research',
        location: 'New York, NY',
        remote_type: 'On-site',
        job_type: 'Internship',
        pipeline_stage: 'Junior Internship',
        salary_min: 130000,
        salary_max: 170000,
        posted_date: daysAgo(4),
        apply_url: 'https://www.twosigma.com/careers',
        licenses_required: ['None Required'],
        description: 'Apply machine learning and statistical methods to financial datasets at Two Sigma. Develop predictive models, test hypotheses, and contribute to the firm\'s investment process.',
      },
      // More jobs at existing companies in underrepresented categories
      // Goldman Sachs - Insurance
      {
        title: 'Insurance Solutions Analyst',
        company_id: companyMap['Goldman Sachs'],
        category: 'Insurance',
        location: 'New York, NY',
        remote_type: 'On-site',
        job_type: 'Full-time',
        pipeline_stage: 'New Grad',
        salary_min: 85000,
        salary_max: 100000,
        posted_date: daysAgo(5),
        apply_url: 'https://higher.gs.com/roles/130810',
        licenses_required: ['None Required'],
        description: 'Join Goldman Sachs\' Insurance Solutions team. Analyze insurance company portfolios, develop risk transfer solutions, and support structured transactions involving insurance liabilities.',
      },
      // Deloitte - Financial Planning
      {
        title: 'Financial Advisory Consultant',
        company_id: companyMap['Deloitte'],
        category: 'Financial Planning',
        location: 'Chicago, IL',
        remote_type: 'Hybrid',
        job_type: 'Full-time',
        pipeline_stage: 'New Grad',
        salary_min: 72000,
        salary_max: 88000,
        posted_date: daysAgo(3),
        apply_url: 'https://apply.deloitte.com/careers',
        licenses_required: ['None Required'],
        description: 'Advise clients on financial planning, retirement strategy, and wealth optimization. Work with a team of financial advisors to deliver comprehensive planning solutions.',
      },
      // Morgan Stanley - Senior Internship
      {
        title: 'Wealth Management Senior Summer Analyst 2026',
        company_id: companyMap['Morgan Stanley'],
        category: 'Private Wealth',
        location: 'New York, NY',
        remote_type: 'On-site',
        job_type: 'Internship',
        pipeline_stage: 'Senior Internship',
        salary_min: 85000,
        salary_max: 95000,
        posted_date: daysAgo(2),
        apply_url: 'https://morganstanley.tal.net/vx/candidate/apply/17108',
        licenses_required: ['None Required'],
        description: 'Morgan Stanley\'s Senior Summer Analyst program in Wealth Management. Support financial advisors with client presentations, portfolio analysis, and investment research. For rising seniors graduating in 2026.',
      },
      // J.P. Morgan - Commercial Banking
      {
        title: 'Commercial Banking Analyst Program',
        company_id: companyMap['J.P. Morgan'],
        category: 'Commercial Banking',
        location: 'Chicago, IL',
        remote_type: 'On-site',
        job_type: 'Full-time',
        pipeline_stage: 'New Grad',
        salary_min: 75000,
        salary_max: 90000,
        posted_date: daysAgo(4),
        apply_url: 'https://jpmc.fa.oraclecloud.com/hcmUI/CandidateExperience/en/sites/CX_1001/jobs',
        licenses_required: ['None Required'],
        description: 'Join JPMorgan\'s Commercial Banking Analyst Program. Provide credit and lending solutions to middle-market companies. Rotate through relationship management, credit risk, and treasury services.',
      },
      // Bank of America - Financial Planning
      {
        title: 'Merrill Financial Solutions Advisor',
        company_id: companyMap['Bank of America'],
        category: 'Financial Planning',
        location: 'Charlotte, NC',
        remote_type: 'On-site',
        job_type: 'Full-time',
        pipeline_stage: 'No Experience Required',
        salary_min: 55000,
        salary_max: 75000,
        posted_date: daysAgo(6),
        apply_url: 'https://careers.bankofamerica.com/en-us',
        licenses_required: ['Series 7', 'Series 66'],
        description: 'Join Merrill\'s Financial Solutions Advisor program. Build a book of business by providing financial guidance to clients. Licensing sponsorship and comprehensive training provided.',
      },
      // Citi - Operations
      {
        title: 'Operations Analyst - Global Markets',
        company_id: companyMap['Citi'],
        category: 'Operations',
        location: 'New York, NY',
        remote_type: 'Hybrid',
        job_type: 'Full-time',
        pipeline_stage: 'New Grad',
        salary_min: 70000,
        salary_max: 85000,
        posted_date: daysAgo(5),
        apply_url: 'https://jobs.citi.com/search-jobs',
        licenses_required: ['None Required'],
        description: 'Support Citi\'s Global Markets operations including trade settlement, reconciliation, and risk management. Work with technology teams to optimize post-trade processes.',
      },
      // EY - Insurance
      {
        title: 'Actuarial Consultant - Insurance',
        company_id: companyMap['EY'],
        category: 'Insurance',
        location: 'Boston, MA',
        remote_type: 'Hybrid',
        job_type: 'Full-time',
        pipeline_stage: 'New Grad',
        salary_min: 75000,
        salary_max: 92000,
        posted_date: daysAgo(4),
        apply_url: 'https://eygbl.referrals.selectminds.com',
        licenses_required: ['None Required'],
        description: 'Join EY\'s Insurance Advisory practice. Perform actuarial analysis, reserve studies, and risk assessments for insurance company clients. Support for actuarial exam progression provided.',
      },
    ]

    // Insert jobs
    const jobsToInsert = newJobs
      .filter((j) => j.company_id)
      .map((j) => ({
        ...j,
        is_active: true,
        last_verified_at: new Date().toISOString(),
      }))

    let jobsAdded = 0
    const errors: string[] = []
    for (const job of jobsToInsert) {
      const { error } = await supabaseAdmin.from('jobs').insert(job)
      if (!error) jobsAdded++
      else errors.push(`${job.title}: ${error.message}`)
    }

    const { count } = await supabaseAdmin
      .from('jobs')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    return NextResponse.json({
      success: true,
      companiesAdded: Object.keys(companyMap).length,
      jobsAdded,
      totalActiveJobs: count,
      totalJobsAttempted: jobsToInsert.length,
      errors: errors.slice(0, 5),
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
