-- Performance indexes for search, filtering, and autocomplete
-- Run against your Supabase project via the SQL editor or CLI
-- These are idempotent (IF NOT EXISTS) so safe to re-run

-- =============================================================================
-- 1. TRIGRAM INDEXES for ILIKE search (requires pg_trgm extension)
-- =============================================================================
-- The search API uses ILIKE '%pattern%' on title, description, location.
-- Without trigram indexes, Postgres does full sequential scans on every search.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Title search: most frequent search target, moderate column size
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_title_trgm
  ON jobs USING gin (title gin_trgm_ops);

-- Description search: large text column, GIN trigram helps immensely
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_description_trgm
  ON jobs USING gin (description gin_trgm_ops);

-- Location search: used by both main search and location filter
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_location_trgm
  ON jobs USING gin (location gin_trgm_ops);

-- Company name search (for autocomplete suggestions and company name matching)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_companies_name_trgm
  ON companies USING gin (name gin_trgm_ops);

-- =============================================================================
-- 2. B-TREE INDEXES for exact-match filters
-- =============================================================================
-- These support the common filter parameters: category, job_type, pipeline_stage, etc.

-- Composite index for the most common query pattern:
-- active jobs ordered by posted_date (covers the base query + ORDER BY)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_active_posted
  ON jobs (is_active, posted_date DESC)
  WHERE is_active = true;

-- Category filter (frequently used standalone)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_category_active
  ON jobs (category, posted_date DESC)
  WHERE is_active = true;

-- Pipeline stage filter (used by similar-jobs and main filter)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_stage_active
  ON jobs (pipeline_stage, posted_date DESC)
  WHERE is_active = true;

-- Company ID lookup (used by company page, search company-name matching)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_company_id
  ON jobs (company_id);

-- Remote type filter
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_remote_type_active
  ON jobs (remote_type, posted_date DESC)
  WHERE is_active = true;

-- Job type filter
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_job_type_active
  ON jobs (job_type, posted_date DESC)
  WHERE is_active = true;

-- =============================================================================
-- 3. SALARY RANGE INDEXES
-- =============================================================================
-- Salary filter uses: salary_max >= threshold AND salary_min <= threshold

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_salary_max
  ON jobs (salary_max)
  WHERE is_active = true AND salary_max IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_salary_min
  ON jobs (salary_min)
  WHERE is_active = true AND salary_min IS NOT NULL;

-- =============================================================================
-- 4. JSONB INDEX for license filter
-- =============================================================================
-- The licenses_required column is JSONB array, filtered with @> (contains)

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_licenses_gin
  ON jobs USING gin (licenses_required);

-- =============================================================================
-- 5. USER APPLICATION INDEXES (tracker)
-- =============================================================================

-- Fast lookup by user (the most common query)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_applications_user_date
  ON user_applications (user_id, applied_date DESC);

-- =============================================================================
-- 6. COMPANIES sort index
-- =============================================================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_companies_name_asc
  ON companies (name ASC);
