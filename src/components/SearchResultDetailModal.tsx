"use client";

import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink, Calendar, MapPin, Building, Tag, X, Globe, Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface SearchResultDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: string;
  item: any;
}

export function SearchResultDetailModal({ open, onOpenChange, category, item }: SearchResultDetailModalProps) {
  if (!item) return null;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("클립보드에 복사되었습니다.");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-white p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2 mb-1">
            <span className={`px-2 py-0.5 text-xs font-bold rounded-md uppercase tracking-wider ${
                category === 'job' ? 'bg-blue-100 text-blue-700' :
                category === 'trend' ? 'bg-purple-100 text-purple-700' :
                category === 'recipe' ? 'bg-amber-100 text-amber-700' :
                'bg-gray-100 text-gray-700'
            }`}>
                {item.type || (category === 'job' ? '채용' : category === 'trend' ? '뉴스' : category === 'recipe' ? '프롬프트' : '도구')}
            </span>
            <span className="text-gray-400 text-xs ml-auto flex items-center gap-1">
                <Calendar className="w-3 h-3" /> {item.date || 'The Latest'}
            </span>
          </div>
          <DialogTitle className="text-xl md:text-2xl font-bold text-gray-900 leading-snug">
            {item.title || item.name}
          </DialogTitle>
          {item.company && (
              <DialogDescription className="flex items-center gap-2 text-gray-600 mt-1">
                  <Building className="w-4 h-4" /> {item.company}
                  {item.location && (
                      <>
                        <span className="text-gray-300">|</span>
                        <MapPin className="w-4 h-4" /> {item.location}
                      </>
                  )}
              </DialogDescription>
          )}
        </DialogHeader>

        <div className="p-6 max-h-[60vh] overflow-y-auto">
            {/* Content Section */}
            <div className="prose prose-sm max-w-none text-gray-600 leading-relaxed space-y-4">
                <p>{item.snippet || item.desc || item.summary || "상세 설명이 없습니다."}</p>
                
                {/* Mock Long Content for Demo Effect */}
                <p>
                    이 정보는 AI 에이전트가 수집한 요약 정보입니다. 실제 상세 내용은 원문 링크를 통해 확인하실 수 있습니다. 
                    관심 있는 항목이라면 아래 버튼을 통해 더 자세히 알아보거나 프로젝트에 참고해보세요.
                </p>

                {category === 'recipe' && (
                    <div className="bg-gray-100 p-4 rounded-xl border border-gray-200 font-mono text-sm text-gray-800 relative group">
                        {item.snippet || "/imagine prompt: ..."}
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleCopy(item.snippet)}
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white hover:bg-gray-200"
                        >
                            <Copy className="w-3.5 h-3.5" />
                        </Button>
                    </div>
                )}
            </div>

            {/* Tags */}
            {item.tags && item.tags.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-2">
                    {item.tags.map((tag: string, i: number) => (
                        <div key={i} className="px-3 py-1.5 bg-gray-100 text-gray-600 text-sm rounded-full flex items-center gap-1.5">
                            <HashIcon className="w-3 h-3 text-gray-400" />
                            {tag}
                        </div>
                    ))}
                </div>
            )}
        </div>

        <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
                닫기
            </Button>
            <Button 
                onClick={() => {
                    if (item.link && item.link !== '#') window.open(item.link, '_blank');
                    else toast.info("데모 링크입니다.");
                }} 
                className={`text-white gap-2 shadow-sm ${
                    category === 'job' ? 'bg-blue-600 hover:bg-blue-700' :
                    category === 'trend' ? 'bg-purple-600 hover:bg-purple-700' :
                    category === 'recipe' ? 'bg-amber-500 hover:bg-amber-600' :
                    'bg-gray-900 hover:bg-gray-800'
                }`}
            >
                <ExternalLink className="w-4 h-4" />
                원문 보러가기
            </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function HashIcon(props: any) {
    return (
        <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        >
        <line x1="4" x2="20" y1="9" y2="9" />
        <line x1="4" x2="20" y1="15" y2="15" />
        <line x1="10" x2="8" y1="3" y2="21" />
        <line x1="16" x2="14" y1="3" y2="21" />
        </svg>
    )
}
