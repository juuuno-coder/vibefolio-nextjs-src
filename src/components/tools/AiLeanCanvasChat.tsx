"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Wand2, Send, Bot, User, Grid } from "lucide-react";
import { toast } from "sonner";
import { LeanCanvasData } from "../LeanCanvasModal";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface AiLeanCanvasChatProps {
  onGenerate: (data: LeanCanvasData) => void;
}

const defaultData: LeanCanvasData = {
  problem: "",
  customerSegments: "",
  uniqueValueProposition: "",
  solution: "",
  channels: "",
  revenueStreams: "",
  costStructure: "",
  keyMetrics: "",
  unfairAdvantage: "",
};

export function AiLeanCanvasChat({ onGenerate }: AiLeanCanvasChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    { 
        id: 'welcome', 
        role: 'assistant', 
        content: "안녕하세요! AI 비즈니스 코치입니다. 🤖\n구상하고 계신 아이디어나 사업 아이템에 대해 편하게 말씀해 주세요. 제가 질문을 드리며 린 캔버스를 완성을 도와드릴게요." 
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (!input.trim()) return;
    
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    // Mock AI Response
    setTimeout(() => {
        const responses = [
            "흥미로운 아이디어네요! 그렇다면 이 서비스가 해결하고자 하는 가장 큰 '문제'는 무엇이라고 생각하시나요?",
            "좋습니다. 이 서비스를 가장 필요로 할 '핵심 고객군'은 누구일까요?",
            "그렇군요. 경쟁사 대비 우리만의 '압도적인 경쟁 우위'는 어떤 것이 있을까요?",
            "수익 모델은 어떻게 계획하고 계신가요? 구독? 판매? 광고?"
        ];
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        
        setMessages(prev => [...prev, { 
            id: (Date.now()+1).toString(), 
            role: 'assistant', 
            content: messages.length < 3 ? randomResponse : "충분한 정보를 얻었습니다! 이제 '결과물 생성' 버튼을 눌러 린 캔버스를 확인해보세요." 
        }]);
        setIsLoading(false);
    }, 1000);
  };

  const handleCreateCanvas = () => {
    setIsLoading(true);
    // Mock Generation based on chat
    setTimeout(() => {
      const topic = messages.find(m => m.role === 'user')?.content || "My Project";
      
      const generatedData: LeanCanvasData = {
        problem: `1. 기존 솔루션의 비효율성\n2. 사용자 경험 저하\n3. 높은 진입 장벽`,
        customerSegments: `1. 20-30대 얼리어답터\n2. ${topic}에 관심있는 크리에이터\n3. 효율성을 중시하는 전문가`,
        uniqueValueProposition: `"${topic}"을(를) 통해\n더 빠르고 직관적인 경험 제공.\n복잡한 과정을 원클릭으로 해결.`,
        solution: `1. AI 기반 자동화 엔진\n2. 직관적인 UI/UX 대시보드\n3. 실시간 협업 기능`,
        channels: `1. 소셜 미디어 (Instagram, LinkedIn)\n2. 콘텐츠 마케팅 (블로그)\n3. 베타 테스터 커뮤니티`,
        revenueStreams: `1. 구독 모델 (SaaS)\n2. 프리미엄 기능 인앱 결제\n3. 엔터프라이즈 라이선스`,
        costStructure: `1. 서버 및 API 비용\n2. 개발 및 유지보수 인건비\n3. 마케팅 집행비`,
        keyMetrics: `1. 월간 활성 사용자(MAU)\n2. 유료 전환율\n3. 고객 유지율(Retention)`,
        unfairAdvantage: `1. 독자적인 AI 알고리즘\n2. 강력한 초기 커뮤니티\n3. 특허 출원 기술`,
      };
      
      setIsLoading(false);
      toast.success("린 캔버스가 생성되었습니다! 결과물을 확인해보세요.");
      onGenerate(generatedData);
    }, 1500);
  };

  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* Header Area */}
      <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white/50 backdrop-blur-sm sticky top-0 z-10">
        <div>
            <h2 className="text-xl font-black text-gray-900 flex items-center gap-2 mb-1">
                <Grid className="mb-0.5 w-6 h-6 text-purple-600"/> 
                AI 린 캔버스
            </h2>
            <p className="text-sm text-gray-500 pl-8">
                AI와 대화하며 비즈니스 아이디어를 구체화하고 린 캔버스를 자동으로 생성하세요.
            </p>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 bg-gray-50/30">
        {messages.map((m) => (
            <div key={m.id} className={`flex gap-4 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.role === 'assistant' && (
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center shrink-0 border border-purple-200 shadow-sm">
                        <Bot className="w-6 h-6 text-purple-600" />
                    </div>
                )}
                <div className={`p-4 rounded-2xl max-w-[80%] md:max-w-[70%] text-sm md:text-base shadow-sm leading-relaxed whitespace-pre-wrap animate-in fade-in slide-in-from-bottom-2 duration-300 ${
                    m.role === 'user' 
                    ? 'bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-tr-none shadow-md' 
                    : 'bg-white border border-gray-200/80 text-gray-800 rounded-tl-none'
                }`}>
                    {m.content}
                </div>
                {m.role === 'user' && (
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center shrink-0 border border-gray-300">
                        <User className="w-6 h-6 text-gray-600" />
                    </div>
                )}
            </div>
        ))}
        {isLoading && (
            <div className="flex gap-4 justify-start">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center shrink-0 border border-purple-200">
                    <Bot className="w-6 h-6 text-purple-600" />
                </div>
                <div className="p-4 rounded-2xl bg-white border border-gray-200 text-gray-500 rounded-tl-none flex items-center gap-2 shadow-sm">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="animate-pulse">분석 중입니다...</span>
                </div>
            </div>
        )}
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* Input Area */}
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
                placeholder="아이디어를 자유롭게 설명해주세요... (Shift+Enter로 줄바꿈)"
                className="min-h-[56px] max-h-[120px] resize-none border-gray-300 focus:border-purple-600 focus:ring-purple-200 bg-gray-50/50 p-3.5 text-base rounded-xl"
            />
            <div className="flex flex-col gap-2 shrink-0">
                <Button 
                    onClick={handleSendMessage} 
                    disabled={!input.trim() || isLoading}
                    className="h-[56px] w-[56px] rounded-xl bg-purple-600 hover:bg-purple-700 shadow-lg hover:shadow-xl transition-all active:scale-95"
                >
                    <Send className="w-5 h-5 ml-0.5" />
                </Button>
            </div>
        </div>
        <div className="max-w-4xl mx-auto mt-3 flex justify-end">
            <Button 
                variant="outline" 
                size="sm" 
                onClick={handleCreateCanvas}
                disabled={isLoading || messages.length < 2} // Require at least some conversation
                className="text-purple-700 border-purple-200 hover:bg-purple-50 gap-2 font-semibold shadow-sm"
            >
                <Wand2 className="w-4 h-4" />
                현재 대화로 린 캔버스 결과물 열기
            </Button>
        </div>
      </div>
    </div>
  );
}
