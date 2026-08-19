import { useEffect, useState, useCallback } from 'react';
import type { Settings } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';

export function useSettings() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    const { data } = await supabase
      .from('settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle();
    if (data) setSettings(data as Settings);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSettings = useCallback(async (updates: Partial<Settings>) => {
    const { data } = await supabase
      .from('settings')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', 1)
      .select()
      .single();
    if (data) setSettings(data as Settings);
  }, []);

  return { settings, loading, updateSettings };
}

export function useDarkMode(initialDark: boolean) {
  const [darkMode, setDarkMode] = useState(initialDark);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return { darkMode, setDarkMode };
}
