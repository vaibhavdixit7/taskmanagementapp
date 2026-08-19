import { useState, useEffect, useCallback } from 'react';
import { Plus, Calendar, Flag, X, Mic, Bell, Tag } from 'lucide-react';
import VoiceInput from '@/components/VoiceInput';
import type { Priority, Category } from '@/lib/supabase';
import { getCategoryColor } from '@/lib/utils';

interface AddTaskFormProps {
  onAdd: (task: {
    title: string;
    description: string;
    priority: Priority;
    due_date: string | null;
    category_id: string | null;
    reminder_time: string | null;
    reminder_enabled: boolean;
  }) => void;
  categories: Category[];
  defaultExpanded?: boolean;
}

export default function AddTaskForm({ onAdd, categories, defaultExpanded = false }: AddTaskFormProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState('');

  const handleSubmit = useCallback(() => {
    if (!title.trim()) return;
    onAdd({
      title: title.trim(),
      description: description.trim(),
      priority,
      due_date: dueDate || null,
      category_id: categoryId || null,
      reminder_time: reminderEnabled && reminderTime ? reminderTime : null,
      reminder_enabled: reminderEnabled,
    });
    setTitle('');
    setDescription('');
    setPriority('medium');
    setDueDate('');
    setCategoryId('');
    setReminderEnabled(false);
    setReminderTime('');
    setIsExpanded(false);
  }, [title, description, priority, dueDate, categoryId, reminderEnabled, reminderTime, onAdd]);

  const handleCancel = () => {
    setTitle('');
    setDescription('');
    setPriority('medium');
    setDueDate('');
    setCategoryId('');
    setReminderEnabled(false);
    setReminderTime('');
    setIsExpanded(false);
  };

  const handleVoiceTranscript = useCallback((text: string) => {
    setTitle(text);
    setIsExpanded(true);
  }, []);

  useEffect(() => {
    if (defaultExpanded) setIsExpanded(true);
  }, [defaultExpanded]);

  if (!isExpanded) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsExpanded(true)}
          className="flex flex-1 items-center gap-3 rounded-xl border-2 border-dashed border-slate-200 bg-white px-4 py-3.5 text-sm font-medium text-slate-400 transition-all hover:border-blue-300 hover:bg-blue-50/50 hover:text-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-blue-500/50"
        >
          <Plus className="h-5 w-5" />
          Add a task
        </button>
        <VoiceInput onTranscript={handleVoiceTranscript} />
      </div>
    );
  }

  return (
    <div className="animate-slide-down rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
              if (e.key === 'Escape') handleCancel();
            }}
            autoFocus
            placeholder="What needs to be done?"
            className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-800 outline-none transition-colors focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
          />
          <VoiceInput onTranscript={handleVoiceTranscript} />
        </div>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add a description (optional)"
          rows={2}
          className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 outline-none transition-colors focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
        />
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Flag className="h-4 w-4 text-slate-400" />
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 outline-none transition-colors focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
            >
              <option value="low">Low priority</option>
              <option value="medium">Medium priority</option>
              <option value="high">High priority</option>
            </select>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-slate-400" />
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 outline-none transition-colors focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
            />
          </div>
          {categories.length > 0 && (
            <div className="flex items-center gap-1.5">
              <Tag className="h-4 w-4 text-slate-400" />
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 outline-none transition-colors focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
              >
                <option value="">No category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <Bell className={`h-4 w-4 ${reminderEnabled ? 'text-amber-500' : 'text-slate-400'}`} />
            <button
              type="button"
              onClick={() => setReminderEnabled(!reminderEnabled)}
              className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                reminderEnabled
                  ? 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400'
                  : 'border-slate-200 text-slate-500 dark:border-slate-600 dark:text-slate-400'
              }`}
            >
              {reminderEnabled ? 'Reminder on' : 'Reminder'}
            </button>
            {reminderEnabled && (
              <input
                type="time"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm text-slate-700 outline-none focus:border-blue-400 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
              />
            )}
          </div>
        </div>
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={handleCancel}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <X className="h-4 w-4" />
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!title.trim()}
            className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Add task
          </button>
        </div>
      </div>
    </div>
  );
}
