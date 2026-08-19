/*
# Create tasks table (single-tenant, no auth)

1. New Tables
- `tasks`
  - `id` (uuid, primary key)
  - `title` (text, not null) — the task name
  - `description` (text, nullable) — optional longer notes
  - `completed` (boolean, default false) — whether the task is done
  - `priority` (text, default 'medium') — 'low', 'medium', or 'high'
  - `due_date` (date, nullable) — optional due date
  - `position` (integer, default 0) — for manual ordering / drag support
  - `created_at` (timestamptz, default now())
  - `updated_at` (timestamptz, default now())

2. Indexes
- Index on `completed` for filtering active vs done tasks.
- Index on `priority` for priority-based sorting.
- Index on `due_date` for date-based queries.

3. Security
- Enable RLS on `tasks`.
- Allow anon + authenticated full CRUD because the data is intentionally shared/public (no sign-in screen).
- Four separate policies (select/insert/update/delete), each scoped to `anon, authenticated`.

4. Notes
- This is a single-tenant app with no authentication. All visitors share the same task list.
- `USING (true)` / `WITH CHECK (true)` is intentional and documented here — the data is public by design.
- `updated_at` is maintained via a trigger to track the last modification time.
*/

CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  completed boolean NOT NULL DEFAULT false,
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  due_date date,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks (completed);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks (priority);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks (due_date);

-- Trigger to auto-update updated_at on row change
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_tasks_updated_at ON tasks;
CREATE TRIGGER trg_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_tasks" ON tasks;
CREATE POLICY "anon_select_tasks" ON tasks FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_tasks" ON tasks;
CREATE POLICY "anon_insert_tasks" ON tasks FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_tasks" ON tasks;
CREATE POLICY "anon_update_tasks" ON tasks FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_tasks" ON tasks;
CREATE POLICY "anon_delete_tasks" ON tasks FOR DELETE
  TO anon, authenticated USING (true);
