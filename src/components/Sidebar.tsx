import {
  ListTodo,
  CheckCircle2,
  Clock,
  Calendar,
  Flame,
  BarChart3,
  Timer,
  Settings,
  Moon,
  Sun,
  Trophy,
  Wifi,
  WifiOff,
  Menu,
  X,
  LayoutDashboard,
  User,
  Gamepad2,
  Crown,
  Users,
  LogOut,
} from 'lucide-react';
import type { Profile } from '@/lib/supabase';

export type PageView =
  | 'dashboard'
  | 'tasks'
  | 'habits'
  | 'analytics'
  | 'calendar'
  | 'pomodoro'
  | 'leaderboard'
  | 'game'
  | 'profile'
  | 'settings';

interface SidebarProps {
  activePage: PageView;
  onNavigate: (page: PageView) => void;
  stats: { total: number; active: number; completed: number; overdue: number };
  darkMode: boolean;
  onToggleDarkMode: () => void;
  isOnline: boolean;
  totalPoints: number;
  earnedBadges: number;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  profile: Profile | null;
  onlineProfiles: Profile[];
  onSignOut: () => void;
}

const navSections: { label: string; items: { id: PageView; label: string; icon: typeof ListTodo }[] }[] = [
  {
    label: 'Main',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'tasks', label: 'Tasks', icon: ListTodo },
      { id: 'habits', label: 'Habits', icon: Flame },
      { id: 'calendar', label: 'Calendar', icon: Calendar },
    ],
  },
  {
    label: 'Productivity',
    items: [
      { id: 'analytics', label: 'Analytics', icon: BarChart3 },
      { id: 'pomodoro', label: 'Pomodoro', icon: Timer },
    ],
  },
  {
    label: 'Community',
    items: [
      { id: 'leaderboard', label: 'Leaderboard', icon: Crown },
      { id: 'game', label: 'Play Game', icon: Gamepad2 },
      { id: 'profile', label: 'Profile', icon: User },
    ],
  },
];

export default function Sidebar({
  activePage,
  onNavigate,
  stats,
  darkMode,
  onToggleDarkMode,
  isOnline,
  totalPoints,
  earnedBadges,
  sidebarOpen,
  onToggleSidebar,
  profile,
  onlineProfiles,
  onSignOut,
}: SidebarProps) {
  return (
    <>
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={onToggleSidebar} />
      )}

      <aside
        className={`fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-300 dark:border-slate-700 dark:bg-slate-900 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/30">
              <ListTodo className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-800 dark:text-white">TaskFlow</h1>
              <p className="text-xs text-slate-400">Pro</p>
            </div>
          </div>
          <button onClick={onToggleSidebar} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Profile mini-card */}
        <button
          onClick={() => onNavigate('profile')}
          className="mx-3 mb-2 flex items-center gap-3 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 px-3 py-2.5 transition-all hover:shadow-md dark:from-blue-500/10 dark:to-indigo-500/10"
        >
          <span className="text-2xl">{profile?.avatar_emoji ?? '🦸'}</span>
          <div className="flex-1 text-left">
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">{profile?.display_name ?? 'You'}</p>
            <p className="text-xs text-slate-400">Level {profile?.level ?? 1} · {profile?.title ?? 'Rookie'}</p>
          </div>
        </button>

        {/* Stats cards */}
        <div className="px-3 py-1">
          <p className="px-2 pb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">Overview</p>
          <div className="grid grid-cols-2 gap-1.5">
            <StatCard icon={ListTodo} label="Total" value={stats.total} color="text-blue-600 dark:text-blue-400" bg="bg-blue-50 dark:bg-blue-500/10" />
            <StatCard icon={Clock} label="Active" value={stats.active} color="text-slate-600 dark:text-slate-300" bg="bg-slate-100 dark:bg-slate-700/40" />
            <StatCard icon={CheckCircle2} label="Done" value={stats.completed} color="text-emerald-600 dark:text-emerald-400" bg="bg-emerald-50 dark:bg-emerald-500/10" />
            <StatCard icon={Clock} label="Overdue" value={stats.overdue} color="text-rose-600 dark:text-rose-400" bg="bg-rose-50 dark:bg-rose-500/10" />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-2 scrollbar-thin">
          {navSections.map((section) => (
            <div key={section.label} className="mb-2">
              <p className="px-2 pb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">{section.label}</p>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activePage === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onNavigate(item.id);
                        if (window.innerWidth < 1024) onToggleSidebar();
                      }}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400'
                          : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Online users */}
        {onlineProfiles.length > 1 && (
          <div className="border-t border-slate-200 px-3 py-2 dark:border-slate-700">
            <p className="px-2 pb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Users className="h-3 w-3" /> Online ({onlineProfiles.length})
            </p>
            <div className="flex flex-wrap gap-1 px-1">
              {onlineProfiles.slice(0, 8).map((p) => (
                <button
                  key={p.id}
                  onClick={() => onNavigate('leaderboard')}
                  className="relative"
                  title={p.display_name}
                >
                  <span className="text-lg">{p.avatar_emoji}</span>
                  <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 ring-1 ring-white dark:ring-slate-900" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Gamification summary */}
        <div className="border-t border-slate-200 px-3 py-2.5 dark:border-slate-700">
          <button
            onClick={() => onNavigate('leaderboard')}
            className="flex w-full items-center justify-between rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 px-3 py-2.5 transition-all hover:shadow-md dark:from-amber-500/10 dark:to-orange-500/10"
          >
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              <div>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{totalPoints} pts</p>
                <p className="text-xs text-slate-400">{earnedBadges} badges</p>
              </div>
            </div>
            <Crown className="h-4 w-4 text-amber-400" />
          </button>
        </div>

        {/* Footer controls */}
        <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 dark:border-slate-700">
          <button
            onClick={onToggleDarkMode}
            className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {darkMode ? 'Light' : 'Dark'}
          </button>
          <div className={`flex items-center gap-1.5 text-xs font-medium ${isOnline ? 'text-emerald-500' : 'text-rose-500'}`}>
            {isOnline ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
            {isOnline ? 'Online' : 'Offline'}
          </div>
        </div>

        {/* Sign out */}
        <div className="border-t border-slate-200 px-4 py-3 dark:border-slate-700">
          <button
            onClick={onSignOut}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-500 transition-all hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 dark:border-slate-600 dark:text-slate-400 dark:hover:border-rose-500/30 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  bg,
}: {
  icon: typeof ListTodo;
  label: string;
  value: number;
  color: string;
  bg: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg px-2 py-1.5">
      <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${bg}`}>
        <Icon className={`h-3.5 w-3.5 ${color}`} />
      </div>
      <div>
        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{value}</p>
        <p className="text-xs text-slate-400">{label}</p>
      </div>
    </div>
  );
}

export function MobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 lg:hidden"
    >
      <Menu className="h-5 w-5" />
    </button>
  );
}
