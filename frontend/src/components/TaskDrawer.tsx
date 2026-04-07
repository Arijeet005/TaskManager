import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, ChevronDown, Trash2, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from '../lib/utils';
import type { PriorityLevel, Task, TaskCategory, TaskStatus } from '../types';

export function TaskDrawer({
  isOpen,
  onClose,
  task,
  onSave,
  onCreateSubtask,
  onToggleSubtask,
  onSetSubtaskDueDate,
  onDeleteSubtask,
  onCompleteTask,
  onSetTaskProgress,
  onDeleteTask,
  isActionBusy = false,
}: {
  isOpen: boolean;
  onClose: () => void;
  task?: Task;
  onSave: (task: Partial<Task>, bulkTitles?: string[]) => void;
  onCreateSubtask: (taskId: string, title: string, dueDate?: string) => void;
  onToggleSubtask: (subtaskId: string, isDone: boolean) => void;
  onSetSubtaskDueDate: (subtaskId: string, dueDate?: string) => void;
  onDeleteSubtask: (subtaskId: string) => void;
  onCompleteTask: (taskId: string) => void;
  onSetTaskProgress: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  isActionBusy?: boolean;
}) {
  const isEditing = !!task?.id;

  const [formData, setFormData] = useState<Partial<Task>>({
    title: '',
    description: '',
    status: 'pending',
    progress: 0,
    category: 'Work',
    priority: 'Medium',
    dueDate: undefined,
  });

  const [bulkMode, setBulkMode] = useState(false);
  const [bulkTitles, setBulkTitles] = useState('');
  const [subtaskTitle, setSubtaskTitle] = useState('');
  const [subtaskDueDate, setSubtaskDueDate] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    if (task) {
      setFormData(task);
      setBulkMode(false);
      setBulkTitles('');
    } else {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setFormData({
        title: '',
        description: '',
        status: 'pending',
        progress: 0,
        category: 'Work',
        priority: 'Medium',
        dueDate: tomorrow.toISOString().split('T')[0],
      });
    }
    setSubtaskTitle('');
    setSubtaskDueDate('');
    setError(false);
  }, [task, isOpen]);

  const handleSave = () => {
    if (bulkMode) {
      const titles = bulkTitles
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);
      if (titles.length === 0) {
        setError(true);
        return;
      }
      onSave(formData, titles);
      onClose();
      return;
    }

    if (!formData.title) {
      setError(true);
      return;
    }
    onSave(formData);
    onClose();
  };

  const subtasks = task?.subtasks ?? [];
  const parentDueDateValue = useMemo(() => {
    if (!task?.dueDate) return '';
    const d = new Date(task.dueDate);
    if (Number.isNaN(d.getTime())) return '';
    return d.toISOString().slice(0, 10);
  }, [task?.dueDate]);

  const maxSubtaskDueDate = useMemo(() => {
    if (!parentDueDateValue) return undefined;
    const d = new Date(`${parentDueDateValue}T00:00:00Z`);
    if (Number.isNaN(d.getTime())) return undefined;
    d.setUTCDate(d.getUTCDate() - 1);
    return d.toISOString().slice(0, 10);
  }, [parentDueDateValue]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-on-surface/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-x-0 bottom-0 z-[70] bg-surface-container-lowest rounded-t-3xl shadow-2xl flex flex-col max-h-[92%] md:max-w-lg md:left-auto md:right-0 md:rounded-l-3xl md:rounded-tr-none md:h-full"
          >
            <div className="px-8 pt-10 pb-6 flex items-center justify-between">
              <div>
                <h2 className="font-headline text-2xl font-bold tracking-tight">
                  {isEditing ? 'Edit Task' : bulkMode ? 'Create Tasks' : 'Create Task'}
                </h2>
                <p className="text-sm text-on-surface-variant mt-1">
                  {isEditing ? 'Update details and subtasks' : 'Create tasks and manage them in bulk'}
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center hover:bg-surface-container-high transition-colors"
              >
                <X className="w-6 h-6 text-on-surface-variant" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-8 space-y-8 pb-32">
              {!isEditing && (
                <div className="flex items-center justify-between bg-surface-container-low rounded-2xl px-4 py-3">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold">Create multiple</span>
                    <span className="text-xs text-on-surface-variant">Paste one title per line</span>
                  </div>
                  <button
                    onClick={() => {
                      setBulkMode((v) => !v);
                      setError(false);
                    }}
                    className={cn(
                      'px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all',
                      bulkMode ? 'border-primary text-primary bg-primary/5' : 'border-transparent bg-surface-container',
                    )}
                  >
                    {bulkMode ? 'On' : 'Off'}
                  </button>
                </div>
              )}

              {bulkMode ? (
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant/80 px-1">
                    Task Titles
                  </label>
                  <textarea
                    className={cn(
                      'w-full bg-surface-container-low border-2 rounded-xl px-4 py-3.5 text-sm resize-none transition-all outline-none',
                      error ? 'border-error/20 bg-error-container/10 focus:border-error' : 'border-transparent focus:border-primary/20',
                    )}
                    rows={7}
                    placeholder={'Example:\nWrite unit tests\nRefactor task list\nPrepare demo'}
                    value={bulkTitles}
                    onChange={(e) => {
                      setBulkTitles(e.target.value);
                      if (e.target.value.trim()) setError(false);
                    }}
                  />
                  {error && (
                    <div className="flex items-center gap-1.5 mt-2 text-error px-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span className="text-[11px] font-medium">Add at least one title.</span>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant/80 px-1">Task Title</label>
                    <input
                      className={cn(
                        'w-full bg-surface-container-low border-2 rounded-xl px-4 py-3.5 font-medium transition-all outline-none focus:ring-0',
                        error ? 'border-error/20 bg-error-container/10 focus:border-error' : 'border-transparent focus:bg-surface-container-lowest focus:border-primary/20',
                      )}
                      placeholder="e.g. Implement bulk actions"
                      value={formData.title || ''}
                      onChange={(e) => {
                        setFormData({ ...formData, title: e.target.value });
                        if (e.target.value) setError(false);
                      }}
                    />
                    {error && (
                      <div className="flex items-center gap-1.5 mt-2 text-error px-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span className="text-[11px] font-medium">Title is required.</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant/80 px-1">Description</label>
                    <textarea
                      className="w-full bg-surface-container-low border-0 focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 rounded-xl px-4 py-3.5 text-sm resize-none transition-all outline-none"
                      placeholder="Describe the task..."
                      rows={4}
                      value={formData.description || ''}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant/80 px-1">Status</label>
	                  <div className="relative">
	                    <select
	                      className="w-full appearance-none bg-surface-container-low border-0 focus:ring-2 focus:ring-primary/20 rounded-xl px-4 py-3.5 text-sm font-medium outline-none"
	                      value={(formData.status as TaskStatus) || 'pending'}
	                      onChange={(e) => setFormData({ ...formData, status: e.target.value as TaskStatus })}
	                    >
	                      <option value="pending">Pending</option>
	                      <option value="in-progress">In Progress</option>
	                      {isEditing && <option value="completed">Completed</option>}
	                    </select>
	                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant w-5 h-5" />
	                  </div>
	                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant/80 px-1">Category</label>
                  <div className="relative">
                    <select
                      className="w-full appearance-none bg-surface-container-low border-0 focus:ring-2 focus:ring-primary/20 rounded-xl px-4 py-3.5 text-sm font-medium outline-none"
                      value={(formData.category as TaskCategory) || 'Work'}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value as TaskCategory })}
                    >
                      <option value="Work">Work</option>
                      <option value="Personal">Personal</option>
                      <option value="Fitness">Fitness</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant w-5 h-5" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant/80 px-1">Due Date</label>
                <input
                  type="date"
                  className="w-full bg-surface-container-low border-0 focus:ring-2 focus:ring-primary/20 rounded-xl px-4 py-3.5 text-sm font-medium outline-none"
                  value={formData.dueDate ? new Date(formData.dueDate).toISOString().slice(0, 10) : ''}
                  onChange={(e) => {
                    const v = e.target.value;
                    setFormData({ ...formData, dueDate: v ? new Date(v).toISOString() : undefined });
                  }}
                />
              </div>

              <div className="bg-surface-container-low rounded-2xl p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant/80">Progress</span>
                  <span className="text-xs font-bold">{Math.round(formData.progress ?? 0)}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={formData.progress ?? 0}
                  onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value, 10) })}
                  className="w-full"
                />
              </div>

              <div className="bg-surface-container-low rounded-2xl p-6 space-y-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant/80">Priority Level</span>
                <div className="flex gap-2">
                  {(['Low', 'Medium', 'High'] as PriorityLevel[]).map((level) => (
                    <button
                      key={level}
                      onClick={() => setFormData({ ...formData, priority: level })}
                      className={cn(
                        'flex-1 py-2 rounded-lg text-xs font-bold border-2 transition-all',
                        formData.priority === level
                          ? 'bg-surface-container-lowest border-primary text-primary'
                          : 'bg-surface-container-lowest border-transparent hover:border-outline-variant/30 text-on-surface-variant',
                      )}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

	              {isEditing && (
	                <div className="bg-surface-container-low rounded-2xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant/80">Subtasks</span>
                    <span className="text-xs text-on-surface-variant">{subtasks.length}</span>
                  </div>

	                  <div className="space-y-2">
	                    {subtasks.map((s) => (
	                      <div key={s.id} className="flex items-center justify-between gap-3 bg-surface-container-lowest rounded-xl px-3 py-2">
                        <button
                          onClick={() => onToggleSubtask(s.id, !s.isDone)}
                          className={cn(
                            'w-6 h-6 rounded-md border-2 transition-all flex items-center justify-center',
                            s.isDone ? 'border-primary bg-primary' : 'border-outline-variant bg-transparent',
                          )}
                        >
                          {s.isDone && <CheckCircle2 className="w-4 h-4 text-white" />}
                        </button>
	                        <span className={cn('flex-1 text-sm', s.isDone && 'line-through text-on-surface-variant')}>
	                          {s.title}
	                        </span>
	                        <input
	                          type="date"
	                          className="bg-transparent text-xs text-on-surface-variant outline-none border border-outline-variant/20 rounded-lg px-2 py-1 w-[130px]"
	                          value={
	                            s.dueDate
	                              ? (() => {
	                                  const d = new Date(s.dueDate);
	                                  return Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
	                                })()
	                              : ''
	                          }
	                          max={maxSubtaskDueDate}
	                          onChange={(e) => {
	                            const v = e.target.value;
	                            if (parentDueDateValue && v && v >= parentDueDateValue) {
	                              alert('Subtask due date must be before the parent task due date.');
	                              return;
	                            }
	                            onSetSubtaskDueDate(s.id, v ? new Date(v).toISOString() : undefined);
	                          }}
	                        />
	                        <button
	                          onClick={() => onDeleteSubtask(s.id)}
	                          className="p-2 rounded-xl hover:bg-surface-container transition-colors text-on-surface-variant"
	                          aria-label="Delete subtask"
	                        >
	                          <Trash2 className="w-4 h-4" />
	                        </button>
	                      </div>
	                    ))}
	                  </div>

	                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
	                    <input
	                      value={subtaskTitle}
	                      onChange={(e) => setSubtaskTitle(e.target.value)}
	                      placeholder="Add a subtask..."
	                      className="flex-1 bg-surface-container-lowest rounded-xl px-3 py-2 text-sm outline-none border border-outline-variant/20 focus:border-primary/30"
	                    />
	                    <input
	                      type="date"
	                      value={subtaskDueDate}
	                      max={maxSubtaskDueDate}
	                      onChange={(e) => setSubtaskDueDate(e.target.value)}
	                      className="bg-surface-container-lowest rounded-xl px-3 py-2 text-sm outline-none border border-outline-variant/20 focus:border-primary/30 sm:w-[170px]"
	                    />
	                    <button
	                      onClick={() => {
	                        if (!task?.id) return;
	                        const title = subtaskTitle.trim();
	                        if (!title) return;
	                        if (parentDueDateValue && subtaskDueDate && subtaskDueDate >= parentDueDateValue) {
	                          alert('Subtask due date must be before the parent task due date.');
	                          return;
	                        }
	                        const dueDateIso = subtaskDueDate ? new Date(subtaskDueDate).toISOString() : undefined;
	                        onCreateSubtask(task.id, title, dueDateIso);
	                        setSubtaskTitle('');
	                        setSubtaskDueDate('');
	                      }}
	                      className="px-3 py-2 rounded-xl bg-primary text-white text-sm font-semibold active:scale-95 transition-transform"
	                    >
	                      Add
	                    </button>
	                  </div>
	                  {!!parentDueDateValue && (
	                    <div className="text-[11px] text-on-surface-variant px-1">
	                      Subtask due date must be before {parentDueDateValue}.
	                    </div>
	                  )}
	                </div>
	              )}
            </div>

	        <div className="px-8 py-6 bg-surface-container-lowest/80 backdrop-blur-md flex flex-col gap-3 border-t border-surface-container">
	          {isEditing && task?.id && (
	            <div className="grid grid-cols-3 gap-2">
	              <button
	                onClick={() => onCompleteTask(task.id)}
	                disabled={isActionBusy}
	                className="bg-surface-container text-on-surface-variant font-semibold py-3 rounded-xl hover:bg-surface-container-high transition-colors active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
	              >
	                Complete
	              </button>
	              <button
	                onClick={() => onSetTaskProgress(task.id)}
	                disabled={isActionBusy}
	                className="bg-surface-container text-on-surface-variant font-semibold py-3 rounded-xl hover:bg-surface-container-high transition-colors active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
	              >
	                Progress
	              </button>
	              <button
	                onClick={() => {
	                  if (!confirm('Delete this task?')) return;
	                  onDeleteTask(task.id);
	                }}
	                disabled={isActionBusy}
	                className="bg-error-container/20 text-error font-semibold py-3 rounded-xl hover:bg-error-container/30 transition-colors active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
	              >
	                Delete
	              </button>
	            </div>
	          )}
	          <button
	            onClick={handleSave}
	            disabled={isActionBusy}
	            className="w-full bg-gradient-to-r from-primary to-primary-container text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 active:scale-[0.98] transition-all"
	          >
	            Save
	          </button>
	          <button
	            onClick={onClose}
	            disabled={isActionBusy}
	            className="w-full bg-surface-container text-on-surface-variant font-semibold py-4 rounded-xl hover:bg-surface-container-high transition-colors active:scale-[0.98]"
	          >
	            Cancel
	          </button>
	        </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
