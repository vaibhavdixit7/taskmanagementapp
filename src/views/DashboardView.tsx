import { useMemo } from 'react';
import {
  CheckCircle2,
  Clock,
  Flame,
  Timer,
  TrendingUp,
  Trophy,
  Target,
  Zap,
  ArrowRight,
  Calendar,
  Star,
} from 'lucide-react';
import type { Task, Habit, Badge, Profile, SpecialTask } from '@/lib/supabase';
import { BarChart } from '@/components/Charts';
import { isOverdue, getLast7Days, formatDueDate, getCategoryColor } from '@/lib/utils';

interface DashboardViewProps {
  tasks: Task[];
  habits: Habit[];
  badges: Badge[];
  totalPoints: number;
  profile: Profile | null;
  specialTasks: SpecialTask[];
  onNavigate: (page: string) => void;
}

export default function DashboardView({
  tasks,
  habits,
  badges,
  totalPoints,
  profile,
  specialTasks,
  onNavigate,
}: DashboardViewProps) {
  const stats = useMemo(() => {
    const completed = tasks.filter((t) => t.completed).length;
    const active = tasks.filter((t) => !t.completed).length;
    const overdue = tasks.filter(isOverdue).length;
    const completionRate = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;
    const bestStreak = habits.length > 0 ? Math.max(...habits.map((h) => h.longest_streak)) : 0;
    const activeStreaks = habits.filter((h) => h.current_streak > 0).length;
    return { completed, active, overdue, completionRate, bestStreak, activeStreaks };
  }, [tasks, habits]);

  const dailyCompletion = useMemo(() => {
    const days = getLast7Days();
    return days.map((date) => {
      const count = tasks.filter((t) => t.completed && t.updated_at.split('T')[0] === date).length;
      return {
        label: new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' }),
        value: count,
        highlight: date === days[days.length - 1],
      };
    });
  }, [tasks]);

  const earnedBadges = useMemo(() => badges.filter((b) => b.earned_at !== null), [badges]);
  const upcomingTasks = useMemo(
    () =>
      tasks
        .filter((t) => !t.completed && t.due_date)
        .sort((a, b) => (a.due_date ?? '').localeCompare(b.due_date ?? ''))
        .slice(0, 4),
    [tasks]
  );

  const activeSpecialTasks = useMemo(
    () => specialTasks.filter((t) => !t.completed).slice(0, 3),
    [specialTasks]
  );

  const xpForNextLevel = (profile?.level ?? 1) * 100;
  const xpProgress = ((profile?.xp ?? 0) % xpForNextLevel) / xpForNextLevel * 100;

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 p-6 text-white shadow-lg">
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{profile?.avatar_emoji ?? '🦸'}</span>
            <div>
              <h2 className="text-xl font-bold">Welcome back, {profile?.display_name ?? 'You'}!</h2>
              <p className="text-sm text-blue-100">
                Level {profile?.level ?? 1} · {profile?.title ?? 'Rookie'} · {totalPoints} points
              </p>
            </div>
          </div>
          {/* XP bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-blue-100">
              <span>XP: {profile?.xp ?? 0}</span>
              <span>Next: {xpForNextLevel}</span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/20">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-300 to-orange-400 transition-all duration-500"
                style={{ width: `${Math.max(xpProgress, 3)}%` }}
              />
            </div>
          </div>
        </div>
        {/* Decorative circles */}
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
        <div className="absolute -bottom-12 right-12 h-24 w-24 rounded-full bg-white/5" />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={CheckCircle2} label="Completed" value={stats.completed} color="text-emerald-600 dark:text-emerald-400" bg="bg-emerald-50 dark:bg-emerald-500/10" onClick={() => onNavigate('tasks')} />
        <StatCard icon={Clock} label="Active" value={stats.active} color="text-blue-600 dark:text-blue-400" bg="bg-blue-50 dark:bg-blue-500/10" onClick={() => onNavigate('tasks')} />
        <StatCard icon={Clock} label="Overdue" value={stats.overdue} color="text-rose-600 dark:text-rose-400" bg="bg-rose-50 dark:bg-rose-500/10" onClick={() => onNavigate('tasks')} />
        <StatCard icon={Flame} label="Best Streak" value={`${stats.bestStreak}d`} color="text-orange-600 dark:text-orange-400" bg="bg-orange-50 dark:bg-orange-500/10" onClick={() => onNavigate('habits')} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Daily completion chart */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">This Week's Progress</h3>
            <button onClick={() => onNavigate('analytics')} className="flex items-center gap-1 text-xs text-blue-600 hover:underline dark:text-blue-400">
              View all <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          <BarChart data={dailyCompletion} color="bg-blue-500" height={100} />
        </div>

        {/* Upcoming tasks */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">Upcoming Tasks</h3>
            <button onClick={() => onNavigate('calendar')} className="flex items-center gap-1 text-xs text-blue-600 hover:underline dark:text-blue-400">
              Calendar <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          {upcomingTasks.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">No upcoming tasks. You're all caught up!</p>
          ) : (
            <div className="space-y-2">
              {upcomingTasks.map((task) => {
                const catColor = task.categories ? getCategoryColor(task.categories.color) : null;
                return (
                  <div key={task.id} className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-700/50">
                    <div className={`h-2 w-2 rounded-full ${task.priority === 'high' ? 'bg-rose-500' : task.priority === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                    <span className="flex-1 truncate text-sm text-slate-700 dark:text-slate-200">{task.title}</span>
                    {catColor && (
                      <span className={`rounded-full px-2 py-0.5 text-xs ${catColor.bg} ${catColor.text}`}>{task.categories!.name}</span>
                    )}
                    <span className="text-xs text-slate-400">{task.due_date ? formatDueDate(task.due_date) : ''}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Special tasks & Achievements */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Special tasks */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-4 flex items-center gap-2">
            <Target className="h-4 w-4 text-violet-500" />
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">Special Challenges</h3>
          </div>
          {activeSpecialTasks.length === 0 ? (
            <p className="py-4 text-center text-sm text-slate-400">All challenges completed! Amazing work!</p>
          ) : (
            <div className="space-y-2">
              {activeSpecialTasks.map((st) => (
                <div key={st.id} className="flex items-center gap-3 rounded-lg bg-gradient-to-r from-violet-50 to-transparent px-3 py-2.5 dark:from-violet-500/10">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-500/20">
                    <Trophy className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{st.title}</p>
                    {st.description && <p className="text-xs text-slate-400">{st.description}</p>}
                  </div>
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">
                    +{st.points_reward}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent badges */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-500" />
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">Achievements</h3>
            </div>
            <button onClick={() => onNavigate('leaderboard')} className="flex items-center gap-1 text-xs text-blue-600 hover:underline dark:text-blue-400">
              Leaderboard <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          {earnedBadges.length === 0 ? (
            <p className="py-4 text-center text-sm text-slate-400">No badges yet. Complete tasks to earn them!</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {earnedBadges.slice(0, 6).map((badge) => (
                <div key={badge.id} className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-1.5 dark:bg-amber-500/10">
                  <Trophy className="h-4 w-4 text-amber-500" />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{badge.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <QuickAction icon={Timer} label="Pomodoro" color="from-violet-500 to-violet-600" onClick={() => onNavigate('pomodoro')} />
        <QuickAction icon={Flame} label="Habits" color="from-orange-500 to-orange-600" onClick={() => onNavigate('habits')} />
        <QuickAction icon={Zap} label="Play Game" color="from-emerald-500 to-emerald-600" onClick={() => onNavigate('game')} />
        <QuickAction icon={TrendingUp} label="Analytics" color="from-blue-500 to-blue-600" onClick={() => onNavigate('analytics')} />
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  bg,
  onClick,
}: {
  icon: typeof CheckCircle2;
  label: string;
  value: string | number;
  color: string;
  bg: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-all hover:shadow-md dark:border-slate-700 dark:bg-slate-800"
    >
      <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${bg}`}>
        <Icon className={`h-5 w-5 ${color}`} />
      </div>
      <div>
        <p className="text-xl font-bold text-slate-800 dark:text-white">{value}</p>
        <p className="text-xs text-slate-400">{label}</p>
      </div>
    </button>
  );
}

function QuickAction({
  icon: Icon,
  label,
  color,
  onClick,
}: {
  icon: typeof Timer;
  label: string;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-2 rounded-xl bg-gradient-to-br ${color} p-4 text-white shadow-sm transition-all hover:scale-105 hover:shadow-md active:scale-95`}
    >
      <Icon className="h-6 w-6" />
      <span className="text-sm font-semibold">{label}</span>
    </button>
  );
}
