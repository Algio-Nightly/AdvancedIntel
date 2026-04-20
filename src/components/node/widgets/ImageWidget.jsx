import React, { useState, useRef, useEffect } from 'react';
import { Trash2, UploadCloud } from 'lucide-react';
import { saveBlobToLocal, getBlobFromLocal, deleteBlobFromLocal } from '../../../lib/storage';

export default function ImageWidget({ data, updateData, onRemove }) {
  const [imageSrc, setImageSrc] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (data.imageId) {
      const load = async () => {
        setIsLoading(true);
        try {
          const blob = await getBlobFromLocal(data.imageId);
          if (blob) {
            const url = URL.createObjectURL(blob);
            setImageSrc(url);
          }
        } catch (err) {
          console.error("Failed to load image", err);
        } finally {
          setIsLoading(false);
        }
      };
      load();
    }
  }, [data.imageId]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith('image/')) return;
    
    setIsLoading(true);
    try {
      const newImageId = `img_${Date.now()}`;
      await saveBlobToLocal(newImageId, file);
      
      updateData({ imageId: newImageId });
      
      const url = URL.createObjectURL(file);
      setImageSrc(url);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async () => {
    if (data.imageId) {
      await deleteBlobFromLocal(data.imageId);
    }
    onRemove();
  };

  return (
    <div className="glass-container flex flex-col rounded-2xl overflow-hidden border border-outline-variant/30 group min-h-[300px]">
      <div className="flex justify-between items-center px-4 py-2 bg-surface-container-highest/20 border-b border-outline-variant/30">
        <span className="text-xs font-display tracking-widest opacity-60">IMAGE</span>
        <button onClick={handleRemove} className="opacity-0 group-hover:opacity-100 text-error/60 hover:text-error transition-all p-1 rounded-md hover:bg-error/10 z-10 relative">
          <Trash2 size={14} />
        </button>
      </div>
      <div className="flex-1 relative flex items-center justify-center bg-black/10 overflow-hidden group/img">
        {isLoading ? (
          <div className="text-primary/50 text-xs font-display tracking-widest">LOADING...</div>
        ) : imageSrc ? (
          <img src={imageSrc} alt="Widget Content" className="absolute w-full h-full object-cover opacity-80 group-hover/img:opacity-100 transition-opacity" />
        ) : (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="w-[80%] h-[80%] border-2 border-dashed border-outline-variant/30 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-surface-container-highest/20 transition-all text-on-surface/40 hover:text-primary"
          >
            <UploadCloud size={32} className="mb-2" />
            <span className="text-xs font-display tracking-widest">UPLOAD IMAGE</span>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              accept="image/*" 
              className="hidden" 
            />
          </div>
        )}
      </div>
    </div>
  );
}
