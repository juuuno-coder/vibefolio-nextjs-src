"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Wand2, Send, Bot, User, UserCircle2 } from "lucide-react";
import { toast } from "sonner";
import { PersonaData } from "../PersonaDefinitionModal";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface AiPersonaChatProps {
  onGenerate: (data: PersonaData) => void;
}

export function AiPersonaChat({ onGenerate }: AiPersonaChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    { 
        id: 'welcome', 
        role: 'assistant', 
        content: "안녕하세요! 서비스의 타겟 고객을 정의해드릴게요. 👥\n어떤 서비스를 기획 중이신가요? 또는 생각하고 계신 핵심 고객층이 있다면 알려주세요." 
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (!input.trim()) return;
    
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    setTimeout(() => {
        const responses = [
            "그렇군요. 그 고객들이 현재 가장 불편해하는 점(Pain Point)은 무엇일까요?",
            "그들의 주된 목표나 욕망은 무엇이라고 생각하시나요?",
            "사용자의 연령대나 직업군은 어떻게 분포되어 있을까요?",
            "그들이 주로 사용하는 SNS나 정보 습득 채널은 어디일까요?"
        ];
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        
        setMessages(prev => [...prev, { 
            id: (Date.now()+1).toString(), 
            role: 'assistant', 
            content: messages.length < 3 ? randomResponse : "충분한 정보가 모였습니다! 이제 '페르소나 생성' 버튼을 눌러 구체적인 고객 프로필을 확인해보세요." 
        }]);
        setIsLoading(false);
    }, 1000);
  };

  const handleGenerate = () => {
    setIsLoading(true);
    setTimeout(() => {
      // Mock Data matching PersonaDefinitionModal structure
      const data: PersonaData = {
        demographics: "이름: 김서연\n나이: 28세\n직업: 프리랜서 디자이너\n거주지: 서울 마포구",
        bio: "수도권에 거주하며 트렌드에 민감한 디지털 노마드. 효율적인 업무 도구와 자기계발에 관심이 많음.",
        goals: "안정적인 클라이언트 확보, 퍼스널 브랜딩 강화, 워라밸 유지",
        frustrations: "불규칙한 수입, 네트워킹의 어려움, 업무와 생활의 분리",
        motivations: "성장, 인정, 자율성",
        personality: "창의적, 독립적, 꼼꼼함",
        techSavviness: "높음 (다양한 SaaS 도구 활용 능숙)",
        preferredChannels: "Instagram, LinkedIn, 각종 커뮤니티(브런치 등)"
      };
      
      setIsLoading(false);
      onGenerate(data);
      toast.success("고객 페르소나가 생성되었습니다!");
    }, 1500);
  };

  return (
    <div className="flex flex-col h-full bg-white relative">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white/50 backdrop-blur-sm sticky top-0 z-10">
        <div>
            <h2 className="text-xl font-black text-gray-900 flex items-center gap-2 mb-1">
                <UserCircle2 className="mb-0.5 w-6 h-6 text-blue-600"/> 
                AI 페르소나 정의
            </h2>
            <p className="text-sm text-gray-500 pl-8">
                타겟 고객의 특성을 대화로 파악하고 구체적인 페르소나를 생성합니다.
            </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 bg-gray-50/30">
        {messages.map((m) => (
            <div key={m.id} className={`flex gap-4 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.role === 'assistant' && (
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0 border border-blue-200 shadow-sm">
                        <Bot className="w-6 h-6 text-blue-600" />
                    </div>
                )}
                <div className={`p-4 rounded-2xl max-w-[80%] md:max-w-[70%] text-sm md:text-base shadow-sm leading-relaxed whitespace-pre-wrap animate-in fade-in slide-in-from-bottom-2 duration-300 ${
                    m.role === 'user' 
                    ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-tr-none shadow-md' 
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
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0 border border-blue-200">
                    <Bot className="w-6 h-6 text-blue-600" />
                </div>
                <div className="p-4 rounded-2xl bg-white border border-gray-200 text-gray-500 rounded-tl-none flex items-center gap-2 shadow-sm">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="animate-pulse">분석 중입니다...</span>
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
                placeholder="답변을 입력해주세요..."
                className="min-h-[56px] max-h-[120px] resize-none border-gray-300 focus:border-blue-600 focus:ring-blue-200 bg-gray-50/50 p-3.5 text-base rounded-xl"
            />
            <div className="flex flex-col gap-2 shrink-0">
                <Button 
                    onClick={handleSendMessage} 
                    disabled={!input.trim() || isLoading}
                    className="h-[56px] w-[56px] rounded-xl bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all active:scale-95"
                >
                    <Send className="w-5 h-5 ml-0.5" />
                </Button>
            </div>
        </div>
        <div className="max-w-4xl mx-auto mt-3 flex justify-end">
            <Button 
                variant="outline" 
                size="sm" 
                onClick={handleGenerate}
                disabled={isLoading || messages.length < 2}
                className="text-blue-700 border-blue-200 hover:bg-blue-50 gap-2 font-semibold shadow-sm"
            >
                <Wand2 className="w-4 h-4" />
                대화 내용을 바탕으로 페르소나 생성
            </Button>
        </div>
      </div>
    </div>
  );
}
