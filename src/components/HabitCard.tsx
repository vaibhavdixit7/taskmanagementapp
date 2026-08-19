import { useState, useEffect } from 'react';
import { Flame, Check, Plus, Trash2, Pencil, X, TrendingUp } from 'lucide-react';
import type { Habit, HabitLog } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import { getCategoryColor, getTodayStr, getLast7Days } from '@/lib/utils';

interface HabitCardProps {
  habit: Habit;
  onUpdate: (id: string, updates: Partial<Habit>) => void;
  onDelete: (id: string) => void;
  onAwardPoints: (points: number, reason: string) => void;
}

export default function HabitCard({ habit, onUpdate, onDelete, onAwardPoints }: HabitCardProps) {
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(habit.name);
  const [editTarget, setEditTarget] = useState(habit.target_per_day);
  const today = getTodayStr();
  const last7 = getLast7Days();
  const color = getCategoryColor(habit.color);

  const fetchLogs = async () => {
    const { data } = await supabase
      .from('habit_logs')
      .select('*')
      .eq('habit_id', habit.id)
      .order('completed_date', { ascending: false })
      .limit(30);
    setLogs((data ?? []) as HabitLog[]);
  };

  useEffect(() => {
    fetchLogs();
  }, [habit.id]);

  const todayLogs = logs.filter((l) => l.completed_date === today);
  const todayCount = todayLogs.length;
  const isDoneToday = todayCount >= habit.target_per_day;

  const handleLog = async () => {
    if (isDoneToday) return;

    const { data } = await supabase
      .from('habit_logs')
      .insert({ habit_id: habit.id, completed_date: today })
      .select()
      .single();

    if (data) {
      setLogs((prev) => [data as HabitLog, ...prev]);
      const newCount = todayCount + 1;

      if (newCount >= habit.target_per_day) {
        let newStreak = habit.current_streak;
        if (habit.last_completed_date === today) {
          // already counted today
        } else if (habit.last_completed_date) {
          const diff = Math.round(
            (new Date(today + 'T00:00:00').getTime() - new Date(habit.last_completed_date + 'T00:00:00').getTime()) / 86400000
          );
          newStreak = diff === 1 ? habit.current_streak + 1 : 1;
        } else {
          newStreak = 1;
        }

        const updates = {
          current_streak: newStreak,
          longest_streak: Math.max(habit.longest_streak, newStreak),
          last_completed_date: today,
        };
        await supabase.from('habits').update(updates).eq('id', habit.id);
        onUpdate(habit.id, updates);
        onAwardPoints(5, `Completed habit: ${habit.name}`);
      }
    }
  };

  const handleUnlog = async () => {
    if (todayLogs.length === 0) return;
    const last = todayLogs[0];
    await supabase.from('habit_logs').delete().eq('id', last.id);
    setLogs((prev) => prev.filter((l) => l.id !== last.id));
  };

  const handleSaveEdit = async () => {
    if (!editName.trim()) return;
    const updates = { name: editName.trim(), target_per_day: Math.max(1, editTarget) };
    await supabase.from('habits').update(updates).eq('id', habit.id);
    onUpdate(habit.id, updates);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    await supabase.from('habits').delete().eq('id', habit.id);
    onDelete(habit.id);
  };

  const getLogCountForDate = (date: string) => logs.filter((l) => l.completed_date === date).length;

  if (isEditing) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="space-y-3">
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            autoFocus
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-800 outline-none focus:border-blue-400 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
          />
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-500 dark:text-slate-400">Target per day:</label>
            <input
              type="number"
              min={1}
              max={10}
              value={editTarget}
              onChange={(e) => setEditTarget(Number(e.target.value))}
              className="w-16 rounded-lg border border-slate-200 px-2 py-1.5 text-sm text-slate-700 outline-none focus:border-blue-400 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setIsEditing(false)} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700">
              <X className="h-4 w-4" /> Cancel
            </button>
            <button onClick={handleSaveEdit} className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-blue-700">
              Save
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-slate-700 dark:bg-slate-800">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${color.bg}`}>
            <Flame className={`h-5 w-5 ${color.text}`} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{habit.name}</h3>
            <p className="text-xs text-slate-400">
              Target: {habit.target_per_day}x/day
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button onClick={() => setIsEditing(true)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700">
            <Pencil className="h-4 w-4" />
          </button>
          <button onClick={handleDelete} className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Streak display */}
      <div className="mt-3 flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <Flame className="h-4 w-4 text-orange-500" />
          <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{habit.current_streak}</span>
          <span className="text-xs text-slate-400">current streak</span>
        </div>
        <div className="flex items-center gap-1.5">
          <TrendingUp className="h-4 w-4 text-emerald-500" />
          <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{habit.longest_streak}</span>
          <span className="text-xs text-slate-400">best</span>
        </div>
      </div>

      {/* Last 7 days */}
      <div className="mt-3 flex items-center gap-1.5">
        {last7.map((date) => {
          const count = getLogCountForDate(date);
          const isComplete = count >= habit.target_per_day;
          const dayLabel = new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' });
          const dayNum = new Date(date + 'T00:00:00').getDate();
          return (
            <div key={date} className="flex flex-1 flex-col items-center gap-1">
              <span className="text-xs text-slate-400">{dayLabel.charAt(0)}</span>
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-medium transition-all ${
                  isComplete
                    ? `${color.solid} text-white`
                    : count > 0
                    ? `${color.bg} ${color.text}`
                    : 'bg-slate-100 text-slate-400 dark:bg-slate-700'
                }`}
                title={`${dayLabel} ${dayNum}: ${count}/${habit.target_per_day}`}
              >
                {isComplete ? <Check className="h-4 w-4" /> : count > 0 ? count : dayNum}
              </div>
            </div>
          );
        })}
      </div>

      {/* Action button */}
      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={handleLog}
          disabled={isDoneToday}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold transition-all ${
            isDoneToday
              ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
              : `${color.solid} text-white hover:opacity-90 active:scale-95`
          }`}
        >
          {isDoneToday ? (
            <>
              <Check className="h-4 w-4" /> Done today ({todayCount}/{habit.target_per_day})
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" /> Log ({todayCount}/{habit.target_per_day})
            </>
          )}
        </button>
        {todayCount > 0 && !isDoneToday && (
          <button
            onClick={handleUnlog}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-500 hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-700"
          >
            Undo
          </button>
        )}
      </div>
    </div>
  );
}
