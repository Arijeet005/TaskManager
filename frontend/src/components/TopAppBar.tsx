import { Plus, Search } from 'lucide-react';

export function TopAppBar({
  search,
  onSearchChange,
  onCreateTask,
}: {
  search: string;
  onSearchChange: (v: string) => void;
  onCreateTask: () => void;
}) {
  return (
    <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-surface-container">
      <div className="flex items-center justify-between px-6 h-16 w-full max-w-6xl mx-auto">
        <h1 className="font-headline font-bold text-xl tracking-tight text-primary">Task Manager</h1>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 bg-surface-container-low rounded-xl px-3 py-2">
            <Search className="w-4 h-4 text-on-surface-variant" />
            <input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search tasks..."
              className="bg-transparent outline-none text-sm w-64"
            />
          </div>
          <button
            onClick={onCreateTask}
            className="bg-gradient-to-br from-primary to-primary-container text-white px-4 py-2 rounded-xl font-semibold active:scale-95 transition-transform"
          >
            <span className="inline-flex items-center gap-2">
              <Plus className="w-4 h-4" />
              New
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}

