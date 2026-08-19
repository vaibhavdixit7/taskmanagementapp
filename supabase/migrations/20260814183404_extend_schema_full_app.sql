/*
# Extend schema: categories, habits, pomodoro, gamification, collaboration, settings

1. New Tables
- `categories` — user-defined groups for tasks (Work, Personal, Health, etc.)
  - id, name, color, icon, created_at
- `habits` — recurring daily habits with streak tracking
  - id, name, icon, color, target_per_day, current_streak, longest_streak, last_completed_date, created_at
- `habit_logs` — one row per habit completion (tracks each time a habit is done)
  - id, habit_id, completed_date, note, created_at
- `pomodoro_sessions` — records of completed pomodoro focus sessions
  - id, task_id (nullable), duration_minutes, completed_at, session_type (work/break)
- `task_comments` — collaboration comments on tasks
  - id, task_id, author_name, content, created_at
- `badges` — gamification badge definitions
  - id, name, description, icon, threshold, metric, earned_at (nullable)
- `settings` — single-row app settings (dark mode, notifications, pomodoro config, etc.)
  - id, dark_mode, notifications_enabled, pomodoro_work, pomodoro_break, pomodoro_long_break, updated_at
- `points_log` — gamification points ledger
  - id, points, reason, created_at

2. Modified Tables
- `tasks` — add `category_id` (nullable FK to categories), `reminder_time` (timetz nullable), `reminder_enabled` (boolean)

3. Security
- All new tables have RLS enabled with anon+authenticated full CRUD (single-tenant, no auth, public/shared data).
- Each table gets 4 separate policies (SELECT/INSERT/UPDATE/DELETE).

4. Notes
- This is a single-tenant app with no authentication. All visitors share the same data.
- `USING (true)` / `WITH CHECK (true)` is intentional — the data is public by design.
- The `settings` table uses a fixed id of 1 for the singleton row, seeded on first access.
- Badge thresholds are checked client-side after awarding points.
*/

-- ============================================================
-- CATEGORIES
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  color text NOT NULL DEFAULT 'blue',
  icon text NOT NULL DEFAULT 'circle',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_categories" ON categories;
CREATE POLICY "anon_select_categories" ON categories FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_categories" ON categories;
CREATE POLICY "anon_insert_categories" ON categories FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_categories" ON categories;
CREATE POLICY "anon_update_categories" ON categories FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_categories" ON categories;
CREATE POLICY "anon_delete_categories" ON categories FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- TASKS: add category_id, reminder_time, reminder_enabled
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'category_id') THEN
    ALTER TABLE tasks ADD COLUMN category_id uuid REFERENCES categories(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'reminder_time') THEN
    ALTER TABLE tasks ADD COLUMN reminder_time timetz;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'reminder_enabled') THEN
    ALTER TABLE tasks ADD COLUMN reminder_enabled boolean NOT NULL DEFAULT false;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_tasks_category_id ON tasks (category_id);

-- ============================================================
-- HABITS
-- ============================================================
CREATE TABLE IF NOT EXISTS habits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  icon text NOT NULL DEFAULT 'flame',
  color text NOT NULL DEFAULT 'blue',
  target_per_day integer NOT NULL DEFAULT 1 CHECK (target_per_day >= 1),
  current_streak integer NOT NULL DEFAULT 0,
  longest_streak integer NOT NULL DEFAULT 0,
  last_completed_date date,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE habits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_habits" ON habits;
CREATE POLICY "anon_select_habits" ON habits FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_habits" ON habits;
CREATE POLICY "anon_insert_habits" ON habits FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_habits" ON habits;
CREATE POLICY "anon_update_habits" ON habits FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_habits" ON habits;
CREATE POLICY "anon_delete_habits" ON habits FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- HABIT_LOGS
-- ============================================================
CREATE TABLE IF NOT EXISTS habit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id uuid NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  completed_date date NOT NULL DEFAULT CURRENT_DATE,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_habit_logs_habit_id ON habit_logs (habit_id);
CREATE INDEX IF NOT EXISTS idx_habit_logs_date ON habit_logs (completed_date);

ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_habit_logs" ON habit_logs;
CREATE POLICY "anon_select_habit_logs" ON habit_logs FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_habit_logs" ON habit_logs;
CREATE POLICY "anon_insert_habit_logs" ON habit_logs FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_habit_logs" ON habit_logs;
CREATE POLICY "anon_update_habit_logs" ON habit_logs FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_habit_logs" ON habit_logs;
CREATE POLICY "anon_delete_habit_logs" ON habit_logs FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- POMODORO_SESSIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS pomodoro_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES tasks(id) ON DELETE SET NULL,
  duration_minutes integer NOT NULL,
  session_type text NOT NULL DEFAULT 'work' CHECK (session_type IN ('work', 'break')),
  completed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pomodoro_completed_at ON pomodoro_sessions (completed_at);

ALTER TABLE pomodoro_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_pomodoro" ON pomodoro_sessions;
CREATE POLICY "anon_select_pomodoro" ON pomodoro_sessions FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_pomodoro" ON pomodoro_sessions;
CREATE POLICY "anon_insert_pomodoro" ON pomodoro_sessions FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_pomodoro" ON pomodoro_sessions;
CREATE POLICY "anon_delete_pomodoro" ON pomodoro_sessions FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- TASK_COMMENTS (collaboration)
-- ============================================================
CREATE TABLE IF NOT EXISTS task_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  author_name text NOT NULL DEFAULT 'Anonymous',
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_comments_task_id ON task_comments (task_id);

ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_comments" ON task_comments;
CREATE POLICY "anon_select_comments" ON task_comments FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_comments" ON task_comments;
CREATE POLICY "anon_insert_comments" ON task_comments FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_comments" ON task_comments;
CREATE POLICY "anon_delete_comments" ON task_comments FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- BADGES (gamification)
-- ============================================================
CREATE TABLE IF NOT EXISTS badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL DEFAULT 'award',
  metric text NOT NULL,
  threshold integer NOT NULL,
  earned_at timestamptz
);

ALTER TABLE badges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_badges" ON badges;
CREATE POLICY "anon_select_badges" ON badges FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_badges" ON badges;
CREATE POLICY "anon_insert_badges" ON badges FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_badges" ON badges;
CREATE POLICY "anon_update_badges" ON badges FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_badges" ON badges;
CREATE POLICY "anon_delete_badges" ON badges FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- POINTS_LOG (gamification ledger)
-- ============================================================
CREATE TABLE IF NOT EXISTS points_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  points integer NOT NULL,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_points_log_created_at ON points_log (created_at);

ALTER TABLE points_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_points" ON points_log;
CREATE POLICY "anon_select_points" ON points_log FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_points" ON points_log;
CREATE POLICY "anon_insert_points" ON points_log FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_points" ON points_log;
CREATE POLICY "anon_delete_points" ON points_log FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- SETTINGS (singleton)
-- ============================================================
CREATE TABLE IF NOT EXISTS settings (
  id integer PRIMARY KEY DEFAULT 1,
  dark_mode boolean NOT NULL DEFAULT false,
  notifications_enabled boolean NOT NULL DEFAULT false,
  pomodoro_work integer NOT NULL DEFAULT 25,
  pomodoro_break integer NOT NULL DEFAULT 5,
  pomodoro_long_break integer NOT NULL DEFAULT 15,
  pomodoro_rounds integer NOT NULL DEFAULT 4,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_settings" ON settings;
CREATE POLICY "anon_select_settings" ON settings FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_settings" ON settings;
CREATE POLICY "anon_insert_settings" ON settings FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_settings" ON settings;
CREATE POLICY "anon_update_settings" ON settings FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

-- Seed default settings row if not exists
INSERT INTO settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- SEED: default badges
-- ============================================================
INSERT INTO badges (name, description, icon, metric, threshold) VALUES
  ('First Steps', 'Complete your first task', 'check-circle', 'tasks_completed', 1),
  ('Getting Started', 'Complete 5 tasks', 'rocket', 'tasks_completed', 5),
  ('On Fire', 'Complete 25 tasks', 'flame', 'tasks_completed', 25),
  ('Century Club', 'Complete 100 tasks', 'trophy', 'tasks_completed', 100),
  ('Habit Hero', 'Maintain a 7-day streak', 'flame', 'best_streak', 7),
  ('Unstoppable', 'Maintain a 30-day streak', 'zap', 'best_streak', 30),
  ('Focus Master', 'Complete 10 pomodoro sessions', 'brain', 'pomodoros', 10),
  ('Point Hunter', 'Earn 500 total points', 'star', 'total_points', 500),
  ('Early Bird', 'Complete a task before 8 AM', 'sunrise', 'early_bird', 1),
  ('Consistency King', 'Complete tasks 7 days in a row', 'calendar-check', 'daily_streak', 7)
ON CONFLICT DO NOTHING;

-- ============================================================
-- SEED: default categories
-- ============================================================
INSERT INTO categories (name, color, icon) VALUES
  ('Work', 'blue', 'briefcase'),
  ('Personal', 'emerald', 'heart'),
  ('Health', 'rose', 'activity'),
  ('Learning', 'amber', 'book-open'),
  ('Shopping', 'violet', 'shopping-cart')
ON CONFLICT DO NOTHING;
