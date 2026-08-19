import type { Task } from '@/lib/supabase';
import CalendarGrid from '@/components/CalendarGrid';

interface CalendarViewProps {
  tasks: Task[];
}

export default function CalendarView({ tasks }: CalendarViewProps) {
  return (
    <div className="space-y-4">
      <CalendarGrid tasks={tasks} />

      {/* Upcoming tasks */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <h3 className="mb-3 text-sm font-bold text-slate-700 dark:text-slate-200">Upcoming Tasks</h3>
        {tasks.filter((t) => !t.completed && t.due_date).length === 0 ? (
          <p className="text-sm text-slate-400">No upcoming tasks with due dates.</p>
        ) : (
          <div className="space-y-2">
            {tasks
              .filter((t) => !t.completed && t.due_date)
              .sort((a, b) => (a.due_date ?? '').localeCompare(b.due_date ?? ''))
              .slice(0, 5)
              .map((task) => (
                <div key={task.id} className="flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-700/50">
                  <div className={`h-2 w-2 rounded-full ${
                    task.priority === 'high' ? 'bg-rose-500' :
                    task.priority === 'medium' ? 'bg-amber-500' :
                    'bg-emerald-500'
                  }`} />
                  <span className="flex-1 text-sm text-slate-700 dark:text-slate-200">{task.title}</span>
                  <span className="text-xs text-slate-400">{task.due_date}</span>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
