import React, { useState } from 'react';
import { Trash2, Link } from 'lucide-react';

export default function YouTubeWidget({ data, updateData, onRemove }) {
  const [url, setUrl] = useState(data.url || '');
  const [isEditing, setIsEditing] = useState(!data.url);

  const getEmbedUrl = (youtubeUrl) => {
    try {
      const parsedUrl = new URL(youtubeUrl);
      let videoId = '';
      if (parsedUrl.hostname.includes('youtube.com')) {
        videoId = parsedUrl.searchParams.get('v');
      } else if (parsedUrl.hostname === 'youtu.be') {
        videoId = parsedUrl.pathname.slice(1);
      }
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    } catch {
      return null;
    }
  };

  const handleSave = () => {
    updateData({ url });
    setIsEditing(false);
  };

  const embedUrl = getEmbedUrl(url);

  return (
    <div className="glass-container flex flex-col rounded-2xl overflow-hidden border border-outline-variant/30 group col-span-1 md:col-span-2 min-h-[300px]">
      <div className="flex justify-between items-center px-4 py-2 bg-surface-container-highest/20 border-b border-outline-variant/30">
        <span className="text-xs font-display tracking-widest opacity-60">YOUTUBE</span>
        <div className="flex gap-2">
          <button onClick={() => setIsEditing(!isEditing)} className="opacity-0 group-hover:opacity-100 text-on-surface/60 hover:text-on-surface transition-all p-1 rounded-md hover:bg-surface-container-highest">
            <Link size={14} />
          </button>
          <button onClick={onRemove} className="opacity-0 group-hover:opacity-100 text-error/60 hover:text-error transition-all p-1 rounded-md hover:bg-error/10">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      <div className="flex-1 flex flex-col relative bg-black/20">
        {isEditing || !embedUrl ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 gap-4 bg-surface/50 backdrop-blur-sm z-10">
            <input 
              type="text" 
              value={url} 
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste YouTube URL..." 
              className="w-full max-w-md bg-surface-container border border-outline-variant/50 rounded-lg px-4 py-2 text-sm outline-none focus:border-primary/50"
            />
            <button onClick={handleSave} className="px-4 py-2 bg-primary text-on-primary text-xs tracking-widest font-display rounded-md">EMBED VIDEO</button>
          </div>
        ) : null}
        
        {embedUrl && !isEditing && (
          <iframe 
            width="100%" 
            height="100%" 
            src={embedUrl} 
            title="YouTube video player" 
            frameBorder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowFullScreen
            className="absolute inset-0 w-full h-full"
          ></iframe>
        )}
      </div>
    </div>
  );
}
