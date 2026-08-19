import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, Coffee, Brain, SkipForward } from 'lucide-react';
import type { Settings } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';

interface PomodoroTimerProps {
  settings: Settings | null;
  onSessionComplete: (minutes: number, type: 'work' | 'break') => void;
  onAwardPoints: (points: number, reason: string) => void;
}

type Phase = 'work' | 'break' | 'long-break';

export default function PomodoroTimer({ settings, onSessionComplete, onAwardPoints }: PomodoroTimerProps) {
  const workMin = settings?.pomodoro_work ?? 25;
  const breakMin = settings?.pomodoro_break ?? 5;
  const longBreakMin = settings?.pomodoro_long_break ?? 15;
  const roundsBeforeLongBreak = settings?.pomodoro_rounds ?? 4;

  const [phase, setPhase] = useState<Phase>('work');
  const [secondsLeft, setSecondsLeft] = useState(workMin * 60);
  const [running, setRunning] = useState(false);
  const [completedRounds, setCompletedRounds] = useState(0);
  const [totalSessions, setTotalSessions] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const phaseDuration = useCallback(() => {
    if (phase === 'work') return workMin * 60;
    if (phase === 'break') return breakMin * 60;
    return longBreakMin * 60;
  }, [phase, workMin, breakMin, longBreakMin]);

  useEffect(() => {
    if (!running) {
      setSecondsLeft(phaseDuration());
    }
  }, [phase, running, phaseDuration]);

  useEffect(() => {
    if (!running) return;

    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  useEffect(() => {
    if (secondsLeft === 0 && running) {
      setRunning(false);
      const minutes = phase === 'work' ? workMin : phase === 'break' ? breakMin : longBreakMin;
      onSessionComplete(minutes, phase === 'work' ? 'work' : 'break');

      if (phase === 'work') {
        onAwardPoints(10, 'Completed a Pomodoro focus session');
        const newRounds = completedRounds + 1;
        setCompletedRounds(newRounds);
        setTotalSessions((p) => p + 1);
        setPhase(newRounds % roundsBeforeLongBreak === 0 ? 'long-break' : 'break');
      } else {
        setPhase('work');
      }
    }
  }, [secondsLeft, running, phase, workMin, breakMin, longBreakMin, completedRounds, roundsBeforeLongBreak, onSessionComplete, onAwardPoints]);

  const handleStart = () => setRunning(true);
  const handlePause = () => setRunning(false);
  const handleReset = () => {
    setRunning(false);
    setSecondsLeft(phaseDuration());
  };
  const handleSkip = () => {
    setRunning(false);
    setSecondsLeft(0);
  };

  const minutes = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const progress = 1 - secondsLeft / phaseDuration();
  const circumference = 2 * Math.PI * 120;

  const phaseColors: Record<Phase, { ring: string; bg: string; text: string; icon: typeof Brain; label: string }> = {
    work: { ring: 'text-blue-500', bg: 'from-blue-500 to-blue-600', text: 'text-blue-600 dark:text-blue-400', icon: Brain, label: 'Focus Time' },
    break: { ring: 'text-emerald-500', bg: 'from-emerald-500 to-emerald-600', text: 'text-emerald-600 dark:text-emerald-400', icon: Coffee, label: 'Short Break' },
    'long-break': { ring: 'text-violet-500', bg: 'from-violet-500 to-violet-600', text: 'text-violet-600 dark:text-violet-400', icon: Coffee, label: 'Long Break' },
  };

  const pc = phaseColors[phase];
  const PhaseIcon = pc.icon;

  return (
    <div className="flex flex-col items-center">
      {/* Phase indicator */}
      <div className={`mb-4 flex items-center gap-2 rounded-full bg-gradient-to-r ${pc.bg} px-4 py-1.5 text-sm font-semibold text-white shadow-md`}>
        <PhaseIcon className="h-4 w-4" />
        {pc.label}
      </div>

      {/* Circular timer */}
      <div className="relative flex h-72 w-72 items-center justify-center">
        <svg className="absolute h-full w-full -rotate-90" viewBox="0 0 256 256">
          <circle
            cx="128"
            cy="128"
            r="120"
            fill="none"
            strokeWidth="8"
            className="stroke-slate-200 dark:stroke-slate-700"
          />
          <circle
            cx="128"
            cy="128"
            r="120"
            fill="none"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progress)}
            className={`${pc.ring} transition-all duration-500`}
          />
        </svg>
        <div className="flex flex-col items-center">
          <span className="text-5xl font-bold tabular-nums text-slate-800 dark:text-white">
            {String(minutes).padStart(2, '0')}:{String(secs).padStart(2, '0')}
          </span>
          <span className="mt-1 text-sm text-slate-400">
            Round {completedRounds + 1} of {roundsBeforeLongBreak}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="mt-6 flex items-center gap-3">
        {!running ? (
          <button
            onClick={handleStart}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition-all hover:bg-blue-700 active:scale-95"
          >
            <Play className="h-5 w-5" />
            Start
          </button>
        ) : (
          <button
            onClick={handlePause}
            className="flex items-center gap-2 rounded-xl bg-slate-700 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:bg-slate-800 active:scale-95 dark:bg-slate-600 dark:hover:bg-slate-500"
          >
            <Pause className="h-5 w-5" />
            Pause
          </button>
        )}
        <button
          onClick={handleReset}
          className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-600 transition-all hover:bg-slate-100 active:scale-95 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <RotateCcw className="h-5 w-5" />
          Reset
        </button>
        <button
          onClick={handleSkip}
          className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-600 transition-all hover:bg-slate-100 active:scale-95 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <SkipForward className="h-5 w-5" />
          Skip
        </button>
      </div>

      {/* Stats */}
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-center dark:border-slate-700 dark:bg-slate-800">
          <p className="text-2xl font-bold text-slate-800 dark:text-white">{totalSessions}</p>
          <p className="text-xs text-slate-400">Sessions Today</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-center dark:border-slate-700 dark:bg-slate-800">
          <p className="text-2xl font-bold text-slate-800 dark:text-white">{completedRounds}</p>
          <p className="text-xs text-slate-400">Rounds Done</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-center dark:border-slate-700 dark:bg-slate-800">
          <p className="text-2xl font-bold text-slate-800 dark:text-white">{totalSessions * workMin}m</p>
          <p className="text-xs text-slate-400">Focus Time</p>
        </div>
      </div>
    </div>
  );
}
