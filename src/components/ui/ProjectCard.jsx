import React from 'react';
import { formatRelativeTime } from '../../lib/utils';
import { Network, AlertTriangle, Play, FileText, Folder, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const THEMES = {
  'clinical-mint': { text: 'text-teal-700', bg: 'bg-teal-500/5', border: 'border-teal-500/20', glow: 'drop-shadow-[0_0_6px_rgba(20,184,166,0.25)]', badge: 'bg-transparent border-teal-500/20 text-teal-700' },
  'clinical-slate': { text: 'text-slate-700', bg: 'bg-slate-500/5', border: 'border-slate-500/20', glow: 'drop-shadow-[0_0_6px_rgba(100,116,139,0.25)]', badge: 'bg-transparent border-slate-500/20 text-slate-700' },
  'clinical-lavender': { text: 'text-fuchsia-700', bg: 'bg-fuchsia-500/5', border: 'border-fuchsia-500/20', glow: 'drop-shadow-[0_0_6px_rgba(217,70,239,0.25)]', badge: 'bg-transparent border-fuchsia-500/20 text-fuchsia-700' },
  'clinical-amber': { text: 'text-amber-700', bg: 'bg-amber-500/5', border: 'border-amber-500/20', glow: 'drop-shadow-[0_0_6px_rgba(245,158,11,0.25)]', badge: 'bg-transparent border-amber-500/20 text-amber-700' },
  'clinical-rose': { text: 'text-rose-700', bg: 'bg-rose-500/5', border: 'border-rose-500/20', glow: 'drop-shadow-[0_0_6px_rgba(225,29,72,0.25)]', badge: 'bg-transparent border-rose-500/20 text-rose-700' },
  'clinical-sapphire': { text: 'text-blue-700', bg: 'bg-blue-500/5', border: 'border-blue-500/20', glow: 'drop-shadow-[0_0_6px_rgba(59,130,246,0.25)]', badge: 'bg-transparent border-blue-500/20 text-blue-700' },
  'clinical-emerald': { text: 'text-emerald-700', bg: 'bg-emerald-500/5', border: 'border-emerald-500/20', glow: 'drop-shadow-[0_0_6px_rgba(16,185,129,0.25)]', badge: 'bg-transparent border-emerald-500/20 text-emerald-700' },
  'clinical-crimson': { text: 'text-red-700', bg: 'bg-red-500/5', border: 'border-red-500/20', glow: 'drop-shadow-[0_0_6px_rgba(239,68,68,0.25)]', badge: 'bg-transparent border-red-500/20 text-red-700' },
};

export default function ProjectCard({ project, onDelete, onRefresh }) {
  const navigate = useNavigate();

  const handleDelete = (e) => {
    e.stopPropagation();
    if (!onDelete) return;

    const hasContent = project.metrics?.totalNodes > 0;
    
    if (hasContent) {
      toast.warning(`Purge active workspace: ${project.title}?`, {
        description: "This project contains mapped data. This action is irreversible.",
        action: {
          label: "PURGE",
          onClick: async () => {
            const toastId = toast.loading("Purging nexus...");
            try {
              await onDelete(project.projectId);
              if (onRefresh) await onRefresh();
              toast.success("Nexus purged", { id: toastId });
            } catch (err) {
              toast.error("Purge failed", { id: toastId });
            }
          }
        }
      });
    } else {
      // Immediate delete or simpler confirmation for empty projects
      toast.promise(onDelete(project.projectId).then(() => onRefresh && onRefresh()), {
        loading: 'Deleting empty workspace...',
        success: 'Workspace removed',
        error: 'Failed to delete'
      });
    }
  };

  // Ensure default fallbacks if data is malformed
  const themeKey = project.theme || 'clinical-mint';
  const T = THEMES[themeKey] || THEMES['clinical-mint'];
  
  const m = project.metrics || { totalNodes: 0, totalEdges: 0, synthesisRatio: 0, orphanCount: 0 };
  const timestamps = project.timestamps || { lastAccessed: null };
  const prereqs = project.prerequisites || [];

  const isHealthy = m.synthesisRatio > 1.0;

  return (
    <div 
      onClick={() => navigate(`/project/${project.projectId}`)}
      className={`glass-container rounded-3xl p-6 flex flex-col gap-8 cursor-pointer transition-all hover:scale-[1.02] shadow-ambient ${T.bg} ${T.border} hover:shadow-lg`}
    >
      {/* Zone 1: Header (Identity) */}
      <div className="flex flex-col gap-2 relative">
        <h2 className={`font-display font-light text-3xl pr-12 leading-tight ${T.text}`}>
          {project.title}
        </h2>
        <div className="flex items-center justify-between">
          <span className="text-[9px] meta-label opacity-40 uppercase tracking-widest">
            Last active {formatRelativeTime(timestamps.lastAccessed)}
          </span>
        </div>
        <button 
          onClick={handleDelete}
          className="absolute top-0 right-0 p-2 text-on-surface/20 hover:text-error hover:bg-error/10 rounded-full transition-all group-hover:opacity-100"
          title="Purge Workspace"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Zone 2: Core Telemetry (Health) */}
      <div className="flex items-center justify-between">
        
        {/* Synthesis Ratio */}
        <div className="flex flex-col">
          <div className="flex items-baseline">
            <span className={`text-5xl font-light font-display transition-all ${isHealthy ? `${T.text} ${T.glow}` : 'text-on-surface/80'}`}>
              {m.synthesisRatio.toFixed(2)}
            </span>
            <span className={`text-xl font-light ml-1 ${isHealthy ? T.text : 'text-on-surface/60'}`}>x</span>
          </div>
          <span className="meta-label opacity-50 text-[10px] tracking-widest mt-1">SYNTHESIS RATIO</span>
        </div>

        {/* Warning Badges / Node Counts */}
        <div className="flex flex-col gap-2 items-end">
           <div className={`px-3 py-1 rounded-full border border-outline-variant/20 flex items-center gap-2 text-xs font-display ${T.badge}`}>
             <Network size={12} />
             <span>{m.totalNodes} Nodes</span>
           </div>
           
           {m.orphanCount > 0 && (
             <div className={`px-3 py-1 rounded-full border border-outline-variant/20 flex items-center gap-2 text-xs font-display opacity-80 ${T.text}`}>
               <AlertTriangle size={12} strokeWidth={2} />
               <span>{m.orphanCount} ORPHANS</span>
             </div>
           )}
        </div>
      </div>

      {/* Zone 3: Dependency Dock */}
      <div className="mt-auto pt-6 border-t border-outline-variant/10 flex flex-col gap-3">
         <span className="meta-label opacity-40 text-[9px]">ACTIVE DEPENDENCIES</span>
         
         <div className="flex flex-wrap gap-2">
            {prereqs.length === 0 && (
               <span className="text-xs text-on-surface/40 italic">Standalone Entity</span>
            )}
            
            {prereqs.map((req, idx) => (
              <div 
                key={idx} 
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-display uppercase tracking-wider border border-white/20 bg-white/40 shadow-sm ${T.text}`}
              >
                {req.type === 'pdf' ? <FileText size={10} /> : <Folder size={10} />}
                <span className="truncate max-w-[120px]">{req.title}</span>
              </div>
            ))}
         </div>
      </div>

    </div>
  );
}
