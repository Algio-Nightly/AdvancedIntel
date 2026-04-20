import React, { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';

export default function MarkdownWidget({ data, updateData, onRemove }) {
  const [text, setText] = useState(data.text || '');

  useEffect(() => {
    const timer = setTimeout(() => {
      if (text !== data.text) {
        updateData({ text });
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [text, data.text, updateData]);

  return (
    <div className="glass-container flex flex-col rounded-2xl overflow-hidden border border-outline-variant/30 group col-span-1 md:col-span-2">
      <div className="flex justify-between items-center px-4 py-2 bg-surface-container-highest/20 border-b border-outline-variant/30">
        <span className="text-xs font-display tracking-widest opacity-60">MARKDOWN</span>
        <button onClick={onRemove} className="opacity-0 group-hover:opacity-100 text-error/60 hover:text-error transition-all p-1 rounded-md hover:bg-error/10">
          <Trash2 size={14} />
        </button>
      </div>
      <div className="p-4 flex-1">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Start typing..."
          className="w-full h-full min-h-[200px] bg-transparent resize-none outline-none text-on-surface/90 text-sm leading-relaxed placeholder:opacity-30 font-sans"
        />
      </div>
    </div>
  );
}
