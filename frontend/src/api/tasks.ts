import { apiFetch } from './http';
import type { Subtask, Task, TaskStatus } from '../types';

export type TaskCreate = Omit<
  Task,
  'id' | 'createdAt' | 'updatedAt' | 'completedAt' | 'subtasks'
> & {
  dueDate?: string | null;
};

export type TaskUpdate = Partial<TaskCreate> & {
  completedAt?: string | null;
};

function toApiTask(task: TaskCreate | TaskUpdate) {
  const payload: any = {};
  if (task.title !== undefined) payload.title = task.title;
  if (task.description !== undefined) payload.description = task.description ?? null;
  if (task.status !== undefined) payload.status = task.status;
  if (task.progress !== undefined) payload.progress = task.progress;
  if (task.category !== undefined) payload.category = task.category ?? null;
  if (task.priority !== undefined) payload.priority = task.priority ?? null;
  if (task.dueDate !== undefined) payload.due_date = task.dueDate ? new Date(task.dueDate).toISOString() : null;
  if (task.completedAt !== undefined) payload.completed_at = task.completedAt ?? null;
  return payload;
}

function fromApiTask(t: any): Task {
  return {
    id: t.id,
    title: t.title,
    description: t.description ?? '',
    status: t.status as TaskStatus,
    progress: t.progress ?? 0,
    category: t.category ?? 'Work',
    priority: t.priority ?? 'Medium',
    dueDate: t.due_date ?? undefined,
    createdAt: t.created_at,
    updatedAt: t.updated_at,
    completedAt: t.completed_at ?? undefined,
    subtasks: Array.isArray(t.subtasks)
      ? t.subtasks.map((s: any) => ({
          id: s.id,
          taskId: s.task_id,
          title: s.title,
          isDone: !!s.is_done,
          dueDate: s.due_date ?? undefined,
          createdAt: s.created_at,
        }))
      : [],
  };
}

export async function listTasks(params?: {
  status?: TaskStatus;
  q?: string;
}): Promise<Task[]> {
  const qs = new URLSearchParams();
  if (params?.status) qs.set('status', params.status);
  if (params?.q) qs.set('q', params.q);
  qs.set('include_subtasks', 'true');
  const data = await apiFetch<any[]>(`/api/tasks?${qs.toString()}`);
  return data.map(fromApiTask);
}

export async function createTask(payload: TaskCreate): Promise<Task> {
  const data = await apiFetch<any>('/api/tasks', { method: 'POST', json: toApiTask(payload) });
  return fromApiTask(data);
}

export async function createTasksBulk(payload: TaskCreate[]): Promise<Task[]> {
  const data = await apiFetch<any[]>('/api/tasks/bulk', {
    method: 'POST',
    json: payload.map(toApiTask),
  });
  return data.map(fromApiTask);
}

export async function updateTask(id: string, payload: TaskUpdate): Promise<Task> {
  const data = await apiFetch<any>(`/api/tasks/${id}`, { method: 'PATCH', json: toApiTask(payload) });
  return fromApiTask(data);
}

export async function deleteTask(id: string): Promise<void> {
  await apiFetch<void>(`/api/tasks/${id}`, { method: 'DELETE' });
}

export async function bulkUpdateTasks(ids: string[], data: TaskUpdate): Promise<Task[]> {
  const res = await apiFetch<any[]>('/api/tasks/bulk', {
    method: 'PATCH',
    json: { ids, data: toApiTask(data) },
  });
  return res.map(fromApiTask);
}

export async function bulkDeleteTasks(ids: string[]): Promise<void> {
  await apiFetch<void>('/api/tasks/bulk', { method: 'DELETE', json: { ids } });
}

export async function createSubtask(taskId: string, title: string, dueDate?: string): Promise<Subtask> {
  const s = await apiFetch<any>(`/api/tasks/${taskId}/subtasks`, {
    method: 'POST',
    json: { title, due_date: dueDate ?? undefined },
  });
  return {
    id: s.id,
    taskId: s.task_id,
    title: s.title,
    isDone: !!s.is_done,
    dueDate: s.due_date ?? undefined,
    createdAt: s.created_at,
  };
}

export async function updateSubtask(
  id: string,
  data: Partial<Pick<Subtask, 'title' | 'isDone' | 'dueDate'>>,
): Promise<Subtask> {
  const payload: any = {};
  if (data.title !== undefined) payload.title = data.title;
  if (data.isDone !== undefined) payload.is_done = data.isDone;
  if (data.dueDate !== undefined) payload.due_date = data.dueDate ?? null;
  const s = await apiFetch<any>(`/api/subtasks/${id}`, { method: 'PATCH', json: payload });
  return {
    id: s.id,
    taskId: s.task_id,
    title: s.title,
    isDone: !!s.is_done,
    dueDate: s.due_date ?? undefined,
    createdAt: s.created_at,
  };
}

export async function deleteSubtask(id: string): Promise<void> {
  await apiFetch<void>(`/api/subtasks/${id}`, { method: 'DELETE' });
}
