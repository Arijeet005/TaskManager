import { AlertCircle } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';
import {
  bulkDeleteTasks,
  bulkUpdateTasks,
  createSubtask,
  createTask,
  createTasksBulk,
  deleteTask,
  deleteSubtask,
  listTasks,
  updateSubtask,
  updateTask,
} from './api/tasks';
import { cn } from './lib/utils';
import { BulkActionBar } from './components/BulkActionBar';
import { ProgressPicker } from './components/ProgressPicker';
import { TaskCard } from './components/TaskCard';
import { TaskDrawer } from './components/TaskDrawer';
import { TopAppBar } from './components/TopAppBar';
import type { PriorityLevel, Task, TaskCategory, TaskStatus } from './types';

function isOverdue(task: Task): boolean {
  if (!task.dueDate) return false;
  if (task.status === 'completed') return false;
  return new Date(task.dueDate).getTime() < Date.now();
}

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [filter, setFilter] = useState<TaskStatus | 'All' | 'overdue'>('All');
  const [search, setSearch] = useState('');
  const [isProgressPickerOpen, setIsProgressPickerOpen] = useState(false);
  const [progressTargetIds, setProgressTargetIds] = useState<string[]>([]);
  const [isActionBusy, setIsActionBusy] = useState(false);

  const refresh = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await listTasks();
      setTasks(data);
      // Clean up selectedTaskIds to only include existing tasks
      setSelectedTaskIds((prev) => {
        const currentIds = new Set(data.map(t => t.id));
        return new Set([...prev].filter(id => currentIds.has(id)));
      });
      // Clean up editingTask if it no longer exists
      setEditingTask((prev) => prev && data.some(t => t.id === prev.id) ? prev : undefined);
    } catch (e: any) {
      setLoadError(e?.message || 'Failed to load tasks');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const filteredTasks = useMemo(() => {
    let list = tasks;
    if (filter === 'overdue') list = list.filter(isOverdue);
    else if (filter !== 'All') list = list.filter((t) => t.status === filter);

    const q = search.trim().toLowerCase();
    if (q) list = list.filter((t) => (t.title + ' ' + t.description).toLowerCase().includes(q));
    return list;
  }, [tasks, filter, search]);

  const toggleTaskSelection = (id: string) => {
    setSelectedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const saveTask = async (taskData: Partial<Task>, bulkTitles?: string[]) => {
    try {
      if (bulkTitles && !taskData.id) {
        const template = {
          description: taskData.description ?? '',
          status: (taskData.status as TaskStatus) ?? 'pending',
          progress: taskData.progress ?? 0,
          category: (taskData.category as TaskCategory) ?? 'Work',
          priority: (taskData.priority as PriorityLevel) ?? 'Medium',
          dueDate: taskData.dueDate ?? undefined,
        };
        const payload = bulkTitles.map((title) => ({ ...template, title }));
        const created = await createTasksBulk(payload);
        setTasks((prev) => [...created, ...prev]);
        return;
      }

      if (taskData.id) {
        const updated = await updateTask(taskData.id, taskData as any);
        setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
        setEditingTask(updated);
      } else {
        const created = await createTask(taskData as any);
        setTasks((prev) => [created, ...prev]);
      }
    } catch (e: any) {
      alert(e?.message || 'Failed to save task');
    }
  };

  const completeTasks = async (ids: string[], opts?: { clearSelection?: boolean }) => {
    if (ids.length === 0) return;
    if (isActionBusy) return;
    setIsActionBusy(true);
    try {
      const currentTasks = await listTasks();
      const existingIds = ids.filter(id => currentTasks.some(t => t.id === id));
      if (existingIds.length === 0) return;
      const updated =
        existingIds.length === 1
          ? [await updateTask(existingIds[0], { status: 'completed', progress: 100 } as any)]
          : await bulkUpdateTasks(existingIds, { status: 'completed', progress: 100 } as any);
      await refresh();
      if (opts?.clearSelection) setSelectedTaskIds(new Set());
      if (editingTask?.id && existingIds.includes(editingTask.id)) setEditingTask(updated.find((t) => t.id === editingTask.id));
    } catch (e: any) {
      alert(e?.message || 'Failed to complete tasks');
      await refresh();
    } finally {
      setIsActionBusy(false);
    }
  };

  const deleteTasks = async (ids: string[], opts?: { clearSelection?: boolean; closeDrawer?: boolean }) => {
    if (ids.length === 0) return;
    if (isActionBusy) return;
    setIsActionBusy(true);
    try {
      const currentTasks = await listTasks();
      const existingIds = ids.filter(id => currentTasks.some(t => t.id === id));
      if (existingIds.length === 0) return;
      if (existingIds.length === 1) await deleteTask(existingIds[0]);
      else await bulkDeleteTasks(existingIds);
      await refresh();
      if (opts?.clearSelection) setSelectedTaskIds(new Set());
      else
        setSelectedTaskIds((prev) => {
          if (prev.size === 0) return prev;
          const next = new Set(prev);
          for (const id of existingIds) next.delete(id);
          return next;
        });
      if (opts?.closeDrawer) {
        setEditingTask(undefined);
        setIsDrawerOpen(false);
      }
    } catch (e: any) {
      alert(e?.message || 'Failed to delete tasks');
      await refresh();
    } finally {
      setIsActionBusy(false);
    }
  };

  const openProgressForTasks = (ids: string[]) => {
    if (ids.length === 0) return;
    setProgressTargetIds(ids);
    setIsProgressPickerOpen(true);
  };

  const applyProgressToTargets = async (progress: number) => {
    if (progressTargetIds.length === 0) return;
    if (isActionBusy) return;
    setIsActionBusy(true);
    try {
      const currentTasks = await listTasks();
      const existingIds = progressTargetIds.filter(id => currentTasks.some(t => t.id === id));
      if (existingIds.length === 0) return;
      const updated = existingIds.length === 1 ? [await updateTask(existingIds[0], { progress } as any)] : await bulkUpdateTasks(existingIds, { progress } as any);
      await refresh();
      if (existingIds.every((id) => selectedTaskIds.has(id))) setSelectedTaskIds(new Set());
      if (editingTask?.id && existingIds.includes(editingTask.id)) setEditingTask(updated.find((t) => t.id === editingTask.id));
    } catch (e: any) {
      alert(e?.message || 'Failed to update progress');
      await refresh();
    } finally {
      setIsProgressPickerOpen(false);
      setProgressTargetIds([]);
      setIsActionBusy(false);
    }
  };

  const addSubtask = async (taskId: string, title: string, dueDate?: string) => {
    try {
      const subtask = await createSubtask(taskId, title, dueDate);
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, subtasks: [...(t.subtasks ?? []), subtask] } : t)),
      );
      setEditingTask((prev) =>
        prev?.id === taskId ? { ...prev, subtasks: [...(prev.subtasks ?? []), subtask] } : prev,
      );
    } catch (e: any) {
      alert(e?.message || 'Failed to create subtask');
    }
  };

  const toggleSubtask = async (subtaskId: string, isDone: boolean) => {
    try {
      const updated = await updateSubtask(subtaskId, { isDone });
      setTasks((prev) =>
        prev.map((t) => ({ ...t, subtasks: (t.subtasks ?? []).map((s) => (s.id === subtaskId ? updated : s)) })),
      );
      setEditingTask((prev) =>
        prev ? { ...prev, subtasks: (prev.subtasks ?? []).map((s) => (s.id === subtaskId ? updated : s)) } : prev,
      );
    } catch (e: any) {
      alert(e?.message || 'Failed to update subtask');
    }
  };

  const setSubtaskDueDate = async (subtaskId: string, dueDate?: string) => {
    try {
      const updated = await updateSubtask(subtaskId, { dueDate });
      setTasks((prev) =>
        prev.map((t) => ({ ...t, subtasks: (t.subtasks ?? []).map((s) => (s.id === subtaskId ? updated : s)) })),
      );
      setEditingTask((prev) =>
        prev ? { ...prev, subtasks: (prev.subtasks ?? []).map((s) => (s.id === subtaskId ? updated : s)) } : prev,
      );
    } catch (e: any) {
      alert(e?.message || 'Failed to update subtask due date');
    }
  };

  const removeSubtask = async (subtaskId: string) => {
    try {
      await deleteSubtask(subtaskId);
      setTasks((prev) => prev.map((t) => ({ ...t, subtasks: (t.subtasks ?? []).filter((s) => s.id !== subtaskId) })));
      setEditingTask((prev) =>
        prev ? { ...prev, subtasks: (prev.subtasks ?? []).filter((s) => s.id !== subtaskId) } : prev,
      );
    } catch (e: any) {
      alert(e?.message || 'Failed to delete subtask');
    }
  };

  return (
    <div className="min-h-screen bg-surface pb-24">
      <TopAppBar
        search={search}
        onSearchChange={setSearch}
        onCreateTask={() => {
          setEditingTask(undefined);
          setIsDrawerOpen(true);
        }}
      />

      <main className="pt-24 px-6 max-w-4xl mx-auto">
        <section className="mb-8">
          <div className="flex items-center gap-3 overflow-x-auto pb-2 no-scrollbar">
            {(['All', 'pending', 'in-progress', 'completed', 'overdue'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  'px-5 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap',
                  filter === f ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest',
                )}
              >
                {f === 'All' ? 'All' : f.replace('-', ' ')}
              </button>
            ))}
          </div>
        </section>

        {isLoading ? (
          <div className="text-on-surface-variant">Loading...</div>
        ) : loadError ? (
          <div className="bg-error-container text-on-error-container rounded-2xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 mt-0.5" />
            <div className="flex-1">
              <div className="font-bold">Failed to load tasks</div>
              <div className="text-sm opacity-90 break-words">{loadError}</div>
              <button onClick={() => void refresh()} className="mt-3 px-3 py-2 rounded-xl bg-on-surface text-surface text-sm font-semibold">
                Retry
              </button>
            </div>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-on-surface-variant">No tasks found.</div>
        ) : (
          <div className="space-y-4">
            {filteredTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                isSelected={selectedTaskIds.has(task.id)}
                onToggleSelect={() => toggleTaskSelection(task.id)}
                onClick={() => {
                  if (selectedTaskIds.size > 0) {
                    toggleTaskSelection(task.id);
                    return;
                  }
                  setEditingTask(task);
                  setIsDrawerOpen(true);
                }}
              />
            ))}
          </div>
        )}
      </main>

      <AnimatePresence>
        {selectedTaskIds.size > 0 && (
          <BulkActionBar
            count={selectedTaskIds.size}
            disabled={isActionBusy}
            onComplete={() => void completeTasks(Array.from(selectedTaskIds), { clearSelection: true })}
            onProgress={() => openProgressForTasks(Array.from(selectedTaskIds))}
            onDelete={() => void deleteTasks(Array.from(selectedTaskIds), { clearSelection: true })}
          />
        )}
      </AnimatePresence>

      <ProgressPicker
        isOpen={isProgressPickerOpen}
        onClose={() => {
          setIsProgressPickerOpen(false);
          setProgressTargetIds([]);
        }}
        onConfirm={(p) => void applyProgressToTargets(p)}
      />

      <TaskDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        task={editingTask}
        onSave={(t, bulkTitles) => void saveTask(t, bulkTitles)}
        onCreateSubtask={(taskId, title, dueDate) => void addSubtask(taskId, title, dueDate)}
        onToggleSubtask={(subtaskId, isDone) => void toggleSubtask(subtaskId, isDone)}
        onSetSubtaskDueDate={(subtaskId, dueDate) => void setSubtaskDueDate(subtaskId, dueDate)}
        onDeleteSubtask={(subtaskId) => void removeSubtask(subtaskId)}
        onCompleteTask={(taskId) => void completeTasks([taskId])}
        onSetTaskProgress={(taskId) => openProgressForTasks([taskId])}
        onDeleteTask={(taskId) => void deleteTasks([taskId], { closeDrawer: true })}
        isActionBusy={isActionBusy}
      />
    </div>
  );
}
