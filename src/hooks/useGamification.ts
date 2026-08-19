import { useEffect, useState, useCallback } from 'react';
import type { Badge, PointsLog } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';

export interface GamificationState {
  totalPoints: number;
  badges: Badge[];
  pointsLog: PointsLog[];
  loading: boolean;
}

export function useGamification() {
  const [state, setState] = useState<GamificationState>({
    totalPoints: 0,
    badges: [],
    pointsLog: [],
    loading: true,
  });

  const fetchAll = useCallback(async () => {
    const [pointsRes, badgesRes] = await Promise.all([
      supabase.from('points_log').select('*').order('created_at', { ascending: false }),
      supabase.from('badges').select('*').order('threshold', { ascending: true }),
    ]);

    const points = (pointsRes.data ?? []) as PointsLog[];
    const badges = (badgesRes.data ?? []) as Badge[];
    const total = points.reduce((sum, p) => sum + p.points, 0);

    setState({ totalPoints: total, badges, pointsLog: points, loading: false });
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const awardPoints = useCallback(
    async (points: number, reason: string) => {
      await supabase.from('points_log').insert({ points, reason });
      await fetchAll();
    },
    [fetchAll]
  );

  const checkAndAwardBadges = useCallback(
    async (metrics: Record<string, number>) => {
      const { data: badges } = await supabase
        .from('badges')
        .select('*')
        .is('earned_at', null);

      if (!badges || badges.length === 0) return;

      const newlyEarned = (badges as Badge[]).filter((b) => {
        const val = metrics[b.metric];
        return val !== undefined && val >= b.threshold;
      });

      for (const badge of newlyEarned) {
        await supabase
          .from('badges')
          .update({ earned_at: new Date().toISOString() })
          .eq('id', badge.id);
      }

      if (newlyEarned.length > 0) {
        await fetchAll();
      }

      return newlyEarned;
    },
    [fetchAll]
  );

  return { ...state, awardPoints, checkAndAwardBadges, refresh: fetchAll };
}
