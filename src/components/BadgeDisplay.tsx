import { Trophy, Lock, Star, Award } from 'lucide-react';
import type { Badge } from '@/lib/supabase';
import { formatRelativeTime } from '@/lib/utils';

interface BadgeDisplayProps {
  badges: Badge[];
  totalPoints: number;
}

export default function BadgeDisplay({ badges, totalPoints }: BadgeDisplayProps) {
  const earned = badges.filter((b) => b.earned_at !== null);
  const unearned = badges.filter((b) => b.earned_at === null);

  return (
    <div className="space-y-6">
      {/* Points summary */}
      <div className="flex items-center gap-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 p-5 dark:from-amber-500/10 dark:to-orange-500/10">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg">
          <Star className="h-7 w-7 text-white" />
        </div>
        <div>
          <p className="text-3xl font-bold text-slate-800 dark:text-white">{totalPoints}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">Total points earned</p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-2xl font-bold text-slate-800 dark:text-white">{earned.length}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">Badges unlocked</p>
        </div>
      </div>

      {/* Earned badges */}
      {earned.length > 0 && (
        <div>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <Trophy className="h-4 w-4 text-amber-500" />
            Earned Badges
          </h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {earned.map((badge) => (
              <div
                key={badge.id}
                className="flex flex-col items-center rounded-xl border border-amber-200 bg-gradient-to-b from-amber-50 to-white p-4 text-center shadow-sm dark:border-amber-500/20 dark:from-amber-500/10 dark:to-slate-800"
              >
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-md">
                  <Award className="h-6 w-6 text-white" />
                </div>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{badge.name}</p>
                <p className="mt-0.5 text-xs text-slate-400">{badge.description}</p>
                <p className="mt-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                  {formatRelativeTime(badge.earned_at!)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Locked badges */}
      {unearned.length > 0 && (
        <div>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <Lock className="h-4 w-4 text-slate-400" />
            Locked Badges
          </h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {unearned.map((badge) => (
              <div
                key={badge.id}
                className="flex flex-col items-center rounded-xl border border-slate-200 bg-slate-50 p-4 text-center dark:border-slate-700 dark:bg-slate-700/30"
              >
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-600">
                  <Lock className="h-6 w-6 text-slate-400" />
                </div>
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400">{badge.name}</p>
                <p className="mt-0.5 text-xs text-slate-400">{badge.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
