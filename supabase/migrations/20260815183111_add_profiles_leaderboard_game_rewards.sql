/*
# Add profiles, connections, leaderboard, game scores, rewards

1. New Tables
- `profiles` — user identity (name, avatar, bio, level, xp, title)
  - id, display_name, avatar_emoji, bio, level, xp, title, created_at, updated_at
- `connections` — follow/connect between users (people connecting online)
  - id, follower_id, following_id, created_at
- `leaderboard_entries` — aggregated points per user per period
  - id, profile_id, period_type (daily/weekly/monthly/yearly/special), period_key, points, tasks_completed, updated_at
- `game_scores` — scores from the mini-game
  - id, profile_id, score, level_reached, created_at
- `rewards` — reward definitions that users can earn
  - id, name, description, icon, points_required, claimed_at (nullable), profile_id (nullable)
- `special_tasks` — weekly/monthly/yearly/special bonus tasks with big rewards
  - id, title, description, task_type (weekly/monthly/yearly/special), points_reward, target_count, created_at

2. Security
- All new tables have RLS enabled with anon+authenticated full CRUD (single-tenant, no auth, public/shared data).
- Each table gets separate policies for SELECT/INSERT/UPDATE/DELETE.

3. Notes
- Single-tenant app, no authentication. All visitors share the same data.
- Profiles are identified by display_name + avatar_emoji (no auth users).
- Leaderboard aggregates points by period (daily/weekly/monthly/yearly) so users can compete globally.
- Special tasks give bonus points for completing weekly/monthly/yearly challenges.
*/

-- ============================================================
-- PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name text NOT NULL,
  avatar_emoji text NOT NULL DEFAULT '😀',
  bio text,
  level integer NOT NULL DEFAULT 1,
  xp integer NOT NULL DEFAULT 0,
  title text NOT NULL DEFAULT 'Rookie',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_profiles" ON profiles;
CREATE POLICY "anon_select_profiles" ON profiles FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_profiles" ON profiles;
CREATE POLICY "anon_insert_profiles" ON profiles FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_profiles" ON profiles;
CREATE POLICY "anon_update_profiles" ON profiles FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_profiles" ON profiles;
CREATE POLICY "anon_delete_profiles" ON profiles FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- CONNECTIONS (people connecting online)
-- ============================================================
CREATE TABLE IF NOT EXISTS connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

CREATE INDEX IF NOT EXISTS idx_connections_follower ON connections (follower_id);
CREATE INDEX IF NOT EXISTS idx_connections_following ON connections (following_id);

ALTER TABLE connections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_connections" ON connections;
CREATE POLICY "anon_select_connections" ON connections FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_connections" ON connections;
CREATE POLICY "anon_insert_connections" ON connections FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_connections" ON connections;
CREATE POLICY "anon_delete_connections" ON connections FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- LEADERBOARD_ENTRIES
-- ============================================================
CREATE TABLE IF NOT EXISTS leaderboard_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  period_type text NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly', 'yearly', 'special')),
  period_key text NOT NULL,
  points integer NOT NULL DEFAULT 0,
  tasks_completed integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(profile_id, period_type, period_key)
);

CREATE INDEX IF NOT EXISTS idx_leaderboard_period ON leaderboard_entries (period_type, period_key);
CREATE INDEX IF NOT EXISTS idx_leaderboard_points ON leaderboard_entries (period_type, period_key, points DESC);

ALTER TABLE leaderboard_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_leaderboard" ON leaderboard_entries;
CREATE POLICY "anon_select_leaderboard" ON leaderboard_entries FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_leaderboard" ON leaderboard_entries;
CREATE POLICY "anon_insert_leaderboard" ON leaderboard_entries FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_leaderboard" ON leaderboard_entries;
CREATE POLICY "anon_update_leaderboard" ON leaderboard_entries FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_leaderboard" ON leaderboard_entries;
CREATE POLICY "anon_delete_leaderboard" ON leaderboard_entries FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- GAME_SCORES
-- ============================================================
CREATE TABLE IF NOT EXISTS game_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  score integer NOT NULL DEFAULT 0,
  level_reached integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_game_scores_score ON game_scores (score DESC);

ALTER TABLE game_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_game_scores" ON game_scores;
CREATE POLICY "anon_select_game_scores" ON game_scores FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_game_scores" ON game_scores;
CREATE POLICY "anon_insert_game_scores" ON game_scores FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_game_scores" ON game_scores;
CREATE POLICY "anon_delete_game_scores" ON game_scores FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- REWARDS
-- ============================================================
CREATE TABLE IF NOT EXISTS rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL DEFAULT 'gift',
  points_required integer NOT NULL,
  claimed_at timestamptz,
  profile_id uuid REFERENCES profiles(id) ON DELETE SET NULL
);

ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_rewards" ON rewards;
CREATE POLICY "anon_select_rewards" ON rewards FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_rewards" ON rewards;
CREATE POLICY "anon_insert_rewards" ON rewards FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_rewards" ON rewards;
CREATE POLICY "anon_update_rewards" ON rewards FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_rewards" ON rewards;
CREATE POLICY "anon_delete_rewards" ON rewards FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- SPECIAL_TASKS (weekly/monthly/yearly/special bonus tasks)
-- ============================================================
CREATE TABLE IF NOT EXISTS special_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  task_type text NOT NULL CHECK (task_type IN ('weekly', 'monthly', 'yearly', 'special')),
  points_reward integer NOT NULL DEFAULT 50,
  target_count integer NOT NULL DEFAULT 1,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE special_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_special_tasks" ON special_tasks;
CREATE POLICY "anon_select_special_tasks" ON special_tasks FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_special_tasks" ON special_tasks;
CREATE POLICY "anon_insert_special_tasks" ON special_tasks FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_special_tasks" ON special_tasks;
CREATE POLICY "anon_update_special_tasks" ON special_tasks FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_special_tasks" ON special_tasks;
CREATE POLICY "anon_delete_special_tasks" ON special_tasks FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- SEED: default profile
-- ============================================================
INSERT INTO profiles (display_name, avatar_emoji, bio, title)
VALUES ('You', '🦸', 'Welcome to TaskFlow! Start completing tasks to level up.', 'Rookie')
ON CONFLICT DO NOTHING;

-- ============================================================
-- SEED: special tasks
-- ============================================================
INSERT INTO special_tasks (title, description, task_type, points_reward, target_count) VALUES
  ('Complete 10 tasks this week', 'Finish 10 tasks before the week ends for bonus points!', 'weekly', 100, 10),
  ('Complete 40 tasks this month', 'A month-long challenge for dedicated task finishers.', 'monthly', 300, 40),
  ('Complete 365 tasks this year', 'The ultimate yearly challenge for true productivity masters.', 'yearly', 1000, 365),
  ('Maintain a 7-day habit streak', 'Keep a habit going for 7 consecutive days.', 'special', 150, 7),
  ('Complete 5 Pomodoro sessions', 'Focus deeply with 5 Pomodoro sessions.', 'special', 75, 5)
ON CONFLICT DO NOTHING;

-- ============================================================
-- SEED: rewards
-- ============================================================
INSERT INTO rewards (name, description, icon, points_required) VALUES
  ('Coffee Break', 'You earned a virtual coffee! ☕', 'coffee', 50),
  ('Productivity Star', 'A shining star for your dedication.', 'star', 150),
  ('Task Master Badge', 'Unlock the exclusive Task Master badge.', 'award', 300),
  ('Power User Title', 'Upgrade your profile title to Power User.', 'zap', 500),
  ('Legendary Status', 'Achieve legendary status with this ultimate reward.', 'crown', 1000)
ON CONFLICT DO NOTHING;
