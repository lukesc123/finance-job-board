-- Finance Job Board Seed Data
-- 10 Companies and 18 Jobs with realistic requirements and licensing information
-- Run this in Supabase SQL Editor after creating the tables

-- Companies
INSERT INTO companies (id, name, website, careers_url, description) VALUES
  ('a1b2c3d4-0001-4000-8000-000000000001', 'Goldman Sachs', 'goldmansachs.com', 'goldmansachs.com/careers', 'Leading global investment banking and financial services firm'),
  ('a1b2c3d4-0002-4000-8000-000000000002', 'J.P. Morgan', 'jpmorgan.com', 'careers.jpmorgan.com', 'Multinational investment bank and financial services company'),
  ('a1b2c3d4-0003-4000-8000-000000000003', 'Morgan Stanley', 'morganstanley.com', 'morganstanley.com/careers', 'Diversified financial services firm'),
  ('a1b2c3d4-0004-4000-8000-000000000004', 'Deloitte', 'deloitte.com', 'apply.deloitte.com', 'Professional services firm with global reach'),
  ('a1b2c3d4-0005-4000-8000-000000000005', 'PwC', 'pwc.com', 'pwc.com/us/en/careers', 'Professional services and consulting firm'),
  ('a1b2c3d4-0006-4000-8000-000000000006', 'Blackstone', 'blackstone.com', 'blackstone.com/careers', 'Leading global asset management and investment firm'),
  ('a1b2c3d4-0007-4000-8000-000000000007', 'Lazard', 'lazard.com', 'lazard.com/careers', 'Financial advisory and asset management firm'),
  ('a1b2c3d4-0008-4000-8000-000000000008', 'EY', 'ey.com', 'ey.com/en_us/careers', 'Professional services and consulting firm'),
  ('a1b2c3d4-0009-4000-8000-000000000009', 'Evercore', 'evercore.com', 'evercore.com/careers', 'Investment banking and wealth management firm'),
  ('a1b2c3d4-0010-4000-8000-000000000010', 'KKR', 'kkr.com', 'kkr.com/careers', 'Global investment firm specializing in private equity');

-- Jobs

-- 1. Investment Banking Analyst - Goldman Sachs (New Grad)
INSERT INTO jobs (id, company_id, title, category, location, remote_type, salary_min, salary_max, job_type, pipeline_stage, description, apply_url, source_url, grad_date_required, grad_date_earliest, grad_date_latest, years_experience_max, licenses_required, licenses_info)
VALUES (
  'b1c2d3e4-0001-4000-8000-000000000001',
  'a1b2c3d4-0001-4000-8000-000000000001',
  'Analyst, Investment Banking Division',
  'Investment Banking',
  'New York, NY',
  'On-site',
  95000,
  105000,
  'Full-time',
  'New Grad',
  'Join our Investment Banking Division as an Analyst. You will work on M&A transactions, leveraged finance, and capital markets deals. Develop financial modeling skills and work with senior bankers on client-facing projects.',
  'goldmansachs.com/careers/jobs/analyst-investment-banking',
  'goldmansachs.com/careers/jobs/analyst-investment-banking',
  true,
  '2025-05-01'::date,
  '2025-12-31'::date,
  0,
  '["Series 7"]'::jsonb,
  '{"study_time_days": 30, "pass_deadline_days": 60, "max_attempts": 3, "prep_materials_paid": true, "notes": "Firm provides Series 7 study materials and exam scheduling"}'::jsonb
);

-- 2. Investment Banking Summer Internship - Goldman Sachs (Sophomore)
INSERT INTO jobs (id, company_id, title, category, location, remote_type, salary_min, salary_max, job_type, pipeline_stage, description, apply_url, source_url, grad_date_required, grad_date_earliest, grad_date_latest, years_experience_max, licenses_required, licenses_info)
VALUES (
  'b1c2d3e4-0002-4000-8000-000000000001',
  'a1b2c3d4-0001-4000-8000-000000000001',
  'Summer Analyst - Investment Banking',
  'Investment Banking',
  'New York, NY',
  'On-site',
  25000,
  28000,
  'Internship',
  'Sophomore Internship',
  'A 10-week summer internship in our Investment Banking Division. Build financial models, research companies, and support senior bankers on live transactions. Open to college sophomores.',
  'goldmansachs.com/careers/jobs/summer-analyst-ib',
  'goldmansachs.com/careers/jobs/summer-analyst-ib',
  false,
  null,
  null,
  null,
  '["None Required"]'::jsonb,
  null
);

-- 3. Global Markets Analyst - J.P. Morgan (No Experience)
INSERT INTO jobs (id, company_id, title, category, location, remote_type, salary_min, salary_max, job_type, pipeline_stage, description, apply_url, source_url, grad_date_required, grad_date_earliest, grad_date_latest, years_experience_max, licenses_required, licenses_info)
VALUES (
  'b1c2d3e4-0003-4000-8000-000000000002',
  'a1b2c3d4-0002-4000-8000-000000000002',
  'Analyst, Global Markets',
  'Sales & Trading',
  'New York, NY',
  'On-site',
  90000,
  110000,
  'Full-time',
  'No Experience Required',
  'Join our Global Markets division as a trading analyst. Support traders in equities, fixed income, currencies, and commodities. Learn real-time market dynamics and risk management.',
  'careers.jpmorgan.com/analyst-global-markets',
  'careers.jpmorgan.com/analyst-global-markets',
  true,
  '2025-06-01'::date,
  '2026-06-30'::date,
  0,
  '["Series 7", "Series 63"]'::jsonb,
  '{"study_time_days": 45, "pass_deadline_days": 90, "max_attempts": 3, "prep_materials_paid": true, "notes": "Both exams covered under firm training program"}'::jsonb
);

-- 4. Private Equity Analyst - Blackstone (New Grad)
INSERT INTO jobs (id, company_id, title, category, location, remote_type, salary_min, salary_max, job_type, pipeline_stage, description, apply_url, source_url, grad_date_required, grad_date_earliest, grad_date_latest, years_experience_max, licenses_required, licenses_info)
VALUES (
  'b1c2d3e4-0004-4000-8000-000000000003',
  'a1b2c3d4-0006-4000-8000-000000000006',
  'Analyst, Private Equity',
  'Private Equity',
  'New York, NY',
  'On-site',
  120000,
  140000,
  'Full-time',
  'New Grad',
  'Launch your PE career with Blackstone. Work on portfolio company valuations, due diligence, and value creation initiatives. Direct exposure to senior investment professionals.',
  'blackstone.com/careers/analyst-pe',
  'blackstone.com/careers/analyst-pe',
  true,
  '2025-05-01'::date,
  '2025-12-31'::date,
  0,
  '["Series 79"]'::jsonb,
  '{"study_time_days": 60, "pass_deadline_days": 120, "max_attempts": 3, "prep_materials_paid": true, "notes": "Required for investment banking and securities analysis roles"}'::jsonb
);

-- 5. Venture Capital Associate - KKR (Entry Level)
INSERT INTO jobs (id, company_id, title, category, location, remote_type, salary_min, salary_max, job_type, pipeline_stage, description, apply_url, source_url, grad_date_required, grad_date_earliest, grad_date_latest, years_experience_max, licenses_required, licenses_info)
VALUES (
  'b1c2d3e4-0005-4000-8000-000000000004',
  'a1b2c3d4-0010-4000-8000-000000000010',
  'Associate, Venture Capital',
  'Venture Capital',
  'San Francisco, CA',
  'On-site',
  110000,
  130000,
  'Full-time',
  'Early Career',
  'Join KKR''s VC team investing in growth-stage technology and healthcare companies. Source deals, conduct diligence, and monitor portfolio companies.',
  'kkr.com/careers/vc-associate',
  'kkr.com/careers/vc-associate',
  true,
  '2025-06-01'::date,
  '2026-06-30'::date,
  2,
  '["None Required"]'::jsonb,
  null
);

-- 6. Senior Auditor - Deloitte (No Experience)
INSERT INTO jobs (id, company_id, title, category, location, remote_type, salary_min, salary_max, job_type, pipeline_stage, description, apply_url, source_url, grad_date_required, grad_date_earliest, grad_date_latest, years_experience_max, licenses_required, licenses_info)
VALUES (
  'b1c2d3e4-0006-4000-8000-000000000005',
  'a1b2c3d4-0004-4000-8000-000000000004',
  'Senior Auditor',
  'Accounting',
  'Chicago, IL',
  'Hybrid',
  80000,
  95000,
  'Full-time',
  'No Experience Required',
  'Begin your audit career at Deloitte. Conduct financial statement audits for public and private companies. Work with experienced partners and learn audit methodologies.',
  'apply.deloitte.com/senior-auditor',
  'apply.deloitte.com/senior-auditor',
  true,
  '2025-05-01'::date,
  '2025-12-31'::date,
  0,
  '["CPA Track"]'::jsonb,
  '{"study_time_days": 300, "pass_deadline_days": 365, "max_attempts": 99, "prep_materials_paid": false, "notes": "CPA exam required within 2 years of hire. Firm offers study resources and exam fee reimbursement"}'::jsonb
);

-- 7. Senior Associate, Assurance - PwC (No Experience)
INSERT INTO jobs (id, company_id, title, category, location, remote_type, salary_min, salary_max, job_type, pipeline_stage, description, apply_url, source_url, grad_date_required, grad_date_earliest, grad_date_latest, years_experience_max, licenses_required, licenses_info)
VALUES (
  'b1c2d3e4-0007-4000-8000-000000000006',
  'a1b2c3d4-0005-4000-8000-000000000005',
  'Senior Associate, Assurance',
  'Accounting',
  'Miami, FL',
  'Hybrid',
  82000,
  98000,
  'Full-time',
  'No Experience Required',
  'Join PwC''s Assurance practice. Audit financial statements for clients across various industries. Develop technical accounting skills and client relationship management.',
  'pwc.com/us/en/careers/senior-associate-assurance',
  'pwc.com/us/en/careers/senior-associate-assurance',
  true,
  '2025-05-01'::date,
  '2025-12-31'::date,
  0,
  '["CPA Track"]'::jsonb,
  '{"study_time_days": 300, "pass_deadline_days": 365, "max_attempts": 99, "prep_materials_paid": true, "notes": "CPA exam expected within 18 months. Firm covers study materials and exam fees"}'::jsonb
);

-- 8. Consultant, Advisory Services - EY (New Grad)
INSERT INTO jobs (id, company_id, title, category, location, remote_type, salary_min, salary_max, job_type, pipeline_stage, description, apply_url, source_url, grad_date_required, grad_date_earliest, grad_date_latest, years_experience_max, licenses_required, licenses_info)
VALUES (
  'b1c2d3e4-0008-4000-8000-000000000007',
  'a1b2c3d4-0008-4000-8000-000000000008',
  'Consultant, Advisory Services',
  'Consulting',
  'Charlotte, NC',
  'Hybrid',
  85000,
  100000,
  'Full-time',
  'New Grad',
  'Begin your consulting career at EY. Work on business transformation and financial advisory projects for Fortune 500 clients. Develop strategic thinking and analytical skills.',
  'ey.com/en_us/careers/consultant-advisory',
  'ey.com/en_us/careers/consultant-advisory',
  true,
  '2025-05-01'::date,
  '2025-12-31'::date,
  0,
  '["None Required"]'::jsonb,
  null
);

-- 9. Financial Advisor - Morgan Stanley (No Experience)
INSERT INTO jobs (id, company_id, title, category, location, remote_type, salary_min, salary_max, job_type, pipeline_stage, description, apply_url, source_url, grad_date_required, grad_date_earliest, grad_date_latest, years_experience_max, licenses_required, licenses_info)
VALUES (
  'b1c2d3e4-0009-4000-8000-000000000008',
  'a1b2c3d4-0003-4000-8000-000000000003',
  'Financial Advisor',
  'Private Wealth',
  'New York, NY',
  'Hybrid',
  75000,
  95000,
  'Full-time',
  'No Experience Required',
  'Launch a career in wealth management. Manage client portfolios, provide investment advice, and build client relationships. Comprehensive training program provided.',
  'morganstanley.com/careers/financial-advisor',
  'morganstanley.com/careers/financial-advisor',
  true,
  '2025-06-01'::date,
  '2026-06-30'::date,
  0,
  '["Series 7", "Series 66"]'::jsonb,
  '{"study_time_days": 90, "pass_deadline_days": 120, "max_attempts": 3, "prep_materials_paid": true, "notes": "Kaplan study materials and exam fees provided by firm. Both exams must be passed within first year"}'::jsonb
);

-- 10. Analyst, Corporate Banking - Evercore (No Experience)
INSERT INTO jobs (id, company_id, title, category, location, remote_type, salary_min, salary_max, job_type, pipeline_stage, description, apply_url, source_url, grad_date_required, grad_date_earliest, grad_date_latest, years_experience_max, licenses_required, licenses_info)
VALUES (
  'b1c2d3e4-0010-4000-8000-000000000009',
  'a1b2c3d4-0009-4000-8000-000000000009',
  'Analyst, Corporate Banking',
  'Investment Banking',
  'New York, NY',
  'On-site',
  92000,
  108000,
  'Full-time',
  'No Experience Required',
  'Work with Evercore''s Corporate Banking team on lending and financial advisory services. Support origination, structuring, and execution of credit facilities.',
  'evercore.com/careers/analyst-corporate-banking',
  'evercore.com/careers/analyst-corporate-banking',
  true,
  '2025-05-01'::date,
  '2025-12-31'::date,
  0,
  '["Series 7"]'::jsonb,
  '{"study_time_days": 30, "pass_deadline_days": 60, "max_attempts": 3, "prep_materials_paid": true, "notes": "Firm provides study materials and scheduling support"}'::jsonb
);

-- 11. Summer Analyst - Investment Banking - Morgan Stanley (Junior Internship)
INSERT INTO jobs (id, company_id, title, category, location, remote_type, salary_min, salary_max, job_type, pipeline_stage, description, apply_url, source_url, grad_date_required, grad_date_earliest, grad_date_latest, years_experience_max, licenses_required, licenses_info)
VALUES (
  'b1c2d3e4-0011-4000-8000-000000000010',
  'a1b2c3d4-0003-4000-8000-000000000003',
  'Summer Analyst - Investment Banking',
  'Investment Banking',
  'San Francisco, CA',
  'On-site',
  26000,
  29000,
  'Internship',
  'Junior Internship',
  'A 10-week summer internship for college juniors in our Investment Banking Division. Hands-on experience with financial modeling and M&A transactions.',
  'morganstanley.com/careers/summer-analyst-ib',
  'morganstanley.com/careers/summer-analyst-ib',
  false,
  null,
  null,
  null,
  '["None Required"]'::jsonb,
  null
);

-- 12. Analyst, Equity Research - Lazard (New Grad)
INSERT INTO jobs (id, company_id, title, category, location, remote_type, salary_min, salary_max, job_type, pipeline_stage, description, apply_url, source_url, grad_date_required, grad_date_earliest, grad_date_latest, years_experience_max, licenses_required, licenses_info)
VALUES (
  'b1c2d3e4-0012-4000-8000-000000000011',
  'a1b2c3d4-0007-4000-8000-000000000007',
  'Analyst, Equity Research',
  'Research',
  'New York, NY',
  'On-site',
  98000,
  115000,
  'Full-time',
  'New Grad',
  'Join Lazard''s Equity Research team. Analyze companies and industries, create financial models, and publish research reports. Direct exposure to portfolio managers.',
  'lazard.com/careers/analyst-equity-research',
  'lazard.com/careers/analyst-equity-research',
  true,
  '2025-05-01'::date,
  '2025-12-31'::date,
  0,
  '["Series 7"]'::jsonb,
  '{"study_time_days": 35, "pass_deadline_days": 75, "max_attempts": 3, "prep_materials_paid": true, "notes": "Exam support and materials provided"}'::jsonb
);

-- 13. Analyst, Corporate Finance - J.P. Morgan (No Experience)
INSERT INTO jobs (id, company_id, title, category, location, remote_type, salary_min, salary_max, job_type, pipeline_stage, description, apply_url, source_url, grad_date_required, grad_date_earliest, grad_date_latest, years_experience_max, licenses_required, licenses_info)
VALUES (
  'b1c2d3e4-0013-4000-8000-000000000012',
  'a1b2c3d4-0002-4000-8000-000000000002',
  'Analyst, Corporate Finance',
  'Corporate Finance',
  'Chicago, IL',
  'Hybrid',
  88000,
  105000,
  'Full-time',
  'No Experience Required',
  'Support JPMorgan''s corporate finance team. Work on capital structure optimization, financial planning, and strategic initiatives for corporate clients.',
  'careers.jpmorgan.com/analyst-corporate-finance',
  'careers.jpmorgan.com/analyst-corporate-finance',
  true,
  '2025-06-01'::date,
  '2026-06-30'::date,
  0,
  '["None Required"]'::jsonb,
  null
);

-- 14. Summer Analyst - Sales & Trading - Goldman Sachs (Sophomore Internship)
INSERT INTO jobs (id, company_id, title, category, location, remote_type, salary_min, salary_max, job_type, pipeline_stage, description, apply_url, source_url, grad_date_required, grad_date_earliest, grad_date_latest, years_experience_max, licenses_required, licenses_info)
VALUES (
  'b1c2d3e4-0014-4000-8000-000000000013',
  'a1b2c3d4-0001-4000-8000-000000000001',
  'Summer Analyst - Sales & Trading',
  'Sales & Trading',
  'New York, NY',
  'On-site',
  24000,
  27000,
  'Internship',
  'Sophomore Internship',
  'Immerse yourself in global markets. Work with traders and salespeople across equities, fixed income, and derivatives. Build trading intuition and market knowledge.',
  'goldmansachs.com/careers/summer-analyst-st',
  'goldmansachs.com/careers/summer-analyst-st',
  false,
  null,
  null,
  null,
  '["None Required"]'::jsonb,
  null
);

-- 15. Analyst, Risk Management - Blackstone (No Experience)
INSERT INTO jobs (id, company_id, title, category, location, remote_type, salary_min, salary_max, job_type, pipeline_stage, description, apply_url, source_url, grad_date_required, grad_date_earliest, grad_date_latest, years_experience_max, licenses_required, licenses_info)
VALUES (
  'b1c2d3e4-0015-4000-8000-000000000014',
  'a1b2c3d4-0006-4000-8000-000000000006',
  'Analyst, Risk Management',
  'Risk Management',
  'Miami, FL',
  'Remote',
  86000,
  102000,
  'Full-time',
  'No Experience Required',
  'Protect Blackstone''s portfolio companies. Identify, assess, and mitigate operational and financial risks. Develop data analysis and risk modeling skills.',
  'blackstone.com/careers/analyst-risk',
  'blackstone.com/careers/analyst-risk',
  true,
  '2025-05-01'::date,
  '2025-12-31'::date,
  0,
  '["None Required"]'::jsonb,
  null
);

-- 16. Tax Consultant - PwC (New Grad)
INSERT INTO jobs (id, company_id, title, category, location, remote_type, salary_min, salary_max, job_type, pipeline_stage, description, apply_url, source_url, grad_date_required, grad_date_earliest, grad_date_latest, years_experience_max, licenses_required, licenses_info)
VALUES (
  'b1c2d3e4-0016-4000-8000-000000000015',
  'a1b2c3d4-0005-4000-8000-000000000005',
  'Tax Consultant',
  'Accounting',
  'Charlotte, NC',
  'Hybrid',
  79000,
  93000,
  'Full-time',
  'New Grad',
  'Join PwC''s Tax practice. Provide tax advisory and compliance services to corporate clients. Learn federal, state, and international tax issues.',
  'pwc.com/us/en/careers/tax-consultant',
  'pwc.com/us/en/careers/tax-consultant',
  true,
  '2025-05-01'::date,
  '2025-12-31'::date,
  0,
  '["CPA Track"]'::jsonb,
  '{"study_time_days": 300, "pass_deadline_days": 365, "max_attempts": 99, "prep_materials_paid": true, "notes": "CPA exam expected within 2 years. Study materials and exam fees covered by firm"}'::jsonb
);

-- 17. Analyst, Financial Planning & Analysis - EY (No Experience)
INSERT INTO jobs (id, company_id, title, category, location, remote_type, salary_min, salary_max, job_type, pipeline_stage, description, apply_url, source_url, grad_date_required, grad_date_earliest, grad_date_latest, years_experience_max, licenses_required, licenses_info)
VALUES (
  'b1c2d3e4-0017-4000-8000-000000000016',
  'a1b2c3d4-0008-4000-8000-000000000008',
  'Analyst, Financial Planning & Analysis',
  'Corporate Finance',
  'San Francisco, CA',
  'Remote',
  81000,
  97000,
  'Full-time',
  'No Experience Required',
  'Support client FP&A operations. Build financial models, forecasts, and dashboards. Partner with business leaders on strategic financial decisions.',
  'ey.com/en_us/careers/analyst-fpa',
  'ey.com/en_us/careers/analyst-fpa',
  true,
  '2025-06-01'::date,
  '2026-06-30'::date,
  0,
  '["None Required"]'::jsonb,
  null
);

-- 18. Analyst, Investment Operations - Evercore (No Experience)
INSERT INTO jobs (id, company_id, title, category, location, remote_type, salary_min, salary_max, job_type, pipeline_stage, description, apply_url, source_url, grad_date_required, grad_date_earliest, grad_date_latest, years_experience_max, licenses_required, licenses_info)
VALUES (
  'b1c2d3e4-0018-4000-8000-000000000017',
  'a1b2c3d4-0009-4000-8000-000000000009',
  'Analyst, Investment Operations',
  'Operations',
  'Chicago, IL',
  'Hybrid',
  77000,
  91000,
  'Full-time',
  'No Experience Required',
  'Ensure smooth operations of Evercore''s investment teams. Process trades, manage settlements, and maintain compliance. Work with systems and data.',
  'evercore.com/careers/analyst-operations',
  'evercore.com/careers/analyst-operations',
  true,
  '2025-05-01'::date,
  '2025-12-31'::date,
  0,
  '["None Required"]'::jsonb,
  null
);

-- 19. Summer Consulting Intern - Deloitte (Junior Internship)
INSERT INTO jobs (id, company_id, title, category, location, remote_type, salary_min, salary_max, job_type, pipeline_stage, description, apply_url, source_url, grad_date_required, grad_date_earliest, grad_date_latest, years_experience_max, licenses_required, licenses_info)
VALUES (
  'b1c2d3e4-0019-4000-8000-000000000018',
  'a1b2c3d4-0004-4000-8000-000000000004',
  'Summer Consulting Intern',
  'Consulting',
  'New York, NY',
  'On-site',
  20000,
  23000,
  'Internship',
  'Junior Internship',
  'Gain consulting experience at Deloitte. Work on client projects, build case study skills, and network with leaders. Open to college juniors.',
  'apply.deloitte.com/summer-consulting-intern',
  'apply.deloitte.com/summer-consulting-intern',
  false,
  null,
  null,
  null,
  '["None Required"]'::jsonb,
  null
);
