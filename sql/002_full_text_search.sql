-- =============================================================================
-- Full-Text Search (tsvector/tsquery) for jobs
-- =============================================================================
-- Replaces ILIKE '%pattern%' with proper Postgres FTS.
-- tsvector is 10-50x faster at scale and supports stemming, ranking, and
-- language-aware tokenization (e.g. "producing" matches "produce").
--
-- Run this AFTER 001_search_indexes.sql
-- =============================================================================

-- 1. Add a generated tsvector column that auto-updates on INSERT/UPDATE
--    Weighted: title (A) is most important, company via description (B), location (C)
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(location, '')), 'C')
  ) STORED;

-- 2. GIN index on the tsvector column for fast lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_search_vector
  ON jobs USING gin (search_vector);

-- 3. RPC function for ranked full-text search
--    Returns jobs matching the query with relevance ranking.
--    Falls back to ILIKE if the tsquery is invalid (e.g. single special chars).
CREATE OR REPLACE FUNCTION search_jobs_fts(
  search_query text,
  category_filter text DEFAULT NULL,
  location_filter text DEFAULT NULL,
  job_type_filter text DEFAULT NULL,
  pipeline_stage_filter text DEFAULT NULL,
  remote_type_filter text DEFAULT NULL,
  company_filter text DEFAULT NULL,
  salary_min_filter int DEFAULT NULL,
  salary_max_filter int DEFAULT NULL,
  result_limit int DEFAULT 200
)
RETURNS TABLE (
  id uuid,
  title text,
  category text,
  location text,
  remote_type text,
  job_type text,
  pipeline_stage text,
  salary_min int,
  salary_max int,
  posted_date timestamptz,
  apply_url text,
  source_url text,
  is_active boolean,
  description text,
  company_id uuid,
  grad_date_required boolean,
  grad_date_earliest date,
  grad_date_latest date,
  licenses_required jsonb,
  licenses_info text,
  years_experience_max int,
  removal_detected_at timestamptz,
  last_verified_at timestamptz,
  company_name text,
  company_website text,
  company_careers_url text,
  company_logo_url text,
  company_description text,
  relevance real
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  tsq tsquery;
BEGIN
  -- Build tsquery from user input (websearch_to_tsquery handles natural language)
  BEGIN
    tsq := websearch_to_tsquery('english', search_query);
  EXCEPTION WHEN OTHERS THEN
    -- Fallback: treat entire input as a phrase
    tsq := phraseto_tsquery('english', search_query);
  END;

  RETURN QUERY
  SELECT
    j.id,
    j.title,
    j.category,
    j.location,
    j.remote_type,
    j.job_type,
    j.pipeline_stage,
    j.salary_min,
    j.salary_max,
    j.posted_date,
    j.apply_url,
    j.source_url,
    j.is_active,
    j.description,
    j.company_id,
    j.grad_date_required,
    j.grad_date_earliest,
    j.grad_date_latest,
    j.licenses_required,
    j.licenses_info,
    j.years_experience_max,
    j.removal_detected_at,
    j.last_verified_at,
    c.name AS company_name,
    c.website AS company_website,
    c.careers_url AS company_careers_url,
    c.logo_url AS company_logo_url,
    c.description AS company_description,
    ts_rank_cd(j.search_vector, tsq, 32) AS relevance
  FROM jobs j
  LEFT JOIN companies c ON c.id = j.company_id
  WHERE j.is_active = true
    AND (
      j.search_vector @@ tsq
      OR c.name ILIKE '%' || search_query || '%'
    )
    AND (category_filter IS NULL OR j.category = category_filter)
    AND (location_filter IS NULL OR j.location ILIKE '%' || location_filter || '%')
    AND (job_type_filter IS NULL OR j.job_type = job_type_filter)
    AND (pipeline_stage_filter IS NULL OR j.pipeline_stage = pipeline_stage_filter)
    AND (remote_type_filter IS NULL OR j.remote_type = remote_type_filter)
    AND (company_filter IS NULL OR c.name = company_filter)
    AND (salary_min_filter IS NULL OR j.salary_max >= salary_min_filter)
    AND (salary_max_filter IS NULL OR j.salary_min <= salary_max_filter)
  ORDER BY relevance DESC, j.posted_date DESC
  LIMIT result_limit;
END;
$$;

-- =============================================================================
-- Similar Jobs RPC function (single round-trip instead of 2-3 queries)
-- =============================================================================
-- Scores candidates by: same category (+3), same stage (+5), same company (+2),
-- same remote type (+1), same job type (+1), same city (+2), salary proximity (+2/+1)

CREATE OR REPLACE FUNCTION get_similar_jobs(
  source_job_id uuid,
  max_results int DEFAULT 4,
  min_score int DEFAULT 2
)
RETURNS TABLE (
  id uuid,
  title text,
  category text,
  location text,
  remote_type text,
  job_type text,
  pipeline_stage text,
  salary_min int,
  salary_max int,
  posted_date timestamptz,
  company_id uuid,
  company_name text,
  company_logo_url text,
  company_website text,
  similarity_score int
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  src RECORD;
BEGIN
  -- Fetch source job attributes for scoring
  SELECT j.id, j.category, j.pipeline_stage, j.company_id,
         j.location, j.remote_type, j.job_type, j.salary_max
  INTO src
  FROM jobs j
  WHERE j.id = source_job_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  RETURN QUERY
  WITH scored AS (
    SELECT
      j.id,
      j.title,
      j.category,
      j.location,
      j.remote_type,
      j.job_type,
      j.pipeline_stage,
      j.salary_min,
      j.salary_max,
      j.posted_date,
      j.company_id,
      c.name AS company_name,
      c.logo_url AS company_logo_url,
      c.website AS company_website,
      (
        CASE WHEN j.pipeline_stage = src.pipeline_stage THEN 5 ELSE 0 END +
        CASE WHEN j.category = src.category THEN 3 ELSE 0 END +
        CASE WHEN j.company_id = src.company_id THEN 2 ELSE 0 END +
        CASE WHEN j.remote_type = src.remote_type THEN 1 ELSE 0 END +
        CASE WHEN j.job_type = src.job_type THEN 1 ELSE 0 END +
        CASE WHEN split_part(j.location, ',', 1) = split_part(src.location, ',', 1) THEN 2 ELSE 0 END +
        CASE
          WHEN src.salary_max > 0 AND j.salary_max > 0 AND
               abs(src.salary_max - j.salary_max)::float / GREATEST(src.salary_max, 1) <= 0.2 THEN 2
          WHEN src.salary_max > 0 AND j.salary_max > 0 AND
               abs(src.salary_max - j.salary_max)::float / GREATEST(src.salary_max, 1) <= 0.4 THEN 1
          ELSE 0
        END
      )::int AS similarity_score
    FROM jobs j
    LEFT JOIN companies c ON c.id = j.company_id
    WHERE j.is_active = true
      AND j.id != source_job_id
      AND (j.category = src.category OR j.pipeline_stage = src.pipeline_stage)
  )
  SELECT s.id, s.title, s.category, s.location, s.remote_type,
         s.job_type, s.pipeline_stage, s.salary_min, s.salary_max,
         s.posted_date, s.company_id, s.company_name, s.company_logo_url,
         s.company_website, s.similarity_score
  FROM scored s
  WHERE s.similarity_score >= min_score
  ORDER BY s.similarity_score DESC, s.posted_date DESC
  LIMIT max_results;
END;
$$;
