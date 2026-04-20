import React, { useState, useRef, useEffect } from 'react';
import { useLibrary } from '../context/LibraryContext';
import { saveBlobToLocal, getBlobFromLocal, deleteBlobFromLocal } from '../lib/storage';
import { UploadCloud, FileText, Trash2, AlertTriangle, Activity } from 'lucide-react';
import { formatRelativeTime } from '../lib/utils';
import DocumentWorkspace from './library/DocumentWorkspace';
import { toast } from 'sonner';

export default function Library() {
  const { documents, saveDocumentMetadata, deleteDocumentMetadata, refreshDocuments, loading, error } = useLibrary();
  const [isUploading, setIsUploading] = useState(false);
  
  // Document Workspace State
  const [activeDoc, setActiveDoc] = useState(null); // { meta: docObj, blob: blob }

  const fileInputRef = useRef(null);

  // Handle global error from context
  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error("Only PDF documents are supported for Cognitive ingestion.");
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast.error("Document exceeds 50MB trial limit.");
      return;
    }

    setIsUploading(true);
    const toastId = toast.loading("Ingesting binary archive...");
    
    try {
      const meta = await saveDocumentMetadata({
        name: file.name,
        size: file.size,
        type: file.type
      });

      await saveBlobToLocal(meta.id, file);
      await refreshDocuments();
      toast.success(`'${file.name}' ingested successfully`, { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error("Upload failed: " + err.message, { id: toastId });
    } finally {
      setIsUploading(false);
      if(fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleOpenDoc = async (docObj) => {
    try {
      const blob = await getBlobFromLocal(docObj.id);
      if (!blob) {
        toast.error(`Offline Error: The binary file for '${docObj.fileName}' is not stored on this device's local cache.`);
        return;
      }
      setActiveDoc({ meta: docObj, blob });
    } catch (err) {
      toast.error("Failed to retrieve file from local cache.");
    }
  };

  const handleDelete = async (e, docId) => {
    e.stopPropagation();
    
    toast.warning("Disconnect this document from the network?", {
      description: "This action cannot be undone.",
      action: {
        label: "DISCONNECT",
        onClick: async () => {
          try {
            await deleteDocumentMetadata(docId);
            await deleteBlobFromLocal(docId);
            await refreshDocuments();
            toast.success("Document disconnected from network");
          } catch (err) {
            console.error(err);
            toast.error("Failed to disconnect document");
          }
        },
      },
    });
  };

  const formatSize = (bytes) => {
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div className="flex flex-col text-on-surface min-h-screen relative">
      
      {/* Document Workspace Overlay */}
      {activeDoc && (
        <DocumentWorkspace 
          docId={activeDoc.meta.id}
          blob={activeDoc.blob} 
          fileName={activeDoc.meta.fileName} 
          onClose={() => setActiveDoc(null)} 
        />
      )}

      <main className="w-full max-w-[1400px] mx-auto pt-24 md:pt-32 flex flex-col px-4 xl:px-12 pb-20">
        
        <h1 className="text-4xl md:text-5xl font-light font-display">Document Library</h1>
        <p className="text-sm opacity-50 meta-label mt-2 mb-10">RESEARCH PAPERS & KNOWLEDGE INGESTION</p>

        {/* The Disclaimer Banner */}
        <div className="glass-container p-4 md:p-6 mb-12 border-l-4 border-l-amber-500/50 bg-amber-500/5 flex items-start md:items-center gap-4 text-amber-700">
           <AlertTriangle size={24} className="shrink-0 mt-1 md:mt-0" />
           <div className="flex flex-col">
              <span className="text-sm font-bold tracking-wide">TRIAL HYBRID ARCHITECTURE NOTICE</span>
              <span className="text-xs opacity-80 leading-relaxed mt-1">
                 Because Cloud Storage is not yet configured, files uploaded here are tracked via Firebase but physically stored in your browser's local sandbox (IndexedDB). If you clear your browser cache or switch devices, your files will appear listed but you will need to re-upload the PDFs to view them.
              </span>
           </div>
        </div>

        {/* Dropzone / Upload Area */}
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="w-full relative glass-container border-2 border-dashed border-outline-variant/40 rounded-3xl h-48 flex flex-col items-center justify-center cursor-pointer hover:bg-surface-container-highest/20 transition-all hover:border-primary/50 group mb-12"
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            accept="application/pdf" 
            className="hidden" 
          />
          
          {isUploading ? (
             <div className="flex flex-col items-center text-primary">
                <Activity size={32} className="animate-spin mb-3 opacity-60" />
                <span className="meta-label text-xs tracking-widest">INGESTING BINARY...</span>
             </div>
          ) : (
             <div className="flex flex-col items-center text-on-surface/40 group-hover:text-primary transition-colors">
                <UploadCloud size={40} strokeWidth={1.5} className="mb-3 opacity-70" />
                <span className="font-display tracking-[0.2em] text-sm hidden md:block">INITIATE UPLOAD SEQUENCE</span>
                <span className="font-display tracking-[0.2em] text-sm md:hidden">UPLOAD PDF</span>
                <span className="text-xs opacity-50 mt-2">Maximum trial throughput: 50MB</span>
             </div>
          )}
        </div>

        {/* Grid of Documents */}
        {loading && documents.length === 0 ? (
          <div className="py-20 flex justify-center text-primary opacity-50"><Activity className="animate-spin" /></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {documents.map(docObj => (
              <div 
                key={docObj.id}
                onClick={() => handleOpenDoc(docObj)}
                className="glass-container p-5 rounded-2xl flex flex-col cursor-pointer border border-outline-variant/30 hover:border-primary/40 hover:bg-surface-container-highest/10 transition-all shadow-ambient group"
              >
                 <div className="flex justify-between items-start mb-6">
                    <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                       <FileText size={18} strokeWidth={1.5} />
                    </div>
                    <button 
                      onClick={(e) => handleDelete(e, docObj.id)}
                      className="text-error opacity-0 group-hover:opacity-60 hover:opacity-100 transition-opacity p-2"
                    >
                      <Trash2 size={14} />
                    </button>
                 </div>
                 
                 <h3 className="font-display truncate text-sm md:text-base leading-tight mb-2 pr-4">{docObj.fileName}</h3>
                 
                 <div className="mt-auto flex items-center justify-between meta-label text-[10px] opacity-40">
                    <span>{formatSize(docObj.fileSize)}</span>
                    <span>{formatRelativeTime(docObj.uploadedAt)}</span>
                 </div>
              </div>
            ))}
            
            {documents.length === 0 && (
               <div className="col-span-full py-16 flex items-center justify-center text-on-surface/30 meta-label tracking-widest text-xs">
                 NO ARCHIVES FOUND IN MAINFRAME
               </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}
