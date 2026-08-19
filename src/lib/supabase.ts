import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Priority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  priority: Priority;
  due_date: string | null;
  position: number;
  category_id: string | null;
  reminder_time: string | null;
  reminder_enabled: boolean;
  created_at: string;
  updated_at: string;
  categories?: Category | null;
  task_comments?: TaskComment[];
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  created_at: string;
}

export interface Habit {
  id: string;
  name: string;
  icon: string;
  color: string;
  target_per_day: number;
  current_streak: number;
  longest_streak: number;
  last_completed_date: string | null;
  created_at: string;
}

export interface HabitLog {
  id: string;
  habit_id: string;
  completed_date: string;
  note: string | null;
  created_at: string;
}

export interface PomodoroSession {
  id: string;
  task_id: string | null;
  duration_minutes: number;
  session_type: 'work' | 'break';
  completed_at: string;
}

export interface TaskComment {
  id: string;
  task_id: string;
  author_name: string;
  content: string;
  created_at: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  metric: string;
  threshold: number;
  earned_at: string | null;
}

export interface PointsLog {
  id: string;
  points: number;
  reason: string;
  created_at: string;
}

export interface Settings {
  id: number;
  dark_mode: boolean;
  notifications_enabled: boolean;
  pomodoro_work: number;
  pomodoro_break: number;
  pomodoro_long_break: number;
  pomodoro_rounds: number;
  updated_at: string;
}

export type NewTask = {
  title: string;
  description?: string | null;
  priority?: Priority;
  due_date?: string | null;
  category_id?: string | null;
  reminder_time?: string | null;
  reminder_enabled?: boolean;
};

export interface Profile {
  id: string;
  display_name: string;
  avatar_emoji: string;
  bio: string | null;
  level: number;
  xp: number;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface Connection {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

export type PeriodType = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'special';

export interface LeaderboardEntry {
  id: string;
  profile_id: string;
  period_type: PeriodType;
  period_key: string;
  points: number;
  tasks_completed: number;
  updated_at: string;
  profiles?: Profile | null;
}

export interface GameScore {
  id: string;
  profile_id: string | null;
  score: number;
  level_reached: number;
  created_at: string;
  profiles?: Profile | null;
}

export interface Reward {
  id: string;
  name: string;
  description: string;
  icon: string;
  points_required: number;
  claimed_at: string | null;
  profile_id: string | null;
}

export type SpecialTaskType = 'weekly' | 'monthly' | 'yearly' | 'special';

export interface SpecialTask {
  id: string;
  title: string;
  description: string | null;
  task_type: SpecialTaskType;
  points_reward: number;
  target_count: number;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
}
