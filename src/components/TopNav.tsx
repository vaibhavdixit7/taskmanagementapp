import { useState } from 'react';
import { ChevronDown, Search, Bell, Plus } from 'lucide-react';
import type { PageView } from '@/components/Sidebar';

interface TopNavProps {
  activePage: PageView;
  onQuickAdd: () => void;
  onSearch: (query: string) => void;
  searchQuery: string;
  notificationCount: number;
  onOpenNotifications: () => void;
}

const pageTitles: Record<PageView, { title: string; subtitle: string }> = {
  dashboard: { title: 'Dashboard', subtitle: 'Your productivity at a glance' },
  tasks: { title: 'Tasks', subtitle: 'Manage your tasks and to-dos' },
  habits: { title: 'Habits', subtitle: 'Track your daily routines' },
  analytics: { title: 'Analytics', subtitle: 'Insights into your productivity' },
  calendar: { title: 'Calendar', subtitle: 'View tasks by date' },
  pomodoro: { title: 'Pomodoro', subtitle: 'Focus timer for deep work' },
  leaderboard: { title: 'Leaderboard', subtitle: 'Compete with people worldwide' },
  game: { title: 'Task Catcher', subtitle: 'Play and earn bonus points' },
  profile: { title: 'Profile', subtitle: 'Your achievements and rewards' },
  settings: { title: 'Settings', subtitle: 'Customize your experience' },
};

export default function TopNav({
  activePage,
  onQuickAdd,
  onSearch,
  searchQuery,
  notificationCount,
  onOpenNotifications,
}: TopNavProps) {
  const [expanded, setExpanded] = useState(false);
  const info = pageTitles[activePage];

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur-md dark:border-slate-700 dark:bg-slate-900/80">
      <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white sm:text-xl">{info.title}</h2>
            <button
              onClick={() => setExpanded(!expanded)}
              className={`rounded-md p-1 text-slate-400 transition-all hover:bg-slate-100 dark:hover:bg-slate-800 ${expanded ? 'rotate-180' : ''}`}
            >
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>
          <p className="truncate text-xs text-slate-400 sm:text-sm">{info.subtitle}</p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative hidden sm:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Search tasks..."
              className="w-40 rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-700 outline-none transition-all focus:w-56 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:focus:bg-slate-800"
            />
          </div>

          <button
            onClick={onOpenNotifications}
            className="relative rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <Bell className="h-5 w-5" />
            {notificationCount > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-xs font-bold text-white">
                {notificationCount}
              </span>
            )}
          </button>

          <button
            onClick={onQuickAdd}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md active:scale-95 sm:px-4"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Quick Add</span>
          </button>
        </div>
      </div>

      {expanded && (
        <div className="animate-slide-down border-t border-slate-200 px-4 py-3 dark:border-slate-700 sm:px-6">
          <ExpandedDetails page={activePage} />
        </div>
      )}
    </header>
  );
}

function ExpandedDetails({ page }: { page: PageView }) {
  const details: Record<PageView, { items: { label: string; desc: string }[] }> = {
    dashboard: {
      items: [
        { label: 'Overview', desc: 'Quick stats and progress' },
        { label: 'Weekly Chart', desc: 'See your completion trend' },
        { label: 'Special Tasks', desc: 'Bonus challenges with rewards' },
        { label: 'Quick Actions', desc: 'Jump to any feature' },
      ],
    },
    tasks: {
      items: [
        { label: 'Categories', desc: 'Organize tasks into groups' },
        { label: 'Priorities', desc: 'Low, Medium, High urgency' },
        { label: 'Reminders', desc: 'Get notified at a specific time' },
        { label: 'Voice Input', desc: 'Add tasks hands-free' },
      ],
    },
    habits: {
      items: [
        { label: 'Daily Tracking', desc: 'Mark habits complete each day' },
        { label: 'Streaks', desc: 'Build consistency with streaks' },
        { label: 'Targets', desc: 'Set daily completion goals' },
      ],
    },
    analytics: {
      items: [
        { label: 'Completion Rate', desc: 'Track task completion over time' },
        { label: 'Points & Badges', desc: 'Gamification progress' },
        { label: 'Productivity', desc: 'Pomodoro session history' },
      ],
    },
    calendar: {
      items: [
        { label: 'Month View', desc: 'See all tasks on a calendar' },
        { label: 'Due Dates', desc: 'Visual due date tracking' },
      ],
    },
    pomodoro: {
      items: [
        { label: 'Focus Timer', desc: '25-min work sessions' },
        { label: 'Break Tracking', desc: 'Short and long breaks' },
        { label: 'Session History', desc: 'Track focus time' },
      ],
    },
    leaderboard: {
      items: [
        { label: 'Global Ranks', desc: 'Daily, weekly, monthly, yearly' },
        { label: 'Connect', desc: 'Follow other users' },
        { label: 'Compete', desc: 'Climb the leaderboard' },
      ],
    },
    game: {
      items: [
        { label: 'Task Catcher', desc: 'Catch tasks, avoid distractions' },
        { label: 'Combos', desc: 'Build streaks for bonus points' },
        { label: 'High Scores', desc: 'Compete for the top spot' },
      ],
    },
    profile: {
      items: [
        { label: 'Avatar & Title', desc: 'Customize your identity' },
        { label: 'Badges', desc: 'Show off your achievements' },
        { label: 'Rewards Shop', desc: 'Spend points on rewards' },
      ],
    },
    settings: {
      items: [
        { label: 'Dark Mode', desc: 'Toggle eye-comfort theme' },
        { label: 'Notifications', desc: 'Enable push notifications' },
        { label: 'Export Data', desc: 'Backup your data' },
        { label: 'Pomodoro Config', desc: 'Customize timer lengths' },
      ],
    },
  };

  return (
    <div className="flex flex-wrap gap-4">
      {details[page].items.map((item) => (
        <div key={item.label} className="flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800/50">
          <div className="h-2 w-2 flex-shrink-0 rounded-full bg-blue-500" />
          <div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{item.label}</p>
            <p className="text-xs text-slate-400">{item.desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
