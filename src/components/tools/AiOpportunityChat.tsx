"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";  // Keep using Textarea for chat input consistency
import { Loader2, Send, Bot, User, Search, ExternalLink, Building, Calendar, MapPin, Newspaper, Lightbulb, PenTool, Hash } from "lucide-react";
import { motion } from "framer-motion";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  type?: 'text' | 'result-list';
  data?: any[];
}

interface AiOpportunityChatProps {
  category: 'job' | 'trend' | 'recipe' | 'tool';
}

export function AiOpportunityChat({ category }: AiOpportunityChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Reset messages when category changes
    const initialMessages: Record<string, string> = {
        'job': "안녕하세요! AI 관련 채용 정보나 알바, 공모전 정보를 찾아드릴까요? \n찾으시는 직무나 키워드를 말씀해주세요. (예: 프롬프트 엔지니어, 데이터 라벨링)",
        'trend': "최신 AI 기술 트렌드와 뉴스를 요약해드립니다. \n궁금한 주제가 있으신가요? (예: Sora, LLM, 생성형 AI)",
        'recipe': "이미지 생성 프롬프트나 워크플로우를 찾아드릴게요. \n원하는 스타일이나 도구를 알려주세요. (예: 미드저니, 스테이블 디퓨전, 사이버펑크 스타일)",
        'tool': "작업에 필요한 AI 도구를 추천해드립니다. \n어떤 작업을 하고 싶으신가요? (예: 배경 제거, 목소리 변조, 영상 편집)"
    };

    setMessages([
        { 
            id: 'welcome', 
            role: 'assistant', 
            content: initialMessages[category] || "무엇을 도와드릴까요?" 
        }
    ]);
  }, [category]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    // Simulate Network / Search Display
    setTimeout(() => {
        // Mock Result Generation based on Category
        const mockResults = generateMockResults(category, input);
        
        const responseMsg: Message = {
            id: (Date.now()+1).toString(),
            role: 'assistant',
            content: `"${input}"에 대한 ${getCategoryName(category)} 검색 결과입니다.`,
            type: 'result-list',
            data: mockResults
        };

        setMessages(prev => [...prev, responseMsg]);
        setIsLoading(false);
    }, 1500);
  };

  const getCategoryName = (cat: string) => {
      if(cat === 'job') return '채용 정보';
      if(cat === 'trend') return '트렌드';
      if(cat === 'recipe') return '레시피';
      if(cat === 'tool') return '도구';
      return '정보';
  }

  return (
    <div className="flex flex-col h-full bg-white relative">
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 bg-gray-50/30">
        {messages.map((m) => (
            <div key={m.id} className={`flex gap-4 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.role === 'assistant' && (
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 border border-indigo-200 shadow-sm mt-1">
                        <Bot className="w-6 h-6 text-indigo-600" />
                    </div>
                )}
                
                <div className={`flex flex-col gap-2 max-w-[85%] md:max-w-[75%] ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                    {/* Text Bubble */}
                    {m.content && (
                         <div className={`p-4 rounded-2xl text-sm md:text-base shadow-sm leading-relaxed whitespace-pre-wrap ${
                            m.role === 'user' 
                            ? 'bg-gradient-to-br from-indigo-600 to-blue-600 text-white rounded-tr-none shadow-md' 
                            : 'bg-white border border-gray-200/80 text-gray-800 rounded-tl-none'
                        }`}>
                            {m.content}
                        </div>
                    )}

                    {/* Result Cards */}
                    {m.type === 'result-list' && m.data && (
                        <div className="w-full grid gap-3 mt-2">
                            {m.data.map((item, idx) => (
                                <ResultCard key={idx} category={category} item={item} />
                            ))}
                        </div>
                    )}
                </div>

                {m.role === 'user' && (
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center shrink-0 border border-gray-300 mt-1">
                        <User className="w-6 h-6 text-gray-600" />
                    </div>
                )}
            </div>
        ))}

        {isLoading && (
            <div className="flex gap-4 justify-start">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 border border-indigo-200">
                    <Bot className="w-6 h-6 text-indigo-600" />
                </div>
                <div className="p-4 rounded-2xl bg-white border border-gray-200 text-gray-500 rounded-tl-none flex items-center gap-2 shadow-sm">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="animate-pulse">정보를 찾고 있습니다...</span>
                </div>
            </div>
        )}
        <div ref={messagesEndRef} className="h-4" />
      </div>

      <div className="p-4 md:p-6 bg-white border-t border-gray-200 shrink-0 shadow-[0_-5px_20px_-10px_rgba(0,0,0,0.05)]">
        <div className="max-w-4xl mx-auto flex gap-3 items-end">
            <Textarea 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                    if(e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                    }
                }}
                placeholder="검색어나 질문을 입력하세요..."
                className="min-h-[56px] max-h-[120px] resize-none border-gray-300 focus:border-indigo-600 focus:ring-indigo-200 bg-gray-50/50 p-3.5 text-base rounded-xl"
            />
            <div className="flex flex-col gap-2 shrink-0">
                <Button 
                    onClick={handleSendMessage} 
                    disabled={!input.trim() || isLoading}
                    className="h-[56px] w-[56px] rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-lg hover:shadow-xl transition-all active:scale-95"
                >
                    <Send className="w-5 h-5 ml-0.5" />
                </Button>
            </div>
        </div>
      </div>
    </div>
  );
}

function ResultCard({ category, item }: { category: string, item: any }) {
    if (category === 'job') {
        return (
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2">
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs font-bold rounded-md">{item.type || "채용"}</span>
                    <span className="text-gray-400 text-xs">{item.date}</span>
                </div>
                <h4 className="font-bold text-gray-900 mb-1">{item.title}</h4>
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                    <Building className="w-3.5 h-3.5" /> {item.company}
                    <span className="w-px h-2 bg-gray-300 mx-1"></span>
                    <MapPin className="w-3.5 h-3.5" /> {item.location}
                </div>
                <div className="flex gap-2 mb-3 max-w-full overflow-hidden">
                    {item.tags?.map((t: string, i: number) => (
                        <span key={i} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full whitespace-nowrap">{t}</span>
                    ))}
                </div>
                <Button variant="outline" size="sm" className="w-full text-indigo-600 border-indigo-100 hover:bg-indigo-50" asChild>
                    <a href="#" target="_blank">상세 보기 <ExternalLink className="w-3 h-3 ml-1" /></a>
                </Button>
            </div>
        )
    }
    if (category === 'trend') {
        return (
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-2">
                    <Newspaper className="w-4 h-4 text-purple-500" />
                    <span className="text-xs font-bold text-purple-600">AI 트렌드</span>
                </div>
                <h4 className="font-bold text-gray-900 mb-2">{item.title}</h4>
                <p className="text-sm text-gray-600 line-clamp-2 mb-3">{item.summary}</p>
                <div className="flex justify-between items-center text-xs text-gray-400">
                    <span>{item.source} · {item.date}</span>
                    <a href="#" className="flex items-center text-indigo-600 hover:underline">원문 <ExternalLink className="w-3 h-3 ml-1" /></a>
                </div>
            </div>
        )
    }
    if (category === 'recipe') {
        return (
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex gap-4">
                <div className="w-20 h-20 bg-gray-100 rounded-lg shrink-0 overflow-hidden">
                     {/* Placeholder for image */}
                    <div className="w-full h-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
                        <Lightbulb className="w-8 h-8 text-amber-500/50" />
                    </div>
                </div>
                <div className="flex-1 min-w-0">
                     <h4 className="font-bold text-gray-900 mb-1 truncate">{item.title}</h4>
                     <p className="text-xs text-gray-500 mb-2 truncate">{item.model}</p>
                     <div className="flex gap-1 mb-2">
                         {item.tags?.slice(0, 2).map((t:string,i:number) => (
                             <span key={i} className="px-1.5 py-0.5 bg-amber-50 text-amber-700 text-[10px] rounded-md">{t}</span>
                         ))}
                     </div>
                     <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-gray-500 hover:text-amber-600">
                         프롬프트 복사
                     </Button>
                </div>
            </div>
        )
    }
    // Tool
    return (
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
             <div className="flex items-start gap-3">
                 <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center shrink-0 text-2xl">
                     {item.icon || "🛠️"}
                 </div>
                 <div className="flex-1">
                     <h4 className="font-bold text-gray-900">{item.name}</h4>
                     <p className="text-xs text-blue-600 font-medium mb-1">{item.category}</p>
                     <p className="text-sm text-gray-600 line-clamp-2 mb-2">{item.desc}</p>
                     <div className="flex gap-2">
                         <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">Free</span>
                         <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">Web</span>
                     </div>
                 </div>
             </div>
        </div>
    )
}

function generateMockResults(category: string, query: string) {
    if (category === 'job') {
        return [
            { type: '채용', title: 'Generative AI Prompt Engineer', company: 'TechCorp', location: '서울 강남구', date: '마감임박', tags: ['Python', 'LLM', 'Creative'] },
            { type: '해커톤', title: '제 5회 AI 융합 아이디어 해커톤', company: 'AI협회', location: '온라인', date: 'D-3', tags: ['상금1000만', '대학생'] },
            { type: '채용', title: 'AI 서비스 기획자 (Junior)', company: 'StartUp A', location: '판교', date: '상시채용', tags: ['PM', 'UX'] }
        ];
    }
    if (category === 'trend') {
        return [
            { title: 'OpenAI, 새로운 모델 GPT-5 출시 예고?', summary: '최근 루머에 따르면 차세대 모델의 추론 능력이 비약적으로 상승했다고 합니다.', source: 'TechCrunch', date: '2시간 전' },
            { title: '생성형 AI, 저작권 문제의 새로운 국면', summary: '주요 아티스트들이 AI 기업을 상대로 제기한 소송의 첫 판결이 나왔습니다.', source: 'TheVerge', date: '어제' },
        ];
    }
    if (category === 'recipe') {
        return [
            { title: 'Cyberpunk Neon City', model: 'Midjourney v6', tags: ['Neon', 'Sci-fi', 'Cityscape'] },
            { title: 'Watercolor Portrait', model: 'Stable Diffusion XL', tags: ['Artistic', 'Soft', 'Portrait'] },
        ];
    }
    return [
        { name: 'Remove.bg', category: 'Image Editing', desc: '이미지 배경을 5초 만에 자동으로 제거해주는 AI 도구입니다.', icon: '🖼️' },
        { name: 'Gamma', category: 'Presentation', desc: '텍스트만 입력하면 아름다운 PPT 슬라이드를 만들어줍니다.', icon: '📊' },
        { name: 'Vrew', category: 'Video Editing', desc: '영상 자막 자동 생성 및 AI 컷 편집을 지원하는 에디터.', icon: '🎬' },
    ];
}
