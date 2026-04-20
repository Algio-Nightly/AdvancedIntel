import React, { useState, useEffect } from 'react';
import { Trash2, Play, Pause, RotateCcw } from 'lucide-react';

export default function TimerWidget({ data, updateData, onRemove }) {
  const [time, setTime] = useState(data.time || 0);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    let intervalId;
    if (isRunning) {
      intervalId = setInterval(() => setTime(t => t + 1), 1000);
    }
    return () => clearInterval(intervalId);
  }, [isRunning]);

  useEffect(() => {
    if (!isRunning && time !== data.time) {
      updateData({ time });
    }
  }, [isRunning, time, data.time, updateData]);

  const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleReset = () => {
    setIsRunning(false);
    setTime(0);
    updateData({ time: 0 });
  };

  return (
    <div className="glass-container flex flex-col rounded-2xl overflow-hidden border border-outline-variant/30 group">
      <div className="flex justify-between items-center px-4 py-2 bg-surface-container-highest/20 border-b border-outline-variant/30">
        <span className="text-xs font-display tracking-widest opacity-60">TIMER</span>
        <button onClick={onRemove} className="opacity-0 group-hover:opacity-100 text-error/60 hover:text-error transition-all p-1 rounded-md hover:bg-error/10">
          <Trash2 size={14} />
        </button>
      </div>
      <div className="p-6 flex flex-col items-center justify-center gap-6 min-h-[200px]">
        <div className="text-5xl font-light font-display tracking-wider text-primary">
          {formatTime(time)}
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => setIsRunning(!isRunning)} 
            className={`p-3 rounded-full flex items-center justify-center transition-colors ${isRunning ? 'bg-primary/20 text-primary' : 'bg-primary text-on-primary'}`}
          >
            {isRunning ? <Pause size={20} /> : <Play size={20} />}
          </button>
          <button onClick={handleReset} className="p-3 rounded-full bg-surface-container-highest text-on-surface/60 hover:text-on-surface transition-colors">
            <RotateCcw size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
