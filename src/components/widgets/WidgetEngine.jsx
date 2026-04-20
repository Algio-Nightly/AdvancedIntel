import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { 
  Maximize2, Minimize2, Edit3, Eye, Trash2, Video, FileText, Plus, 
  ChevronDown, Clock, Hash, Timer as TimerIcon, CheckSquare, Square, 
  Link as LinkIcon, ExternalLink, Minus, X, LayoutGrid, Image as ImageIcon,
  Upload, File as FileIcon, Search, AlertCircle, Loader2, Brain, Settings
} from 'lucide-react';
import { saveBlobToLocal, getBlobFromLocal } from '../../lib/storage';
import { useLibrary } from '../../context/LibraryContext';
import { toast } from 'sonner';
import AIPanel from '../ai/AIPanel';

// --- EDITABLE TITLE COMPONENT ---
const EditableTitle = ({ value, onSave, className }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);

  const handleSave = () => {
    setIsEditing(false);
    if (tempValue.trim() !== value) {
      onSave(tempValue.trim() || 'Untitled');
    }
  };

  if (isEditing) {
    return (
      <input 
        autoFocus
        value={tempValue}
        onChange={e => setTempValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={e => e.key === 'Enter' && handleSave()}
        className={`bg-surface-container-highest border border-primary/30 rounded px-1 text-on-surface focus:outline-none ${className}`}
        onClick={e => e.stopPropagation()}
      />
    );
  }

  return (
    <span 
      onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
      className={`cursor-text hover:bg-surface-container-highest/50 px-1 rounded transition-colors ${className}`}
      title="Click to edit name"
    >
      {value}
    </span>
  );
};

// --- ENLARGED WIDGET MODAL ---
export const WidgetEnlargedModal = ({ widget, onClose, onUpdate, allNodes = [], allDocs = [] }) => {
  const [localUrl, setLocalUrl] = useState(null);

  useEffect(() => {
    let url = null;
    const loadLocal = async () => {
      if (widget.data && widget.isLocal) {
        const blob = await getBlobFromLocal(widget.data);
        if (blob) {
          url = URL.createObjectURL(blob);
          setLocalUrl(url);
        }
      } else {
        setLocalUrl(null);
      }
    };
    loadLocal();
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [widget.data, widget.isLocal]);

  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  useEffect(() => {
    // If it's a mirror widget, use the synced content from source
    if (widget.type === 'library_notes' && widget.config?.noteId) {
      if (widget.config.sourceType === 'doc' || widget.config.sourceType === 'library') {
        setEditContent(widget.data || '');
      } else {
        const sourceNode = allNodes.find(n => n.id === widget.config.sourceId);
        const sourceNote = (sourceNode?.widgets || []).find(w => w.id === widget.config.noteId);
        setEditContent(sourceNote?.data || widget.data || '');
      }
    } else {
      setEditContent(widget.data || '');
    }
  }, [widget, allNodes]);

  const [showAIPanel, setShowAIPanel] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSave = () => {
    onUpdate({ ...widget, data: editContent });
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 animate-fade-in">
      <div 
        className="absolute inset-0 bg-surface/80 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-7xl h-full max-h-[85vh] glass-container rounded-2xl border border-outline-variant/30 flex flex-col bg-surface shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden">
        <div className="flex flex-shrink-0 items-center justify-between p-4 border-b border-outline-variant/20 bg-surface-container/50">
          <div className="flex items-center gap-3">
            {widget.type === 'youtube' ? <Video size={18} className="text-rose-500" /> : 
             widget.type === 'image' ? <ImageIcon size={18} className="text-indigo-500" /> : 
             widget.type === 'pdf' ? <FileIcon size={18} className="text-emerald-500" /> :
             widget.type === 'library_notes' ? <LinkIcon size={18} className="text-primary" /> :
             <FileText size={18} className="text-cyan-500" />}
            <h2 className="font-display text-on-surface uppercase tracking-widest text-sm">
              {widget.type === 'library_notes' && widget.config?.noteId && widget.config.sourceType === 'node' 
                ? `Reference: ${(allNodes.find(n => n.id === widget.config.sourceId)?.widgets || []).find(w => w.id === widget.config.noteId)?.title || 'Note'}`
                : widget.title || 'Widget View'}
            </h2>
          </div>
          
          <div className="flex items-center gap-2">
            {['markdown', 'library_notes', 'pdf'].includes(widget.type) && (
              <>
                <button
                  onClick={() => setShowAIPanel(!showAIPanel)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-display tracking-widest transition-all border ${
                    showAIPanel
                      ? 'bg-primary text-on-primary border-primary shadow-[0_0_15px_rgba(var(--primary),0.4)]'
                      : 'bg-surface-container/80 border-outline-variant/30 text-primary hover:bg-primary/10 hover:border-primary/50'
                  }`}
                >
                  <Brain size={14} />
                  AI ASSISTANT
                </button>
                {widget.type === 'markdown' && (
                  <button 
                    onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-xs font-display tracking-widest"
                  >
                    {isEditing ? <><Eye size={14} /> PREVIEW</> : <><Edit3 size={14} /> EDIT</>}
                  </button>
                )}
              </>
            )}
            <button 
              onClick={onClose}
              className="p-1.5 hover:bg-rose-500/10 text-on-surface/50 hover:text-rose-500 rounded-lg transition-colors"
            >
              <Minimize2 size={16} />
            </button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 overflow-auto p-6 bg-surface-container-lowest/30">
          {widget.type === 'youtube' && (
            <div className="w-full h-full flex items-center justify-center bg-black rounded-xl overflow-hidden">
              <iframe
                src={widget.data}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full aspect-video max-h-full"
              />
            </div>
          )}

          {widget.type === 'image' && (
            <div className="w-full h-full flex items-center justify-center bg-black/5 rounded-xl overflow-hidden p-4">
              <img
                src={widget.isLocal ? localUrl : widget.data}
                alt={widget.title || 'Widget Image'}
                className="max-w-full max-h-full object-contain drop-shadow-2xl"
              />
            </div>
          )}

          {widget.type === 'pdf' && (
            <div className="w-full h-full bg-surface-container/20 rounded-xl overflow-hidden">
              {localUrl ? (
                <iframe 
                  src={localUrl} 
                  className="w-full h-full border-0"
                  title={widget.title}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-on-surface/30">
                  <AlertCircle size={48} className="mb-4 opacity-20" />
                  <p className="font-display tracking-widest text-sm uppercase">File not found in local cache</p>
                </div>
              )}
            </div>
          )}

          {(widget.type === 'markdown' || widget.type === 'library_notes') && (
            <div className="w-full h-full">
              {isEditing ? (
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full h-full bg-surface-container/30 border border-outline-variant/30 rounded-xl p-4 text-on-surface font-mono text-sm focus:outline-none focus:border-primary/50 resize-none"
                  placeholder="Type markdown here... (Supports LaTeX, Tables, GFM)"
                />
              ) : (
                <div className={`markdown-body prose max-w-none p-4 ${widget.type === 'library_notes' ? 'prose-emerald' : 'prose-slate'} prose-headings:text-on-surface prose-p:text-on-surface/90`}>
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm, remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                  >
                    {editContent || '*Empty Document*'}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          )}
        </div>

        {showAIPanel && (
          <div className="border-l border-outline-variant/30 flex shrink-0">
            <AIPanel 
              noteSlabs={[{ id: widget.id, title: widget.title, data: editContent }]}
              onAppendToNote={(id, text) => {
                const newContent = editContent + "\n\n" + text;
                setEditContent(newContent);
                onUpdate({ ...widget, data: newContent });
              }}
              onReplaceNote={(id, text) => {
                setEditContent(text);
                onUpdate({ ...widget, data: text });
              }}
              isOpen={true}
              onClose={() => setShowAIPanel(false)}
              context="widget"
            />
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

// --- YOUTUBE WIDGET ---
export const YouTubeWidget = ({ widget, onEnlarge, onRemove, onUpdate }) => {
  const [inputUrl, setInputUrl] = useState('');
  const [isEditing, setIsEditing] = useState(!widget.data);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputUrl) return;
    
    let embedUrl = inputUrl;
    if (inputUrl.includes('watch?v=')) {
      const videoId = inputUrl.split('watch?v=')[1].split('&')[0];
      embedUrl = `https://www.youtube.com/embed/${videoId}`;
    } else if (inputUrl.includes('youtu.be/')) {
      const videoId = inputUrl.split('youtu.be/')[1].split('?')[0];
      embedUrl = `https://www.youtube.com/embed/${videoId}`;
    } else if (!inputUrl.includes('youtube.com/embed/')) {
      setError('Invalid YouTube URL format');
      return;
    }
    
    onUpdate({ ...widget, data: embedUrl });
    setIsEditing(false);
    setError('');
  };

  return (
    <div className="relative group bg-surface-container/50 border border-outline-variant/20 rounded-xl overflow-hidden flex flex-col aspect-video">
      {widget.data && (
        <div className="absolute top-0 left-0 right-0 p-3 bg-gradient-to-b from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-10 flex justify-between items-start pointer-events-none group-hover:pointer-events-auto">
          <div className="flex items-center gap-2 text-white/90">
            <Video size={14} className="text-rose-400" />
            <EditableTitle
              value={widget.title || 'Video Player'}
              onSave={(title) => onUpdate({...widget, title})}
              className="text-[10px] font-display tracking-widest uppercase truncate max-w-[150px]"
            />
          </div>
          <div className="flex items-center gap-1">
            {!isEditing && (
              <button 
                onClick={() => setIsEditing(true)}
                className="p-1.5 bg-black/50 hover:bg-rose-500 text-white rounded transition-colors"
                title="Edit URL"
              >
                <Edit3 size={14} />
              </button>
            )}
            <button 
              onClick={() => onEnlarge(widget.id)}
              className="p-1.5 bg-black/50 hover:bg-primary/80 text-white rounded transition-colors"
            >
              <Maximize2 size={14} />
            </button>
            <button 
              onClick={() => onRemove(widget.id)}
              className="p-1.5 bg-black/50 hover:bg-rose-500 text-white rounded transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 bg-surface-container-lowest flex items-center justify-center">
        {(!widget.data || isEditing) ? (
          <form onSubmit={handleSubmit} className="p-6 w-full flex flex-col items-center gap-4 relative z-10">
            {!widget.data && <button onClick={() => onRemove(widget.id)} type="button" className="absolute top-0 right-0 p-1.5 hover:bg-rose-500/20 text-rose-500 rounded"><Trash2 size={14}/></button>}
            {isEditing && widget.data && <button onClick={() => setIsEditing(false)} type="button" className="absolute top-0 right-0 p-1.5 hover:bg-surface-container-highest text-on-surface/50 rounded"><X size={14}/></button>}
            
            <Video size={32} className="text-rose-500/50 mb-2" />
            <div className="w-full">
              <input 
                type="text" 
                placeholder="Paste YouTube URL..." 
                className={`w-full bg-surface-container/50 border ${error ? 'border-error/50' : 'border-outline-variant/50'} rounded-lg px-4 py-2 text-sm text-center focus:outline-none focus:border-rose-500/50`}
                value={inputUrl}
                onChange={e => { setInputUrl(e.target.value); setError(''); }}
              />
              {error && <p className="text-[10px] text-error text-center mt-1 uppercase tracking-widest">{error}</p>}
            </div>
            <button type="submit" className="px-4 py-2 bg-rose-500/20 text-rose-500 rounded-lg text-xs font-display tracking-widest uppercase hover:bg-rose-500/30">
              {widget.data ? 'Update Video' : 'Load Video'}
            </button>
          </form>
        ) : (
          <iframe
            src={widget.data}
            title="YouTube video player"
            frameBorder="0"
            allowFullScreen
            className="w-full h-full pointer-events-none group-hover:pointer-events-auto"
          />
        )}
      </div>
    </div>
  );
};

// --- IMAGE WIDGET ---
export const ImageWidget = ({ widget, onEnlarge, onRemove, onUpdate }) => {
  const [inputUrl, setInputUrl] = useState('');
  const [isEditing, setIsEditing] = useState(!widget.data);
  const [localUrl, setLocalUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    let url = null;
    const loadLocal = async () => {
      if (widget.data && widget.isLocal) {
        const blob = await getBlobFromLocal(widget.data);
        if (blob) {
          url = URL.createObjectURL(blob);
          setLocalUrl(url);
        }
      } else {
        setLocalUrl(null);
      }
    };
    loadLocal();
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [widget.data, widget.isLocal]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputUrl) return;
    onUpdate({ ...widget, data: inputUrl, isLocal: false });
    setIsEditing(false);
  };

  const handleFileUpload = async (file) => {
    if (!file || !file.type.startsWith('image/')) {
      toast.error("Please upload an image file");
      return;
    }
    setIsUploading(true);
    const toastId = toast.loading("Ingesting image archive...");
    try {
      const id = `img-${Date.now()}`;
      await saveBlobToLocal(id, file);
      onUpdate({ ...widget, data: id, isLocal: true });
      setIsEditing(false);
      toast.success("Image ingested successfully", { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error("Ingestion failed", { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files[0];
    handleFileUpload(file);
  };

  return (
    <div className="relative group bg-surface-container/50 border border-outline-variant/20 rounded-xl overflow-hidden flex flex-col aspect-square">
      {widget.data && (
        <div className="absolute top-0 left-0 right-0 p-3 bg-gradient-to-b from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-10 flex justify-between items-start pointer-events-none group-hover:pointer-events-auto">
          <div className="flex items-center gap-2 text-white/90">
            <ImageIcon size={14} className="text-indigo-400" />
            <EditableTitle
              value={widget.title || 'Image'}
              onSave={(title) => onUpdate({...widget, title})}
              className="text-[10px] font-display tracking-widest uppercase truncate max-w-[150px]"
            />
          </div>
          <div className="flex items-center gap-1">
            {!isEditing && (
              <button 
                onClick={() => setIsEditing(true)}
                className="p-1.5 bg-black/50 hover:bg-indigo-500 text-white rounded transition-colors"
                title="Edit Source"
              >
                <Edit3 size={14} />
              </button>
            )}
            <button 
              onClick={() => onEnlarge(widget.id)}
              className="p-1.5 bg-black/50 hover:bg-primary/80 text-white rounded transition-colors"
            >
              <Maximize2 size={14} />
            </button>
            <button 
              onClick={() => onRemove(widget.id)}
              className="p-1.5 bg-black/50 hover:bg-rose-500 text-white rounded transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 bg-surface-container-lowest flex items-center justify-center relative">
        {(!widget.data || isEditing) ? (
          <div className="p-4 w-full h-full flex flex-col gap-3 relative z-10 overflow-hidden">
            {!widget.data && <button onClick={() => onRemove(widget.id)} type="button" className="absolute top-0 right-0 p-1.5 hover:bg-rose-500/20 text-rose-500 rounded"><Trash2 size={14}/></button>}
            {isEditing && widget.data && <button onClick={() => setIsEditing(false)} type="button" className="absolute top-0 right-0 p-1.5 hover:bg-surface-container-highest text-on-surface/50 rounded"><X size={14}/></button>}

            <div 
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 border-2 border-dashed border-outline-variant/30 rounded-lg flex flex-col items-center justify-center text-on-surface/40 hover:border-indigo-500/50 hover:text-indigo-400 transition-all cursor-pointer group/upload"
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={e => handleFileUpload(e.target.files[0])} 
                accept="image/*" 
                className="hidden" 
              />
              {isUploading ? (
                <Loader2 size={24} className="animate-spin text-indigo-500" />
              ) : (
                <>
                  <Upload size={24} className="mb-2 group-hover/upload:scale-110 transition-transform" />
                  <span className="text-[10px] font-display tracking-widest uppercase text-center px-2">Drop or Click to Upload</span>
                </>
              )}
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-outline-variant/20"></div></div>
              <div className="relative flex justify-center text-[10px] uppercase font-display tracking-widest"><span className="bg-surface-container-lowest px-2 text-on-surface/30">or paste url</span></div>
            </div>

            <form onSubmit={handleSubmit} className="flex gap-2">
              <input 
                type="text" 
                placeholder="Image URL..." 
                className="flex-1 bg-surface-container/50 border border-outline-variant/50 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500/50"
                value={inputUrl}
                onChange={e => setInputUrl(e.target.value)}
              />
              <button type="submit" className="px-3 py-1.5 bg-indigo-500/20 text-indigo-400 rounded text-[10px] font-display tracking-widest uppercase hover:bg-indigo-500/30">Load</button>
            </form>
          </div>
        ) : (
          <img
            src={widget.isLocal ? localUrl : widget.data}
            alt={widget.title || 'Widget Image'}
            className="w-full h-full object-cover cursor-pointer"
            onClick={() => onEnlarge(widget.id)}
          />
        )}
      </div>
    </div>
  );
};

// --- MARKDOWN WIDGET ---
export const MarkdownWidget = ({ widget, onEnlarge, onRemove, onUpdate }) => {
  return (
    <div className="relative group bg-surface-container/50 border border-outline-variant/20 rounded-xl overflow-hidden flex flex-col h-64">
      <div className="absolute top-0 left-0 right-0 p-3 bg-gradient-to-b from-surface-container-highest to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-10 flex justify-between items-start border-b border-outline-variant/10">
        <div className="flex items-center gap-2">
          <FileText size={14} className="text-cyan-400" />
          <EditableTitle
            value={widget.title || 'Document'}
            onSave={(title) => onUpdate({...widget, title})}
            className="text-[10px] font-display tracking-widest uppercase text-on-surface truncate max-w-[150px]"
          />
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => onEnlarge(widget.id)}
            className="p-1.5 bg-surface hover:bg-primary/20 text-on-surface hover:text-primary rounded transition-colors"
          >
            <Maximize2 size={14} />
          </button>
          <button 
            onClick={() => onRemove(widget.id)}
            className="p-1.5 bg-surface hover:bg-rose-500/20 text-on-surface hover:text-rose-500 rounded transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden p-4 pt-10 mask-image-bottom cursor-pointer" onClick={() => onEnlarge(widget.id)}>
        <div className="markdown-body prose prose-sm prose-slate prose-headings:text-on-surface prose-p:text-on-surface/80">
          <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
            {widget.data || '*Empty Document*'}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
};

// --- CLOCK WIDGET ---
export const ClockWidget = ({ widget, onRemove, onUpdate }) => {
  const [time, setTime] = useState(new Date());
  
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative group bg-surface-container/50 border border-outline-variant/20 rounded-xl overflow-hidden flex flex-col h-40">
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => onRemove(widget.id)} className="p-1.5 bg-surface hover:bg-rose-500/20 text-rose-500 rounded"><Trash2 size={14}/></button>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center">
        <Clock size={20} className="text-blue-500/50 mb-3" />
        <EditableTitle
          value={widget.title || 'Clock'}
          onSave={(title) => onUpdate({...widget, title})}
          className="text-[10px] font-display tracking-widest uppercase text-blue-400 mb-2"
        />
        <div className="text-4xl font-display font-light text-blue-400">{time.toLocaleTimeString([], { hour12: false })}</div>
        <div className="text-xs meta-label opacity-50 mt-2 tracking-widest">{time.toLocaleDateString()}</div>
      </div>
    </div>
  );
};

// --- COUNTER WIDGET ---
export const CounterWidget = ({ widget, onUpdate, onRemove }) => {
  const count = typeof widget.data === 'number' ? widget.data : 0;
  
  return (
    <div className="relative group bg-surface-container/50 border border-outline-variant/20 rounded-xl overflow-hidden flex flex-col h-40">
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => onRemove(widget.id)} className="p-1.5 bg-surface hover:bg-rose-500/20 text-rose-500 rounded"><Trash2 size={14}/></button>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <EditableTitle
          value={widget.title || 'Counter'}
          onSave={(title) => onUpdate({...widget, title})}
          className="text-xs meta-label opacity-50 tracking-widest text-primary"
        />
        <div className="flex items-center gap-6">
          <button onClick={() => onUpdate({...widget, data: count - 1})} className="p-2 bg-surface-container hover:bg-primary/20 rounded-full transition-colors text-primary"><Minus size={18}/></button>
          <div className="text-5xl font-display font-light w-20 text-center text-on-surface">{count}</div>
          <button onClick={() => onUpdate({...widget, data: count + 1})} className="p-2 bg-surface-container hover:bg-primary/20 rounded-full transition-colors text-primary"><Plus size={18}/></button>
        </div>
      </div>
    </div>
  );
};

// --- TODO WIDGET ---
export const TodoWidget = ({ widget, onUpdate, onRemove }) => {
  const todos = Array.isArray(widget.data) ? widget.data : [];
  const [input, setInput] = useState('');

  const addTodo = (e) => {
    if (e.key === 'Enter' && input.trim()) {
      onUpdate({...widget, data: [...todos, { id: Date.now(), text: input.trim(), done: false }]});
      setInput('');
    }
  };

  const toggleTodo = (id) => {
    onUpdate({...widget, data: todos.map(t => t.id === id ? {...t, done: !t.done} : t)});
  };

  const removeTodo = (id) => {
    onUpdate({...widget, data: todos.filter(t => t.id !== id)});
  };

  return (
    <div className="relative group bg-surface-container/50 border border-outline-variant/20 rounded-xl overflow-hidden flex flex-col h-64">
      <div className="p-3 border-b border-outline-variant/10 flex justify-between items-center bg-surface-container-highest/30">
        <div className="flex items-center gap-2">
          <CheckSquare size={14} className="text-amber-500"/>
          <EditableTitle
            value={widget.title || 'Task List'}
            onSave={(title) => onUpdate({...widget, title})}
            className="text-[10px] font-display uppercase tracking-widest text-on-surface"
          />
        </div>
        <button onClick={() => onRemove(widget.id)} className="p-1 hover:bg-rose-500/20 text-on-surface/50 hover:text-rose-500 rounded opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14}/></button>
      </div>
      <div className="p-3">
        <input type="text" value={input} onChange={e=>setInput(e.target.value)} onKeyDown={addTodo} placeholder="Add a task (Enter)" className="w-full bg-surface-container rounded px-3 py-2 text-xs focus:outline-none focus:border-amber-500/50 border border-transparent text-on-surface placeholder:text-on-surface/30" />
      </div>
      <div className="flex-1 overflow-y-auto px-3 pb-3 flex flex-col gap-1 custom-scrollbar">
        {todos.map(t => (
          <div key={t.id} className="flex items-start gap-2 group/task py-1">
            <button onClick={() => toggleTodo(t.id)} className={`mt-0.5 shrink-0 transition-colors ${t.done ? 'text-amber-500' : 'text-on-surface/30 hover:text-amber-500/50'}`}>
              {t.done ? <CheckSquare size={14} /> : <Square size={14} />}
            </button>
            <span className={`text-sm flex-1 break-words transition-all ${t.done ? 'line-through opacity-40 text-on-surface' : 'text-on-surface'}`}>{t.text}</span>
            <button onClick={() => removeTodo(t.id)} className="opacity-0 group-hover/task:opacity-100 text-rose-500/50 hover:text-rose-500 transition-opacity"><X size={12}/></button>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- BOOKMARK WIDGET ---
export const BookmarkWidget = ({ widget, onUpdate, onRemove }) => {
  const data = widget.data || { url: '', title: '' };
  const [editing, setEditing] = useState(!data.url);
  const [url, setUrl] = useState(data.url);
  const [title, setTitle] = useState(data.title);

  const handleSave = () => {
    if (!url.trim()) return;
    let finalUrl = url.trim();
    if (!finalUrl.startsWith('http')) finalUrl = 'https://' + finalUrl;
    onUpdate({ ...widget, data: { url: finalUrl, title: title.trim() || finalUrl } });
    setEditing(false);
  };

  return (
    <div className="relative group bg-surface-container/50 border border-outline-variant/20 rounded-xl overflow-hidden flex flex-col h-40">
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex gap-1">
        {!editing && <button onClick={() => setEditing(true)} className="p-1.5 bg-surface hover:bg-emerald-500/20 text-emerald-500 rounded"><Edit3 size={14}/></button>}
        <button onClick={() => onRemove(widget.id)} className="p-1.5 bg-surface hover:bg-rose-500/20 text-rose-500 rounded"><Trash2 size={14}/></button>
      </div>
      
      {editing ? (
        <div className="flex-1 flex flex-col p-4 justify-center gap-3">
          <input type="text" placeholder="URL..." value={url} onChange={e=>setUrl(e.target.value)} className="bg-surface-container rounded px-3 py-2 text-sm focus:outline-none text-on-surface placeholder:text-on-surface/30" />
          <input type="text" placeholder="Title (optional)" value={title} onChange={e=>setTitle(e.target.value)} className="bg-surface-container rounded px-3 py-2 text-sm focus:outline-none text-on-surface placeholder:text-on-surface/30" />
          <button onClick={handleSave} className="bg-emerald-500/20 text-emerald-500 rounded py-1.5 text-xs font-display tracking-widest uppercase hover:bg-emerald-500/30">Save Link</button>
        </div>
      ) : (
        <a href={data.url} target="_blank" rel="noopener noreferrer" className="flex-1 flex flex-col items-center justify-center gap-3 hover:bg-emerald-500/5 transition-colors group/link">
          <div className="h-12 w-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center group-hover/link:scale-110 transition-transform">
            <LinkIcon size={24} />
          </div>
          <div className="text-center px-4 w-full">
            <EditableTitle
              value={widget.title || 'Bookmark'}
              onSave={(title) => onUpdate({...widget, data: {...data, title}, title})}
              className="font-display text-sm text-on-surface truncate w-full inline-block"
            />
            <div className="text-xs text-emerald-500/70 truncate w-full flex items-center justify-center gap-1 mt-1">
              {data.url} <ExternalLink size={10} />
            </div>
          </div>
        </a>
      )}
    </div>
  );
};

// --- TIMER WIDGET ---
export const TimerWidget = ({ widget, onUpdate, onRemove }) => {
  const data = widget.data || { duration: 25 * 60, endTime: null, readings: [] };
  const [timeLeft, setTimeLeft] = useState(data.duration);
  const [inputMins, setInputMins] = useState(Math.floor(data.duration / 60));
  const [readingLabel, setReadingLabel] = useState('');

  useEffect(() => {
    let interval;
    if (data.endTime) {
      interval = setInterval(() => {
        const now = Date.now();
        const remaining = Math.max(0, Math.floor((data.endTime - now) / 1000));
        setTimeLeft(remaining);
        if (remaining === 0) {
          onUpdate({ ...widget, data: { ...data, endTime: null } });
        }
      }, 1000);
    } else {
      setTimeLeft(data.duration);
    }
    return () => clearInterval(interval);
  }, [data.endTime, data.duration]);

  const toggleTimer = () => {
    if (data.endTime) {
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((data.endTime - now) / 1000));
      onUpdate({ ...widget, data: { ...data, duration: remaining, endTime: null } });
    } else {
      onUpdate({ ...widget, data: { ...data, duration: timeLeft, endTime: Date.now() + timeLeft * 1000 } });
    }
  };

  const resetTimer = () => {
    const defaultDur = inputMins * 60;
    onUpdate({ ...widget, data: { ...data, duration: defaultDur, endTime: null } });
  };

  const saveReading = (e) => {
    e.preventDefault();
    const mins = Math.floor(timeLeft / 60).toString().padStart(2, '0');
    const secs = (timeLeft % 60).toString().padStart(2, '0');
    const label = readingLabel.trim() || `Reading ${(data.readings?.length || 0) + 1}`;
    
    const newReadings = [...(data.readings || []), { label, time: `${mins}:${secs}`, id: Date.now() }];
    onUpdate({ ...widget, data: { ...data, readings: newReadings } });
    setReadingLabel('');
  };

  const removeReading = (id) => {
    const newReadings = (data.readings || []).filter(r => r.id !== id);
    onUpdate({ ...widget, data: { ...data, readings: newReadings } });
  };

  const mins = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const secs = (timeLeft % 60).toString().padStart(2, '0');
  const hasReadings = data.readings && data.readings.length > 0;

  return (
    <div className={`relative group bg-surface-container/50 border border-outline-variant/20 rounded-xl overflow-hidden flex flex-col ${hasReadings ? 'h-64' : 'h-40'}`}>
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <button onClick={() => onRemove(widget.id)} className="p-1.5 bg-surface hover:bg-rose-500/20 text-rose-500 rounded"><Trash2 size={14}/></button>
      </div>
      
      <div className="flex-1 flex flex-col items-center justify-center gap-3 p-4">
        <EditableTitle
          value={widget.title || 'Timer'}
          onSave={(title) => onUpdate({...widget, title})}
          className="text-xs meta-label opacity-50 tracking-widest text-purple-400"
        />
        
        {data.endTime ? (
          <div className="text-5xl font-display font-light text-purple-400">{mins}:{secs}</div>
        ) : (
          <div className="flex items-center gap-1 text-5xl font-display font-light text-on-surface">
            <input 
              type="number" 
              value={inputMins} 
              onChange={e => {
                const val = parseInt(e.target.value) || 0;
                setInputMins(val);
                onUpdate({...widget, data: { ...data, duration: val * 60, endTime: null }});
              }}
              className="w-20 bg-transparent text-center focus:outline-none focus:bg-surface-container rounded"
              min="1"
            />
            <span className="opacity-50">:00</span>
          </div>
        )}

        <div className="flex gap-2 w-full justify-center">
          <button onClick={toggleTimer} className="px-4 py-1.5 bg-purple-500/20 text-purple-400 rounded hover:bg-purple-500/30 text-xs font-display tracking-widest">
            {data.endTime ? 'PAUSE' : 'START'}
          </button>
          <button onClick={resetTimer} className="px-4 py-1.5 bg-surface-container text-on-surface/70 rounded hover:bg-surface-container-highest text-xs font-display tracking-widest">
            RESET
          </button>
        </div>

        {/* Readings Input form */}
        <form onSubmit={saveReading} className="flex gap-2 w-full mt-2">
          <input 
            type="text" 
            placeholder="Label (optional)" 
            value={readingLabel} 
            onChange={e => setReadingLabel(e.target.value)} 
            className="flex-1 bg-surface-container-highest/30 rounded px-2 py-1 text-xs focus:outline-none border border-transparent focus:border-purple-500/30 text-on-surface"
          />
          <button type="submit" className="px-2 py-1 bg-purple-500/10 text-purple-400 rounded hover:bg-purple-500/20 text-[10px] font-display tracking-widest">SAVE</button>
        </form>
      </div>

      {/* Readings List */}
      {hasReadings && (
        <div className="h-24 bg-surface-container-highest/10 border-t border-outline-variant/10 overflow-y-auto custom-scrollbar p-2 flex flex-col gap-1">
          {data.readings.map(r => (
            <div key={r.id} className="flex justify-between items-center text-xs group/reading px-2 py-1 hover:bg-surface-container-highest/30 rounded">
              <span className="text-on-surface/70 truncate mr-2">{r.label}</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-purple-400">{r.time}</span>
                <button onClick={() => removeReading(r.id)} className="opacity-0 group-hover/reading:opacity-100 text-rose-500/50 hover:text-rose-500"><X size={10}/></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};


// --- PDF WIDGET ---
export const PdfWidget = ({ widget, onEnlarge, onRemove, onUpdate }) => {
  const { documents } = useLibrary();
  const [isEditing, setIsEditing] = useState(!widget.data);
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    let url = null;
    const loadLocal = async () => {
      if (widget.data && widget.isLocal) {
        const blob = await getBlobFromLocal(widget.data);
        if (blob) {
          url = URL.createObjectURL(blob);
          setPreviewUrl(url);
        }
      }
    };
    loadLocal();
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [widget.data, widget.isLocal]);

  const handleSelectDoc = (doc) => {
    onUpdate({ ...widget, data: doc.id, title: doc.fileName, isLocal: true });
    setIsEditing(false);
  };

  return (
    <div className="relative group bg-surface-container/50 border border-outline-variant/20 rounded-xl overflow-hidden flex flex-col aspect-[3/4]">
      <div className="absolute top-0 left-0 right-0 p-3 bg-gradient-to-b from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-10 flex justify-between items-start pointer-events-none group-hover:pointer-events-auto">
        <div className="flex items-center gap-2 text-white/90">
          <FileIcon size={14} className="text-emerald-400" />
          <EditableTitle
            value={widget.title || 'PDF Document'}
            onSave={(title) => onUpdate({...widget, title})}
            className="text-[10px] font-display tracking-widest uppercase truncate max-w-[150px]"
          />
        </div>
        <div className="flex items-center gap-1">
          {!isEditing && (
            <button 
              onClick={() => setIsEditing(true)}
              className="p-1.5 bg-black/50 hover:bg-emerald-500 text-white rounded transition-colors"
              title="Change Document"
            >
              <Edit3 size={14} />
            </button>
          )}
          <button 
            onClick={() => onEnlarge(widget.id)}
            className="p-1.5 bg-black/50 hover:bg-primary/80 text-white rounded transition-colors"
          >
            <Maximize2 size={14} />
          </button>
          <button 
            onClick={() => onRemove(widget.id)}
            className="p-1.5 bg-black/50 hover:bg-rose-500 text-white rounded transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="flex-1 bg-surface-container-lowest flex items-center justify-center overflow-hidden">
        {(!widget.data || isEditing) ? (
          <div className="p-4 w-full h-full flex flex-col gap-3 relative z-10 bg-surface-container/30">
            <div className="flex items-center gap-2 mb-2 text-on-surface/50">
              <Search size={14} />
              <span className="text-[10px] font-display uppercase tracking-[0.2em]">Select Library Document</span>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-2">
              {documents.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center opacity-30 text-center px-4">
                  <FileIcon size={24} className="mb-2" />
                  <p className="text-[9px] uppercase tracking-widest">Library is empty. Upload PDFs in the Library first.</p>
                </div>
              ) : (
                documents.map(doc => (
                  <button 
                    key={doc.id}
                    onClick={() => handleSelectDoc(doc)}
                    className="w-full text-left p-2 rounded bg-surface-container hover:bg-emerald-500/10 border border-outline-variant/10 hover:border-emerald-500/30 transition-all group/doc"
                  >
                    <div className="text-[10px] font-medium truncate group-hover/doc:text-emerald-400 transition-colors">{doc.fileName}</div>
                    <div className="text-[8px] opacity-40 mt-1 uppercase">ID: {doc.id.slice(0, 8)}...</div>
                  </button>
                ))
              )}
            </div>
            {widget.data && (
              <button 
                onClick={() => setIsEditing(false)}
                className="w-full py-2 border border-outline-variant/30 rounded text-[10px] uppercase font-display tracking-widest hover:bg-surface-container-highest transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        ) : (
          <div className="w-full h-full relative group/preview cursor-pointer" onClick={() => onEnlarge(widget.id)}>
            {previewUrl ? (
              <iframe 
                src={`${previewUrl}#toolbar=0&navpanes=0&scrollbar=0`} 
                className="w-full h-full border-0 pointer-events-none"
                title={widget.title}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-on-surface/20">
                <FileIcon size={48} strokeWidth={1} />
                <p className="mt-2 text-[9px] uppercase tracking-widest">PDF Preview</p>
              </div>
            )}
            <div className="absolute inset-0 bg-transparent group-hover/preview:bg-primary/5 transition-colors" />
          </div>
        )}
      </div>
    </div>
  );
};


// --- DEPLOY WIDGET DROPDOWN ---
const DeployDropdown = ({ onDeploy }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const options = [
    { type: 'markdown', label: 'Markdown Note', icon: FileText, color: 'text-cyan-500' },
    { type: 'youtube', label: 'YouTube Video', icon: Video, color: 'text-rose-500' },
    { type: 'image', label: 'Image', icon: ImageIcon, color: 'text-indigo-500' },
    { type: 'pdf', label: 'Library Document', icon: FileIcon, color: 'text-emerald-500' },
    { type: 'library_notes', label: 'Dependency Mirror', icon: LinkIcon, color: 'text-primary' },
    { type: 'todo', label: 'Task List', icon: CheckSquare, color: 'text-amber-500' },
    { type: 'counter', label: 'Counter', icon: Hash, color: 'text-primary' },
    { type: 'timer', label: 'Countdown Timer', icon: TimerIcon, color: 'text-purple-500' },
    { type: 'clock', label: 'World Clock', icon: Clock, color: 'text-blue-500' },
    { type: 'bookmark', label: 'External Bookmark', icon: LinkIcon, color: 'text-emerald-500' },
  ];

  return (
    <div className="relative z-20" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-xs font-display tracking-widest border border-primary/20"
      >
        <Plus size={14} /> DEPLOY WIDGET <ChevronDown size={14} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-56 bg-surface-container-highest border border-outline-variant/30 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] overflow-hidden">
          {options.map((opt) => (
            <button
              key={opt.type}
              onClick={() => {
                onDeploy(opt.type);
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-container transition-colors text-left border-b border-outline-variant/10 last:border-0 group/menu"
            >
              <opt.icon size={16} className={`${opt.color} group-hover/menu:scale-110 transition-transform`} />
              <span className="text-xs text-on-surface font-display tracking-wider uppercase">{opt.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};


// --- DEPENDENCY NOTES WIDGET (REFERENCE VIEW) ---
export const DependencyNotesWidget = ({ widget, onEnlarge, onRemove, onUpdate, node, allNodes, allDocs, fetchDocNotes }) => {
  const [isConfiguring, setIsConfiguring] = useState(!widget.config?.noteId);
  const [availableNotes, setAvailableNotes] = useState([]);
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);

  const config = widget.config || { sourceId: '', sourceType: '', noteId: '' };

  // Fetch available notes for the selected source
  useEffect(() => {
    if (isConfiguring && config.sourceId) {
      const loadSourceNotes = async () => {
        setIsLoadingNotes(true);
        try {
          if (config.sourceType === 'doc' || config.sourceType === 'library') {
            const notes = await fetchDocNotes(config.sourceId);
            setAvailableNotes(notes.map(n => ({ id: n.id, title: n.title, data: n.data })));
          } else {
            const fsNode = allNodes.find(n => n.id === config.sourceId);
            if (!fsNode) return;

            const fsNoteSlabs = (fsNode.widgets || []).filter(w => w.type === 'markdown').map(w => ({
              id: w.id,
              title: w.title,
              data: w.data
            }));
            setAvailableNotes(fsNoteSlabs);
          }
        } catch (err) {
          console.error("Failed to load source notes", err);
        } finally {
          setIsLoadingNotes(false);
        }
      };
      loadSourceNotes();
    }
  }, [config.sourceId, config.sourceType, isConfiguring, allNodes, fetchDocNotes]);

  // Live Sync: Find the current content of the linked note
  let syncedContent = '*Source note not found or unlinked.*';
  let syncedTitle = 'Unlinked Reference';

  if (config.noteId) {
    if (config.sourceType === 'doc' || config.sourceType === 'library') {
      // For library docs, we'd ideally have them pre-loaded or use a local cache
      // Since fetchDocNotes is async, for immediate sync we might need a cache
      // For now, we use the data that was last synced to the widget's data field
      syncedContent = widget.data;
      syncedTitle = `Synced: ${widget.title || 'Note'}`;
    } else {
      const sourceNode = allNodes.find(n => n.id === config.sourceId);
      const sourceNote = (sourceNode?.widgets || []).find(w => w.id === config.noteId);
      if (sourceNote) {
        syncedContent = sourceNote.data;
        syncedTitle = `Reference: ${sourceNote.title}`;
      }
    }
  }

  const handleLinkNote = (noteId) => {
    const selectedNote = availableNotes.find(n => n.id === noteId);
    onUpdate({ 
      ...widget, 
      title: selectedNote?.title || 'Synced Note',
      data: selectedNote?.data || '',
      config: { ...config, noteId } 
    });
    setIsConfiguring(false);
  };

  if (isConfiguring) {
    const dependencies = node.dependencies || [];
    
    return (
      <div className="relative group bg-surface-container/80 border border-primary/20 rounded-xl overflow-hidden flex flex-col h-64 shadow-2xl z-20">
        <div className="p-3 border-b border-outline-variant/10 flex items-center justify-between bg-primary/5">
          <span className="text-[10px] meta-label text-primary uppercase tracking-widest">Link Dependency Note</span>
          <button onClick={() => onRemove(widget.id)} className="text-error"><Trash2 size={12}/></button>
        </div>
        
        <div className="flex-1 p-4 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] meta-label opacity-40 uppercase">1. Select Source</label>
            <select 
              value={config.sourceId}
              onChange={(e) => {
                const dep = dependencies.find(d => d.id === e.target.value);
                onUpdate({ 
                  ...widget, 
                  config: { 
                    sourceId: e.target.value, 
                    sourceType: dep?.type || 'node',
                    noteId: '' 
                  } 
                });
              }}
              className="bg-surface border border-outline-variant/20 rounded-lg p-2 text-xs text-on-surface focus:outline-none focus:border-primary/50"
            >
              <option value="">-- Choose Dependency --</option>
              {dependencies.map(dep => (
                <option key={dep.id} value={dep.id}>
                  {['doc', 'library', 'pdf'].includes(dep.type) ? '📄 ' : '📦 '} {dep.name}
                </option>
              ))}
            </select>
          </div>

          {config.sourceId && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] meta-label opacity-40 uppercase">2. Select Note to Mirror</label>
              <select 
                value={config.noteId}
                onChange={(e) => handleLinkNote(e.target.value)}
                className="bg-surface border border-outline-variant/20 rounded-lg p-2 text-xs text-on-surface focus:outline-none focus:border-primary/50"
              >
                <option value="">{isLoadingNotes ? 'Loading...' : '-- Choose Note --'}</option>
                {availableNotes.map(note => (
                  <option key={note.id} value={note.id}>{note.title}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative group bg-surface-container/50 border border-primary/20 rounded-xl overflow-hidden flex flex-col h-64 shadow-lg">
      <div className="absolute top-0 left-0 right-0 p-3 bg-gradient-to-b from-surface-container-highest to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-10 flex justify-between items-start border-b border-primary/10">
        <div className="flex items-center gap-2">
          <LinkIcon size={14} className="text-primary" />
          <span className="text-[10px] font-display tracking-widest uppercase text-primary truncate max-w-[150px]">
            {syncedTitle}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setIsConfiguring(true)}
            className="p-1.5 bg-surface hover:bg-primary/20 text-on-surface hover:text-primary rounded transition-colors"
          >
            <Settings size={14} />
          </button>
          <button 
            onClick={() => onEnlarge(widget.id)}
            className="p-1.5 bg-surface hover:bg-primary/20 text-on-surface hover:text-primary rounded transition-colors"
          >
            <Maximize2 size={14} />
          </button>
          <button 
            onClick={() => onRemove(widget.id)}
            className="p-1.5 bg-surface hover:bg-rose-500/20 text-on-surface hover:text-rose-500 rounded transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden p-4 pt-10 mask-image-bottom cursor-pointer" onClick={() => onEnlarge(widget.id)}>
        <div className="markdown-body prose prose-sm prose-slate prose-headings:text-on-surface prose-p:text-on-surface/80">
          <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
            {syncedContent}
          </ReactMarkdown>
        </div>
      </div>
      <div className="absolute bottom-2 right-2 flex items-center gap-1 opacity-20 group-hover:opacity-60 transition-opacity pointer-events-none">
        <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
        <span className="text-[8px] meta-label uppercase tracking-tighter">Live Reference</span>
      </div>
    </div>
  );
};

// --- MAIN WIDGET ENGINE RENDERER ---
export const WidgetArea = ({ node, updateWidgets, renderDependencies, allNodes = [], allDocs = [], fetchDocNotes }) => {
  const [enlargedWidgetId, setEnlargedWidgetId] = useState(null);
  
  const widgets = node.widgets || [];
  
  // Filtering for categorization
  const youtubeWidgets = widgets.filter(w => w.type === 'youtube');
  const markdownWidgets = widgets.filter(w => w.type === 'markdown');
  const libraryNotesWidgets = widgets.filter(w => w.type === 'library_notes');
  const imageWidgets = widgets.filter(w => w.type === 'image');
  const pdfWidgets = widgets.filter(w => w.type === 'pdf');
  const utilityWidgets = widgets.filter(w => !['youtube', 'markdown', 'image', 'pdf', 'library_notes'].includes(w.type));

  const enlargedWidget = widgets.find(w => w.id === enlargedWidgetId);

  const handleUpdateWidget = (updatedWidget) => {
    const newWidgets = widgets.map(w => w.id === updatedWidget.id ? updatedWidget : w);
    updateWidgets(node.id, newWidgets);
  };

  const handleRemoveWidget = (widgetId) => {
    const newWidgets = widgets.filter(w => w.id !== widgetId);
    updateWidgets(node.id, newWidgets);
  };

  const handleDeployWidget = (type) => {
    let data = null;
    let title = 'New Widget';

    if (type === 'markdown') {
      data = '# New Note\n\nStart typing here...';
      title = 'Note';
    } else if (type === 'youtube') {
      data = ''; // Ask in-place
      title = 'Video';
    } else if (type === 'image') {
      data = ''; 
      title = 'Image';
    } else if (type === 'pdf') {
      data = '';
      title = 'PDF';
    } else if (type === 'counter') {
      data = 0;
      title = 'Counter';
    } else if (type === 'timer') {
      data = { duration: 1500, endTime: null }; // 25 mins
      title = 'Timer';
    } else if (type === 'clock') {
      title = 'Clock';
    } else if (type === 'todo') {
      data = [];
      title = 'Tasks';
    } else if (type === 'library_notes') {
      data = '';
      title = 'Dependency Sync';
    } else if (type === 'bookmark') {
      data = { url: '', title: '' };
      title = 'Bookmark';
    }

    const newWidget = {
      id: `widget-${Date.now()}`,
      type,
      title,
      data
    };
    updateWidgets(node.id, [...widgets, newWidget]);
  };

  return (
    <div className="flex flex-col h-full relative">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-outline-variant/10 shrink-0">
        <DeployDropdown onDeploy={handleDeployWidget} />
      </div>

      {widgets.length === 0 && !renderDependencies && (
        <div className="flex-1 flex flex-col items-center justify-center opacity-40">
          <LayoutGrid size={48} className="mb-4 text-primary opacity-50" />
          <p className="text-sm font-display tracking-widest text-primary uppercase">No Widgets Deployed</p>
          <p className="text-xs mt-2 font-sans text-center max-w-xs">Deploy tools and references to build out this container.</p>
        </div>
      )}

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 flex flex-col gap-8">
        
        {renderDependencies && (
          <div>
            <div className="flex items-center gap-2 mb-4 opacity-50">
              <LinkIcon size={14} className="text-emerald-400" />
              <span className="text-[10px] font-display tracking-widest uppercase">Dependencies</span>
            </div>
            {renderDependencies()}
          </div>
        )}

        {libraryNotesWidgets.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4 opacity-50">
              <FileText size={14} className="text-emerald-400" />
              <span className="text-[10px] font-display tracking-widest uppercase text-emerald-400">Integrated Library Findings</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {libraryNotesWidgets.map(widget => (
                <DependencyNotesWidget 
                  key={widget.id} 
                  widget={widget} 
                  onEnlarge={setEnlargedWidgetId} 
                  onRemove={handleRemoveWidget} 
                  onUpdate={handleUpdateWidget} 
                  node={node}
                  allNodes={allNodes}
                  allDocs={allDocs}
                  fetchDocNotes={fetchDocNotes}
                />
              ))}
            </div>
          </div>
        )}
        
        {utilityWidgets.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4 opacity-50">
              <Hash size={14} className="text-primary" />
              <span className="text-[10px] font-display tracking-widest uppercase">Utilities & Tasks</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {utilityWidgets.map(widget => {
                if (widget.type === 'counter') return <CounterWidget key={widget.id} widget={widget} onRemove={handleRemoveWidget} onUpdate={handleUpdateWidget} />;
                if (widget.type === 'timer') return <TimerWidget key={widget.id} widget={widget} onRemove={handleRemoveWidget} onUpdate={handleUpdateWidget} />;
                if (widget.type === 'clock') return <ClockWidget key={widget.id} widget={widget} onRemove={handleRemoveWidget} onUpdate={handleUpdateWidget} />;
                if (widget.type === 'todo') return <TodoWidget key={widget.id} widget={widget} onRemove={handleRemoveWidget} onUpdate={handleUpdateWidget} />;
                if (widget.type === 'bookmark') return <BookmarkWidget key={widget.id} widget={widget} onRemove={handleRemoveWidget} onUpdate={handleUpdateWidget} />;
                return null;
              })}
            </div>
          </div>
        )}

        {markdownWidgets.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4 opacity-50">
              <FileText size={14} className="text-cyan-400" />
              <span className="text-[10px] font-display tracking-widest uppercase">Markdown Notes</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {markdownWidgets.map(widget => (
                <MarkdownWidget key={widget.id} widget={widget} onEnlarge={setEnlargedWidgetId} onRemove={handleRemoveWidget} onUpdate={handleUpdateWidget} />
              ))}
            </div>
          </div>
        )}

        {pdfWidgets.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4 opacity-50">
              <FileIcon size={14} className="text-emerald-400" />
              <span className="text-[10px] font-display tracking-widest uppercase">Library Documents</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
              {pdfWidgets.map(widget => (
                <PdfWidget key={widget.id} widget={widget} onEnlarge={setEnlargedWidgetId} onRemove={handleRemoveWidget} onUpdate={handleUpdateWidget} />
              ))}
            </div>
          </div>
        )}

        {imageWidgets.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4 opacity-50">
              <ImageIcon size={14} className="text-indigo-400" />
              <span className="text-[10px] font-display tracking-widest uppercase">Image Gallery</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
              {imageWidgets.map(widget => (
                <ImageWidget key={widget.id} widget={widget} onEnlarge={setEnlargedWidgetId} onRemove={handleRemoveWidget} onUpdate={handleUpdateWidget} />
              ))}
            </div>
          </div>
        )}

        {youtubeWidgets.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4 opacity-50">
              <Video size={14} className="text-rose-400" />
              <span className="text-[10px] font-display tracking-widest uppercase">Video References</span>
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {youtubeWidgets.map(widget => (
                <YouTubeWidget key={widget.id} widget={widget} onEnlarge={setEnlargedWidgetId} onRemove={handleRemoveWidget} onUpdate={handleUpdateWidget} />
              ))}
            </div>
          </div>
        )}

      </div>

      {enlargedWidget && (
        <WidgetEnlargedModal 
          widget={enlargedWidget} 
          onClose={() => setEnlargedWidgetId(null)}
          onUpdate={handleUpdateWidget}
          allNodes={allNodes}
          allDocs={allDocs}
        />
      )}
    </div>
  );
};
