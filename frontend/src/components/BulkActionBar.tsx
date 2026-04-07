import { CheckCircle2, RefreshCw, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';

export function BulkActionBar({
  count,
  onComplete,
  onProgress,
  onDelete,
  disabled = false,
}: {
  count: number;
  onComplete: () => void;
  onProgress: () => void;
  onDelete: () => void;
  disabled?: boolean;
}) {
  return (
    <motion.div
      initial={{ y: 100, x: '-50%', opacity: 0 }}
      animate={{ y: 0, x: '-50%', opacity: 1 }}
      exit={{ y: 100, x: '-50%', opacity: 0 }}
      className="fixed bottom-6 left-1/2 w-[calc(100%-3rem)] max-w-2xl z-40"
    >
      <div className="bg-on-surface text-surface rounded-2xl px-6 py-4 flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-3">
          <span className="bg-primary-container text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
            {count}
          </span>
          <span className="font-medium">Selected</span>
	        </div>
	        <div className="flex items-center gap-1">
	          <button
	            onClick={onComplete}
	            disabled={disabled}
	            className="p-2 hover:bg-white/10 rounded-xl transition-colors flex flex-col items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
	          >
	            <CheckCircle2 className="w-5 h-5" />
	            <span className="text-[10px]">Complete</span>
	          </button>
	          <button
	            onClick={onProgress}
	            disabled={disabled}
	            className="p-2 hover:bg-white/10 rounded-xl transition-colors flex flex-col items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
	          >
	            <RefreshCw className="w-5 h-5" />
	            <span className="text-[10px]">Progress</span>
	          </button>
	          <button
	            onClick={onDelete}
	            disabled={disabled}
	            className="p-2 hover:bg-error/20 text-error-container rounded-xl transition-colors flex flex-col items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
	          >
	            <Trash2 className="w-5 h-5" />
	            <span className="text-[10px]">Delete</span>
	          </button>
	        </div>
	      </div>
    </motion.div>
  );
}
