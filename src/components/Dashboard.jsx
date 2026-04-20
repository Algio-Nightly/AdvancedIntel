import React, { useState, useEffect } from 'react';
import { Database, ShieldAlert, TrendingUp, Brain, Plus, FolderClosed, FileText, Link2, Activity } from 'lucide-react';
import { useProjects } from '../context/ProjectContext';
import { useLibrary } from '../context/LibraryContext';
import { useNavigate } from 'react-router-dom';
import { formatRelativeTime } from '../lib/utils';
import { getStorageStats, clearAllBlobs } from '../lib/storage';
import { useFirebase } from '../hooks/useFirebase';
import { toast } from 'sonner';

// Static placeholder for sparkline until we implement historical graphing
const ingestionData = [
  { value: 12 }, { value: 19 }, { value: 15 }, { value: 25 }, { value: 22 }, { value: 30 }, { value: 45 },
];

export default function Dashboard() {
  const { projects, loading: projectsLoading } = useProjects();
  const { documents, loading: docsLoading } = useLibrary();
  const navigate = useNavigate();

  const { fetchAllUserNodes, saveTelemetrySnapshot, fetchTelemetryHistory } = useFirebase();
  const [telemetry, setTelemetry] = useState({
    storage: { formatted: '0 MB', count: 0 },
    cdi: 0,
    velocity: 0,
    crd: 0,
    aiSaturation: 0,
    history: []
  });

  const loadTelemetry = async () => {
    try {
      const storage = await getStorageStats();
      const allNodes = await fetchAllUserNodes();
      
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      const staleNodes = allNodes.filter(n => {
        const lastUpd = n.lastUpdated?.seconds ? n.lastUpdated.seconds * 1000 : Date.now();
        return lastUpd < thirtyDaysAgo;
      });
      const cdi = allNodes.length ? Math.round((staleNodes.length / allNodes.length) * 100) : 0;

      const todayStart = new Date().setHours(0,0,0,0);
      const todayNotes = allNodes.reduce((acc, n) => {
        const count = (n.widgets || []).filter(w => {
           const created = w.createdAt || n.createdAt?.seconds * 1000 || Date.now();
           return created > todayStart;
        }).length;
        return acc + count;
      }, 0);
      const velocity = todayNotes > 0 ? Math.min(100, todayNotes * 10) : 0;

      const totalDeps = allNodes.reduce((acc, n) => acc + (n.dependencies?.length || 0), 0);
      const crd = allNodes.length ? (totalDeps / allNodes.length).toFixed(1) : 0;

      const aiNotes = allNodes.reduce((acc, n) => {
        return acc + (n.widgets || []).filter(w => w.type === 'markdown' && w.data?.includes('AI')).length;
      }, 0);
      const aiSaturation = allNodes.length ? Math.round((aiNotes / Math.max(1, allNodes.reduce((acc,n)=>acc+(n.widgets?.length||0),0))) * 100) : 0;

      const history = await fetchTelemetryHistory();

      const newStats = { storage, cdi, velocity, crd, aiSaturation, history };
      setTelemetry(newStats);

      // Auto-save today's snapshot
      await saveTelemetrySnapshot({ cdi, velocity, crd, aiSaturation, storageSize: storage.count });
    } catch (err) {
      console.error("Telemetry failed", err);
    }
  };

  useEffect(() => {
    loadTelemetry();
  }, [projects]);

  const handleFlushCache = async () => {
    if (confirm("Purge local binary cache? This will delete all locally stored PDFs but keep your nodes.")) {
       await clearAllBlobs();
       toast.success("Local volatility stabilized. Cache cleared.");
       loadTelemetry();
    }
  };

  const recentProjects = projects.slice(0, 2);
  const recentDocs = documents.slice(0, 2);

  return (
    <div className="flex flex-col text-on-surface min-h-screen">
      <main className="w-full pt-32 flex flex-col px-4 md:px-12 2xl:px-24">

        {/* Master 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 px-4 pb-20">
          
          {/* ============================================================ */}
          {/* LEFT COLUMN: ACTIVE PROJECTS & INBOX (Takes ~1/3 of space) */}
          {/* ============================================================ */}
          <div className="lg:col-span-4 xl:col-span-3 flex flex-col gap-10">
            
            {/* Active Projects Block */}
            <div className="w-full flex flex-col">
              <div className="flex justify-between items-end mb-4 pr-2">
                 <h3 className="text-2xl font-light font-display">Active Projects</h3>
                 <span onClick={() => navigate('/projects')} className="meta-label opacity-50 cursor-pointer hover:text-primary transition-colors">VIEW ALL</span>
              </div>
              
              <div className="flex flex-col gap-4">
                 {projectsLoading ? (
                   <div className="p-8 flex items-center justify-center text-primary/50"><Activity className="animate-spin" /></div>
                 ) : recentProjects.length === 0 ? (
                   <div className="glass-container p-6 text-center meta-label opacity-50">NO PROJECTS ACTIVE</div>
                 ) : (
                   recentProjects.map(proj => (
                     <div 
                       key={proj.projectId}
                       onClick={() => navigate(`/projects`)}
                       className="glass-container p-6 cursor-pointer hover:bg-surface-container-highest/20 transition-all flex flex-col justify-between group border border-outline-variant/30 hover:border-primary/30"
                     >
                        <div className="flex justify-between items-start mb-4">
                          <FolderClosed size={20} className="text-secondary opacity-70 group-hover:opacity-100 transition-opacity" />
                          <span className="meta-label">{proj.metrics?.totalNodes || 0} NODES</span>
                        </div>
                        <h4 className="text-xl font-light leading-tight truncate">{proj.title}</h4>
                        <p className="text-xs text-on-surface/50 mt-2 font-body uppercase tracking-wider text-[10px]">
                          {formatRelativeTime(proj.timestamps?.lastAccessed)}
                        </p>
                     </div>
                   ))
                 )}
              </div>
            </div>

            {/* Inbox / Library Block */}
            <div className="w-full flex flex-col mt-4">
              <div className="flex justify-between items-end mb-4 pr-2">
                 <h3 className="text-2xl font-light font-display">Library Inbox</h3>
                 <span onClick={() => navigate('/library')} className="meta-label opacity-50 cursor-pointer hover:text-primary transition-colors">PROCESS</span>
              </div>
              <div className="glass-container p-5 flex flex-col gap-3">
                 {docsLoading ? (
                   <div className="p-4 flex items-center justify-center text-primary/50"><Activity className="animate-spin" /></div>
                 ) : recentDocs.length === 0 ? (
                   <div className="p-4 text-center meta-label opacity-50">LIBRARY EMPTY</div>
                 ) : (
                   recentDocs.map(docObj => (
                     <div key={docObj.id} className="flex items-center gap-3 p-3 rounded bg-surface-container-highest/30 border border-outline-variant/10">
                       <FileText size={16} className="text-primary shrink-0"/>
                       <div className="flex w-full justify-between items-center overflow-hidden">
                          <span className="text-sm truncate pr-2">{docObj.fileName}</span>
                          <span className="meta-label ml-2 shrink-0">{docObj.type === 'application/pdf' ? 'PDF' : 'DOC'}</span>
                       </div>
                     </div>
                   ))
                 )}
              </div>
            </div>

          </div>


          {/* ============================================================ */}
          {/* RIGHT COLUMN: COGNITIVE TELEMETRY (Takes ~2/3 of space)      */}
          {/* ============================================================ */}
          <div className="lg:col-span-8 xl:col-span-9 flex flex-col">
            
            <div className="mb-6">
              <h1 className="text-4xl font-light">Global Telemetry</h1>
              <p className="meta-label opacity-40 mt-1">REAL-TIME RAM STATE ANALYSIS</p>
            </div>

            {/* New High-Fidelity Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              
              {/* Local Volatility */}
              <div className="glass-container p-8 flex flex-col justify-between border-primary/20 bg-primary/5 min-h-[220px] group/stat">
                 <div className="flex justify-between items-start">
                   <Database size={20} className="text-primary opacity-50" />
                   <span className="text-[10px] meta-label text-primary tracking-[0.2em]">LOCAL VOLATILITY</span>
                 </div>
                 <div>
                   <div className="text-4xl font-display font-light text-on-surface">{telemetry.storage.formatted}</div>
                   <div className="text-xs opacity-40 meta-label mt-2 uppercase">{telemetry.storage.count} PDFs ENCAPSULATED</div>
                 </div>
                 <button onClick={handleFlushCache} className="mt-6 text-[10px] meta-label text-error/50 hover:text-error transition-colors text-left uppercase tracking-widest opacity-0 group-hover/stat:opacity-100">Initialize Cache Purge</button>
              </div>

              {/* Cognitive Decay */}
              <div className="glass-container p-8 flex flex-col justify-between border-amber-500/20 bg-amber-500/5 min-h-[220px]">
                 <div className="flex justify-between items-start">
                   <ShieldAlert size={20} className="text-amber-500 opacity-50" />
                   <span className="text-[10px] meta-label text-amber-500 tracking-[0.2em]">DECAY INDEX</span>
                 </div>
                 <div>
                   <div className="text-4xl font-display font-light text-amber-500">{telemetry.cdi}%</div>
                   <div className="text-xs opacity-40 meta-label mt-2 uppercase">Stale knowledge nodes</div>
                 </div>
                 <div className="h-1 bg-surface-container rounded-full overflow-hidden mt-6">
                    <div className="h-full bg-amber-500 transition-all duration-1000" style={{ width: `${telemetry.cdi}%` }} />
                 </div>
              </div>

              {/* Synthesis Velocity */}
              <div className="glass-container p-8 flex flex-col justify-between border-emerald-500/20 bg-emerald-500/5 min-h-[220px]">
                 <div className="flex justify-between items-start">
                   <TrendingUp size={20} className="text-emerald-500 opacity-50" />
                   <span className="text-[10px] meta-label text-emerald-500 tracking-[0.2em]">VELOCITY</span>
                 </div>
                 <div>
                   <div className="text-4xl font-display font-light text-emerald-500">▲ +{telemetry.velocity}%</div>
                   <div className="text-xs opacity-40 meta-label mt-2 uppercase">7-Day Synthesis Delta</div>
                 </div>
                 <div className="flex gap-2 mt-6 h-12 items-end">
                    {/* Map last 7 days of real history, fallback to zero for new accounts */}
                    {Array.from({ length: 7 }).map((_, i) => {
                      const dayData = telemetry.history[i] || { velocity: 0 };
                      const val = (i === 6) ? telemetry.velocity : dayData.velocity; // Current day is always the latest real calc
                      return (
                        <div 
                          key={i} 
                          className="flex-1 bg-emerald-500/20 rounded-t-sm transition-all duration-500" 
                          style={{ height: `${Math.max(10, (val / 100) * 100)}%` }} 
                        />
                      );
                    })}
                 </div>
              </div>

              {/* CRD Metric */}
              <div className="glass-container p-8 flex flex-col justify-between border-blue-500/20 bg-blue-500/5 min-h-[220px]">
                 <div className="flex justify-between items-start">
                   <Link2 size={20} className="text-blue-500 opacity-50" />
                   <span className="text-[10px] meta-label text-blue-500 tracking-[0.2em]">NETWORK DENSITY</span>
                 </div>
                 <div>
                   <div className="text-4xl font-display font-light text-blue-500">{telemetry.crd}</div>
                   <div className="text-xs opacity-40 meta-label mt-2 uppercase">Avg. References per node</div>
                 </div>
                 <div className="text-[10px] meta-label opacity-30 mt-6 uppercase tracking-widest">Integration: {telemetry.crd > 2 ? 'Optimal' : 'Siloed'}</div>
              </div>

              {/* AI Saturation */}
              <div className="glass-container p-8 flex flex-col justify-between border-purple-500/20 bg-purple-500/5 min-h-[220px]">
                 <div className="flex justify-between items-start">
                   <Brain size={20} className="text-purple-500 opacity-50" />
                   <span className="text-[10px] meta-label text-purple-500 tracking-[0.2em]">AI SATURATION</span>
                 </div>
                 <div>
                   <div className="text-4xl font-display font-light text-purple-500">{telemetry.aiSaturation}%</div>
                   <div className="text-xs opacity-40 meta-label mt-2 uppercase">Collaboration Ratio</div>
                 </div>
                 <div className="flex items-center gap-3 mt-6">
                    <div className="w-3 h-3 rounded-full bg-purple-500 animate-pulse shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
                    <span className="text-[10px] meta-label opacity-40 uppercase tracking-widest">Cortex Link Active</span>
                 </div>
              </div>

              {/* Quick Action: New Project */}
              <div 
                onClick={() => navigate('/projects')}
                className="glass-container p-8 flex flex-col justify-center items-center border-outline-variant/30 bg-surface-container-highest/20 min-h-[220px] cursor-pointer hover:bg-surface-container-highest/40 hover:border-primary/30 transition-all group"
              >
                 <Plus size={32} className="text-primary-container opacity-30 group-hover:opacity-100 group-hover:scale-110 transition-all mb-4" />
                 <span className="meta-label opacity-40 group-hover:opacity-100 transition-all">INITIALIZE NEW NEXUS</span>
              </div>
              
            </div>

          </div>

        </div>
      </main>
    </div>
  );
}
