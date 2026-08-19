import { useMemo, useEffect, useState } from 'react';
import { TrendingUp, CheckCircle2, Clock, Flame, Timer, Trophy } from 'lucide-react';
import type { Task, Habit, Badge, PomodoroSession } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import { BarChart, DonutChart, LineChart } from '@/components/Charts';
import { getLast7Days, getLast30Days, isOverdue } from '@/lib/utils';
import BadgeDisplay from '@/components/BadgeDisplay';

interface AnalyticsViewProps {
  tasks: Task[];
  habits: Habit[];
  badges: Badge[];
  totalPoints: number;
}

export default function AnalyticsView({ tasks, habits, badges, totalPoints }: AnalyticsViewProps) {
  const [pomodoroSessions, setPomodoroSessions] = useState<PomodoroSession[]>([]);

  useEffect(() => {
    supabase
      .from('pomodoro_sessions')
      .select('*')
      .order('completed_at', { ascending: false })
      .limit(100)
      .then(({ data }) => setPomodoroSessions((data ?? []) as PomodoroSession[]));
  }, []);

  const stats = useMemo(() => {
    const completed = tasks.filter((t) => t.completed).length;
    const active = tasks.filter((t) => !t.completed).length;
    const overdue = tasks.filter(isOverdue).length;
    const completionRate = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;
    const bestStreak = habits.length > 0 ? Math.max(...habits.map((h) => h.longest_streak)) : 0;
    const totalFocusMinutes = pomodoroSessions
      .filter((s) => s.session_type === 'work')
      .reduce((sum, s) => sum + s.duration_minutes, 0);

    return { completed, active, overdue, completionRate, bestStreak, totalFocusMinutes };
  }, [tasks, habits, pomodoroSessions]);

  // Tasks completed per day (last 7 days)
  const dailyCompletion = useMemo(() => {
    const days = getLast7Days();
    return days.map((date) => {
      const count = tasks.filter(
        (t) => t.completed && t.updated_at.split('T')[0] === date
      ).length;
      return {
        label: new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' }),
        value: count,
        highlight: date === days[days.length - 1],
      };
    });
  }, [tasks]);

  // Tasks by priority
  const priorityDist = useMemo(() => {
    const high = tasks.filter((t) => t.priority === 'high').length;
    const medium = tasks.filter((t) => t.priority === 'medium').length;
    const low = tasks.filter((t) => t.priority === 'low').length;
    return [
      { label: 'High', value: high, color: 'stroke-rose-500' },
      { label: 'Medium', value: medium, color: 'stroke-amber-500' },
      { label: 'Low', value: low, color: 'stroke-emerald-500' },
    ];
  }, [tasks]);

  // Habit completions over last 30 days (line chart)
  const habitTrend = useMemo(() => {
    const days = getLast30Days();
    return days.map((date) => ({
      label: new Date(date + 'T00:00:00').toLocaleDateString('en-US', { day: 'numeric' }),
      value: 0,
    }));
  }, []);

  // Pomodoro sessions per day (last 7 days)
  const pomodoroDaily = useMemo(() => {
    const days = getLast7Days();
    return days.map((date) => {
      const count = pomodoroSessions.filter(
        (s) => s.session_type === 'work' && s.completed_at.split('T')[0] === date
      ).length;
      return {
        label: new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' }),
        value: count,
        highlight: date === days[days.length - 1],
      };
    });
  }, [pomodoroSessions]);

  const statCards = [
    { label: 'Completion Rate', value: `${stats.completionRate}%`, icon: TrendingUp, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/10' },
    { label: 'Completed', value: stats.completed, icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
    { label: 'Active', value: stats.active, icon: Clock, color: 'text-slate-600 dark:text-slate-300', bg: 'bg-slate-100 dark:bg-slate-700/40' },
    { label: 'Overdue', value: stats.overdue, icon: Clock, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-500/10' },
    { label: 'Best Streak', value: `${stats.bestStreak}d`, icon: Flame, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-500/10' },
    { label: 'Focus Time', value: `${stats.totalFocusMinutes}m`, icon: Timer, color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-500/10' },
  ];

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${stat.bg}`}>
                <Icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-xl font-bold text-slate-800 dark:text-white">{stat.value}</p>
                <p className="text-xs text-slate-400">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Daily completion bar chart */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <h3 className="mb-4 text-sm font-bold text-slate-700 dark:text-slate-200">Tasks Completed (Last 7 Days)</h3>
          <BarChart data={dailyCompletion} color="bg-blue-500" />
        </div>

        {/* Priority distribution donut */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <h3 className="mb-4 text-sm font-bold text-slate-700 dark:text-slate-200">Tasks by Priority</h3>
          <div className="flex justify-center py-2">
            <DonutChart segments={priorityDist} />
          </div>
        </div>

        {/* Pomodoro sessions bar chart */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <h3 className="mb-4 text-sm font-bold text-slate-700 dark:text-slate-200">Pomodoro Sessions (Last 7 Days)</h3>
          <BarChart data={pomodoroDaily} color="bg-violet-500" />
        </div>

        {/* Habit trend line chart */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <h3 className="mb-4 text-sm font-bold text-slate-700 dark:text-slate-200">Habit Activity (Last 30 Days)</h3>
          <LineChart data={habitTrend} color="#f97316" />
        </div>
      </div>

      {/* Badges & Gamification */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
          <Trophy className="h-4 w-4 text-amber-500" />
          Achievements
        </h3>
        <BadgeDisplay badges={badges} totalPoints={totalPoints} />
      </div>
    </div>
  );
}
