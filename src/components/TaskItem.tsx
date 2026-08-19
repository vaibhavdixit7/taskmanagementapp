import { useState } from 'react';
import { Check, Clock, Trash2, Pencil, Flag, X, Bell, MessageSquare, Send } from 'lucide-react';
import type { Task, Priority, Category, TaskComment } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import { priorityConfig, getCategoryColor, formatDueDate, isOverdue, formatRelativeTime } from '@/lib/utils';

interface TaskItemProps {
  task: Task;
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
  categories: Category[];
}

export default function TaskItem({ task, onToggle, onDelete, onEdit, categories }: TaskItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [authorName, setAuthorName] = useState('Anonymous');
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDescription, setEditDescription] = useState(task.description ?? '');
  const [editPriority, setEditPriority] = useState<Priority>(task.priority);
  const [editDueDate, setEditDueDate] = useState(task.due_date ?? '');
  const [editCategoryId, setEditCategoryId] = useState(task.category_id ?? '');
  const [editReminderEnabled, setEditReminderEnabled] = useState(task.reminder_enabled);
  const [editReminderTime, setEditReminderTime] = useState(task.reminder_time ?? '');

  const priority = priorityConfig[task.priority];
  const overdue = task.due_date && !task.completed && isOverdue(task);
  const catColor = task.categories ? getCategoryColor(task.categories.color) : null;

  const handleSave = () => {
    if (!editTitle.trim()) return;
    onEdit(task.id, {
      title: editTitle.trim(),
      description: editDescription.trim(),
      priority: editPriority,
      due_date: editDueDate || null,
      category_id: editCategoryId || null,
      reminder_time: editReminderEnabled && editReminderTime ? editReminderTime : null,
      reminder_enabled: editReminderEnabled,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditTitle(task.title);
    setEditDescription(task.description ?? '');
    setEditPriority(task.priority);
    setEditDueDate(task.due_date ?? '');
    setEditCategoryId(task.category_id ?? '');
    setEditReminderEnabled(task.reminder_enabled);
    setEditReminderTime(task.reminder_time ?? '');
    setIsEditing(false);
  };

  const loadComments = async () => {
    const { data } = await supabase
      .from('task_comments')
      .select('*')
      .eq('task_id', task.id)
      .order('created_at', { ascending: true });
    setComments((data ?? []) as TaskComment[]);
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    const { data } = await supabase
      .from('task_comments')
      .insert({
        task_id: task.id,
        author_name: authorName.trim() || 'Anonymous',
        content: newComment.trim(),
      })
      .select()
      .single();
    if (data) {
      setComments((prev) => [...prev, data as TaskComment]);
      setNewComment('');
    }
  };

  const handleToggleComments = () => {
    if (!showComments) loadComments();
    setShowComments(!showComments);
  };

  if (isEditing) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-slate-700 dark:bg-slate-800">
        <div className="space-y-3">
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') handleCancel();
            }}
            autoFocus
            placeholder="Task title"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-800 outline-none transition-colors focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
          />
          <textarea
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            placeholder="Description (optional)"
            rows={2}
            className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 outline-none transition-colors focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
          />
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={editPriority}
              onChange={(e) => setEditPriority(e.target.value as Priority)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 outline-none focus:border-blue-400 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
            >
              <option value="low">Low priority</option>
              <option value="medium">Medium priority</option>
              <option value="high">High priority</option>
            </select>
            <input
              type="date"
              value={editDueDate}
              onChange={(e) => setEditDueDate(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 outline-none focus:border-blue-400 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
            />
            <select
              value={editCategoryId}
              onChange={(e) => setEditCategoryId(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 outline-none focus:border-blue-400 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
            >
              <option value="">No category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setEditReminderEnabled(!editReminderEnabled)}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                editReminderEnabled
                  ? 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400'
                  : 'border-slate-200 text-slate-500 dark:border-slate-600 dark:text-slate-400'
              }`}
            >
              <Bell className="h-4 w-4" />
              {editReminderEnabled ? 'Reminder on' : 'Reminder'}
            </button>
            {editReminderEnabled && (
              <input
                type="time"
                value={editReminderTime}
                onChange={(e) => setEditReminderTime(e.target.value)}
                className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm text-slate-700 outline-none focus:border-blue-400 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
              />
            )}
          </div>
          <div className="flex items-center justify-end gap-2">
            <button onClick={handleCancel} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 dark:hover:bg-slate-700">
              <X className="h-4 w-4" /> Cancel
            </button>
            <button onClick={handleSave} className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 active:scale-95">
              Save
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-slate-700 dark:bg-slate-800">
      <div className="flex items-start gap-3">
        <button
          onClick={() => onToggle(task.id, !task.completed)}
          className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border-2 transition-all ${
            task.completed
              ? 'border-blue-500 bg-blue-500 text-white'
              : 'border-slate-300 hover:border-blue-400 hover:bg-blue-50 dark:border-slate-600 dark:hover:bg-blue-500/10'
          }`}
          aria-label={task.completed ? 'Mark as not done' : 'Mark as done'}
        >
          {task.completed && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
        </button>

        <div className="min-w-0 flex-1">
          <h3 className={`text-sm font-medium leading-snug ${task.completed ? 'text-slate-400 line-through dark:text-slate-500' : 'text-slate-800 dark:text-slate-100'}`}>
            {task.title}
          </h3>
          {task.description && (
            <p className={`mt-1 text-sm leading-snug ${task.completed ? 'text-slate-300 dark:text-slate-600' : 'text-slate-500 dark:text-slate-400'}`}>
              {task.description}
            </p>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${priority.bg} ${priority.text}`}>
              <Flag className="h-3 w-3" />
              {priority.label}
            </span>
            {task.due_date && (
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${overdue ? 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>
                <Clock className="h-3 w-3" />
                {formatDueDate(task.due_date)}
              </span>
            )}
            {task.categories && catColor && (
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${catColor.bg} ${catColor.text}`}>
                <span className={`h-2 w-2 rounded-full ${catColor.solid}`} />
                {task.categories.name}
              </span>
            )}
            {task.reminder_enabled && task.reminder_time && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                <Bell className="h-3 w-3" />
                {task.reminder_time.slice(0, 5)}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={handleToggleComments}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700"
            aria-label="Comments"
          >
            <MessageSquare className="h-4 w-4" />
          </button>
          <button
            onClick={() => setIsEditing(true)}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700"
            aria-label="Edit task"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(task.id)}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10"
            aria-label="Delete task"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Collaboration comments */}
      {showComments && (
        <div className="mt-3 animate-slide-down border-t border-slate-100 pt-3 dark:border-slate-700">
          <div className="space-y-2">
            {comments.length === 0 && (
              <p className="text-xs text-slate-400">No comments yet. Start the conversation!</p>
            )}
            {comments.map((c) => (
              <div key={c.id} className="flex gap-2">
                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                  {c.author_name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{c.author_name}</span>
                    <span className="text-xs text-slate-400">{formatRelativeTime(c.created_at)}</span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300">{c.content}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <input
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="Your name"
              className="w-28 rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-slate-700 outline-none focus:border-blue-400 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
            />
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
              placeholder="Write a comment..."
              className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 outline-none focus:border-blue-400 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
            />
            <button
              onClick={handleAddComment}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
