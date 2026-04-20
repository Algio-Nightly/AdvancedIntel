import React, { useState } from 'react';
import { useProjects } from '../context/ProjectContext';
import ProjectCard from './ui/ProjectCard';
import { Plus, Activity, FolderClosed, X, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function Projects() {
  const { projects, createProject, deleteProject, refreshProjects, loading, error: projectError } = useProjects();
  const [isInitializing, setIsInitializing] = useState(false);
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [selectedTheme, setSelectedTheme] = useState('clinical-mint');
  const [showForm, setShowForm] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newProjectTitle.trim()) return;
    
    setIsInitializing(true);
    setLocalError('');
    const toastId = toast.loading("Deploying new cognitive nexus...");
    try {
      await createProject(newProjectTitle, selectedTheme);
      setNewProjectTitle('');
      setShowForm(false);
      await refreshProjects();
      toast.success("Nexus deployed successfully", { id: toastId });
    } catch (err) {
      setLocalError(err.message);
      toast.error("Deployment failed", { id: toastId });
    } finally {
      setIsInitializing(false);
    }
  };

  return (
    <div className="flex flex-col text-on-surface min-h-screen">
      <main className="w-full max-w-[1800px] mx-auto pt-32 flex flex-col px-4 md:px-12 2xl:px-24">
        
        {/* Header Area */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
           <div>
             <h1 className="text-5xl font-light font-display">Active Projects</h1>
             <p className="text-sm opacity-50 meta-label mt-2">COGNITIVE WORKSPACES & DATA SANDBOXES</p>
           </div>

           <div className="flex items-center gap-4">
             <button 
               onClick={() => setShowForm(!showForm)}
               disabled={isInitializing}
               className="px-6 py-3 bg-primary/10 border border-primary/30 text-primary rounded-full flex items-center gap-3 hover:bg-primary/20 hover:border-primary/60 transition-all font-display tracking-widest text-xs disabled:opacity-50 shadow-[0_0_20px_rgba(var(--primary),0.1)]"
             >
               {showForm ? <X size={16} /> : <Plus size={16} />}
               {showForm ? 'CANCEL DEPLOYMENT' : 'INITIALIZE NEXUS'}
             </button>
           </div>
        </div>

        {/* Deployment Form */}
        {showForm && (
          <div className="mb-16 glass-container p-8 animate-in fade-in slide-in-from-top-4 duration-500">
            <form onSubmit={handleCreate} className="flex flex-col md:flex-row gap-6 items-end">
              <div className="flex-1 flex flex-col gap-2">
                <label className="meta-label text-[10px] opacity-50">NEXUS IDENTIFIER (TITLE)</label>
                <input 
                  autoFocus
                  value={newProjectTitle}
                  onChange={(e) => setNewProjectTitle(e.target.value)}
                  placeholder="e.g. Neural Topology Mapping"
                  className="clinical-input text-2xl font-light font-display"
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="meta-label text-[10px] opacity-50 uppercase">Visual Identity</label>
                <div className="flex gap-2">
                  {[
                    { id: 'clinical-mint', color: '#10b981' },
                    { id: 'clinical-slate', color: '#475569' },
                    { id: 'clinical-lavender', color: '#8b5cf6' },
                    { id: 'clinical-amber', color: '#d97706' },
                    { id: 'clinical-rose', color: '#e11d48' },
                    { id: 'clinical-sapphire', color: '#2563eb' },
                    { id: 'clinical-emerald', color: '#059669' },
                    { id: 'clinical-crimson', color: '#991b1b' },
                  ].map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSelectedTheme(t.id)}
                      className={`h-8 w-8 rounded-full border-2 transition-all ${selectedTheme === t.id ? 'border-primary scale-110 shadow-lg' : 'border-transparent opacity-50 hover:opacity-100'}`}
                      style={{ backgroundColor: t.color }}
                    />
                  ))}
                </div>
              </div>

              <button 
                type="submit"
                disabled={isInitializing}
                className="btn-primary py-4 px-10 h-full flex items-center gap-3"
              >
                {isInitializing ? <Activity className="animate-spin" size={18} /> : <CheckCircle size={18} />}
                CONFIRM DEPLOYMENT
              </button>
            </form>
          </div>
        )}

        {(localError || projectError) && <div className="text-error mb-8">{localError || projectError}</div>}

        {/* The Grid */}
        {loading && projects.length === 0 ? (
          <div className="flex items-center justify-center p-20 text-primary">
            <Activity className="animate-spin opacity-50" size={32} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-8 pb-20">
             {projects.map(proj => (
                <ProjectCard key={proj.projectId} project={proj} onDelete={deleteProject} onRefresh={refreshProjects} />
             ))}
             
             {projects.length === 0 && (
                <div className="md:col-span-2 lg:col-span-3 2xl:col-span-4 p-20 glass-container flex flex-col items-center justify-center text-center opacity-60 border border-dashed border-outline-variant/50">
                  <FolderClosed size={48} strokeWidth={1} className="mb-4" />
                  <p className="font-display tracking-widest">NO ACTIVE WORKSPACES</p>
                  <p className="text-xs opacity-60 mt-2">Initialize a new mock project sandbox to begin mapping.</p>
                </div>
             )}
          </div>
        )}

      </main>
    </div>
  );
}
