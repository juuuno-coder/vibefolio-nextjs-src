
import React from 'react';
import ReactMarkdown from 'react-markdown';
import {
  ImageIcon,
} from "lucide-react";

export interface IrSlide {
  id: string;
  deck_id: string;
  order_index: number;
  layout_type: 'cover' | 'basic' | 'image_left' | 'image_right' | 'grid' | 'big_number' | 'swot';
  title: string;
  content: string;
  image_url: string | null;
  speaker_notes: string | null;
}

interface SlideRendererProps {
  slide: IrSlide;
  deckName?: string;
}

export function SlideRenderer({ slide, deckName }: SlideRendererProps) {
  return (
    <div className="w-full h-full bg-white relative flex flex-col overflow-hidden">
      {/* Header / Logo Area */}
      {deckName && (
        <div className="absolute top-8 right-12 text-xs font-bold text-neutral-300 uppercase tracking-widest z-10">
          {deckName}
        </div>
      )}

      {/* Dynamic Layout Rendering */}
      {slide.layout_type === 'cover' && (
        <div className="flex flex-col justify-center h-full p-12">
          <h1 className="text-6xl font-black text-neutral-900 mb-6 leading-tight whitespace-pre-wrap">
            {slide.title}
          </h1>
          <div className="text-2xl text-neutral-500 whitespace-pre-wrap font-light leading-relaxed">
            {slide.content}
          </div>
        </div>
      )}

      {slide.layout_type === 'basic' && (
        <div className="h-full flex flex-col p-12">
          <h2 className="text-4xl font-bold text-neutral-900 mb-8 border-l-4 border-blue-600 pl-4">
            {slide.title}
          </h2>
          <div className="flex-1 prose prose-lg max-w-none text-neutral-600">
            <ReactMarkdown>{slide.content}</ReactMarkdown>
          </div>
        </div>
      )}

      {slide.layout_type === 'image_right' && (
        <div className="h-full flex gap-12 p-12">
          <div className="flex-1 flex flex-col justify-center">
            <h2 className="text-4xl font-bold text-neutral-900 mb-8 leading-tight">
              {slide.title}
            </h2>
            <div className="prose text-neutral-600">
              <ReactMarkdown>{slide.content}</ReactMarkdown>
            </div>
          </div>
          <div className="flex-1 bg-neutral-100 rounded-lg overflow-hidden flex items-center justify-center relative">
            {slide.image_url ? (
              <img src={slide.image_url} alt="slide visual" className="w-full h-full object-cover" />
            ) : (
              <div className="text-neutral-300 flex flex-col items-center">
                <ImageIcon className="w-12 h-12 mb-2" />
                <span className="text-sm font-medium">Image Placeholder</span>
              </div>
            )}
          </div>
        </div>
      )}

      {slide.layout_type === 'image_left' && (
        <div className="h-full flex gap-12 flex-row-reverse p-12">
          <div className="flex-1 flex flex-col justify-center">
            <h2 className="text-4xl font-bold text-neutral-900 mb-8">
              {slide.title}
            </h2>
            <div className="prose text-neutral-600">
              <ReactMarkdown>{slide.content}</ReactMarkdown>
            </div>
          </div>
          <div className="flex-1 bg-neutral-100 rounded-lg overflow-hidden flex items-center justify-center">
            {slide.image_url ? (
              <img src={slide.image_url} alt="slide visual" className="w-full h-full object-cover" />
            ) : (
              <div className="text-neutral-300 flex flex-col items-center">
                <ImageIcon className="w-12 h-12 mb-2" />
                <span className="text-sm font-medium">Image Placeholder</span>
              </div>
            )}
          </div>
        </div>
      )}

      {slide.layout_type === 'grid' && (
        <div className="h-full flex flex-col p-12">
          <h2 className="text-3xl font-bold text-neutral-900 mb-8 text-center">
            {slide.title}
          </h2>
          <div className="flex-1 grid grid-cols-2 gap-6">
            <div className="bg-neutral-50 p-6 rounded-lg border border-neutral-100">
              <div className="prose prose-sm"><ReactMarkdown>{slide.content.split('\n\n')[0] || ''}</ReactMarkdown></div>
            </div>
            <div className="bg-neutral-50 p-6 rounded-lg border border-neutral-100">
              <div className="prose prose-sm"><ReactMarkdown>{slide.content.split('\n\n')[1] || ''}</ReactMarkdown></div>
            </div>
            <div className="bg-neutral-50 p-6 rounded-lg border border-neutral-100">
              <div className="prose prose-sm"><ReactMarkdown>{slide.content.split('\n\n')[2] || ''}</ReactMarkdown></div>
            </div>
            <div className="bg-neutral-50 p-6 rounded-lg border border-neutral-100 flex items-center justify-center text-neutral-300">
              <ImageIcon className="w-8 h-8" />
            </div>
          </div>
        </div>
      )}

      {slide.layout_type === 'swot' && (
        <div className="h-full flex flex-col p-12">
          <h2 className="text-3xl font-bold text-neutral-900 mb-6 text-center">
            {slide.title}
          </h2>
          <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-4">
            <div className="bg-blue-50 p-6 rounded-xl flex flex-col">
              <span className="text-blue-500 font-bold mb-2">STRENGTH</span>
              <div className="text-sm text-neutral-700 flex-1"><ReactMarkdown>{slide.content}</ReactMarkdown></div>
            </div>
            <div className="bg-red-50 p-6 rounded-xl flex flex-col">
              <span className="text-red-500 font-bold mb-2">WEAKNESS</span>
              <div className="text-sm text-neutral-700">- ...</div>
            </div>
            <div className="bg-green-50 p-6 rounded-xl flex flex-col">
              <span className="text-green-500 font-bold mb-2">OPPORTUNITY</span>
              <div className="text-sm text-neutral-700">- ...</div>
            </div>
            <div className="bg-orange-50 p-6 rounded-xl flex flex-col">
              <span className="text-orange-500 font-bold mb-2">THREAT</span>
              <div className="text-sm text-neutral-700">- ...</div>
            </div>
          </div>
        </div>
      )}

      {slide.layout_type === 'big_number' && (
        <div className="h-full flex flex-col items-center justify-center text-center p-12">
          <h2 className="text-2xl font-bold text-neutral-400 mb-8 uppercase tracking-widest">
            {slide.title}
          </h2>
          <div className="text-8xl font-black text-blue-600 mb-6 tracking-tight">
            {slide.content.split('\n')[0] || '0%'}
          </div>
          <div className="text-xl text-neutral-600 max-w-xl leading-relaxed">
            <ReactMarkdown>{slide.content.split('\n').slice(1).join('\n') || ''}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}
