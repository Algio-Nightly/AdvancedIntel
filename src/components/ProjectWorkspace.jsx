import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactFlow, { 
  Background, 
  Controls, 
  useNodesState, 
  useEdgesState, 
  MarkerType,
  Handle,
  Position
} from 'reactflow';
import 'reactflow/dist/style.css';

import { useProjects } from '../context/ProjectContext';
import { useNodes } from '../context/NodeContext';
import { useLibrary } from '../context/LibraryContext';
import { 
  Plus, 
  Activity, 
  LayoutGrid, 
  Link2, 
  Trash2, 
  X, 
  Maximize2, 
  ArrowLeft,
  Settings,
  MoreVertical,
  CheckSquare,
  Square,
  Search,
  BookOpen,
  Link as LinkIcon,
  Brain,
  Video,
  Image as ImageIcon,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';
import { WidgetArea } from './widgets/WidgetEngine';
import DocumentWorkspace from './library/DocumentWorkspace';
import AIPanel from './ai/AIPanel';

// --- SUB-COMPONENTS ---

const DependencyBox = ({ node, backendNodes, libraryDocs, addDependency, removeDependency, onOpen }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showResults, setShowResults] = useState(false);

  const dependencies = node.dependencies || [];
  
  const filteredNodes = backendNodes.filter(n => 
    n.id !== node.id && 
    n.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !dependencies.some(d => d.id === n.id)
  );

  const filteredDocs = libraryDocs.filter(d => 
    d.fileName.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !dependencies.some(dep => dep.id === d.id)
  );

  const handleAdd = (id, type, name) => {
    addDependency(node.id, { id, type, name });
    setSearchTerm('');
    setShowResults(false);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <div className="flex items-center gap-2 bg-surface-container px-3 py-2 rounded-lg border border-outline-variant/30 focus-within:border-primary/50 transition-colors">
          <Search size={14} className="opacity-40" />
          <input 
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowResults(true);
            }}
            onFocus={() => setShowResults(true)}
            placeholder="Search containers or library..."
            className="bg-transparent border-none focus:ring-0 text-xs w-full"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')}><X size={14} className="opacity-40" /></button>
          )}
        </div>

        {showResults && searchTerm && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-surface-container-highest border border-outline-variant/30 rounded-xl shadow-2xl z-[100] max-h-64 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-2">
            {filteredNodes.length > 0 && (
              <div className="p-2">
                <p className="text-[9px] meta-label opacity-40 px-2 py-1 uppercase">Research Containers</p>
                {filteredNodes.map(n => (
                  <button 
                    key={n.id}
                    onClick={() => handleAdd(n.id, 'node', n.title)}
                    className="w-full text-left px-3 py-2 hover:bg-primary/10 rounded-lg text-xs flex items-center justify-between group"
                  >
                    <span>{n.title}</span>
                    <Plus size={12} className="opacity-0 group-hover:opacity-100 text-primary" />
                  </button>
                ))}
              </div>
            )}
            {filteredDocs.length > 0 && (
              <div className="p-2 border-t border-outline-variant/10">
                <p className="text-[9px] meta-label opacity-40 px-2 py-1 uppercase">Library Archives</p>
                {filteredDocs.map(d => (
                  <button 
                    key={d.id}
                    onClick={() => handleAdd(d.id, 'library', d.fileName)}
                    className="w-full text-left px-3 py-2 hover:bg-emerald-500/10 rounded-lg text-xs flex items-center justify-between group"
                  >
                    <span className="truncate pr-4">{d.fileName}</span>
                    <Plus size={12} className="opacity-0 group-hover:opacity-100 text-emerald-500" />
                  </button>
                ))}
              </div>
            )}
            {filteredNodes.length === 0 && filteredDocs.length === 0 && (
              <div className="p-4 text-center text-[10px] opacity-40 italic">No matches in cognitive database</div>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {dependencies.length === 0 ? (
          <div className="py-8 flex flex-col items-center justify-center opacity-20 text-center">
            <Link2 size={32} strokeWidth={1} className="mb-2" />
            <p className="text-[10px] uppercase tracking-widest">No dependencies mapped</p>
          </div>
        ) : (
          dependencies.map(dep => (
            <div key={dep.id} className="flex items-center justify-between bg-surface-container/30 border border-outline-variant/10 p-3 rounded-xl group hover:border-outline-variant/30 transition-all">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${dep.type === 'library' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-primary/10 text-primary'}`}>
                  {dep.type === 'library' ? <BookOpen size={14} /> : <LayoutGrid size={14} />}
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className="text-xs font-medium truncate">{dep.name}</span>
                  <span className="text-[9px] meta-label opacity-40 uppercase tracking-tighter">
                    {dep.type === 'library' ? 'Library Archive' : 'Research Container'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {dep.type === 'library' && (
                  <button 
                    onClick={() => onOpen(dep)}
                    className="p-1.5 hover:bg-primary/10 text-primary rounded"
                  >
                    <Maximize2 size={12}/>
                  </button>
                )}
                <button 
                  onClick={() => removeDependency(node.id, dep.id)}
                  className="p-1.5 hover:bg-error/10 text-error rounded"
                >
                  <X size={12}/>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const NODE_COLORS = [
  { id: 'default', hex: '#6366f1', class: 'border-indigo-500/50' },
  { id: 'emerald', hex: '#10b981', class: 'border-emerald-500/50' },
  { id: 'rose', hex: '#f43f5e', class: 'border-rose-500/50' },
  { id: 'amber', hex: '#f59e0b', class: 'border-amber-500/50' },
  { id: 'cyan', hex: '#06b6d4', class: 'border-cyan-500/50' },
];

const NodeComponent = ({ data, selected }) => {
  const isSelected = selected || data.selected;
  const dependencies = data.dependencies || [];
  const widgets = (data.widgets || []).filter(w => 
    ['youtube', 'image', 'markdown', 'pdf', 'library_notes'].includes(w.type)
  );

  return (
    <div 
      className={`relative px-6 py-4 rounded-2xl bg-surface-container border-2 transition-all duration-300 shadow-xl min-w-[200px] max-w-[280px] max-h-[160px] ${isSelected ? 'scale-105 ring-4 ring-primary/20 z-50' : 'hover:border-primary/40'}`}
      style={{ borderColor: data.color || 'rgb(var(--outline-variant))' }}
    >
      <Handle type="target" position={Position.Top} className="!bg-primary !w-3 !h-3 !border-4 !border-surface" />
      
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 mb-1">
          <div className={`h-2 w-2 rounded-full animate-pulse ${isSelected ? 'bg-primary' : 'bg-on-surface/30'}`} />
          <span className="text-[9px] meta-label opacity-40 uppercase tracking-widest">Research Container</span>
        </div>
        <h3 className="font-display text-base leading-tight text-on-surface truncate">{data.label}</h3>
        
        {data.metrics && (
          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-outline-variant/10 text-[9px] meta-label opacity-40 uppercase shrink-0">
            <span className="flex items-center gap-1"><Activity size={10} /> {data.metrics.synthesisRatio?.toFixed(1)} SR</span>
            <span>{data.widgetsCount || 0} Tools</span>
          </div>
        )}
      </div>

      {/* Honeycomb Orbit Panels */}
      {isSelected && (
        <div className="absolute inset-0 pointer-events-none">
          <HoneycombOrbit items={dependencies} side="left" />
          <HoneycombOrbit items={widgets} side="right" />
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="!bg-primary !w-3 !h-3 !border-4 !border-surface" />
    </div>
  );
};

// --- HEXAGONAL BUBBLE COMPONENT ---
const HexBubble = ({ children, colorClass, delay, title, side }) => (
  <div 
    title={title}
    className={`
      w-10 h-11 flex items-center justify-center shadow-xl backdrop-blur-md animate-in zoom-in fill-mode-both border-0
      ${colorClass}
      ${side === 'left' ? 'slide-in-from-right-4' : 'slide-in-from-left-4'}
    `}
    style={{ 
      animationDelay: `${delay}ms`,
      clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
      background: 'currentColor'
    }}
  >
    <div className="bg-surface/90 w-full h-full flex items-center justify-center" style={{ clipPath: 'inherit' }}>
      {children}
    </div>
  </div>
);

const HoneycombOrbit = ({ items, side }) => {
  if (!items || items.length === 0) return null;
  
  // Group into columns of 3
  const columns = [];
  for (let i = 0; i < items.length; i += 3) {
    columns.push(items.slice(i, i + 3));
  }

  return (
    <div className={`absolute top-1/2 -translate-y-1/2 flex gap-1 z-[100] pointer-events-auto ${side === 'left' ? '-left-6' : '-right-6'} ${side === 'left' ? '-translate-x-full' : 'translate-x-full'}`}>
      {columns.map((col, colIdx) => (
        <div 
          key={colIdx} 
          className="flex flex-col gap-1"
          style={{ marginTop: colIdx % 2 === 0 ? '0' : '22px' }} // Stagger for honeycomb effect
        >
          {col.map((item, i) => (
            <HexBubble 
              key={item.id} 
              title={item.name || item.title}
              side={side}
              delay={(colIdx * 3 + i) * 80}
              colorClass={side === 'left' ? 'text-emerald-500' : 'text-primary'}
            >
              {item.type === 'library' && <BookOpen size={14} />}
              {item.type === 'node' && <LayoutGrid size={14} />}
              {item.type === 'youtube' && <Video size={14} />}
              {item.type === 'image' && <ImageIcon size={14} />}
              {item.type === 'markdown' && <FileText size={14} />}
              {item.type === 'library_notes' && <BookOpen size={14} />}
            </HexBubble>
          ))}
        </div>
      ))}
    </div>
  );
};

const nodeTypes = {
  project_node: NodeComponent,
};

// --- MAIN PROJECT WORKSPACE COMPONENT ---

export default function ProjectWorkspace() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { projects, updateProjectMetrics } = useProjects();
  const { nodes: backendNodes, loadNodes, updateMetadata, updateWidgets, updatePosition, addNode, removeNode, loading, error } = useNodes();
  const { documents: libraryDocs, fetchDocumentNotes } = useLibrary();

  // Live Metric Calculation (derived for immediate UI feedback)
  const derivedMetrics = useMemo(() => {
    const totalNodes = backendNodes.length;
    let totalEdges = 0;
    const connectedNodeIds = new Set();
    
    backendNodes.filter(Boolean).forEach(n => {
      const parents = n.targetParentIds || (n.targetParentId ? [n.targetParentId] : []);
      parents.forEach(pId => {
        totalEdges++;
        connectedNodeIds.add(n.id);
        connectedNodeIds.add(pId);
      });
      
      if (n.dependencies) {
        n.dependencies.forEach(dep => {
          if (dep.type === 'node') {
            totalEdges++;
            connectedNodeIds.add(n.id);
            connectedNodeIds.add(dep.id);
          }
        });
      }
    });

    const ratio = totalNodes > 0 ? totalEdges / totalNodes : 0;
    const orphanCount = backendNodes.filter(n => !connectedNodeIds.has(n.id)).length;

    return {
      totalNodes,
      totalEdges,
      synthesisRatio: ratio,
      orphanCount
    };
  }, [backendNodes]);

  // Debounced Firestore sync for metrics
  useEffect(() => {
    if (!id || backendNodes.length === 0) return;

    const timer = setTimeout(() => {
      updateProjectMetrics(id, derivedMetrics);
    }, 5000); // 5s debounce for persistent sync

    return () => clearTimeout(timer);
  }, [derivedMetrics, id, updateProjectMetrics]);

  const [project, setProject] = useState(null);
  const [selectedNodeIds, setSelectedNodeIds] = useState([]);
  const [fullscreenNodeId, setFullscreenNodeId] = useState(null);
  const [isMultiselect, setIsMultiselect] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [localTitle, setLocalTitle] = useState('');
  const [showAIPanel, setShowAIPanel] = useState(false);

  const [rfNodes, setRfNodes, onNodesChange] = useNodesState([]);
  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState([]);
  const [activeDoc, setActiveDoc] = useState(null);

  const handleOpenDependencyDoc = async (dep) => {
    if (dep.type !== 'library' && dep.type !== 'pdf') return;
    
    const docMeta = libraryDocs.find(d => d.id === dep.id);
    if (!docMeta) {
      toast.error("Document metadata not found");
      return;
    }

    const toastId = toast.loading("Retrieving document from local cache...");
    try {
      const { getBlobFromLocal } = await import('../lib/storage');
      const blob = await getBlobFromLocal(dep.id);
      if (!blob) {
        toast.error("Document not found in local cache", { id: toastId });
        return;
      }
      setActiveDoc({ id: dep.id, name: dep.name, blob });
      toast.success("Document stream initialized", { id: toastId });
    } catch (err) {
      toast.error("Cache retrieval failed", { id: toastId });
    }
  };

  useEffect(() => {
    if (id && projects.length > 0) {
      const found = projects.find(p => p.projectId === id);
      if (found) setProject(found);
      loadNodes(id);
    }
  }, [id, projects, loadNodes]);

  useEffect(() => {
    const nodes = backendNodes.map(n => ({
      id: n.id,
      type: 'project_node',
      position: n.position || { x: Math.random() * 400, y: Math.random() * 400 },
      data: { 
        label: n.title, 
        selected: selectedNodeIds.includes(n.id),
        color: n.color,
        widgetsCount: (n.widgets || []).length,
        widgets: n.widgets || [],
        dependencies: n.dependencies || []
      }
    }));

    const edges = [];
    backendNodes.forEach(n => {
      // Support both legacy single parent and new multiple parents
      const parents = n.targetParentIds || (n.targetParentId ? [n.targetParentId] : []);
      
      parents.forEach(pId => {
        edges.push({
          id: `e-${n.id}-${pId}`,
          source: pId,
          target: n.id,
          animated: true,
          style: { stroke: n.color || 'rgb(var(--primary))', strokeWidth: 2, opacity: 0.8 },
          markerEnd: { type: MarkerType.ArrowClosed, color: n.color || 'rgb(var(--primary))' }
        });
      });
      if (n.dependencies) {
        n.dependencies.forEach(dep => {
          if (dep.type === 'node') {
            edges.push({
              id: `dep-${n.id}-${dep.id}`,
              source: n.id,
              target: dep.id,
              animated: true,
              style: { stroke: '#10b981', strokeDasharray: '5,5', opacity: 0.3 },
              markerEnd: { type: MarkerType.ArrowClosed, color: '#10b981' }
            });
          }
        });
      }
    });

    setRfNodes(nodes);
    setRfEdges(edges);
  }, [backendNodes, selectedNodeIds, setRfNodes, setRfEdges]);

  const onNodeClick = (_, node) => {
    if (isMultiselect) {
      setSelectedNodeIds(prev => 
        prev.includes(node.id) ? prev.filter(id => id !== node.id) : [...prev, node.id]
      );
    } else {
      setSelectedNodeIds([node.id]);
    }
  };

  const onPaneClick = () => {
    if (!isMultiselect) setSelectedNodeIds([]);
  };

  const handleNodeDragStop = (_, node) => {
    updatePosition(node.id, node.position);
  };

  const handleCreateNode = async () => {
    setIsCreating(true);
    const toastId = toast.loading("Synthesizing new container...");
    try {
      const newNode = await addNode(id, "New Container", "research_node");
      if (newNode) {
        setSelectedNodeIds([newNode.id]);
        toast.success("Container synthesized", { id: toastId });
      }
    } catch (err) {
      toast.error("Synthesis failed", { id: toastId });
    } finally {
      setIsCreating(false);
    }
  };

  const handleMetadataChange = (nodeId, field, value) => {
    updateMetadata(nodeId, { [field]: value });
  };

  const addDependency = async (nodeId, dep) => {
    const node = backendNodes.find(n => n.id === nodeId);
    if (!node) return;
    const currentDeps = node.dependencies || [];
    if (currentDeps.some(d => d.id === dep.id)) return;
    
    await updateMetadata(nodeId, { dependencies: [...currentDeps, dep] });
    toast.success(`Dependency linked: ${dep.name}`);
  };

  const removeDependency = async (activeNodeId, depId) => {
    const activeNode = backendNodes.find(n => n.id === activeNodeId);
    if (!activeNode) return;
    
    const newDeps = (activeNode.dependencies || []).filter(Boolean).filter(d => d.id !== depId);
    await updateMetadata(activeNodeId, { dependencies: newDeps });
  };

  const activeNodeId = selectedNodeIds.length > 0 ? selectedNodeIds[selectedNodeIds.length - 1] : null;
  const activeNode = activeNodeId ? backendNodes.find(n => n.id === activeNodeId) : null;

  useEffect(() => {
    if (activeNode) {
      setLocalTitle(activeNode.title || '');
    }
  }, [activeNodeId, activeNode?.title]);

  if (!project) {
    return <div className="flex h-screen items-center justify-center text-primary font-display tracking-widest uppercase">Initializing Nexus...</div>;
  }

  const selectedNodes = backendNodes.filter(n => selectedNodeIds.includes(n.id));

  return (
    <>
      {/* Document Workspace Overlay */}
      {activeDoc && (
        <DocumentWorkspace 
          docId={activeDoc.id}
          fileName={activeDoc.name}
          blob={activeDoc.blob}
          activeNodeId={activeNodeId} 
          onClose={() => setActiveDoc(null)} 
        />
      )}

      {fullscreenNodeId ? (
        (() => {
          const fsNode = backendNodes.find(n => n?.id === fullscreenNodeId);
          if (!fsNode) {
            setFullscreenNodeId(null);
            return null;
          }

          // Build note slabs from markdown widgets for AI panel
          const fsNoteSlabs = (fsNode.widgets || []).filter(w => w.type === 'markdown' || w.type === 'library_notes').map(w => ({
            id: w.id,
            title: w.title || 'Untitled',
            data: w.data || '',
          }));

          // Build dependency content references
          const fsDeps = (fsNode.dependencies || []).map(dep => ({
            id: dep.id,
            type: dep.type,
            name: dep.name,
            content: dep.type === 'node'
              ? (backendNodes.find(n => n.id === dep.id)?.widgets || []).filter(w => w.type === 'markdown').map(w => w.data).join('\n\n')
              : '',
          }));

          return (
            <div className="flex flex-col h-screen text-on-surface bg-surface px-6 py-6 pt-24 overflow-hidden animate-fade-in">
              <div className="flex items-center justify-between mb-8 pb-6 border-b border-outline-variant/20 flex-shrink-0">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setFullscreenNodeId(null)}
                    className="p-2 mr-2 hover:bg-surface-container-highest rounded-lg transition-colors text-primary"
                  >
                    <ArrowLeft size={20} />
                  </button>
                  <div className="h-12 w-12 rounded-xl bg-primary/20 text-primary flex items-center justify-center">
                    <LayoutGrid size={24} />
                  </div>
                  <div>
                    <h2 className="font-display text-3xl text-primary leading-tight">{fsNode.title}</h2>
                    <p className="text-xs meta-label opacity-50 mt-1 uppercase tracking-widest">Full-Spectrum Container Access</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAIPanel(!showAIPanel)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-display tracking-widest transition-all border ${
                    showAIPanel
                      ? 'bg-violet-500/20 border-violet-500/30 text-violet-400'
                      : 'bg-surface-container/60 border-outline-variant/20 text-on-surface/60 hover:border-violet-500/30 hover:text-violet-400'
                  }`}
                >
                  <Brain size={14} />
                  AI
                </button>
              </div>
              <div className="flex-1 overflow-hidden flex gap-0">
                <div className="flex-1 overflow-hidden relative min-h-0">
                  <WidgetArea 
                    node={fsNode} 
                    updateWidgets={updateWidgets} 
                    allNodes={backendNodes}
                    allDocs={libraryDocs}
                    fetchDocNotes={fetchDocumentNotes}
                    renderDependencies={() => (
                      <DependencyBox 
                        node={fsNode} 
                        backendNodes={backendNodes} 
                        libraryDocs={libraryDocs} 
                        addDependency={addDependency} 
                        removeDependency={removeDependency} 
                        onOpen={handleOpenDependencyDoc}
                      />
                    )}
                  />
                </div>
                <AIPanel
                  noteSlabs={fsNoteSlabs}
                  dependencies={fsDeps}
                  onAppendToNote={(noteId, content) => {
                    const currentWidgets = fsNode.widgets || [];
                    const updated = currentWidgets.map(w =>
                      w.id === noteId ? { ...w, data: (w.data || '') + content } : w
                    );
                    updateWidgets(fsNode.id, updated);
                  }}
                  onReplaceNote={(noteId, newContent) => {
                    const currentWidgets = fsNode.widgets || [];
                    const updated = currentWidgets.map(w =>
                      w.id === noteId ? { ...w, data: newContent } : w
                    );
                    updateWidgets(fsNode.id, updated);
                  }}
                  onSaveAsNewNote={(content) => {
                    const newWidget = {
                      id: `widget-${Date.now()}`,
                      type: 'markdown',
                      title: 'AI Insight',
                      data: content
                    };
                    updateWidgets(fsNode.id, [...(fsNode.widgets || []), newWidget]);
                  }}
                  context="project"
                  isOpen={showAIPanel}
                  onClose={() => setShowAIPanel(false)}
                />
              </div>
            </div>
          );
        })()
      ) : (
        <div className="flex flex-col text-on-surface min-h-screen bg-surface px-4 md:px-12 2xl:px-24 py-12 pt-32 overflow-x-hidden">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6 shrink-0">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Activity size={18} className="text-primary animate-pulse" />
                <p className="text-[10px] meta-label opacity-50 tracking-[0.3em] uppercase">Cognitive Workspace Active</p>
              </div>
              <h1 className="text-5xl font-light font-display tracking-tight leading-tight">{project.title}</h1>
            </div>

            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsMultiselect(!isMultiselect)}
                className={`px-6 py-3 rounded-full border transition-all font-display tracking-widest text-[10px] uppercase ${isMultiselect ? 'bg-primary text-on-primary border-primary' : 'border-outline-variant/30 opacity-50 hover:opacity-100 hover:border-primary/50'}`}
              >
                {isMultiselect ? 'TERMINATE SELECTION' : 'INITIATE MULTISELECT'}
              </button>
              <button 
                onClick={() => navigate('/projects')}
                className="px-6 py-3 border border-outline-variant/30 rounded-full hover:bg-surface-container-highest transition-all font-display tracking-widest text-[10px] uppercase hover:border-primary/50"
              >
                Back to Archive
              </button>
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-12 overflow-visible">
            
            {/* Top Grid: Canvas + Selection Controls */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 min-h-[500px]">
              
              {/* Canvas (2/3) */}
              <div className="xl:col-span-2 glass-container overflow-hidden relative border-outline-variant/10 shadow-2xl min-h-[500px] rounded-[2rem]">
                <ReactFlow
                  nodes={rfNodes}
                  edges={rfEdges}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  onNodeClick={onNodeClick}
                  onPaneClick={onPaneClick}
                  nodeTypes={nodeTypes}
                  onNodeDragStop={handleNodeDragStop}
                  fitView
                  className="bg-surface/50"
                >
                  <Background variant="dots" color="currentColor" className="opacity-[0.05]" gap={24} />
                  <Controls className="!bg-surface-container !border-outline-variant/20 !shadow-xl !rounded-xl overflow-hidden" />
                </ReactFlow>

                <div className="absolute top-6 right-6 flex flex-col gap-4 z-10 pointer-events-none">
                  <div className="p-5 glass-container border-primary/20 bg-primary/5 backdrop-blur-md flex flex-col gap-4 min-w-[220px] rounded-2xl pointer-events-auto">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] meta-label opacity-50 uppercase tracking-widest">Synthesis Ratio</span>
                      <span className="text-xs font-mono text-primary">{derivedMetrics.synthesisRatio.toFixed(2)}</span>
                    </div>
                    <div className="w-full h-1 bg-surface-container rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all duration-1000" 
                        style={{ width: `${Math.min(derivedMetrics.synthesisRatio * 50, 100)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] meta-label opacity-40 uppercase tracking-tight">
                      <span>{derivedMetrics.totalNodes} Containers</span>
                      <span>{derivedMetrics.totalEdges} Links</span>
                    </div>
                  </div>

                  <div className="p-4 glass-container border-error/20 bg-error/5 backdrop-blur-md flex flex-col gap-2 rounded-xl pointer-events-auto">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] meta-label opacity-50 text-error uppercase tracking-widest">Orphaned Nodes</span>
                      <span className="text-xs font-mono text-error">{derivedMetrics.orphanCount}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Selection Summary / Control Center (1/3) */}
              <div className="xl:col-span-1 glass-container p-8 flex flex-col gap-8 rounded-[2rem] border-outline-variant/10 shadow-xl bg-surface-container-low/30 overflow-hidden relative">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                   <Activity size={120} strokeWidth={1} />
                </div>

                <div className="relative z-10">
                  <h2 className="text-2xl font-display text-on-surface mb-1">Control Center</h2>
                  <p className="text-[10px] meta-label opacity-50 uppercase tracking-[0.2em]">Deployment & Node Operations</p>
                </div>

                <button 
                  onClick={handleCreateNode}
                  disabled={isCreating}
                  className="relative z-10 w-full py-5 bg-primary/10 border border-primary/20 text-primary rounded-2xl flex items-center justify-center gap-4 hover:bg-primary/20 hover:border-primary/50 transition-all font-display tracking-widest text-xs disabled:opacity-50 shadow-[0_0_30px_rgba(var(--primary),0.1)]"
                >
                  {isCreating ? <Activity size={18} className="animate-spin" /> : <Plus size={18} />}
                  DEPLOY NEW CONTAINER
                </button>

                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 flex flex-col gap-6 relative z-10">
                  {selectedNodeIds.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-on-surface/30 opacity-40 italic text-center p-8 gap-4">
                      <div className="h-16 w-16 rounded-full border-2 border-dashed border-outline-variant/30 flex items-center justify-center">
                         <LayoutGrid size={24} />
                      </div>
                      <p className="text-xs uppercase tracking-widest leading-loose">Select containers on the canvas to begin cognitive editing.</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                       <div className="flex items-center justify-between">
                          <span className="text-[10px] meta-label opacity-50 uppercase tracking-widest">{selectedNodeIds.length} Containers Selected</span>
                          <button onClick={() => setSelectedNodeIds([])} className="text-[10px] text-error uppercase tracking-widest hover:underline">Clear</button>
                       </div>
                       
                       {activeNode && (
                          <div className="p-6 glass-container border-primary/20 bg-primary/5 rounded-2xl animate-in slide-in-from-right-4 duration-300">
                             <div className="flex items-center justify-between mb-4">
                                <span className="text-[10px] meta-label text-primary uppercase">Active Focus</span>
                                <button onClick={() => setFullscreenNodeId(activeNodeId)}><Maximize2 size={14} className="text-primary opacity-60 hover:opacity-100" /></button>
                             </div>
                             <input 
                               value={localTitle}
                               onChange={(e) => {
                                 setLocalTitle(e.target.value);
                                 handleMetadataChange(activeNodeId, 'title', e.target.value);
                               }}
                               className="bg-transparent border-none focus:ring-0 text-xl font-display text-on-surface p-0 w-full mb-4"
                             />
                             <div className="flex gap-2">
                                {NODE_COLORS.map(c => (
                                  <button
                                    key={c.id}
                                    onClick={() => handleMetadataChange(activeNodeId, 'color', c.hex)}
                                    className={`h-5 w-5 rounded-full border-2 transition-all ${
                                      activeNode.color === c.hex 
                                        ? 'border-on-surface scale-125' 
                                        : 'border-transparent opacity-50 hover:opacity-100'
                                    }`}
                                    style={{ backgroundColor: c.hex }}
                                  />
                                ))}
                             </div>

                             <div className="mt-8 pt-6 border-t border-outline-variant/10">
                                <button
                                  onClick={async () => {
                                    if (window.confirm("Permanently delete this research container and all its mapped data?")) {
                                      await removeNode(activeNodeId);
                                      setSelectedNodeIds([]);
                                      toast.success("Container purged from Nexus");
                                    }
                                  }}
                                  className="w-full py-3 bg-error/5 border border-error/20 text-error rounded-xl flex items-center justify-center gap-2 hover:bg-error/10 transition-all font-display tracking-widest text-[10px]"
                                >
                                  <Trash2 size={14} />
                                  PURGE CONTAINER
                                </button>
                             </div>

                             {/* Parent Linking Section */}
                             <div className="mt-6 pt-6 border-t border-primary/10 flex flex-col gap-3">
                                <span className="text-[10px] meta-label text-primary uppercase opacity-60">Synthesis Parents</span>
                                
                                {/* Active Parent List */}
                                <div className="flex flex-wrap gap-2 mb-2">
                                  {(activeNode.targetParentIds || (activeNode.targetParentId ? [activeNode.targetParentId] : [])).map(pId => {
                                    const pNode = backendNodes.find(bn => bn.id === pId);
                                    if (!pNode) return null;
                                    return (
                                      <div key={pId} className="flex items-center gap-2 px-2 py-1 bg-primary/10 border border-primary/20 rounded-md text-[10px] text-primary">
                                        <span className="truncate max-w-[100px]">{pNode.title}</span>
                                        <button 
                                          onClick={() => {
                                            const current = activeNode.targetParentIds || (activeNode.targetParentId ? [activeNode.targetParentId] : []);
                                            const updated = current.filter(id => id !== pId);
                                            handleMetadataChange(activeNodeId, 'targetParentIds', updated);
                                            if (activeNode.targetParentId === pId) {
                                              handleMetadataChange(activeNodeId, 'targetParentId', null);
                                            }
                                          }}
                                          className="hover:text-error transition-colors"
                                        >
                                          <X size={10} />
                                        </button>
                                      </div>
                                    );
                                  })}
                                </div>

                                <div className="flex gap-2">
                                  <select 
                                    value=""
                                    onChange={(e) => {
                                      if (!e.target.value) return;
                                      const current = activeNode.targetParentIds || (activeNode.targetParentId ? [activeNode.targetParentId] : []);
                                      if (!current.includes(e.target.value)) {
                                        handleMetadataChange(activeNodeId, 'targetParentIds', [...current, e.target.value]);
                                      }
                                    }}
                                    className="flex-1 bg-surface-container/60 border border-outline-variant/20 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-primary/40 text-on-surface"
                                  >
                                    <option value="">Add Parent Link...</option>
                                    {backendNodes
                                      .filter(n => n.id !== activeNodeId && !(activeNode.targetParentIds || (activeNode.targetParentId ? [activeNode.targetParentId] : [])).includes(n.id))
                                      .map(n => (
                                        <option key={n.id} value={n.id}>{n.title}</option>
                                      ))}
                                  </select>
                                </div>
                                <p className="text-[9px] opacity-30 italic">Establish multi-parent connections to map complex intellectual synthesis and hybrid ideas.</p>
                             </div>
                          </div>
                       )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Slabs: Selected Container Details */}
            {selectedNodes.length > 0 && (
              <div className="flex flex-col gap-12 mt-8 animate-in slide-in-from-bottom-8 duration-700">
                <div className="flex items-center gap-6 opacity-30">
                   <div className="h-px flex-1 bg-outline-variant" />
                   <span className="meta-label text-[10px] uppercase tracking-[0.5em]">Cognitive Workspaces</span>
                   <div className="h-px flex-1 bg-outline-variant" />
                </div>

                {selectedNodes.map(node => (
                  <div key={node.id} className="grid grid-cols-1 xl:grid-cols-3 gap-8 h-[600px] max-h-[600px]">
                    {/* Dependencies (1/3) */}
                    <div className="xl:col-span-1 glass-container p-8 flex flex-col rounded-[2rem] border-outline-variant/10 shadow-xl bg-surface-container-low/30 overflow-hidden">
                       <div className="flex items-center gap-4 mb-8 pb-6 border-b border-emerald-500/10">
                          <div className="h-10 w-10 rounded-xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
                             <LinkIcon size={20} />
                          </div>
                          <div>
                            <h2 className="font-display text-2xl text-emerald-500 leading-tight">Dependencies</h2>
                            <p className="text-[10px] meta-label opacity-50 mt-1 uppercase tracking-widest">Cross-Context References</p>
                          </div>
                       </div>
                       
                       <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                          <DependencyBox 
                            node={node} 
                            backendNodes={backendNodes} 
                            libraryDocs={libraryDocs} 
                            addDependency={addDependency} 
                            removeDependency={removeDependency} 
                            onOpen={handleOpenDependencyDoc}
                          />
                       </div>
                    </div>

                    {/* Widget Engine (2/3) */}
                    <div className="xl:col-span-2 glass-container p-8 flex flex-col rounded-[2rem] border-outline-variant/10 shadow-xl bg-surface-container-low/30 overflow-hidden relative">
                       <div className="flex items-center justify-between mb-8 pb-6 border-b border-primary/10">
                          <div className="flex items-center gap-4">
                             <div className="h-10 w-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center">
                                <LayoutGrid size={20} />
                             </div>
                             <div>
                                <h2 className="font-display text-2xl text-primary leading-tight">{node.title}</h2>
                                <p className="text-[10px] meta-label opacity-50 mt-1 uppercase tracking-widest">Active Tool Area</p>
                             </div>
                          </div>
                          <button 
                            onClick={() => setFullscreenNodeId(node.id)}
                            className="p-2 hover:bg-primary/10 text-primary rounded-lg transition-colors"
                          >
                             <Maximize2 size={20} />
                          </button>
                       </div>
                       
                       <div className="flex-1 overflow-y-auto custom-scrollbar">
                          <WidgetArea 
                            node={node} 
                            updateWidgets={updateWidgets} 
                            // renderDependencies removed here to avoid duplication in standard view
                          />
                       </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        </div>
      )}
    </>
  );
}
