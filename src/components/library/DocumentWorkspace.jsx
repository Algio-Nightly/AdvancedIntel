import React, { useState, useEffect } from 'react';
import { X, Maximize2, Minimize2, Save, Link, FileText, Edit3, Eye, CheckCircle, Plus, Brain } from 'lucide-react';
import { toast } from 'sonner';
import { MarkdownWidget, WidgetEnlargedModal } from '../widgets/WidgetEngine';
import { useLibrary } from '../../context/LibraryContext';
import { useNodes } from '../../context/NodeContext';
import AIPanel from '../ai/AIPanel';

export default function DocumentWorkspace({ docId, fileName, blob, onClose, activeNodeId }) {
  const { updateDocumentNotes, fetchDocumentNotes } = useLibrary();
  const { updateWidgets, nodes } = useNodes();
  
  const [noteSlabs, setNoteSlabs] = useState([]);
  const [enlargedNoteId, setEnlargedNoteId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [pdfUrl, setPdfUrl] = useState("");
  const [showAIPanel, setShowAIPanel] = useState(false);

  useEffect(() => {
    if (blob) {
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [blob]);

  useEffect(() => {
    const loadNotes = async () => {
      if (!docId) return;
      const savedSlabs = await fetchDocumentNotes(docId);
      setNoteSlabs(savedSlabs || []);
    };
    loadNotes();
  }, [docId, fetchDocumentNotes]);

  const handleSaveNotes = async (slabsToSave = noteSlabs) => {
    if (!docId) return;
    setIsSaving(true);
    try {
      await updateDocumentNotes(docId, slabsToSave);
      // toast.success("Cognitive archive updated"); // Removed for less noise during auto-saves
    } catch (err) {
      toast.error("Failed to sync notes");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddNote = () => {
    const newNote = {
      id: `doc-note-${Date.now()}`,
      type: 'markdown',
      title: 'New Analysis Slab',
      data: '# New Observation\n\nInitialize cognitive analysis...'
    };
    const updated = [newNote, ...noteSlabs];
    setNoteSlabs(updated);
    handleSaveNotes(updated);
  };

  const handleUpdateNote = (updatedNote) => {
    const updated = noteSlabs.map(n => n.id === updatedNote.id ? updatedNote : n);
    setNoteSlabs(updated);
    handleSaveNotes(updated);
  };

  const handleRemoveNote = (noteId) => {
    const updated = noteSlabs.filter(n => n.id !== noteId);
    setNoteSlabs(updated);
    handleSaveNotes(updated);
  };

  const handleReferenceToContainer = async () => {
    if (!activeNodeId) {
      toast.error("No active container selected for reference.");
      return;
    }

    const activeNode = nodes.find(n => n.id === activeNodeId);
    if (!activeNode) return;

    const currentWidgets = activeNode.widgets || [];
    
    // Aggregate all notes into one synthesis block
    const aggregatedNotes = noteSlabs.map(slab => `### ${slab.title}\n${slab.data}`).join('\n\n---\n\n');
    
    // Find or create 'Library Synthesis' widget
    let libWidget = currentWidgets.find(w => w.type === 'library_notes');
    
    const noteEntry = `\n\n### Document Archive: ${fileName}\n${aggregatedNotes}\n---`;
    
    let updatedWidgets;
    if (libWidget) {
      updatedWidgets = currentWidgets.map(w => 
        w.id === libWidget.id ? { ...w, data: (w.data || "") + noteEntry } : w
      );
    } else {
      updatedWidgets = [
        ...currentWidgets,
        {
          id: `lib-notes-${Date.now()}`,
          type: 'library_notes',
          title: 'Integrated Library Synthesis',
          data: `## Findings from ${fileName}\n` + noteEntry
        }
      ];
    }

    try {
      await updateWidgets(activeNodeId, updatedWidgets);
      toast.success(`Referenced ${noteSlabs.length} slabs to ${activeNode.title}`);
    } catch (err) {
      toast.error("Failed to link reference");
    }
  };

  const enlargedNote = noteSlabs.find(n => n.id === enlargedNoteId);

  return (
    <div className="fixed inset-0 z-[100] bg-surface flex flex-col animate-in fade-in duration-300">
      
      {/* Top Navigation Bar */}
      <div className="h-16 bg-surface-container-highest/30 border-b border-outline-variant/30 flex items-center justify-between px-6 backdrop-blur-xl shrink-0">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded bg-primary/20 flex items-center justify-center text-primary">
            <FileText size={20} />
          </div>
          <div>
            <h2 className="font-display text-lg tracking-tight leading-tight">{fileName}</h2>
            <p className="text-[10px] meta-label opacity-50 uppercase tracking-widest">Document Cognitive Workspace</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => handleSaveNotes()}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 text-primary rounded-lg text-xs font-display tracking-widest hover:bg-primary/20 transition-all disabled:opacity-50"
          >
            {isSaving ? <span className="h-3 w-3 border-2 border-primary border-t-transparent animate-spin rounded-full"></span> : <Save size={14} />}
            SYNC ARCHIVE
          </button>
          
          {activeNodeId && (
            <button 
              onClick={handleReferenceToContainer}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 rounded-lg text-xs font-display tracking-widest hover:bg-emerald-500/20 transition-all"
            >
              <Link size={14} />
              REFERENCE TO CONTAINER
            </button>
          )}

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

          <div className="w-px h-6 bg-outline-variant/30 mx-2" />
          
          <button 
            onClick={onClose}
            className="p-2 hover:bg-error/10 text-error/60 hover:text-error rounded-lg transition-all"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Main Dual Panel Layout */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Panel: PDF Viewer */}
        <div className="flex-1 bg-[#2d3133] border-r border-outline-variant/20 relative">
          {pdfUrl ? (
            <iframe 
              src={`${pdfUrl}#toolbar=0`} 
              className="w-full h-full border-none"
              title="PDF Archive"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-on-surface/30 meta-label italic">
              Loading encrypted stream...
            </div>
          )}
        </div>

        {/* Right Panel: Note Slabs */}
        <div className="w-[500px] xl:w-[600px] flex flex-col bg-surface overflow-hidden shadow-[-10px_0_30px_rgba(0,0,0,0.1)]">
          <div className="flex items-center justify-between p-4 border-b border-outline-variant/10 bg-surface-container-low/50 shrink-0">
            <div>
              <span className="meta-label text-[10px] opacity-60 uppercase tracking-widest">Analysis Slabs</span>
              <p className="text-[9px] opacity-40 mt-0.5">DOCUMENT-SPECIFIC KNOWLEDGE</p>
            </div>
            
            <button 
              onClick={() => setShowAIPanel(!showAIPanel)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-[10px] font-display tracking-widest transition-all border ${
                showAIPanel 
                  ? 'bg-violet-500/20 border-violet-500/30 text-violet-400' 
                  : 'bg-primary/10 border-primary/20 text-primary hover:bg-primary/20'
              }`}
            >
              <Brain size={14} />
              AI ASSISTANT
            </button>
            
            <button 
              onClick={handleAddNote}
              className="flex items-center gap-2 px-3 py-1.5 bg-primary/20 text-primary rounded-md text-[10px] font-display tracking-widest hover:bg-primary/30 transition-all border border-primary/20"
            >
              <Plus size={14} />
              ADD NOTE
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
            {noteSlabs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-on-surface/20 italic p-10 text-center gap-4">
                <div className="h-16 w-16 rounded-full border-2 border-dashed border-outline-variant/30 flex items-center justify-center opacity-50">
                  <Edit3 size={24} />
                </div>
                <p className="text-xs uppercase tracking-[0.2em]">Archive empty. Initiate observation by adding a note slab.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {noteSlabs.map(slab => (
                  <MarkdownWidget 
                    key={slab.id} 
                    widget={slab} 
                    onEnlarge={() => setEnlargedNoteId(slab.id)}
                    onRemove={handleRemoveNote}
                    onUpdate={handleUpdateNote}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* AI Assistant Panel */}
        <AIPanel
          noteSlabs={noteSlabs}
          dependencies={[]}
          onAppendToNote={(noteId, content) => {
            const updated = noteSlabs.map(n =>
              n.id === noteId ? { ...n, data: (n.data || '') + content } : n
            );
            setNoteSlabs(updated);
            handleSaveNotes(updated);
          }}
          onReplaceNote={(noteId, newContent) => {
            const updated = noteSlabs.map(n =>
              n.id === noteId ? { ...n, data: newContent } : n
            );
            setNoteSlabs(updated);
            handleSaveNotes(updated);
          }}
          onSaveAsNewNote={(content) => {
            const newNote = {
              id: `doc-note-${Date.now()}`,
              type: 'markdown',
              title: 'AI Analysis Slab',
              data: content
            };
            const updated = [newNote, ...noteSlabs];
            setNoteSlabs(updated);
            handleSaveNotes(updated);
          }}
          context="library"
          isOpen={showAIPanel}
          onClose={() => setShowAIPanel(false)}
        />

      </div>

      {/* Enlarged Modal for Note Editing */}
      {enlargedNote && (
        <WidgetEnlargedModal 
          widget={enlargedNote}
          onClose={() => setEnlargedNoteId(null)}
          onUpdate={handleUpdateNote}
        />
      )}

    </div>
  );
}
