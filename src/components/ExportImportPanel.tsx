import { Download, Upload, FileJson, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import type { Task, Habit, Category, Settings } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';

interface ExportImportPanelProps {
  tasks: Task[];
  habits: Habit[];
  categories: Category[];
  settings: Settings | null;
  onDataImported: () => void;
}

export default function ExportImportPanel({
  tasks,
  habits,
  categories,
  settings,
  onDataImported,
}: ExportImportPanelProps) {
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null; msg: string }>({ type: null, msg: '' });

  const handleExport = () => {
    const backup = {
      exported_at: new Date().toISOString(),
      version: 1,
      tasks,
      habits,
      categories,
      settings,
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `taskflow-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setStatus({ type: 'success', msg: 'Backup exported successfully!' });
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (data.tasks) {
        for (const task of data.tasks as Task[]) {
          const { id, categories: _c, task_comments: _tc, ...rest } = task;
          await supabase.from('tasks').upsert({
            ...rest,
            id: id,
          }, { onConflict: 'id' });
        }
      }

      if (data.habits) {
        for (const habit of data.habits as Habit[]) {
          await supabase.from('habits').upsert(habit, { onConflict: 'id' });
        }
      }

      if (data.categories) {
        for (const cat of data.categories as Category[]) {
          await supabase.from('categories').upsert(cat, { onConflict: 'id' });
        }
      }

      if (data.settings) {
        await supabase.from('settings').upsert(data.settings, { onConflict: 'id' });
      }

      setStatus({ type: 'success', msg: `Imported ${data.tasks?.length ?? 0} tasks, ${data.habits?.length ?? 0} habits successfully!` });
      onDataImported();
    } catch (err) {
      setStatus({ type: 'error', msg: 'Failed to import backup. Make sure the file is a valid TaskFlow backup.' });
    }

    event.target.value = '';
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Export */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-500/10">
              <Download className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">Export Backup</h3>
              <p className="text-xs text-slate-400">Download all your data as JSON</p>
            </div>
          </div>
          <button
            onClick={handleExport}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-blue-700 active:scale-95"
          >
            <FileJson className="h-4 w-4" />
            Export Data
          </button>
        </div>

        {/* Import */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-500/10">
              <Upload className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">Import Backup</h3>
              <p className="text-xs text-slate-400">Restore from a JSON file</p>
            </div>
          </div>
          <label className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition-all hover:border-emerald-400 hover:bg-emerald-50 dark:border-slate-600 dark:text-slate-300 dark:hover:border-emerald-500/50">
            <Upload className="h-4 w-4" />
            Choose File
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
        </div>
      </div>

      {/* Status message */}
      {status.type && (
        <div
          className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm ${
            status.type === 'success'
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
              : 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400'
          }`}
        >
          {status.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
          )}
          {status.msg}
        </div>
      )}

      {/* Data summary */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
        <h3 className="mb-3 text-sm font-bold text-slate-700 dark:text-slate-200">Data Summary</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <DataStat label="Tasks" value={tasks.length} />
          <DataStat label="Habits" value={habits.length} />
          <DataStat label="Categories" value={categories.length} />
          <DataStat label="Completed" value={tasks.filter((t) => t.completed).length} />
        </div>
      </div>
    </div>
  );
}

function DataStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3 text-center dark:bg-slate-700/50">
      <p className="text-xl font-bold text-slate-700 dark:text-slate-200">{value}</p>
      <p className="text-xs text-slate-400">{label}</p>
    </div>
  );
}
