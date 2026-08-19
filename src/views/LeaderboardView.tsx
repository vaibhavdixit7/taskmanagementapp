import { useState, useEffect, useCallback } from 'react';
import { Trophy, Crown, Medal, Users, UserPlus, UserCheck, Flame, Star, TrendingUp } from 'lucide-react';
import type { Profile, LeaderboardEntry, Connection, PeriodType } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';

interface LeaderboardViewProps {
  currentProfile: Profile | null;
  onAwardPoints: (points: number, reason: string) => void;
}

const periodTabs: { value: PeriodType; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

function getPeriodKey(type: PeriodType): string {
  const now = new Date();
  if (type === 'daily') return now.toISOString().split('T')[0];
  if (type === 'weekly') {
    const d = new Date(now);
    const day = d.getDay();
    d.setDate(d.getDate() - day);
    return d.toISOString().split('T')[0];
  }
  if (type === 'monthly') return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  if (type === 'yearly') return `${now.getFullYear()}`;
  return 'all';
}

export default function LeaderboardView({ currentProfile, onAwardPoints }: LeaderboardViewProps) {
  const [period, setPeriod] = useState<PeriodType>('weekly');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = useCallback(async () => {
    const periodKey = getPeriodKey(period);
    const { data } = await supabase
      .from('leaderboard_entries')
      .select('*, profiles(*)')
      .eq('period_type', period)
      .eq('period_key', periodKey)
      .order('points', { ascending: false })
      .limit(50);
    setEntries((data ?? []) as LeaderboardEntry[]);
  }, [period]);

  const fetchProfiles = useCallback(async () => {
    const { data } = await supabase.from('profiles').select('*').order('xp', { ascending: false });
    setProfiles((data ?? []) as Profile[]);
  }, []);

  const fetchConnections = useCallback(async () => {
    if (!currentProfile) return;
    const { data } = await supabase
      .from('connections')
      .select('*')
      .or(`follower_id.eq.${currentProfile.id},following_id.eq.${currentProfile.id}`);
    setConnections((data ?? []) as Connection[]);
  }, [currentProfile]);

  useEffect(() => {
    Promise.all([fetchLeaderboard(), fetchProfiles(), fetchConnections()]).then(() => setLoading(false));
  }, [fetchLeaderboard, fetchProfiles, fetchConnections]);

  const handleConnect = useCallback(
    async (targetId: string) => {
      if (!currentProfile || targetId === currentProfile.id) return;
      const existing = connections.find(
        (c) => c.follower_id === currentProfile.id && c.following_id === targetId
      );
      if (existing) {
        await supabase.from('connections').delete().eq('id', existing.id);
      } else {
        await supabase.from('connections').insert({ follower_id: currentProfile.id, following_id: targetId });
        onAwardPoints(5, 'Connected with a new person');
      }
      fetchConnections();
    },
    [currentProfile, connections, onAwardPoints, fetchConnections]
  );

  const isFollowing = (profileId: string) =>
    currentProfile ? connections.some((c) => c.follower_id === currentProfile.id && c.following_id === profileId) : false;

  const rankIcon = (rank: number) => {
    if (rank === 0) return <Crown className="h-5 w-5 text-amber-500" />;
    if (rank === 1) return <Medal className="h-5 w-5 text-slate-400" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-orange-600" />;
    return <span className="text-sm font-bold text-slate-400">#{rank + 1}</span>;
  };

  return (
    <div className="space-y-6">
      {/* Period tabs */}
      <div className="flex flex-wrap gap-1.5">
        {periodTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setPeriod(tab.value)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
              period === tab.value
                ? 'bg-slate-800 text-white shadow-sm dark:bg-slate-700'
                : 'bg-white text-slate-500 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
            }`}
          >
            <Trophy className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Top 3 podium */}
      {!loading && entries.length >= 3 && (
        <div className="grid grid-cols-3 gap-3">
          {[1, 0, 2].map((displayIdx) => {
            const entry = entries[displayIdx];
            if (!entry) return null;
            const isFirst = displayIdx === 0;
            return (
              <div
                key={entry.id}
                className={`flex flex-col items-center rounded-2xl border p-4 text-center ${
                  isFirst
                    ? 'border-amber-300 bg-gradient-to-b from-amber-50 to-white dark:border-amber-500/30 dark:from-amber-500/10 dark:to-slate-800'
                    : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800'
                }`}
              >
                <div className={`flex h-14 items-end justify-center ${isFirst ? 'mb-2' : 'mb-1'}`}>
                  {isFirst ? (
                    <Crown className="h-8 w-8 text-amber-500" />
                  ) : displayIdx === 1 ? (
                    <Medal className="h-6 w-6 text-slate-400" />
                  ) : (
                    <Medal className="h-6 w-6 text-orange-600" />
                  )}
                </div>
                <span className={`mb-1 ${isFirst ? 'text-3xl' : 'text-2xl'}`}>{entry.profiles?.avatar_emoji ?? '👤'}</span>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate w-full">
                  {entry.profiles?.display_name ?? 'Unknown'}
                </p>
                <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{entry.points}</p>
                <p className="text-xs text-slate-400">pts</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Full leaderboard */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="border-b border-slate-100 px-5 py-3 dark:border-slate-700">
          <h3 className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
            <TrendingUp className="h-4 w-4 text-blue-500" /> Global Rankings — {periodTabs.find((t) => t.value === period)?.label}
          </h3>
        </div>
        <div className="divide-y divide-slate-50 dark:divide-slate-700/50">
          {loading ? (
            <p className="px-5 py-8 text-center text-sm text-slate-400">Loading rankings...</p>
          ) : entries.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-slate-400">
              No entries yet for this period. Complete tasks to climb the ranks!
            </p>
          ) : (
            entries.map((entry, idx) => {
              const isMe = currentProfile && entry.profile_id === currentProfile.id;
              return (
                <div
                  key={entry.id}
                  className={`flex items-center gap-3 px-5 py-3 ${
                    isMe ? 'bg-blue-50 dark:bg-blue-500/10' : ''
                  }`}
                >
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center">
                    {rankIcon(idx)}
                  </div>
                  <span className="text-2xl">{entry.profiles?.avatar_emoji ?? '👤'}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate ${isMe ? 'text-blue-700 dark:text-blue-400' : 'text-slate-700 dark:text-slate-200'}`}>
                      {entry.profiles?.display_name ?? 'Unknown'} {isMe && '(You)'}
                    </p>
                    <p className="text-xs text-slate-400">
                      {entry.tasks_completed} tasks · {entry.profiles?.title ?? 'Rookie'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-amber-600 dark:text-amber-400">{entry.points}</p>
                    <p className="text-xs text-slate-400">pts</p>
                  </div>
                  {currentProfile && !isMe && (
                    <button
                      onClick={() => handleConnect(entry.profile_id)}
                      className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all ${
                        isFollowing(entry.profile_id)
                          ? 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                          : 'bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20'
                      }`}
                    >
                      {isFollowing(entry.profile_id) ? (
                        <><UserCheck className="h-3.5 w-3.5" /> Following</>
                      ) : (
                        <><UserPlus className="h-3.5 w-3.5" /> Follow</>
                      )}
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* People to connect with */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
          <Users className="h-4 w-4 text-blue-500" /> People You Can Connect With
        </h3>
        {profiles.length <= 1 ? (
          <p className="py-4 text-center text-sm text-slate-400">No other users yet. Invite friends to join the competition!</p>
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {profiles
              .filter((p) => !currentProfile || p.id !== currentProfile.id)
              .slice(0, 6)
              .map((p) => (
                <div key={p.id} className="flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-2.5 dark:bg-slate-700/50">
                  <span className="text-2xl">{p.avatar_emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">{p.display_name}</p>
                    <p className="text-xs text-slate-400">Level {p.level} · {p.title}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                    <Star className="h-3 w-3" /> {p.xp} XP
                  </div>
                  <button
                    onClick={() => handleConnect(p.id)}
                    className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all ${
                      isFollowing(p.id)
                        ? 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                        : 'bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20'
                    }`}
                  >
                    {isFollowing(p.id) ? (
                      <><UserCheck className="h-3.5 w-3.5" /></>
                    ) : (
                      <><UserPlus className="h-3.5 w-3.5" /></>
                    )}
                  </button>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
