/*
# Add user authentication support (multi-tenant conversion)

1. Overview
Converts the app from single-tenant (shared data) to multi-tenant (per-user data).
Users sign up with email/password via Supabase Auth. Data is scoped to auth.uid().

2. Schema Changes
- profiles: add nullable user_id (uuid, references auth.users, unique). Existing profile row deleted (was a placeholder).
- tasks, habits, settings, points_log, badges, pomodoro_sessions, task_comments, habit_logs, game_scores: add user_id column.
  - Old rows without an owner are deleted first (they were demo/placeholder data).
  - Then columns are set to NOT NULL DEFAULT auth.uid().
- settings: add unique index on user_id.

3. Trigger
- on_auth_user_created: auto-creates a profiles row when a new auth user signs up.

4. Security (RLS)
- Owner-scoped tables (tasks, habits, settings, points_log, badges, pomodoro_sessions, task_comments, habit_logs):
  4 policies each (SELECT/INSERT/UPDATE/DELETE), TO authenticated, auth.uid() = user_id.
- profiles: SELECT for all authenticated (leaderboard), UPDATE/DELETE for owner only.
- game_scores: SELECT for all authenticated (high scores), INSERT/DELETE for owner.
- leaderboard_entries: SELECT for all authenticated, INSERT/UPDATE/DELETE for owner (via profile ownership check).
- connections: SELECT for all authenticated, INSERT/DELETE for owner (via profile ownership check).
- rewards: full access for all authenticated (shared reward definitions + claim tracking).
- categories, special_tasks: keep existing anon+authenticated policies (shared reference data).
*/

-- ============================================================
-- Step 1: Clean up old single-tenant data (no owner to assign)
-- ============================================================
DELETE FROM habit_logs;
DELETE FROM habits;
DELETE FROM settings;
DELETE FROM points_log;
DELETE FROM badges;
DELETE FROM pomodoro_sessions;
DELETE FROM task_comments;
DELETE FROM tasks;
DELETE FROM game_scores;
DELETE FROM leaderboard_entries;
DELETE FROM connections;
DELETE FROM profiles;

-- ============================================================
-- Step 2: Add user_id columns (nullable first)
-- ============================================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE habits ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE points_log ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE badges ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE pomodoro_sessions ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE task_comments ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE habit_logs ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE game_scores ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- ============================================================
-- Step 3: Set NOT NULL + DEFAULT auth.uid() on owner-scoped tables
-- ============================================================
ALTER TABLE tasks ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE tasks ALTER COLUMN user_id SET DEFAULT auth.uid();

ALTER TABLE habits ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE habits ALTER COLUMN user_id SET DEFAULT auth.uid();

ALTER TABLE settings ALTER COLUMN user_id SET DEFAULT auth.uid();

ALTER TABLE points_log ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE points_log ALTER COLUMN user_id SET DEFAULT auth.uid();

ALTER TABLE badges ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE badges ALTER COLUMN user_id SET DEFAULT auth.uid();

ALTER TABLE pomodoro_sessions ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE pomodoro_sessions ALTER COLUMN user_id SET DEFAULT auth.uid();

ALTER TABLE task_comments ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE task_comments ALTER COLUMN user_id SET DEFAULT auth.uid();

ALTER TABLE habit_logs ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE habit_logs ALTER COLUMN user_id SET DEFAULT auth.uid();

ALTER TABLE game_scores ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE game_scores ALTER COLUMN user_id SET DEFAULT auth.uid();

-- ============================================================
-- Step 4: Indexes
-- ============================================================
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles (user_id) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_settings_user_id ON settings (user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks (user_id);
CREATE INDEX IF NOT EXISTS idx_habits_user_id ON habits (user_id);
CREATE INDEX IF NOT EXISTS idx_points_log_user_id ON points_log (user_id);
CREATE INDEX IF NOT EXISTS idx_badges_user_id ON badges (user_id);
CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_user_id ON pomodoro_sessions (user_id);

-- ============================================================
-- Step 5: Auto-create profile on signup
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, avatar_emoji, bio, title)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_emoji', '🦸'),
    'Welcome to TaskFlow! Start completing tasks to level up.',
    'Rookie'
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- Step 6: Update RLS policies
-- ============================================================

-- TASKS
DROP POLICY IF EXISTS "anon_select_tasks" ON tasks;
DROP POLICY IF EXISTS "anon_insert_tasks" ON tasks;
DROP POLICY IF EXISTS "anon_update_tasks" ON tasks;
DROP POLICY IF EXISTS "anon_delete_tasks" ON tasks;
DROP POLICY IF EXISTS "select_own_tasks" ON tasks;
DROP POLICY IF EXISTS "insert_own_tasks" ON tasks;
DROP POLICY IF EXISTS "update_own_tasks" ON tasks;
DROP POLICY IF EXISTS "delete_own_tasks" ON tasks;

CREATE POLICY "select_own_tasks" ON tasks FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_tasks" ON tasks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_tasks" ON tasks FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_tasks" ON tasks FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- HABITS
DROP POLICY IF EXISTS "anon_select_habits" ON habits;
DROP POLICY IF EXISTS "anon_insert_habits" ON habits;
DROP POLICY IF EXISTS "anon_update_habits" ON habits;
DROP POLICY IF EXISTS "anon_delete_habits" ON habits;
DROP POLICY IF EXISTS "select_own_habits" ON habits;
DROP POLICY IF EXISTS "insert_own_habits" ON habits;
DROP POLICY IF EXISTS "update_own_habits" ON habits;
DROP POLICY IF EXISTS "delete_own_habits" ON habits;

CREATE POLICY "select_own_habits" ON habits FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_habits" ON habits FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_habits" ON habits FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_habits" ON habits FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- SETTINGS
DROP POLICY IF EXISTS "anon_select_settings" ON settings;
DROP POLICY IF EXISTS "anon_insert_settings" ON settings;
DROP POLICY IF EXISTS "anon_update_settings" ON settings;
DROP POLICY IF EXISTS "anon_delete_settings" ON settings;
DROP POLICY IF EXISTS "select_own_settings" ON settings;
DROP POLICY IF EXISTS "insert_own_settings" ON settings;
DROP POLICY IF EXISTS "update_own_settings" ON settings;
DROP POLICY IF EXISTS "delete_own_settings" ON settings;

CREATE POLICY "select_own_settings" ON settings FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_settings" ON settings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_settings" ON settings FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_settings" ON settings FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- POINTS_LOG
DROP POLICY IF EXISTS "anon_select_points_log" ON points_log;
DROP POLICY IF EXISTS "anon_insert_points_log" ON points_log;
DROP POLICY IF EXISTS "anon_update_points_log" ON points_log;
DROP POLICY IF EXISTS "anon_delete_points_log" ON points_log;
DROP POLICY IF EXISTS "select_own_points_log" ON points_log;
DROP POLICY IF EXISTS "insert_own_points_log" ON points_log;
DROP POLICY IF EXISTS "delete_own_points_log" ON points_log;

CREATE POLICY "select_own_points_log" ON points_log FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_points_log" ON points_log FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_points_log" ON points_log FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- BADGES
DROP POLICY IF EXISTS "anon_select_badges" ON badges;
DROP POLICY IF EXISTS "anon_insert_badges" ON badges;
DROP POLICY IF EXISTS "anon_update_badges" ON badges;
DROP POLICY IF EXISTS "anon_delete_badges" ON badges;
DROP POLICY IF EXISTS "select_own_badges" ON badges;
DROP POLICY IF EXISTS "insert_own_badges" ON badges;
DROP POLICY IF EXISTS "update_own_badges" ON badges;
DROP POLICY IF EXISTS "delete_own_badges" ON badges;

CREATE POLICY "select_own_badges" ON badges FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_badges" ON badges FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_badges" ON badges FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_badges" ON badges FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- POMODORO_SESSIONS
DROP POLICY IF EXISTS "anon_select_pomodoro_sessions" ON pomodoro_sessions;
DROP POLICY IF EXISTS "anon_insert_pomodoro_sessions" ON pomodoro_sessions;
DROP POLICY IF EXISTS "anon_update_pomodoro_sessions" ON pomodoro_sessions;
DROP POLICY IF EXISTS "anon_delete_pomodoro_sessions" ON pomodoro_sessions;
DROP POLICY IF EXISTS "select_own_pomodoro" ON pomodoro_sessions;
DROP POLICY IF EXISTS "insert_own_pomodoro" ON pomodoro_sessions;
DROP POLICY IF EXISTS "delete_own_pomodoro" ON pomodoro_sessions;

CREATE POLICY "select_own_pomodoro" ON pomodoro_sessions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_pomodoro" ON pomodoro_sessions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_pomodoro" ON pomodoro_sessions FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- TASK_COMMENTS
DROP POLICY IF EXISTS "anon_select_task_comments" ON task_comments;
DROP POLICY IF EXISTS "anon_insert_task_comments" ON task_comments;
DROP POLICY IF EXISTS "anon_update_task_comments" ON task_comments;
DROP POLICY IF EXISTS "anon_delete_task_comments" ON task_comments;
DROP POLICY IF EXISTS "select_own_comments" ON task_comments;
DROP POLICY IF EXISTS "insert_own_comments" ON task_comments;
DROP POLICY IF EXISTS "delete_own_comments" ON task_comments;

CREATE POLICY "select_own_comments" ON task_comments FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_comments" ON task_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_comments" ON task_comments FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- HABIT_LOGS
DROP POLICY IF EXISTS "anon_select_habit_logs" ON habit_logs;
DROP POLICY IF EXISTS "anon_insert_habit_logs" ON habit_logs;
DROP POLICY IF EXISTS "anon_update_habit_logs" ON habit_logs;
DROP POLICY IF EXISTS "anon_delete_habit_logs" ON habit_logs;
DROP POLICY IF EXISTS "select_own_habit_logs" ON habit_logs;
DROP POLICY IF EXISTS "insert_own_habit_logs" ON habit_logs;
DROP POLICY IF EXISTS "delete_own_habit_logs" ON habit_logs;

CREATE POLICY "select_own_habit_logs" ON habit_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_habit_logs" ON habit_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_habit_logs" ON habit_logs FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- GAME_SCORES: readable by all authenticated (for high scores), writable by owner
DROP POLICY IF EXISTS "anon_select_game_scores" ON game_scores;
DROP POLICY IF EXISTS "anon_insert_game_scores" ON game_scores;
DROP POLICY IF EXISTS "anon_delete_game_scores" ON game_scores;
DROP POLICY IF EXISTS "select_all_game_scores" ON game_scores;
DROP POLICY IF EXISTS "insert_own_game_scores" ON game_scores;
DROP POLICY IF EXISTS "delete_own_game_scores" ON game_scores;

CREATE POLICY "select_all_game_scores" ON game_scores FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_own_game_scores" ON game_scores FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_game_scores" ON game_scores FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- PROFILES: readable by all authenticated (for leaderboard/connections), updatable by owner only
DROP POLICY IF EXISTS "anon_select_profiles" ON profiles;
DROP POLICY IF EXISTS "anon_insert_profiles" ON profiles;
DROP POLICY IF EXISTS "anon_update_profiles" ON profiles;
DROP POLICY IF EXISTS "anon_delete_profiles" ON profiles;
DROP POLICY IF EXISTS "select_all_profiles" ON profiles;
DROP POLICY IF EXISTS "update_own_profile" ON profiles;
DROP POLICY IF EXISTS "delete_own_profile" ON profiles;

CREATE POLICY "select_all_profiles" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_profile" ON profiles FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- LEADERBOARD_ENTRIES: readable by all authenticated, writable by owner
DROP POLICY IF EXISTS "anon_select_leaderboard" ON leaderboard_entries;
DROP POLICY IF EXISTS "anon_insert_leaderboard" ON leaderboard_entries;
DROP POLICY IF EXISTS "anon_update_leaderboard" ON leaderboard_entries;
DROP POLICY IF EXISTS "anon_delete_leaderboard" ON leaderboard_entries;
DROP POLICY IF EXISTS "select_all_leaderboard" ON leaderboard_entries;
DROP POLICY IF EXISTS "insert_own_leaderboard" ON leaderboard_entries;
DROP POLICY IF EXISTS "update_own_leaderboard" ON leaderboard_entries;
DROP POLICY IF EXISTS "delete_own_leaderboard" ON leaderboard_entries;

CREATE POLICY "select_all_leaderboard" ON leaderboard_entries FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_own_leaderboard" ON leaderboard_entries FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = leaderboard_entries.profile_id AND profiles.user_id = auth.uid())
);
CREATE POLICY "update_own_leaderboard" ON leaderboard_entries FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = leaderboard_entries.profile_id AND profiles.user_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = leaderboard_entries.profile_id AND profiles.user_id = auth.uid())
);
CREATE POLICY "delete_own_leaderboard" ON leaderboard_entries FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = leaderboard_entries.profile_id AND profiles.user_id = auth.uid())
);

-- CONNECTIONS: readable by all authenticated, insertable/deletable by owner (follower)
DROP POLICY IF EXISTS "anon_select_connections" ON connections;
DROP POLICY IF EXISTS "anon_insert_connections" ON connections;
DROP POLICY IF EXISTS "anon_delete_connections" ON connections;
DROP POLICY IF EXISTS "select_all_connections" ON connections;
DROP POLICY IF EXISTS "insert_own_connections" ON connections;
DROP POLICY IF EXISTS "delete_own_connections" ON connections;

CREATE POLICY "select_all_connections" ON connections FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_own_connections" ON connections FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = connections.follower_id AND profiles.user_id = auth.uid())
);
CREATE POLICY "delete_own_connections" ON connections FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = connections.follower_id AND profiles.user_id = auth.uid())
);

-- REWARDS: full access for all authenticated (shared reward definitions + claim tracking)
DROP POLICY IF EXISTS "anon_select_rewards" ON rewards;
DROP POLICY IF EXISTS "anon_insert_rewards" ON rewards;
DROP POLICY IF EXISTS "anon_update_rewards" ON rewards;
DROP POLICY IF EXISTS "anon_delete_rewards" ON rewards;
DROP POLICY IF EXISTS "select_all_rewards" ON rewards;
DROP POLICY IF EXISTS "insert_all_rewards" ON rewards;
DROP POLICY IF EXISTS "update_all_rewards" ON rewards;
DROP POLICY IF EXISTS "delete_all_rewards" ON rewards;

CREATE POLICY "select_all_rewards" ON rewards FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_all_rewards" ON rewards FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_all_rewards" ON rewards FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_all_rewards" ON rewards FOR DELETE TO authenticated USING (true);
