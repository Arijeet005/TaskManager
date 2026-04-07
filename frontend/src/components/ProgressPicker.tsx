import { X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';

export function ProgressPicker({
  isOpen,
  onClose,
  onConfirm,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (progress: number) => void;
}) {
  const [value, setValue] = useState(50);

  useEffect(() => {
    if (isOpen) setValue(50);
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[80] bg-on-surface/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: 40, opacity: 0, x: '-50%' }}
            animate={{ y: 0, opacity: 1, x: '-50%' }}
            exit={{ y: 40, opacity: 0, x: '-50%' }}
            className="fixed left-1/2 top-1/2 -translate-y-1/2 z-[90] w-[calc(100%-3rem)] max-w-md bg-surface-container-lowest rounded-2xl shadow-2xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-headline font-bold text-lg">Set progress</h3>
              <button onClick={onClose} className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center">
                <X className="w-5 h-5 text-on-surface-variant" />
              </button>
            </div>
            <div className="space-y-4">
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={value}
                onChange={(e) => setValue(parseInt(e.target.value, 10))}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-on-surface-variant">
                <span>0%</span>
                <span className="font-bold text-on-surface">{value}%</span>
                <span>100%</span>
              </div>
              <button
                onClick={() => onConfirm(value)}
                className="w-full bg-gradient-to-r from-primary to-primary-container text-white font-bold py-3.5 rounded-xl shadow-lg shadow-primary/20 active:scale-[0.98] transition-all"
              >
                Apply
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

