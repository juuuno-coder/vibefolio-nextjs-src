"use client";

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Play, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface MediaPreviewProps {
  type: 'link' | 'image' | 'video';
  data: any; // URL or Array of URLs or Video ID
  isAB?: boolean;
  dataB?: any;
}

export function MediaPreview({ type, data, isAB, dataB }: MediaPreviewProps) {
  if (isAB) {
    return (
      <div className="w-full h-full flex flex-col md:flex-row">
        <div className="relative flex-1 border-r border-slate-100 flex flex-col">
          <div className="absolute top-4 left-4 z-10 bg-slate-900/90 text-white text-[10px] font-black px-3 py-1 rounded-full backdrop-blur-md border border-white/10 uppercase tracking-widest">Option A</div>
          <RenderSingleMedia type={type} data={data} />
        </div>
        <div className="relative flex-1 flex flex-col">
          <div className="absolute top-4 left-4 z-10 bg-orange-500/90 text-white text-[10px] font-black px-3 py-1 rounded-full backdrop-blur-md border border-white/10 uppercase tracking-widest">Option B</div>
          <RenderSingleMedia type={type} data={dataB} />
        </div>
      </div>
    );
  }

  return <RenderSingleMedia type={type} data={data} />;
}

function RenderSingleMedia({ type, data }: { type: string, data: any }) {
  const [activeIdx, setActiveIdx] = useState(0);

  if (type === 'image') {
    const images = Array.isArray(data) ? data : [data];
    if (images.length === 0) return <Placeholder text="No Images" />;

    return (
      <div className="relative w-full h-full bg-slate-900 flex items-center justify-center group">
        <div className="relative w-full h-full flex items-center justify-center p-4">
          <Image 
            src={images[activeIdx]} 
            alt="Preview" 
            fill
            className="object-contain shadow-2xl rounded-lg transition-all duration-500"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
          />
        </div>
        
        {images.length > 1 && (
          <>
            <button 
              onClick={() => setActiveIdx(prev => (prev > 0 ? prev - 1 : images.length - 1))}
              className="absolute left-6 w-12 h-12 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
            >
              <ChevronLeft size={24} />
            </button>
            <button 
              onClick={() => setActiveIdx(prev => (prev < images.length - 1 ? prev + 1 : 0))}
              className="absolute right-6 w-12 h-12 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
            >
              <ChevronRight size={24} />
            </button>
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
              {images.map((_, i) => (
                <div key={i} className={cn("w-2 h-2 rounded-full transition-all", i === activeIdx ? "bg-white w-6" : "bg-white/30")} />
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  if (type === 'video') {
    // Basic Youtube/Vimeo/Direct detection
    let videoUrl = data;
    if (typeof data === 'string' && data.includes('youtube.com/watch?v=')) {
      const id = data.split('v=')[1]?.split('&')[0];
      videoUrl = `https://www.youtube.com/embed/${id}?autoplay=0&rel=0`;
    } else if (typeof data === 'string' && data.includes('youtu.be/')) {
       const id = data.split('youtu.be/')[1];
       videoUrl = `https://www.youtube.com/embed/${id}?autoplay=0&rel=0`;
    }

    return (
      <div className="w-full h-full bg-black flex items-center justify-center">
        <iframe 
          src={videoUrl} 
          className="w-full h-full border-none" 
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
          allowFullScreen
        />
      </div>
    );
  }

  // Default: Link (Iframe)
  return (
    <div className="w-full h-full bg-white">
      {data ? (
        <iframe src={data} className="w-full h-full border-none" title="Link Preview" />
      ) : (
        <Placeholder text="URL Missing" />
      )}
    </div>
  );
}

function Placeholder({ text }: { text: string }) {
  return (
    <div className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-300 font-black text-xl uppercase tracking-tighter">
      {text}
    </div>
  );
}
