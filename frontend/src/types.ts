export type TaskStatus = 'pending' | 'in-progress' | 'completed';
export type TaskCategory = 'Work' | 'Personal' | 'Fitness' | 'Urgent';
export type PriorityLevel = 'Low' | 'Medium' | 'High';

export interface Subtask {
  id: string;
  taskId: string;
  title: string;
  isDone: boolean;
  dueDate?: string;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  progress: number;
  category: TaskCategory;
  priority: PriorityLevel;
  dueDate?: string;
  createdAt?: string;
  updatedAt?: string;
  completedAt?: string;
  subtasks?: Subtask[];
}

export type View = 'home' | 'tasks' | 'categories' | 'profile';
