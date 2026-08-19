import { useState, useCallback } from 'react';
import { Plus, Flame, Loader2, X } from 'lucide-react';
import type { Habit } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import HabitCard from '@/components/HabitCard';

interface HabitsViewProps {
  habits: Habit[];
  loading: boolean;
  onHabitsChange: () => void;
  onAwardPoints: (points: number, reason: string) => void;
}

export default function HabitsView({ habits, loading, onHabitsChange, onAwardPoints }: HabitsViewProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newTarget, setNewTarget] = useState(1);
  const [newColor, setNewColor] = useState('blue');

  const colors = ['blue', 'emerald', 'rose', 'amber', 'violet'];

  const handleAdd = useCallback(async () => {
    if (!newName.trim()) return;
    const { data } = await supabase
      .from('habits')
      .insert({
        name: newName.trim(),
        target_per_day: Math.max(1, newTarget),
        color: newColor,
      })
      .select()
      .single();
    if (data) {
      setNewName('');
      setNewTarget(1);
      setNewColor('blue');
      setShowAddForm(false);
      onHabitsChange();
    }
  }, [newName, newTarget, newColor, onHabitsChange]);

  const handleUpdate = useCallback((id: string, updates: Partial<Habit>) => {
    onHabitsChange();
  }, [onHabitsChange]);

  const handleDelete = useCallback(() => {
    onHabitsChange();
  }, [onHabitsChange]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-orange-500" />
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {habits.length} {habits.length === 1 ? 'habit' : 'habits'} tracked
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition-all hover:bg-blue-700 active:scale-95"
        >
          {showAddForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showAddForm ? 'Cancel' : 'New Habit'}
        </button>
      </div>

      {/* Add form */}
      {showAddForm && (
        <div className="animate-slide-down rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="space-y-3">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              autoFocus
              placeholder="Habit name (e.g. Drink water, Exercise, Read)"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
            />
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-sm text-slate-500 dark:text-slate-400">Target/day:</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={newTarget}
                  onChange={(e) => setNewTarget(Number(e.target.value))}
                  className="w-16 rounded-lg border border-slate-200 px-2 py-1.5 text-sm text-slate-700 outline-none focus:border-blue-400 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-slate-500 dark:text-slate-400">Color:</label>
                <div className="flex gap-1.5">
                  {colors.map((c) => (
                    <button
                      key={c}
                      onClick={() => setNewColor(c)}
                      className={`h-6 w-6 rounded-full transition-all ${
                        newColor === c ? 'ring-2 ring-offset-2 ring-slate-400 dark:ring-offset-slate-800' : ''
                      } ${
                        c === 'blue' ? 'bg-blue-500' :
                        c === 'emerald' ? 'bg-emerald-500' :
                        c === 'rose' ? 'bg-rose-500' :
                        c === 'amber' ? 'bg-amber-500' :
                        'bg-violet-500'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <button
                onClick={handleAdd}
                disabled={!newName.trim()}
                className="ml-auto rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white transition-all hover:bg-blue-700 active:scale-95 disabled:opacity-50"
              >
                Add Habit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Habits grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      ) : habits.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white py-16 text-center dark:border-slate-700 dark:bg-slate-800">
          <Flame className="mb-3 h-10 w-10 text-slate-300 dark:text-slate-600" />
          <p className="text-sm font-medium text-slate-400">
            No habits yet. Start building a streak!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {habits.map((habit) => (
            <HabitCard
              key={habit.id}
              habit={habit}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
              onAwardPoints={onAwardPoints}
            />
          ))}
        </div>
      )}
    </div>
  );
}
