import { useMemo } from 'react';
import { Inbox, Loader2 } from 'lucide-react';
import type { Task, Category, Priority } from '@/lib/supabase';
import TaskItem from '@/components/TaskItem';
import AddTaskForm from '@/components/AddTaskForm';
import FilterTabs, { type FilterType } from '@/components/FilterTabs';
import { priorityOrder, isOverdue } from '@/lib/utils';

interface TasksViewProps {
  tasks: Task[];
  categories: Category[];
  loading: boolean;
  filter: FilterType;
  onFilterChange: (f: FilterType) => void;
  searchQuery: string;
  onAdd: (task: {
    title: string;
    description: string;
    priority: Priority;
    due_date: string | null;
    category_id: string | null;
    reminder_time: string | null;
    reminder_enabled: boolean;
  }) => void;
  onToggle: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, updates: {
    title: string;
    description: string;
    priority: Priority;
    due_date: string | null;
    category_id: string | null;
    reminder_time: string | null;
    reminder_enabled: boolean;
  }) => void;
  quickAddTrigger: number;
}

export default function TasksView({
  tasks,
  categories,
  loading,
  filter,
  onFilterChange,
  searchQuery,
  onAdd,
  onToggle,
  onDelete,
  onEdit,
  quickAddTrigger,
}: TasksViewProps) {
  const filterCounts = useMemo<Record<FilterType, number>>(
    () => ({
      all: tasks.length,
      active: tasks.filter((t) => !t.completed).length,
      completed: tasks.filter((t) => t.completed).length,
      overdue: tasks.filter(isOverdue).length,
    }),
    [tasks]
  );

  const filteredTasks = useMemo(() => {
    let result = tasks;
    if (filter === 'active') result = tasks.filter((t) => !t.completed);
    else if (filter === 'completed') result = tasks.filter((t) => t.completed);
    else if (filter === 'overdue') result = tasks.filter(isOverdue);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.description?.toLowerCase().includes(q) ?? false)
      );
    }

    return [...result].sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      const pDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (pDiff !== 0) return pDiff;
      if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date);
      if (a.due_date) return -1;
      if (b.due_date) return 1;
      return b.created_at.localeCompare(a.created_at);
    });
  }, [tasks, filter, searchQuery]);

  return (
    <div className="space-y-4">
      <AddTaskForm onAdd={onAdd} categories={categories} defaultExpanded={quickAddTrigger > 0} />

      <FilterTabs activeFilter={filter} onFilterChange={onFilterChange} counts={filterCounts} />

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white py-16 text-center dark:border-slate-700 dark:bg-slate-800">
          <Inbox className="mb-3 h-10 w-10 text-slate-300 dark:text-slate-600" />
          <p className="text-sm font-medium text-slate-400">
            {searchQuery
              ? 'No tasks match your search.'
              : filter === 'all'
              ? 'No tasks yet. Add one above to get started!'
              : filter === 'active'
              ? 'No active tasks. You are all caught up!'
              : filter === 'completed'
              ? 'No completed tasks yet.'
              : 'No overdue tasks. Great job!'}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onToggle={onToggle}
              onDelete={onDelete}
              onEdit={onEdit}
              categories={categories}
            />
          ))}
        </div>
      )}
    </div>
  );
}
