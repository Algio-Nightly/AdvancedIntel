import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

export default function PDFViewer({ blob, fileName, onClose }) {
  const [url, setUrl] = useState(null);

  useEffect(() => {
    if (blob) {
      const objectUrl = URL.createObjectURL(blob);
      setUrl(objectUrl);
      
      // Cleanup to prevent memory leaks in the browser
      return () => {
        URL.revokeObjectURL(objectUrl);
      };
    }
  }, [blob]);

  if (!blob) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-12 bg-on-surface/40 backdrop-blur-sm">
      <div className="glass-container w-full h-full max-w-6xl flex flex-col shadow-2xl relative border border-outline-variant/30 rounded-2xl overflow-hidden bg-surface-container-lowest/90">
        
        {/* Header toolbar */}
        <div className="h-14 border-b border-outline-variant/20 flex items-center justify-between px-6 bg-surface-container-low/50">
           <h3 className="font-display tracking-widest text-sm text-primary truncate max-w-[80%]">
             {fileName || "DOCUMENT VIEWER"}
           </h3>
           <button 
             onClick={onClose}
             className="h-8 w-8 rounded-full hover:bg-error/10 text-on-surface/50 hover:text-error flex items-center justify-center transition-colors"
           >
             <X size={16} />
           </button>
        </div>

        {/* Viewer Body */}
        <div className="flex-1 w-full bg-surface-container-lowest relative">
          {url ? (
            <iframe 
              src={`${url}#toolbar=0&navpanes=0`} 
              className="w-full h-full border-none"
              title="PDF Reader"
            />
          ) : (
            <div className="flex w-full h-full items-center justify-center meta-label opacity-50 text-xs tracking-widest">
              INITIALIZING BINARY BUFFER...
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
