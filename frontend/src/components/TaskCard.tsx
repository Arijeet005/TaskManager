import { Calendar, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import type { Task, TaskStatus } from '../types';

type DisplayStatus = TaskStatus | 'overdue';

function isOverdue(task: Task): boolean {
  if (!task.dueDate) return false;
  if (task.status === 'completed') return false;
  return new Date(task.dueDate).getTime() < Date.now();
}

function formatDueDate(task: Task): string {
  if (!task.dueDate) return 'No due date';
  const d = new Date(task.dueDate);
  if (Number.isNaN(d.getTime())) return 'Invalid date';
  return d.toLocaleDateString();
}

function StatusBadge({ status }: { status: DisplayStatus }) {
  const styles: Record<DisplayStatus, string> = {
    pending: 'bg-secondary-fixed text-on-secondary-fixed',
    'in-progress': 'bg-tertiary-fixed text-on-tertiary-fixed',
    completed: 'bg-[#dcfce7] text-[#166534]',
    overdue: 'bg-error-container text-on-error-container',
  };
  return (
    <span className={cn('px-3 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase', styles[status])}>
      {status.replace('-', ' ')}
    </span>
  );
}

export function TaskCard({
  task,
  isSelected,
  onToggleSelect,
  onClick,
}: {
  task: Task;
  isSelected: boolean;
  onToggleSelect: () => void;
  onClick: () => void;
}) {
  const overdue = isOverdue(task);
  const displayStatus: DisplayStatus = overdue ? 'overdue' : task.status;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-surface-container-lowest rounded-2xl p-5 flex items-start gap-4 shadow-[0px_20px_40px_-12px_rgba(25,28,30,0.06)] group hover:scale-[1.01] transition-transform cursor-pointer"
      onClick={onClick}
    >
      <div
        className="pt-1"
        onClick={(e) => {
          e.stopPropagation();
          onToggleSelect();
        }}
      >
        <div
          className={cn(
            'w-6 h-6 rounded-md border-2 transition-all flex items-center justify-center',
            isSelected ? 'border-primary bg-primary' : 'border-outline-variant bg-transparent',
          )}
        >
          {isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}
        </div>
      </div>

      <div className="flex-1">
        <div className="flex justify-between items-start mb-1 gap-3">
          <h3 className={cn("font-bold text-lg text-on-surface leading-tight", task.status === 'completed' && "line-through")}>{task.title}</h3>
          <StatusBadge status={displayStatus} />
        </div>
        <p className="text-on-surface-variant text-sm mb-4 leading-relaxed line-clamp-2">{task.description}</p>

        <div className="flex flex-wrap items-center gap-2">
          <span className="bg-surface-container text-on-surface-variant px-3 py-1 rounded-lg text-xs font-semibold">
            {task.category}
          </span>
          <span className="bg-surface-container text-on-surface-variant px-3 py-1 rounded-lg text-xs font-semibold">
            {task.priority}
          </span>
          {!!(task.subtasks?.length) && (
            <span className="bg-surface-container text-on-surface-variant px-3 py-1 rounded-lg text-xs font-semibold">
              {task.subtasks.length} subtasks
            </span>
          )}
          <div className="flex items-center gap-1 text-on-surface-variant text-xs">
            <Calendar className="w-3.5 h-3.5" />
            <span>{formatDueDate(task)}</span>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex justify-between text-xs text-on-surface-variant font-medium mb-1">
            <span>Progress</span>
            <span>{task.progress}%</span>
          </div>
          <div className="h-2 rounded-full bg-surface-container overflow-hidden">
            <div
              className={cn('h-full rounded-full', task.progress === 100 ? 'bg-[#22c55e]' : 'bg-primary')}
              style={{ width: `${task.progress}%` }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

