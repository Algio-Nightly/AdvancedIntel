import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { useAI } from '../../context/AIContext';
import {
  Brain, X, ChevronDown, CheckSquare, Square, Sparkles,
  FileText, Copy, Plus, Loader2, AlertCircle, BookOpen,
  LayoutGrid, Minimize2, FilePlus
} from 'lucide-react';
import { toast } from 'sonner';

/**
 * AIPanel — Collapsible AI assistant side-panel.
 *
 * Props:
 *   noteSlabs      — [{id, title, data}] current note slabs
 *   dependencies   — [{id, type, name, content?}] available references
 *   onAppendToNote — (noteId, contentToAppend) => void
 *   onReplaceNote  — (noteId, newContent) => void
 *   context        — 'library' | 'project'
 *   isOpen         — boolean
 *   onClose        — () => void
 */
export default function AIPanel({
  noteSlabs = [],
  dependencies = [],
  onAppendToNote,
  onReplaceNote,
  onSaveAsNewNote,
  context = 'library',
  isOpen,
  onClose,
}) {
  const { stream, isAvailable, isProcessing, MODEL_LABELS } = useAI();

  const [selectedModel, setSelectedModel] = useState('flashLite');
  const [prompt, setPrompt] = useState('');
  const [useReferences, setUseReferences] = useState(true);
  const [selectedRefs, setSelectedRefs] = useState(new Set());
  const [response, setResponse] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [targetNoteId, setTargetNoteId] = useState('');
  const [summarizeTargetId, setSummarizeTargetId] = useState('');
  const responseRef = useRef(null);

  // Auto-scroll response area during streaming
  useEffect(() => {
    if (responseRef.current && isStreaming) {
      responseRef.current.scrollTop = responseRef.current.scrollHeight;
    }
  }, [response, isStreaming]);

  // Reset target note when slabs change
  useEffect(() => {
    if (noteSlabs.length > 0 && !targetNoteId) {
      setTargetNoteId(noteSlabs[0].id);
    }
    if (noteSlabs.length > 0 && !summarizeTargetId) {
      setSummarizeTargetId(noteSlabs[0].id);
    }
  }, [noteSlabs]);

  const toggleRef = (refId) => {
    setSelectedRefs(prev => {
      const next = new Set(prev);
      if (next.has(refId)) next.delete(refId);
      else next.add(refId);
      return next;
    });
  };

  // Build context string from selected references
  function buildContext() {
    if (!useReferences || selectedRefs.size === 0) return '';

    const parts = [];

    noteSlabs.forEach(slab => {
      if (selectedRefs.has(slab.id)) {
        parts.push(`### Note: ${slab.title}\n${slab.data || ''}`);
      }
    });

    dependencies.forEach(dep => {
      if (selectedRefs.has(dep.id)) {
        parts.push(`### ${dep.type === 'library' ? 'Library' : 'Container'}: ${dep.name}\n${dep.content || '(No text content available)'}`);
      }
    });

    return parts.length > 0
      ? `\n\n---\nREFERENCE CONTEXT:\n${parts.join('\n\n')}\n---\n`
      : '';
  }

  async function handleGenerate() {
    if (!prompt.trim()) return;
    if (!isAvailable) {
      toast.error('No API key configured. Go to Settings to add one.');
      return;
    }

    const contextStr = buildContext();
    const fullPrompt = contextStr
      ? `${prompt}\n${contextStr}`
      : prompt;

    setResponse('');
    setIsStreaming(true);

    try {
      await stream(fullPrompt, (chunk) => {
        setResponse(prev => prev + chunk);
      }, {
        model: selectedModel,
        systemInstruction: 'You are an expert research assistant embedded in an intelligence analysis platform. Provide detailed, well-structured responses in markdown format. Use headings, bullet points, and code blocks where appropriate.',
        temperature: 0.7,
        maxTokens: 4096,
      });
    } catch (err) {
      toast.error(`AI Error: ${err.message}`);
      setResponse(prev => prev + `\n\n> ⚠️ Error: ${err.message}`);
    } finally {
      setIsStreaming(false);
    }
  }

  async function handleSummarize() {
    if (!isAvailable) {
      toast.error('No API key configured. Go to Settings to add one.');
      return;
    }

    const targetSlab = noteSlabs.find(s => s.id === summarizeTargetId);
    if (!targetSlab || !targetSlab.data?.trim()) {
      toast.error('Select a note with content to summarize.');
      return;
    }

    setResponse('');
    setIsStreaming(true);

    try {
      let summary = '';
      await stream(
        `Summarize the following content concisely while preserving key information, structure, and any technical details:\n\n${targetSlab.data}`,
        (chunk) => {
          summary += chunk;
          setResponse(prev => prev + chunk);
        },
        {
          model: selectedModel,
          systemInstruction: 'You are a concise academic summarizer. Produce well-structured markdown summaries that retain critical details, findings, and terminology. Use bullet points and headings.',
          temperature: 0.3,
          maxTokens: 2048,
        }
      );

      // Offer to replace the note content
      if (summary && onReplaceNote) {
        onReplaceNote(summarizeTargetId, summary);
        toast.success(`Summarized and updated "${targetSlab.title}"`);
      }
    } catch (err) {
      toast.error(`AI Error: ${err.message}`);
    } finally {
      setIsStreaming(false);
    }
  }

  function handleAppendToNote() {
    if (!response.trim() || !targetNoteId || !onAppendToNote) return;
    onAppendToNote(targetNoteId, `\n\n----- \n*AI Generated:*\n${response}`);
    toast.success('Content appended to note.');
  }

  function handleReplaceNoteAction() {
    if (!response.trim() || !targetNoteId || !onReplaceNote) return;
    onReplaceNote(targetNoteId, response);
    toast.success('Note content replaced.');
  }

  function handleSaveAsNew() {
    if (!response.trim() || !onSaveAsNewNote) return;
    onSaveAsNewNote(response);
    toast.success('AI Insight saved as new note.');
  }

  function handleCopy() {
    navigator.clipboard.writeText(response);
    toast.success('Copied to clipboard.');
  }

  if (!isOpen) return null;

  return (
    <div className="w-[380px] xl:w-[420px] flex flex-col bg-surface border-l border-outline-variant/20 shadow-[-10px_0_40px_rgba(0,0,0,0.15)] animate-in slide-in-from-right-4 duration-300 overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-outline-variant/10 bg-surface-container-low/50 shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
            <Brain size={16} className="text-violet-400" />
          </div>
          <div>
            <span className="meta-label text-[10px] opacity-80 tracking-widest">AI ASSISTANT</span>
            <div className="flex items-center gap-2 mt-0.5">
              <div className={`h-1.5 w-1.5 rounded-full ${isAvailable ? 'bg-emerald-400 animate-pulse' : 'bg-red-400/60'}`} />
              <span className="text-[9px] opacity-40 uppercase tracking-wider">
                {isAvailable ? 'READY' : 'NO KEY'}
              </span>
            </div>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 hover:bg-surface-container-highest rounded-lg transition-colors opacity-50 hover:opacity-100">
          <X size={16} />
        </button>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 scrollbar-thin">

        {/* Model Selector */}
        <div className="relative">
          <label className="text-[9px] meta-label opacity-40 mb-1.5 block tracking-widest">MODEL</label>
          <button
            onClick={() => setShowModelDropdown(!showModelDropdown)}
            className="w-full flex items-center justify-between px-3 py-2.5 bg-surface-container/60 border border-outline-variant/20 rounded-lg text-xs hover:border-primary/30 transition-all"
          >
            <span className="font-mono text-[11px]">{MODEL_LABELS[selectedModel]}</span>
            <ChevronDown size={14} className={`opacity-40 transition-transform ${showModelDropdown ? 'rotate-180' : ''}`} />
          </button>
          {showModelDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-surface-container-highest border border-outline-variant/30 rounded-xl shadow-2xl z-50 overflow-hidden">
              {Object.entries(MODEL_LABELS).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => { setSelectedModel(key); setShowModelDropdown(false); }}
                  className={`w-full text-left px-4 py-3 text-xs hover:bg-primary/10 transition-colors flex items-center justify-between ${selectedModel === key ? 'bg-primary/5 text-primary' : ''}`}
                >
                  <span className="font-mono text-[11px]">{label}</span>
                  {selectedModel === key && <Sparkles size={12} className="text-primary" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Reference Context Section */}
        <div className="flex flex-col gap-2">
          <button
            onClick={() => setUseReferences(!useReferences)}
            className="flex items-center gap-2 text-[10px] meta-label opacity-60 hover:opacity-100 transition-opacity"
          >
            {useReferences
              ? <CheckSquare size={14} className="text-primary" />
              : <Square size={14} />
            }
            <span className="tracking-widest">REFERENCE CONTEXT</span>
          </button>

          {useReferences && (
            <div className="bg-surface-container/40 border border-outline-variant/10 rounded-xl p-3 flex flex-col gap-1.5 max-h-40 overflow-y-auto scrollbar-thin">
              {noteSlabs.length === 0 && dependencies.length === 0 && (
                <p className="text-[10px] opacity-30 italic text-center py-2">No references available</p>
              )}

              {noteSlabs.map(slab => (
                <button
                  key={slab.id}
                  onClick={() => toggleRef(slab.id)}
                  className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left text-[11px] transition-all ${
                    selectedRefs.has(slab.id)
                      ? 'bg-primary/10 border border-primary/20 text-primary'
                      : 'hover:bg-surface-container-highest/50 border border-transparent'
                  }`}
                >
                  {selectedRefs.has(slab.id)
                    ? <CheckSquare size={12} className="shrink-0" />
                    : <Square size={12} className="shrink-0 opacity-30" />
                  }
                  <FileText size={12} className="shrink-0 opacity-50" />
                  <span className="truncate">{slab.title}</span>
                </button>
              ))}

              {dependencies.map(dep => (
                <button
                  key={dep.id}
                  onClick={() => toggleRef(dep.id)}
                  className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left text-[11px] transition-all ${
                    selectedRefs.has(dep.id)
                      ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                      : 'hover:bg-surface-container-highest/50 border border-transparent'
                  }`}
                >
                  {selectedRefs.has(dep.id)
                    ? <CheckSquare size={12} className="shrink-0" />
                    : <Square size={12} className="shrink-0 opacity-30" />
                  }
                  {dep.type === 'library'
                    ? <BookOpen size={12} className="shrink-0 opacity-50" />
                    : <LayoutGrid size={12} className="shrink-0 opacity-50" />
                  }
                  <span className="truncate">{dep.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Prompt Input */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[9px] meta-label opacity-40 tracking-widest">PROMPT</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ask anything about your research..."
            rows={4}
            className="w-full bg-surface-container/60 border border-outline-variant/20 rounded-xl px-4 py-3 text-sm text-on-surface placeholder:opacity-25 focus:outline-none focus:border-primary/40 focus:bg-surface-container/80 transition-all resize-none scrollbar-thin"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleGenerate();
            }}
          />
          <span className="text-[9px] opacity-25 text-right">Ctrl+Enter to generate</span>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleGenerate}
            disabled={!prompt.trim() || isStreaming || !isAvailable}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-violet-500/15 border border-violet-500/25 text-violet-400 text-[11px] font-display tracking-widest uppercase hover:bg-violet-500/25 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {isStreaming ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            Generate
          </button>

          <div className="flex flex-col gap-1 flex-1">
            <select
              value={summarizeTargetId}
              onChange={(e) => setSummarizeTargetId(e.target.value)}
              className="w-full bg-surface-container/60 border border-outline-variant/15 rounded-lg px-2 py-1 text-[9px] focus:outline-none focus:border-primary/30 text-on-surface"
            >
              {noteSlabs.map(s => (
                <option key={s.id} value={s.id}>{s.title}</option>
              ))}
            </select>
            <button
              onClick={handleSummarize}
              disabled={!summarizeTargetId || isStreaming || !isAvailable || noteSlabs.length === 0}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-amber-500/15 border border-amber-500/25 text-amber-400 text-[11px] font-display tracking-widest uppercase hover:bg-amber-500/25 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {isStreaming ? <Loader2 size={14} className="animate-spin" /> : <Minimize2 size={14} />}
              Summarize
            </button>
          </div>
        </div>

        {/* Response Area */}
        {response && (
          <div className="flex flex-col gap-2">
            <label className="text-[9px] meta-label opacity-40 tracking-widest">RESPONSE</label>
            <div
              ref={responseRef}
              className="bg-surface-container/40 border border-outline-variant/10 rounded-xl p-4 max-h-80 overflow-y-auto scrollbar-thin prose prose-sm dark:prose-invert max-w-none
                prose-headings:text-primary prose-headings:font-display prose-headings:tracking-tight
                prose-p:text-on-surface/80 prose-p:text-[13px] prose-p:leading-relaxed
                prose-li:text-on-surface/70 prose-li:text-[13px]
                prose-strong:text-on-surface
                prose-code:text-primary prose-code:bg-surface-container-highest/40 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-[12px]
                prose-a:text-primary"
            >
              <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                {response}
              </ReactMarkdown>
              {isStreaming && (
                <span className="inline-block w-2 h-4 bg-primary/60 animate-pulse ml-0.5" />
              )}
            </div>

            {/* Response Actions */}
            {!isStreaming && (
              <div className="flex gap-2">
                <button
                  onClick={handleSaveAsNew}
                  className="flex items-center gap-1.5 px-3 py-2 text-[10px] rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-all font-display tracking-widest uppercase"
                  title="Save as new note"
                >
                  <FilePlus size={11} />
                  NEW NOTE
                </button>

                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-2 text-[10px] rounded-lg bg-surface-container/60 border border-outline-variant/15 hover:bg-surface-container-highest/50 transition-all font-display tracking-widest uppercase opacity-60 hover:opacity-100"
                >
                  <Copy size={11} />
                  Copy
                </button>

                <div className="flex items-center gap-1.5 flex-1">
                  <select
                    value={targetNoteId}
                    onChange={(e) => setTargetNoteId(e.target.value)}
                    className="flex-1 bg-surface-container/60 border border-outline-variant/15 rounded-lg px-2 py-2 text-[10px] focus:outline-none focus:border-primary/30 text-on-surface"
                  >
                    {noteSlabs.map(s => (
                      <option key={s.id} value={s.id}>{s.title}</option>
                    ))}
                  </select>
                  <button
                    onClick={handleAppendToNote}
                    disabled={!targetNoteId}
                    className="flex items-center gap-1.5 px-2 py-2 text-[9px] rounded-lg bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-all font-display tracking-widest uppercase disabled:opacity-30"
                    title="Append to note"
                  >
                    <Plus size={10} />
                    APPEND
                  </button>
                  <button
                    onClick={handleReplaceNoteAction}
                    disabled={!targetNoteId}
                    className="flex items-center gap-1.5 px-2 py-2 text-[9px] rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-400 hover:bg-violet-500/20 transition-all font-display tracking-widest uppercase disabled:opacity-30"
                    title="Replace note content"
                  >
                    <Sparkles size={10} />
                    REPLACE
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* No Key Warning */}
        {!isAvailable && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-500/5 border border-amber-500/15 text-amber-400 mt-2">
            <AlertCircle size={16} className="shrink-0" />
            <p className="text-[11px] leading-relaxed">Configure your Gemini API key in <strong>Settings</strong> to enable AI features.</p>
          </div>
        )}
      </div>
    </div>
  );
}
