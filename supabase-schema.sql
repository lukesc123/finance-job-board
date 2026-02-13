-- Finance Job Board v2 Schema
-- Drop old tables first
DROP TABLE IF EXISTS jobs CASCADE;
DROP TABLE IF EXISTS companies CASCADE;

-- Companies table
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  website TEXT NOT NULL,
  careers_url TEXT NOT NULL,
  logo_url TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Jobs table
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  location TEXT NOT NULL,
  remote_type TEXT NOT NULL DEFAULT 'On-site',
  salary_min INTEGER,
  salary_max INTEGER,
  job_type TEXT NOT NULL,
  pipeline_stage TEXT NOT NULL,
  description TEXT NOT NULL,
  apply_url TEXT NOT NULL,
  source_url TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  is_verified BOOLEAN DEFAULT TRUE,

  -- graduation / eligibility
  grad_date_required BOOLEAN DEFAULT FALSE,
  grad_date_earliest DATE,
  grad_date_latest DATE,
  years_experience_max INTEGER, -- null = not specified, 0 = truly no experience

  -- licensing (stored as JSONB)
  licenses_required JSONB DEFAULT '[]'::jsonb,
  licenses_info JSONB,

  -- monitoring
  posted_date TIMESTAMPTZ DEFAULT NOW(),
  last_verified_at TIMESTAMPTZ DEFAULT NOW(),
  removal_detected_at TIMESTAMPTZ,
  verification_count INTEGER DEFAULT 1,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_jobs_category ON jobs(category);
CREATE INDEX idx_jobs_location ON jobs(location);
CREATE INDEX idx_jobs_job_type ON jobs(job_type);
CREATE INDEX idx_jobs_pipeline_stage ON jobs(pipeline_stage);
CREATE INDEX idx_jobs_remote_type ON jobs(remote_type);
CREATE INDEX idx_jobs_is_active ON jobs(is_active);
CREATE INDEX idx_jobs_posted_date ON jobs(posted_date DESC);
CREATE INDEX idx_jobs_company_id ON jobs(company_id);
CREATE INDEX idx_jobs_last_verified ON jobs(last_verified_at);
CREATE INDEX idx_jobs_licenses ON jobs USING GIN (licenses_required);

-- RLS Policies
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read companies" ON companies
  FOR SELECT USING (true);

CREATE POLICY "Public can read active jobs" ON jobs
  FOR SELECT USING (is_active = true);

CREATE POLICY "Service role full access companies" ON companies
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access jobs" ON jobs
  FOR ALL USING (auth.role() = 'service_role');
