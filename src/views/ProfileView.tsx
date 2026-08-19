import { useState, useEffect, useCallback } from 'react';
import {
  Pencil,
  Check,
  X,
  Trophy,
  Star,
  Flame,
  Target,
  Zap,
  Calendar,
  Users,
  Award,
  TrendingUp,
} from 'lucide-react';
import type { Profile, Badge, Task, Habit, Reward } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import { isOverdue, formatDate } from '@/lib/utils';

interface ProfileViewProps {
  profile: Profile | null;
  badges: Badge[];
  tasks: Task[];
  habits: Habit[];
  totalPoints: number;
  rewards: Reward[];
  onProfileUpdate: () => void;
  onAwardPoints: (points: number, reason: string) => void;
}

const avatarOptions = ['🦸', '🦊', '🐱', '🐶', '🦁', '🐼', '🦉', '🦄', '🐙', '🦋', '🌟', '🚀', '⚡', '🔥', '💎', '🎯'];
const titleOptions = ['Rookie', 'Explorer', 'Achiever', 'Pro', 'Master', 'Legend', 'Champion', 'Grandmaster'];

export default function ProfileView({
  profile,
  badges,
  tasks,
  habits,
  totalPoints,
  rewards,
  onProfileUpdate,
  onAwardPoints,
}: ProfileViewProps) {
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(profile?.display_name ?? '');
  const [editEmoji, setEditEmoji] = useState(profile?.avatar_emoji ?? '🦸');
  const [editBio, setEditBio] = useState(profile?.bio ?? '');
  const [editTitle, setEditTitle] = useState(profile?.title ?? 'Rookie');

  useEffect(() => {
    if (profile) {
      setEditName(profile.display_name);
      setEditEmoji(profile.avatar_emoji);
      setEditBio(profile.bio ?? '');
      setEditTitle(profile.title);
    }
  }, [profile]);

  const handleSave = useCallback(async () => {
    if (!profile || !editName.trim()) return;
    await supabase
      .from('profiles')
      .update({
        display_name: editName.trim(),
        avatar_emoji: editEmoji,
        bio: editBio.trim() || null,
        title: editTitle,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.id);
    setEditing(false);
    onProfileUpdate();
  }, [profile, editName, editEmoji, editBio, editTitle, onProfileUpdate]);

  const handleClaimReward = useCallback(
    async (reward: Reward) => {
      if (reward.claimed_at || !profile || totalPoints < reward.points_required) return;
      await supabase
        .from('rewards')
        .update({ claimed_at: new Date().toISOString(), profile_id: profile.id })
        .eq('id', reward.id);
      onProfileUpdate();
    },
    [profile, totalPoints, onProfileUpdate]
  );

  const stats = {
    completed: tasks.filter((t) => t.completed).length,
    active: tasks.filter((t) => !t.completed).length,
    overdue: tasks.filter(isOverdue).length,
    bestStreak: habits.length > 0 ? Math.max(...habits.map((h) => h.longest_streak)) : 0,
    activeStreaks: habits.filter((h) => h.current_streak > 0).length,
  };

  const earnedBadges = badges.filter((b) => b.earned_at !== null);
  const xpForNextLevel = (profile?.level ?? 1) * 100;
  const xpProgress = ((profile?.xp ?? 0) % xpForNextLevel) / xpForNextLevel * 100;

  const profileStats = [
    { icon: Trophy, label: 'Total Points', value: totalPoints, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10' },
    { icon: Check, label: 'Tasks Done', value: stats.completed, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
    { icon: Flame, label: 'Best Streak', value: `${stats.bestStreak}d`, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-500/10' },
    { icon: Award, label: 'Badges', value: earnedBadges.length, color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-500/10' },
  ];

  return (
    <div className="space-y-6">
      {/* Profile header */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="h-24 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600" />
        <div className="px-6 pb-6">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-end">
            <div className="-mt-12 flex h-24 w-24 items-center justify-center rounded-2xl bg-white text-5xl shadow-lg dark:bg-slate-800">
              {profile?.avatar_emoji ?? '🦸'}
            </div>
            <div className="flex-1 pb-1">
              {editing ? (
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="rounded-lg border border-slate-200 px-3 py-1 text-lg font-bold text-slate-800 outline-none focus:border-blue-400 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                />
              ) : (
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">{profile?.display_name ?? 'You'}</h2>
              )}
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                  <Star className="h-3 w-3" /> Level {profile?.level ?? 1}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-semibold text-violet-600 dark:bg-violet-500/10 dark:text-violet-400">
                  <Award className="h-3 w-3" /> {profile?.title ?? 'Rookie'}
                </span>
                <span className="text-xs text-slate-400">Joined {profile ? formatDate(profile.created_at) : ''}</span>
              </div>
            </div>
            <div className="pb-1">
              {editing ? (
                <div className="flex gap-2">
                  <button onClick={() => setEditing(false)} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700">
                    <X className="h-4 w-4" /> Cancel
                  </button>
                  <button onClick={handleSave} className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700">
                    <Check className="h-4 w-4" /> Save
                  </button>
                </div>
              ) : (
                <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700">
                  <Pencil className="h-4 w-4" /> Edit
                </button>
              )}
            </div>
          </div>

          {/* Bio */}
          {editing ? (
            <div className="mt-4 space-y-4">
              <textarea
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                placeholder="Tell us about yourself..."
                rows={2}
                className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 outline-none focus:border-blue-400 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
              />
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-500">Choose avatar</label>
                <div className="flex flex-wrap gap-2">
                  {avatarOptions.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => setEditEmoji(emoji)}
                      className={`flex h-10 w-10 items-center justify-center rounded-lg text-2xl transition-all ${
                        editEmoji === emoji ? 'bg-blue-100 ring-2 ring-blue-400 dark:bg-blue-500/20' : 'bg-slate-100 dark:bg-slate-700'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-500">Choose title</label>
                <div className="flex flex-wrap gap-2">
                  {titleOptions.map((title) => (
                    <button
                      key={title}
                      onClick={() => setEditTitle(title)}
                      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                        editTitle === title
                          ? 'bg-violet-100 text-violet-700 ring-2 ring-violet-400 dark:bg-violet-500/20 dark:text-violet-300'
                          : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                      }`}
                    >
                      {title}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            profile?.bio && <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{profile.bio}</p>
          )}

          {/* XP bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Level {profile?.level ?? 1} · {profile?.xp ?? 0} XP</span>
              <span>Next level at {xpForNextLevel} XP</span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-500"
                style={{ width: `${Math.max(xpProgress, 3)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {profileStats.map((stat) => {
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

      {/* Badges */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
          <Trophy className="h-4 w-4 text-amber-500" /> Badges Earned
        </h3>
        {earnedBadges.length === 0 ? (
          <p className="py-4 text-center text-sm text-slate-400">No badges yet. Start completing tasks!</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {earnedBadges.map((badge) => (
              <div key={badge.id} className="flex flex-col items-center rounded-xl border border-amber-200 bg-gradient-to-b from-amber-50 to-white p-4 text-center dark:border-amber-500/20 dark:from-amber-500/10 dark:to-slate-800">
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-md">
                  <Award className="h-6 w-6 text-white" />
                </div>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{badge.name}</p>
                <p className="mt-0.5 text-xs text-slate-400">{badge.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rewards shop */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
          <Target className="h-4 w-4 text-emerald-500" /> Rewards Shop
        </h3>
        <p className="mb-4 text-xs text-slate-400">Spend your points to unlock rewards. You have {totalPoints} points.</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {rewards.map((reward) => {
            const canClaim = !reward.claimed_at && totalPoints >= reward.points_required;
            const claimed = !!reward.claimed_at;
            return (
              <div
                key={reward.id}
                className={`flex items-center gap-3 rounded-xl border p-4 transition-all ${
                  claimed
                    ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/10'
                    : canClaim
                    ? 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800'
                    : 'border-slate-200 bg-slate-50 opacity-60 dark:border-slate-700 dark:bg-slate-800/50'
                }`}
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                  claimed ? 'bg-emerald-100 dark:bg-emerald-500/20' : 'bg-amber-100 dark:bg-amber-500/20'
                }`}>
                  {claimed ? <Check className="h-5 w-5 text-emerald-600 dark:text-emerald-400" /> : <Trophy className="h-5 w-5 text-amber-600 dark:text-amber-400" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{reward.name}</p>
                  <p className="text-xs text-slate-400">{reward.description}</p>
                </div>
                <div className="text-right">
                  {claimed ? (
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Claimed!</span>
                  ) : (
                    <>
                      <p className="text-sm font-bold text-amber-600 dark:text-amber-400">{reward.points_required} pts</p>
                      <button
                        onClick={() => handleClaimReward(reward)}
                        disabled={!canClaim}
                        className="mt-1 rounded-lg bg-blue-600 px-3 py-1 text-xs font-semibold text-white transition-all hover:bg-blue-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Claim
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
