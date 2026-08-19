import { useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, CheckCircle2 } from 'lucide-react';
import type { Task } from '@/lib/supabase';
import { isOverdue, getCategoryColor } from '@/lib/utils';

interface CalendarGridProps {
  tasks: Task[];
}

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CalendarGrid({ tasks }: CalendarGridProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const tasksForDate = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return tasks.filter((t) => t.due_date === dateStr);
  };

  const selectedTasks = selectedDate
    ? tasks.filter((t) => t.due_date === selectedDate)
    : [];

  return (
    <div className="space-y-4">
      {/* Calendar */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        {/* Month navigation */}
        <div className="mb-4 flex items-center justify-between">
          <button
            onClick={prevMonth}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">
            {monthNames[month]} {year}
          </h3>
          <button
            onClick={nextMonth}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Day headers */}
        <div className="mb-2 grid grid-cols-7 gap-1">
          {dayNames.map((day) => (
            <div key={day} className="text-center text-xs font-semibold text-slate-400">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, i) => {
            if (day === null) return <div key={i} className="aspect-square" />;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayTasks = tasksForDate(day);
            const hasTasks = dayTasks.length > 0;
            const hasOverdue = dayTasks.some(isOverdue);
            const allDone = hasTasks && dayTasks.every((t) => t.completed);
            const isSelected = selectedDate === dateStr;
            const isToday = new Date().toISOString().split('T')[0] === dateStr;

            return (
              <button
                key={i}
                onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                className={`relative flex aspect-square flex-col items-center justify-center rounded-lg text-sm transition-all ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-md'
                    : isToday
                    ? 'bg-blue-50 text-blue-600 ring-2 ring-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-500/30'
                    : hasTasks
                    ? 'bg-slate-50 text-slate-700 hover:bg-slate-100 dark:bg-slate-700/50 dark:text-slate-200 dark:hover:bg-slate-700'
                    : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/30'
                }`}
              >
                <span className="font-medium">{day}</span>
                {hasTasks && (
                  <div className="mt-0.5 flex gap-0.5">
                    {dayTasks.slice(0, 3).map((t, idx) => {
                      const catColor = t.categories ? getCategoryColor(t.categories.color) : null;
                      return (
                        <div
                          key={idx}
                          className={`h-1.5 w-1.5 rounded-full ${
                            isSelected
                              ? 'bg-white/70'
                              : allDone
                              ? 'bg-emerald-500'
                              : hasOverdue
                              ? 'bg-rose-500'
                              : catColor
                              ? catColor.solid
                              : 'bg-slate-400'
                          }`}
                        />
                      );
                    })}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected date tasks */}
      {selectedDate && (
        <div className="animate-slide-down rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <h4 className="mb-3 text-sm font-bold text-slate-700 dark:text-slate-200">
            {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </h4>
          {selectedTasks.length === 0 ? (
            <p className="text-sm text-slate-400">No tasks due on this date.</p>
          ) : (
            <div className="space-y-2">
              {selectedTasks.map((task) => (
                <div key={task.id} className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-700/50">
                  {task.completed ? (
                    <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-500" />
                  ) : (
                    <Clock className="h-4 w-4 flex-shrink-0 text-slate-400" />
                  )}
                  <span className={`flex-1 text-sm ${task.completed ? 'text-slate-400 line-through' : 'text-slate-700 dark:text-slate-200'}`}>
                    {task.title}
                  </span>
                  {task.categories && (
                    <span className={`rounded-full px-2 py-0.5 text-xs ${getCategoryColor(task.categories.color).bg} ${getCategoryColor(task.categories.color).text}`}>
                      {task.categories.name}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
