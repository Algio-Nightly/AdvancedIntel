import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useNodes } from '../../context/NodeContext';
import { useProjects } from '../../context/ProjectContext';
import { ArrowLeft, Plus, Settings2 } from 'lucide-react';
import MarkdownWidget from './widgets/MarkdownWidget';
import TimerWidget from './widgets/TimerWidget';
import CounterWidget from './widgets/CounterWidget';
import YouTubeWidget from './widgets/YouTubeWidget';
import ImageWidget from './widgets/ImageWidget';

export default function NodeWorkspace() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { nodes, updateWidgets, updateTitle } = useNodes();
  const { projects } = useProjects();
  
  const [node, setNode] = useState(null);
  const [project, setProject] = useState(null);
  const [showWidgetMenu, setShowWidgetMenu] = useState(false);

  useEffect(() => {
    const n = nodes.find(n => n.id === id);
    if (n) {
      setNode(n);
      const p = projects.find(p => p.projectId === n.parentId);
      if (p) setProject(p);
    }
  }, [id, nodes, projects]);

  if (!node) {
    return <div className="flex h-screen items-center justify-center text-primary">Loading Node Dashboard...</div>;
  }

  const addWidget = async (type) => {
    const newWidget = {
      id: Date.now().toString(),
      type,
      data: {}
    };
    const newWidgets = [...(node.widgets || []), newWidget];
    await updateWidgets(node.id, newWidgets);
    setShowWidgetMenu(false);
  };

  const removeWidget = async (widgetId) => {
    const newWidgets = (node.widgets || []).filter(w => w.id !== widgetId);
    await updateWidgets(node.id, newWidgets);
  };

  const updateWidgetData = async (widgetId, newData) => {
    const newWidgets = (node.widgets || []).map(w => w.id === widgetId ? { ...w, data: newData } : w);
    await updateWidgets(node.id, newWidgets);
  };

  const renderWidget = (widget) => {
    const props = {
      data: widget.data,
      updateData: (data) => updateWidgetData(widget.id, data),
      onRemove: () => removeWidget(widget.id)
    };
    
    switch (widget.type) {
      case 'markdown': return <MarkdownWidget key={widget.id} {...props} />;
      case 'timer': return <TimerWidget key={widget.id} {...props} />;
      case 'counter': return <CounterWidget key={widget.id} {...props} />;
      case 'youtube': return <YouTubeWidget key={widget.id} {...props} />;
      case 'image': return <ImageWidget key={widget.id} {...props} />;
      default: return null;
    }
  };

  return (
    <div className="flex flex-col text-on-surface min-h-screen bg-surface">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/30 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(project ? `/project/${project.projectId}` : '/projects')} className="text-primary opacity-60 hover:opacity-100 transition-opacity">
            <ArrowLeft size={20} />
          </button>
          <div className="flex flex-col">
            <span className="text-xs meta-label opacity-50">{project ? project.title : 'PROJECT'} / NODE</span>
            <input 
              value={node.title}
              onChange={(e) => updateTitle(node.id, e.target.value)}
              className="bg-transparent border-none outline-none font-display text-xl text-on-surface p-0 m-0"
            />
          </div>
        </div>
        
        <div className="relative">
          <button 
            onClick={() => setShowWidgetMenu(!showWidgetMenu)}
            className="p-2 bg-primary-container/20 text-primary rounded-lg hover:bg-primary/20 transition-colors"
          >
            <Plus size={20} />
          </button>
          
          {showWidgetMenu && (
            <div className="absolute right-0 top-full mt-2 w-48 glass-container border border-outline-variant/50 rounded-xl shadow-lg p-2 flex flex-col gap-1">
              <button onClick={() => addWidget('markdown')} className="text-left px-4 py-2 hover:bg-primary/10 rounded-lg text-sm font-display tracking-wide">Markdown Editor</button>
              <button onClick={() => addWidget('timer')} className="text-left px-4 py-2 hover:bg-primary/10 rounded-lg text-sm font-display tracking-wide">Stopwatch Timer</button>
              <button onClick={() => addWidget('counter')} className="text-left px-4 py-2 hover:bg-primary/10 rounded-lg text-sm font-display tracking-wide">Tally Counter</button>
              <button onClick={() => addWidget('youtube')} className="text-left px-4 py-2 hover:bg-primary/10 rounded-lg text-sm font-display tracking-wide">YouTube Embed</button>
              <button onClick={() => addWidget('image')} className="text-left px-4 py-2 hover:bg-primary/10 rounded-lg text-sm font-display tracking-wide">Image Upload</button>
            </div>
          )}
        </div>
      </header>

      {/* Dashboard Grid */}
      <main className="p-6 md:p-12 w-full max-w-[1800px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 auto-rows-min">
          {(node.widgets || []).map(renderWidget)}
        </div>
        
        {(!node.widgets || node.widgets.length === 0) && (
          <div className="flex flex-col items-center justify-center py-32 opacity-40">
            <Settings2 size={48} className="mb-4" />
            <p className="font-display tracking-widest">DASHBOARD EMPTY</p>
            <p className="text-sm mt-2">Mount widgets to begin tracking telemetry.</p>
          </div>
        )}
      </main>
    </div>
  );
}
