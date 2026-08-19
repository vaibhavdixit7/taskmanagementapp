import { useState } from 'react';
import {
  Moon,
  Sun,
  Bell,
  BellOff,
  Timer,
  Download,
  Upload,
  Tag,
  Plus,
  Trash2,
  WifiOff,
} from 'lucide-react';
import type { Settings, Category, Task, Habit } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import ExportImportPanel from '@/components/ExportImportPanel';

interface SettingsViewProps {
  settings: Settings | null;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onUpdateSettings: (updates: Partial<Settings>) => void;
  categories: Category[];
  onCategoriesChange: () => void;
  tasks: Task[];
  habits: Habit[];
  onDataImported: () => void;
  notificationPermission: string;
  onRequestNotifications: () => void;
  isOnline: boolean;
}

const categoryColors = ['blue', 'emerald', 'rose', 'amber', 'violet', 'slate'];
const categoryIcons = ['briefcase', 'heart', 'activity', 'book-open', 'shopping-cart', 'circle', 'star', 'flag'];

export default function SettingsView({
  settings,
  darkMode,
  onToggleDarkMode,
  onUpdateSettings,
  categories,
  onCategoriesChange,
  tasks,
  habits,
  onDataImported,
  notificationPermission,
  onRequestNotifications,
  isOnline,
}: SettingsViewProps) {
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('blue');
  const [newCatIcon, setNewCatIcon] = useState('circle');

  const handleAddCategory = async () => {
    if (!newCatName.trim()) return;
    await supabase.from('categories').insert({
      name: newCatName.trim(),
      color: newCatColor,
      icon: newCatIcon,
    });
    setNewCatName('');
    setNewCatColor('blue');
    setNewCatIcon('circle');
    onCategoriesChange();
  };

  const handleDeleteCategory = async (id: string) => {
    await supabase.from('categories').delete().eq('id', id);
    onCategoriesChange();
  };

  return (
    <div className="space-y-6">
      {/* Appearance */}
      <SectionCard title="Appearance" icon={darkMode ? Moon : Sun}>
        <ToggleRow
          label="Dark Mode"
          description="Easy on the eyes, perfect for low-light environments"
          icon={darkMode ? Moon : Sun}
          value={darkMode}
          onChange={onToggleDarkMode}
        />
      </SectionCard>

      {/* Notifications */}
      <SectionCard title="Push Notifications" icon={Bell}>
        <ToggleRow
          label="Enable Notifications"
          description="Get instant alerts for task reminders"
          icon={settings?.notifications_enabled ? Bell : BellOff}
          value={settings?.notifications_enabled ?? false}
          onChange={(val) => {
            if (val && notificationPermission !== 'granted') {
              onRequestNotifications();
            }
            onUpdateSettings({ notifications_enabled: val });
          }}
        />
        {notificationPermission === 'unsupported' && (
          <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
            Your browser does not support push notifications.
          </p>
        )}
        {notificationPermission === 'denied' && (
          <p className="mt-2 text-xs text-rose-600 dark:text-rose-400">
            Notifications are blocked. Please enable them in your browser settings.
          </p>
        )}
        {notificationPermission === 'granted' && settings?.notifications_enabled && (
          <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-400">
            Notifications are enabled and ready.
          </p>
        )}
      </SectionCard>

      {/* Pomodoro Settings */}
      <SectionCard title="Pomodoro Timer" icon={Timer}>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <NumberInput
            label="Work (min)"
            value={settings?.pomodoro_work ?? 25}
            onChange={(val) => onUpdateSettings({ pomodoro_work: val })}
            min={1}
            max={60}
          />
          <NumberInput
            label="Short Break"
            value={settings?.pomodoro_break ?? 5}
            onChange={(val) => onUpdateSettings({ pomodoro_break: val })}
            min={1}
            max={30}
          />
          <NumberInput
            label="Long Break"
            value={settings?.pomodoro_long_break ?? 15}
            onChange={(val) => onUpdateSettings({ pomodoro_long_break: val })}
            min={1}
            max={60}
          />
          <NumberInput
            label="Rounds"
            value={settings?.pomodoro_rounds ?? 4}
            onChange={(val) => onUpdateSettings({ pomodoro_rounds: val })}
            min={1}
            max={10}
          />
        </div>
      </SectionCard>

      {/* Categories */}
      <SectionCard title="Categories" icon={Tag}>
        <div className="space-y-2">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-700/50"
            >
              <span
                className={`h-3 w-3 rounded-full ${
                  cat.color === 'blue' ? 'bg-blue-500' :
                  cat.color === 'emerald' ? 'bg-emerald-500' :
                  cat.color === 'rose' ? 'bg-rose-500' :
                  cat.color === 'amber' ? 'bg-amber-500' :
                  cat.color === 'violet' ? 'bg-violet-500' :
                  'bg-slate-500'
                }`}
              />
              <span className="flex-1 text-sm font-medium text-slate-700 dark:text-slate-200">
                {cat.name}
              </span>
              <span className="text-xs text-slate-400">
                {tasks.filter((t) => t.category_id === cat.id).length} tasks
              </span>
              <button
                onClick={() => handleDeleteCategory(cat.id)}
                className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Add new category */}
        <div className="mt-4 space-y-3 rounded-lg border border-dashed border-slate-200 p-3 dark:border-slate-600">
          <input
            type="text"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
            placeholder="New category name"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
          />
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              {categoryColors.map((c) => (
                <button
                  key={c}
                  onClick={() => setNewCatColor(c)}
                  className={`h-6 w-6 rounded-full transition-all ${
                    newCatColor === c ? 'ring-2 ring-offset-2 ring-slate-400 dark:ring-offset-slate-800' : ''
                  } ${
                    c === 'blue' ? 'bg-blue-500' :
                    c === 'emerald' ? 'bg-emerald-500' :
                    c === 'rose' ? 'bg-rose-500' :
                    c === 'amber' ? 'bg-amber-500' :
                    c === 'violet' ? 'bg-violet-500' :
                    'bg-slate-500'
                  }`}
                />
              ))}
            </div>
            <button
              onClick={handleAddCategory}
              disabled={!newCatName.trim()}
              className="ml-auto flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white transition-all hover:bg-blue-700 active:scale-95 disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              Add
            </button>
          </div>
        </div>
      </SectionCard>

      {/* Offline Mode */}
      <SectionCard title="Offline Mode" icon={WifiOff}>
        <div className="flex items-center gap-3 rounded-lg bg-slate-50 px-4 py-3 dark:bg-slate-700/50">
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${isOnline ? 'bg-emerald-50 dark:bg-emerald-500/10' : 'bg-rose-50 dark:bg-rose-500/10'}`}>
            {isOnline ? <WifiOff className="h-5 w-5 text-emerald-500" /> : <WifiOff className="h-5 w-5 text-rose-500" />}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              {isOnline ? 'You are online' : 'You are offline'}
            </p>
            <p className="text-xs text-slate-400">
              {isOnline
                ? 'All changes are saved to the cloud automatically.'
                : 'Changes are queued and will sync when you reconnect.'}
            </p>
          </div>
        </div>
      </SectionCard>

      {/* Export / Import */}
      <SectionCard title="Backup & Restore" icon={Download}>
        <ExportImportPanel
          tasks={tasks}
          habits={habits}
          categories={categories}
          settings={settings}
          onDataImported={onDataImported}
        />
      </SectionCard>
    </div>
  );
}

function SectionCard({ title, icon: Icon, children }: { title: string; icon: typeof Moon; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
        <Icon className="h-4 w-4 text-slate-400" />
        {title}
      </h3>
      {children}
    </div>
  );
}

function ToggleRow({
  label,
  description,
  icon: Icon,
  value,
  onChange,
}: {
  label: string;
  description: string;
  icon: typeof Moon;
  value: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700">
        <Icon className="h-5 w-5 text-slate-500 dark:text-slate-400" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</p>
        <p className="text-xs text-slate-400">{description}</p>
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`relative h-6 w-11 flex-shrink-0 rounded-full transition-colors ${
          value ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all ${
          value ? 'left-[22px]' : 'left-0.5'
        }`}
        />
      </button>
    </div>
  );
}

function NumberInput({
  label,
  value,
  onChange,
  min,
  max,
}: {
  label: string;
  value: number;
  onChange: (val: number) => void;
  min: number;
  max: number;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Math.max(min, Math.min(max, Number(e.target.value))))}
        min={min}
        max={max}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
      />
    </div>
  );
}
