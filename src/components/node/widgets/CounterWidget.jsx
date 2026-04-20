import React, { useState, useEffect } from 'react';
import { Trash2, Plus, Minus } from 'lucide-react';

export default function CounterWidget({ data, updateData, onRemove }) {
  const [count, setCount] = useState(data.count || 0);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (count !== data.count) {
        updateData({ count });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [count, data.count, updateData]);

  return (
    <div className="glass-container flex flex-col rounded-2xl overflow-hidden border border-outline-variant/30 group">
      <div className="flex justify-between items-center px-4 py-2 bg-surface-container-highest/20 border-b border-outline-variant/30">
        <span className="text-xs font-display tracking-widest opacity-60">TALLY COUNTER</span>
        <button onClick={onRemove} className="opacity-0 group-hover:opacity-100 text-error/60 hover:text-error transition-all p-1 rounded-md hover:bg-error/10">
          <Trash2 size={14} />
        </button>
      </div>
      <div className="p-6 flex flex-col items-center justify-center gap-6 min-h-[200px]">
        <div className="text-6xl font-light font-display tracking-wider text-primary">
          {count}
        </div>
        <div className="flex gap-4">
          <button onClick={() => setCount(c => c - 1)} className="p-3 rounded-full bg-surface-container-highest text-on-surface/60 hover:text-on-surface transition-colors">
            <Minus size={20} />
          </button>
          <button onClick={() => setCount(c => c + 1)} className="p-3 rounded-full bg-primary/20 text-primary hover:bg-primary/30 transition-colors">
            <Plus size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
