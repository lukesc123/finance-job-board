-- =============================================================================
-- RLS Policy Optimizations
-- =============================================================================
-- Key optimization: wrap auth.uid() in a subselect so Postgres evaluates it
-- once per statement instead of once per row. This can yield 10-100x speedup
-- on large tables.
--
-- IMPORTANT: Review these against your actual RLS policies before running.
-- The patterns below show the optimized form. Adjust table/policy names to match.
-- =============================================================================

-- Example: If you have a policy like this on user_applications:
--   CREATE POLICY "Users can view own applications" ON user_applications
--     FOR SELECT USING (user_id = auth.uid());
--
-- Replace with the optimized version:
--   DROP POLICY IF EXISTS "Users can view own applications" ON user_applications;
--   CREATE POLICY "Users can view own applications" ON user_applications
--     FOR SELECT USING (user_id = (SELECT auth.uid()));

-- Template for all user-scoped tables:
-- Uncomment and adjust for your actual policy names.

-- user_applications
-- DROP POLICY IF EXISTS "Users can view own applications" ON user_applications;
-- CREATE POLICY "Users can view own applications" ON user_applications
--   FOR ALL TO authenticated
--   USING (user_id = (SELECT auth.uid()))
--   WITH CHECK (user_id = (SELECT auth.uid()));

-- user_preferences
-- DROP POLICY IF EXISTS "Users can manage own preferences" ON user_preferences;
-- CREATE POLICY "Users can manage own preferences" ON user_preferences
--   FOR ALL TO authenticated
--   USING (user_id = (SELECT auth.uid()))
--   WITH CHECK (user_id = (SELECT auth.uid()));

-- =============================================================================
-- Performance-critical indexes for RLS lookups
-- =============================================================================
-- These ensure the user_id filter in RLS policies uses an index scan, not seq scan.

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_applications_user_id
  ON user_applications (user_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_preferences_user_id
  ON user_preferences (user_id);

-- =============================================================================
-- Grant execute on RPC functions to authenticated and anon roles
-- =============================================================================
GRANT EXECUTE ON FUNCTION search_jobs_fts TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_similar_jobs TO anon, authenticated;
