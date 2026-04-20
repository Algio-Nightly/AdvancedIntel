import React, { useMemo } from 'react';
import { Activity, Beaker, Dna, Database, Settings, Box, FolderClosed, FileText, AlertTriangle, Link2, ScanFace } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { useProjects } from '../context/ProjectContext';
import { useLibrary } from '../context/LibraryContext';
import { useNavigate } from 'react-router-dom';
import { formatRelativeTime } from '../lib/utils';

// Static placeholder for sparkline until we implement historical graphing
const ingestionData = [
  { value: 12 }, { value: 19 }, { value: 15 }, { value: 25 }, { value: 22 }, { value: 30 }, { value: 45 },
];

export default function Dashboard() {
  const { projects, loading: projectsLoading } = useProjects();
  const { documents, loading: docsLoading } = useLibrary();
  const navigate = useNavigate();

  // Compute Global Telemetry Derived State
  const telemetry = useMemo(() => {
    let nodes = 0;
    let edges = 0;
    let orphans = 0;

    projects.forEach(p => {
      nodes += p.metrics?.totalNodes || 0;
      edges += p.metrics?.totalEdges || 0;
      orphans += p.metrics?.orphanCount || 0;
    });

    const synthesis = nodes > 0 ? (edges / nodes) * 100 : 0;

    return {
      totalNodes: nodes,
      totalEdges: edges,
      orphanDensity: orphans,
      synthesisCoefficient: synthesis,
      crossDomainCount: documents.length
    };
  }, [projects, documents]);

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

            {/* Stats Grid inside the right column */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              
              {/* Card 1: Synthesis Coefficient */}
              <div className="glass-container p-8 flex flex-col justify-between aspect-square relative">
                <span className="absolute top-8 right-8 meta-label opacity-50">01</span>
                <div className="flex-1 flex items-center justify-center">
                  <div className="flex items-baseline">
                    <span className={`display-lg transition-all ${telemetry.synthesisCoefficient > 120 ? 'text-primary-container drop-shadow-[0_0_15px_rgba(181,216,215,0.7)]' : 'text-on-surface'}`}>
                      {(telemetry.synthesisCoefficient / 100).toFixed(2)}
                    </span>
                    <span className="text-2xl font-light ml-1 text-primary-container">x</span>
                  </div>
                </div>
                <div>
                  <div className="meta-label">SYNTHESIS COEFFICIENT —</div>
                  <p className="text-[10px] text-on-surface/50 mt-2 tracking-widest font-display uppercase">Deep Work Metric (Global Edges/Nodes)</p>
                </div>
              </div>

              {/* Card 2: Orphan Density */}
              <div className={`glass-container p-8 flex flex-col justify-between aspect-square relative ${telemetry.orphanDensity > 10 ? 'border-error/20 bg-error/5' : ''}`}>
                 <span className="absolute top-8 right-8 meta-label opacity-50">02</span>
                 
                 <div className="flex-1 flex flex-col items-center justify-center text-center mt-6">
                   <div className={`flex items-center gap-2 mb-2 ${telemetry.orphanDensity > 0 ? 'text-error' : 'text-primary/50'}`}>
                     <AlertTriangle size={18} />
                     <span className={`display-lg text-[2.5rem] ${telemetry.orphanDensity > 0 ? 'text-error' : 'text-primary/50'}`}>
                       {telemetry.orphanDensity}
                     </span>
                   </div>
                   <span className="text-sm opacity-60 font-body">Global Unlinked Nodes</span>
                 </div>

                 <div className="flex flex-col gap-4 mt-auto">
                    {telemetry.orphanDensity > 0 && (
                      <button className="btn-secondary border-error/20 hover:bg-error/10 hover:text-error text-[10px] tracking-widest w-full">INITIATE CLEANUP PROTOCOL</button>
                    )}
                    <div className={`${telemetry.orphanDensity > 0 ? 'text-error/80' : 'opacity-40'} meta-label mt-2`}>ORPHAN COUNT —</div>
                 </div>
              </div>

              {/* Card 3: Network Serendipity (Total Library Size + Projects) */}
              <div className="glass-container p-8 flex flex-col justify-between min-h-[200px] relative xl:col-span-1">
                 <span className="absolute top-8 right-8 meta-label opacity-50">03</span>
                 <div className="h-10 w-10 rounded-full bg-primary-container/20 flex items-center justify-center mb-6">
                   <Link2 size={18} className="text-secondary" />
                 </div>
                 
                 <div className="flex items-center gap-4 mb-2">
                   <h3 className="text-5xl font-light text-primary-container drop-shadow-[0_0_10px_rgba(181,216,215,0.4)]">
                     {telemetry.crossDomainCount}
                   </h3>
                   <span className="text-sm font-body opacity-80 leading-tight">Library<br/>Documents</span>
                 </div>

                 <div className="meta-label mt-auto pt-6 border-t border-outline-variant/10">INGESTION VOLUME —</div>
              </div>
              
            </div>

          </div>

        </div>
      </main>
    </div>
  );
}
