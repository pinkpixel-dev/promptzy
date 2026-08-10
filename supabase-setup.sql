-- Promptzy - Supabase setup
-- Run this in your Supabase project's SQL Editor.
--
-- This script gives the prompts table ownership-scoped Row Level Security.
-- Every policy checks auth.uid() against the row's user_id, so the database
-- enforces ownership on its own. The app's query filters are a convenience,
-- not the security boundary. Holding the anon key alone gets you nothing.
--
-- Upgrading from Promptzy 1.x? Section 8 re-points your existing prompts at
-- your new account. Read it before you run this.

-- ============================================================================
-- 1. CREATE THE PROMPTS TABLE (if it doesn't exist)
-- ============================================================================

CREATE TABLE IF NOT EXISTS prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  createdat TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  title TEXT,
  category TEXT DEFAULT 'task',
  description TEXT DEFAULT '',
  user_id TEXT NOT NULL,
  ispublic BOOLEAN DEFAULT false,
  likes INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0
);

-- ============================================================================
-- 2. ADD MISSING COLUMNS (if your table already exists)
-- ============================================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'prompts' AND column_name = 'user_id') THEN
        ALTER TABLE prompts ADD COLUMN user_id TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'prompts' AND column_name = 'title') THEN
        ALTER TABLE prompts ADD COLUMN title TEXT;
        UPDATE prompts SET title = LEFT(content, 50) WHERE title IS NULL;
    END IF;
END $$;

-- Note: user_id stays TEXT rather than UUID on purpose. Installs upgrading from
-- 1.x hold non-UUID values such as 'legacy-user' or 'anon-1730...' , and a type
-- change would fail on those rows before you had a chance to migrate them.
-- The policies below cast auth.uid() to text for the comparison instead.

-- ============================================================================
-- 3. INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_prompts_user_id ON prompts(user_id);
CREATE INDEX IF NOT EXISTS idx_prompts_createdat ON prompts(createdat);
CREATE INDEX IF NOT EXISTS idx_prompts_tags ON prompts USING GIN(tags);

-- ============================================================================
-- 4. ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 5. DROP OLD POLICIES
-- ============================================================================
-- "Allow all operations for now" is the permissive policy shipped by Promptzy
-- 1.x. It allowed every operation for anyone holding the anon key. Dropping it
-- is the single most important line in this script.

DROP POLICY IF EXISTS "Allow all operations for now" ON prompts;
DROP POLICY IF EXISTS "Allow all access" ON prompts;
DROP POLICY IF EXISTS "Temporary allow all" ON prompts;
DROP POLICY IF EXISTS "Users can view their own prompts" ON prompts;
DROP POLICY IF EXISTS "Users can insert their own prompts" ON prompts;
DROP POLICY IF EXISTS "Users can update their own prompts" ON prompts;
DROP POLICY IF EXISTS "Users can delete their own prompts" ON prompts;

-- ============================================================================
-- 6. OWNERSHIP-SCOPED POLICIES
-- ============================================================================
-- One policy per operation, each restricted to the `authenticated` role.
-- The `anon` role is granted nothing, so an unauthenticated caller holding the
-- public anon key sees an empty table and cannot write to it.
--
-- USING controls which existing rows an operation may touch.
-- WITH CHECK controls what the resulting row is allowed to look like, which is
-- what stops someone writing a row owned by somebody else.

CREATE POLICY "Users can view their own prompts"
  ON prompts FOR SELECT
  TO authenticated
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own prompts"
  ON prompts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own prompts"
  ON prompts FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own prompts"
  ON prompts FOR DELETE
  TO authenticated
  USING (auth.uid()::text = user_id);

-- ============================================================================
-- 7. REVOKE ANON ACCESS
-- ============================================================================
-- Belt and braces. The policies above already exclude `anon`, but revoking the
-- table grant means an anon request is refused before RLS is even consulted.

REVOKE ALL ON prompts FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON prompts TO authenticated;

-- ============================================================================
-- 8. MIGRATING FROM PROMPTZY 1.x  (optional, read first)
-- ============================================================================
-- 1.x identified you by a free-form string: either a custom user ID you typed
-- in Settings, or a generated 'anon-...' value. 2.0 uses your Supabase Auth
-- user id. Your existing rows still carry the old string, so after the upgrade
-- they will not match any account and will not show up.
--
-- To claim them:
--   a) Open Promptzy, run through the setup screen, and create your account.
--   b) Come back here and run the block below with your own email filled in.
--
-- Look at what you have first:
--
--   SELECT user_id, COUNT(*) FROM prompts GROUP BY user_id;
--
-- Then claim every existing prompt for your new account:
--
--   UPDATE prompts
--   SET user_id = (SELECT id::text FROM auth.users WHERE email = 'you@example.com')
--   WHERE user_id = 'the-old-value-you-saw-above';
--
-- If more than one person's prompts share this table, migrate them one
-- old-value-to-one-account at a time. Do not run a blanket UPDATE.

-- ============================================================================
-- 9. VERIFY
-- ============================================================================

-- Confirm RLS is on
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'prompts';

-- Confirm exactly the four ownership policies exist, each scoped to
-- `authenticated`, with the auth.uid() check in `qual` and/or `with_check`.
SELECT policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE tablename = 'prompts'
ORDER BY cmd;

-- Confirm anon holds no privileges on the table. This should return no rows.
SELECT grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_name = 'prompts' AND grantee = 'anon';
