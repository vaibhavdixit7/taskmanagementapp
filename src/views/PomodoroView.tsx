import { useCallback } from 'react';
import type { Settings } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import PomodoroTimer from '@/components/PomodoroTimer';

interface PomodoroViewProps {
  settings: Settings | null;
  onAwardPoints: (points: number, reason: string) => void;
}

export default function PomodoroView({ settings, onAwardPoints }: PomodoroViewProps) {
  const handleSessionComplete = useCallback(
    async (minutes: number, type: 'work' | 'break') => {
      await supabase.from('pomodoro_sessions').insert({
        duration_minutes: minutes,
        session_type: type,
      });
    },
    []
  );

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-8">
        <PomodoroTimer
          settings={settings}
          onSessionComplete={handleSessionComplete}
          onAwardPoints={onAwardPoints}
        />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <h3 className="mb-3 text-sm font-bold text-slate-700 dark:text-slate-200">How It Works</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-500/10">
            <p className="text-sm font-semibold text-blue-700 dark:text-blue-400">1. Focus</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Work for {settings?.pomodoro_work ?? 25} minutes with full concentration on a single task.
            </p>
          </div>
          <div className="rounded-lg bg-emerald-50 p-4 dark:bg-emerald-500/10">
            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">2. Break</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Take a {settings?.pomodoro_break ?? 5} minute short break to recharge.
            </p>
          </div>
          <div className="rounded-lg bg-violet-50 p-4 dark:bg-violet-500/10">
            <p className="text-sm font-semibold text-violet-700 dark:text-violet-400">3. Long Break</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              After {settings?.pomodoro_rounds ?? 4} rounds, enjoy a {settings?.pomodoro_long_break ?? 15} minute long break.
            </p>
          </div>
        </div>
        <p className="mt-4 text-xs text-slate-400">
          Earn 10 points for each completed focus session. Your sessions are tracked in the Analytics page.
        </p>
      </div>
    </div>
  );
}
