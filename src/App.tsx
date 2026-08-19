import { useEffect, useState, useMemo, useCallback } from 'react';
import {
  supabase,
  type Task,
  type Habit,
  type Category,
  type Priority,
  type Badge,
  type Profile,
  type Reward,
  type SpecialTask,
} from '@/lib/supabase';
import { isOverdue } from '@/lib/utils';
import Sidebar, { type PageView } from '@/components/Sidebar';
import TopNav from '@/components/TopNav';
import AuthScreen from '@/components/AuthScreen';
import TasksView from '@/views/TasksView';
import HabitsView from '@/views/HabitsView';
import AnalyticsView from '@/views/AnalyticsView';
import CalendarView from '@/views/CalendarView';
import PomodoroView from '@/views/PomodoroView';
import SettingsView from '@/views/SettingsView';
import DashboardView from '@/views/DashboardView';
import ProfileView from '@/views/ProfileView';
import LeaderboardView from '@/views/LeaderboardView';
import GameView from '@/views/GameView';
import { useAuth } from '@/hooks/useAuth';
import { useSettings, useDarkMode } from '@/hooks/useSettings';
import { useGamification } from '@/hooks/useGamification';
import { useNotifications } from '@/hooks/useNotifications';
import { useOffline } from '@/hooks/useOffline';
import type { FilterType } from '@/components/FilterTabs';
import { Menu, Loader2 } from 'lucide-react';

export default function App() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { settings, updateSettings } = useSettings();
  const { darkMode, setDarkMode } = useDarkMode(settings?.dark_mode ?? false);
  const { totalPoints, badges, awardPoints, checkAndAwardBadges, refresh: refreshGamification } = useGamification();
  const { permission: notifPermission, requestPermission: requestNotifPermission, notify } = useNotifications(settings?.notifications_enabled ?? false);
  const { isOnline } = useOffline();

  const [activePage, setActivePage] = useState<PageView>('dashboard');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [specialTasks, setSpecialTasks] = useState<SpecialTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [quickAddTrigger, setQuickAddTrigger] = useState(0);
  const [notifications, setNotifications] = useState<{ id: string; title: string; body: string; time: string }[]>([]);
  const [showNotifPanel, setShowNotifPanel] = useState(false);

  useEffect(() => {
    if (settings && settings.dark_mode !== darkMode) {
      setDarkMode(settings.dark_mode);
    }
  }, [settings, darkMode, setDarkMode]);

  const fetchTasks = useCallback(async () => {
    const { data } = await supabase
      .from('tasks')
      .select('*, categories(*)')
      .order('completed', { ascending: true })
      .order('created_at', { ascending: false });
    setTasks((data ?? []) as Task[]);
  }, []);

  const fetchHabits = useCallback(async () => {
    const { data } = await supabase.from('habits').select('*').order('created_at', { ascending: false });
    setHabits((data ?? []) as Habit[]);
  }, []);

  const fetchCategories = useCallback(async () => {
    const { data } = await supabase.from('categories').select('*').order('name', { ascending: true });
    setCategories((data ?? []) as Category[]);
  }, []);

  const fetchProfile = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('profiles').select('*').eq('user_id', user.id).maybeSingle();
    setProfile(data as Profile | null);
  }, [user]);

  const fetchProfiles = useCallback(async () => {
    const { data } = await supabase.from('profiles').select('*').order('xp', { ascending: false });
    setProfiles((data ?? []) as Profile[]);
  }, []);

  const fetchRewards = useCallback(async () => {
    const { data } = await supabase.from('rewards').select('*').order('points_required', { ascending: true });
    setRewards((data ?? []) as Reward[]);
  }, []);

  const fetchSpecialTasks = useCallback(async () => {
    const { data } = await supabase.from('special_tasks').select('*').order('points_reward', { ascending: false });
    setSpecialTasks((data ?? []) as SpecialTask[]);
  }, []);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([fetchTasks(), fetchHabits(), fetchCategories(), fetchProfile(), fetchProfiles(), fetchRewards(), fetchSpecialTasks()]).then(() =>
      setLoading(false)
    );
  }, [user, fetchTasks, fetchHabits, fetchCategories, fetchProfile, fetchProfiles, fetchRewards, fetchSpecialTasks]);

  // Reminder checker
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      const currentTime = now.toTimeString().slice(0, 5);
      const todayStr = now.toISOString().split('T')[0];

      tasks.forEach((task) => {
        if (task.reminder_enabled && task.reminder_time && !task.completed) {
          const reminderTime = task.reminder_time.slice(0, 5);
          if (reminderTime === currentTime) {
            const notifId = `${task.id}-${todayStr}-${currentTime}`;
            setNotifications((prev) => {
              if (prev.some((n) => n.id === notifId)) return prev;
              return [{ id: notifId, title: 'Task Reminder', body: task.title, time: new Date().toISOString() }, ...prev];
            });
            notify('Task Reminder', task.title);
          }
        }
      });

      tasks.forEach((task) => {
        if (isOverdue(task) && task.due_date) {
          const notifId = `overdue-${task.id}-${task.due_date}`;
          setNotifications((prev) => {
            if (prev.some((n) => n.id === notifId)) return prev;
            return [{ id: notifId, title: 'Task Overdue', body: task.title, time: new Date().toISOString() }, ...prev];
          });
        }
      });
    };

    const interval = setInterval(checkReminders, 60000);
    checkReminders();
    return () => clearInterval(interval);
  }, [tasks, notify]);

  const stats = useMemo(
    () => ({
      total: tasks.length,
      active: tasks.filter((t) => !t.completed).length,
      completed: tasks.filter((t) => t.completed).length,
      overdue: tasks.filter(isOverdue).length,
    }),
    [tasks]
  );

  const earnedBadgesCount = useMemo(() => badges.filter((b: Badge) => b.earned_at !== null).length, [badges]);

  // Update profile XP/level when points change
  const updateProfileXP = useCallback(
    async (pointsGained: number) => {
      if (!profile) return;
      const newXP = profile.xp + pointsGained;
      const newLevel = Math.floor(newXP / 100) + 1;
      const newTitle =
        newLevel >= 8 ? 'Grandmaster' :
        newLevel >= 7 ? 'Champion' :
        newLevel >= 6 ? 'Legend' :
        newLevel >= 5 ? 'Master' :
        newLevel >= 4 ? 'Pro' :
        newLevel >= 3 ? 'Achiever' :
        newLevel >= 2 ? 'Explorer' : 'Rookie';
      await supabase
        .from('profiles')
        .update({ xp: newXP, level: newLevel, title: newTitle, updated_at: new Date().toISOString() })
        .eq('id', profile.id);
      fetchProfile();
      fetchProfiles();
    },
    [profile, fetchProfile, fetchProfiles]
  );

  // Update leaderboard when points are earned
  const updateLeaderboard = useCallback(
    async (pointsGained: number, tasksCompletedDelta: number = 0) => {
      if (!profile) return;
      const periods: { type: 'daily' | 'weekly' | 'monthly' | 'yearly'; key: string }[] = [
        { type: 'daily', key: new Date().toISOString().split('T')[0] },
        { type: 'weekly', key: getWeekKey() },
        { type: 'monthly', key: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}` },
        { type: 'yearly', key: `${new Date().getFullYear()}` },
      ];
      for (const { type, key } of periods) {
        const { data: existing } = await supabase
          .from('leaderboard_entries')
          .select('*')
          .eq('profile_id', profile.id)
          .eq('period_type', type)
          .eq('period_key', key)
          .maybeSingle();
        if (existing) {
          await supabase
            .from('leaderboard_entries')
            .update({
              points: (existing as any).points + pointsGained,
              tasks_completed: (existing as any).tasks_completed + tasksCompletedDelta,
              updated_at: new Date().toISOString(),
            })
            .eq('id', (existing as any).id);
        } else {
          await supabase.from('leaderboard_entries').insert({
            profile_id: profile.id,
            period_type: type,
            period_key: key,
            points: pointsGained,
            tasks_completed: tasksCompletedDelta,
          });
        }
      }
    },
    [profile]
  );

  const handleAdd = useCallback(
    async (newTask: {
      title: string;
      description: string;
      priority: Priority;
      due_date: string | null;
      category_id: string | null;
      reminder_time: string | null;
      reminder_enabled: boolean;
    }) => {
      const { data } = await supabase
        .from('tasks')
        .insert({
          title: newTask.title,
          description: newTask.description || null,
          priority: newTask.priority,
          due_date: newTask.due_date,
          category_id: newTask.category_id,
          reminder_time: newTask.reminder_time,
          reminder_enabled: newTask.reminder_enabled,
        })
        .select('*, categories(*)')
        .single();
      if (data) {
        setTasks((prev) => [data as Task, ...prev]);
        const points = 5;
        await awardPoints(points, `Added task: ${newTask.title}`);
        await updateProfileXP(points);
        await updateLeaderboard(points);
        await checkAndAwardBadges({ tasks_completed: stats.completed, total_points: totalPoints + points });
        refreshGamification();
      }
    },
    [awardPoints, checkAndAwardBadges, refreshGamification, stats.completed, totalPoints, updateProfileXP, updateLeaderboard]
  );

  const handleToggle = useCallback(
    async (id: string, completed: boolean) => {
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completed } : t)));
      await supabase.from('tasks').update({ completed }).eq('id', id);

      if (completed) {
        const points = 10;
        await awardPoints(points, 'Completed a task');
        const newCompleted = stats.completed + 1;
        await updateProfileXP(points);
        await updateLeaderboard(points, 1);
        await checkAndAwardBadges({
          tasks_completed: newCompleted,
          total_points: totalPoints + points,
          best_streak: Math.max(...habits.map((h) => h.longest_streak), 0),
        });
        refreshGamification();
      }
    },
    [awardPoints, checkAndAwardBadges, refreshGamification, stats.completed, totalPoints, habits, updateProfileXP, updateLeaderboard]
  );

  const handleDelete = useCallback(async (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    await supabase.from('tasks').delete().eq('id', id);
  }, []);

  const handleEdit = useCallback(
    async (
      id: string,
      updates: {
        title: string;
        description: string;
        priority: Priority;
        due_date: string | null;
        category_id: string | null;
        reminder_time: string | null;
        reminder_enabled: boolean;
      }
    ) => {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === id
            ? { ...t, ...updates, description: updates.description || null, categories: categories.find((c) => c.id === updates.category_id) ?? null }
            : t
        )
      );
      await supabase
        .from('tasks')
        .update({
          title: updates.title,
          description: updates.description || null,
          priority: updates.priority,
          due_date: updates.due_date,
          category_id: updates.category_id,
          reminder_time: updates.reminder_time,
          reminder_enabled: updates.reminder_enabled,
        })
        .eq('id', id);
      await fetchTasks();
    },
    [categories, fetchTasks]
  );

  const handleToggleDarkMode = useCallback(() => {
    const newVal = !darkMode;
    setDarkMode(newVal);
    updateSettings({ dark_mode: newVal });
  }, [darkMode, setDarkMode, updateSettings]);

  const handleQuickAdd = useCallback(() => {
    setActivePage('tasks');
    setQuickAddTrigger((p) => p + 1);
  }, []);

  const handleDataImported = useCallback(() => {
    fetchTasks();
    fetchHabits();
    fetchCategories();
    fetchProfile();
    fetchProfiles();
    fetchRewards();
    fetchSpecialTasks();
    refreshGamification();
  }, [fetchTasks, fetchHabits, fetchCategories, fetchProfile, fetchProfiles, fetchRewards, fetchSpecialTasks, refreshGamification]);

  const handleGamePoints = useCallback(
    async (points: number, reason: string) => {
      await awardPoints(points, reason);
      await updateProfileXP(points);
      await updateLeaderboard(points);
      refreshGamification();
    },
    [awardPoints, updateProfileXP, updateLeaderboard, refreshGamification]
  );

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return (
          <DashboardView
            tasks={tasks}
            habits={habits}
            badges={badges}
            totalPoints={totalPoints}
            profile={profile}
            specialTasks={specialTasks}
            onNavigate={(p) => setActivePage(p as PageView)}
          />
        );
      case 'tasks':
        return (
          <TasksView
            tasks={tasks}
            categories={categories}
            loading={loading}
            filter={filter}
            onFilterChange={setFilter}
            searchQuery={searchQuery}
            onAdd={handleAdd}
            onToggle={handleToggle}
            onDelete={handleDelete}
            onEdit={handleEdit}
            quickAddTrigger={quickAddTrigger}
          />
        );
      case 'habits':
        return <HabitsView habits={habits} loading={loading} onHabitsChange={fetchHabits} onAwardPoints={handleGamePoints} />;
      case 'analytics':
        return <AnalyticsView tasks={tasks} habits={habits} badges={badges} totalPoints={totalPoints} />;
      case 'calendar':
        return <CalendarView tasks={tasks} />;
      case 'pomodoro':
        return <PomodoroView settings={settings} onAwardPoints={handleGamePoints} />;
      case 'leaderboard':
        return <LeaderboardView currentProfile={profile} onAwardPoints={handleGamePoints} />;
      case 'game':
        return <GameView profile={profile} onAwardPoints={handleGamePoints} />;
      case 'profile':
        return (
          <ProfileView
            profile={profile}
            badges={badges}
            tasks={tasks}
            habits={habits}
            totalPoints={totalPoints}
            rewards={rewards}
            onProfileUpdate={() => {
              fetchProfile();
              fetchProfiles();
              fetchRewards();
            }}
            onAwardPoints={handleGamePoints}
          />
        );
      case 'settings':
        return (
          <SettingsView
            settings={settings}
            darkMode={darkMode}
            onToggleDarkMode={handleToggleDarkMode}
            onUpdateSettings={updateSettings}
            categories={categories}
            onCategoriesChange={fetchCategories}
            tasks={tasks}
            habits={habits}
            onDataImported={handleDataImported}
            notificationPermission={notifPermission}
            onRequestNotifications={requestNotifPermission}
            isOnline={isOnline}
          />
        );
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!user) {
    return <AuthScreen onAuthSuccess={() => {}} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Sidebar
        activePage={activePage}
        onNavigate={setActivePage}
        stats={stats}
        darkMode={darkMode}
        onToggleDarkMode={handleToggleDarkMode}
        isOnline={isOnline}
        totalPoints={totalPoints}
        earnedBadges={earnedBadgesCount}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        profile={profile}
        onlineProfiles={profiles}
        onSignOut={signOut}
      />

      <div className="lg:pl-64">
        <TopNav
          activePage={activePage}
          onQuickAdd={handleQuickAdd}
          onSearch={setSearchQuery}
          searchQuery={searchQuery}
          notificationCount={notifications.length}
          onOpenNotifications={() => setShowNotifPanel(!showNotifPanel)}
        />

        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="fixed left-4 top-4 z-30 rounded-lg bg-white p-2 shadow-md lg:hidden dark:bg-slate-800"
          >
            <Menu className="h-5 w-5 text-slate-600 dark:text-slate-300" />
          </button>
        )}

        {showNotifPanel && (
          <div className="fixed right-4 top-16 z-30 w-80 rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-700">
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">Notifications</h3>
              {notifications.length > 0 && (
                <button onClick={() => setNotifications([])} className="text-xs text-blue-600 hover:underline dark:text-blue-400">
                  Clear all
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto scrollbar-thin">
              {notifications.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-slate-400">No notifications</p>
              ) : (
                notifications.map((n) => (
                  <div key={n.id} className="border-b border-slate-50 px-4 py-3 last:border-0 dark:border-slate-700/50">
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{n.title}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{n.body}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">{renderPage()}</div>
        </main>
      </div>
    </div>
  );
}

function getWeekKey(): string {
  const d = new Date();
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  return d.toISOString().split('T')[0];
}
