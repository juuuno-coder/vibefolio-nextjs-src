"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Wand2, Send, Bot, User } from "lucide-react";
import { toast } from "sonner";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export interface AssistantData {
  type: string;
  content: string;
}

interface AiAssistantChatProps {
  onGenerate: (data: AssistantData) => void;
}

export function AiAssistantChat({ onGenerate }: AiAssistantChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    { 
        id: 'welcome', 
        role: 'assistant', 
        content: "안녕하세요! AI 콘텐츠 어시스턴트입니다. ✍️\n작성이 필요한 글의 종류(이메일, 제안서, 블로그 등)와 내용을 알려주시면 초안을 작성해드릴게요." 
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
        const res = await fetch('/api/ai/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: input,
                category: 'assistant'
            })
        });

        if (!res.ok) throw new Error("AI 응답을 가져오지 못했습니다.");
        const data = await res.json();
        
        setMessages(prev => [...prev, { 
            id: Date.now().toString(), 
            role: 'assistant', 
            content: data.answer || "죄송합니다. 오류가 발생했습니다."
        }]);
    } catch (e) {
        console.error(e);
        toast.error("AI와 연결하는 중 오류가 발생했습니다.");
    } finally {
        setIsLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (messages.length < 2) {
        toast.error("어떤 글을 작성할지 먼저 말씀해주세요.");
        return;
    }

    setIsLoading(true);
    try {
        const topic = messages
            .filter(m => m.role === 'user')
            .map(m => m.content)
            .join(' ');

        const res = await fetch('/api/ai/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'assistant', // Note: Need to support this in API
                topic: topic
            })
        });

        if (!res.ok) throw new Error("AI 생성에 실패했습니다.");
        const data = await res.json();
        
        onGenerate({ 
            type: 'text', 
            content: data.content || data.result || JSON.stringify(data, null, 2) 
        });
        toast.success("AI가 초안을 작성했습니다!");
    } catch (e: any) {
        console.error(e);
        toast.error(e.message || "오류가 발생했습니다.");
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white relative">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white/95 backdrop-blur-sm z-10 shrink-0">
        <div>
            <h2 className="text-xl font-black text-gray-900 flex items-center gap-2 mb-1">
                <Wand2 className="mb-0.5 w-6 h-6 text-purple-600"/> 
                AI 콘텐츠 어시스턴트
            </h2>
            <p className="text-sm text-gray-500 pl-8">
                작성 목적을 말하면 AI가 적절한 톤과 형식으로 글을 대신 써줍니다.
            </p>
        </div>
      </div>

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
                    ? 'bg-gradient-to-br from-purple-600 to-pink-600 text-white rounded-tr-none shadow-md' 
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
                    <span className="animate-pulse">글을 작성하고 있습니다...</span>
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
                placeholder="작성을 원하는 내용을 입력해주세요..."
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
                onClick={handleGenerate}
                disabled={isLoading || messages.length < 2}
                className="text-purple-700 border-purple-200 hover:bg-purple-50 gap-2 font-semibold shadow-sm"
            >
                <Wand2 className="w-4 h-4" />
                현재 대화로 초안 생성하기
            </Button>
        </div>
      </div>
    </div>
  );
}
