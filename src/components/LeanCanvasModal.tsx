"use client";

import React, { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input"; // Chat uses Textarea or Input
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Wand2, Check, Bot, Send, User, MessageSquare, ArrowLeft, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface LeanCanvasModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply?: (content: string) => void;
  onSave?: (data: LeanCanvasData) => void;
  initialData?: Partial<LeanCanvasData>;
}

export interface LeanCanvasData {
  problem: string;
  customerSegments: string;
  uniqueValueProposition: string;
  solution: string;
  channels: string;
  revenueStreams: string;
  costStructure: string;
  keyMetrics: string;
  unfairAdvantage: string;
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

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export function LeanCanvasModal({ open, onOpenChange, onApply, onSave, initialData }: LeanCanvasModalProps) {
  const [step, setStep] = useState<'chat' | 'result'>('chat');
  const [isLoading, setIsLoading] = useState(false);
  const [canvasData, setCanvasData] = useState<LeanCanvasData>(defaultData);
  
  // Chat States
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize
  useEffect(() => {
    if (open) {
        if (initialData && Object.values(initialData).some(v => v)) {
            // If there's existing data, show result immediately
            setCanvasData({ ...defaultData, ...initialData });
            setStep('result');
        } else {
            // New session
            setStep('chat');
            setMessages([
                { 
                    id: 'welcome', 
                    role: 'assistant', 
                    content: "안녕하세요! AI 비즈니스 코치입니다. 🤖\n구상하고 계신 아이디어나 사업 아이템에 대해 편하게 말씀해 주세요. 제가 질문을 드리며 린 캔버스를 완성을 도와드릴게요." 
                }
            ]);
            setCanvasData(defaultData);
        }
    }
  }, [open, initialData]);

  // Auto-scroll chat
  useEffect(() => {
      if (step === 'chat') {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }
  }, [messages, step]);

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
      // In a real app, we would send messages to LLM here
      const topic = messages.find(m => m.role === 'user')?.content || "My Project";
      
      setCanvasData({
        problem: `1. 기존 솔루션의 비효율성\n2. 사용자 경험 저하\n3. 높은 진입 장벽`,
        customerSegments: `1. 20-30대 얼리어답터\n2. ${topic}에 관심있는 크리에이터\n3. 효율성을 중시하는 전문가`,
        uniqueValueProposition: `"${topic}"을(를) 통해\n더 빠르고 직관적인 경험 제공.\n복잡한 과정을 원클릭으로 해결.`,
        solution: `1. AI 기반 자동화 엔진\n2. 직관적인 UI/UX 대시보드\n3. 실시간 협업 기능`,
        channels: `1. 소셜 미디어 (Instagram, LinkedIn)\n2. 콘텐츠 마케팅 (블로그)\n3. 베타 테스터 커뮤니티`,
        revenueStreams: `1. 구독 모델 (SaaS)\n2. 프리미엄 기능 인앱 결제\n3. 엔터프라이즈 라이선스`,
        costStructure: `1. 서버 및 API 비용\n2. 개발 및 유지보수 인건비\n3. 마케팅 집행비`,
        keyMetrics: `1. 월간 활성 사용자(MAU)\n2. 유료 전환율\n3. 고객 유지율(Retention)`,
        unfairAdvantage: `1. 독자적인 AI 알고리즘\n2. 강력한 초기 커뮤니티\n3. 특허 출원 기술`,
      });
      
      setIsLoading(false);
      setStep('result');
      toast.success("린 캔버스가 생성되었습니다!");
    }, 1500);
  };

  const handleChange = (key: keyof LeanCanvasData, value: string) => {
    setCanvasData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
      if (onSave) {
          onSave(canvasData);
          toast.success("저장되었습니다.");
          onOpenChange(false);
      }
  };

  const handleApplyToProject = () => {
    if (!onApply) return;
    const formattedContent = `
## 📊 프로젝트 린 캔버스 (Lean Canvas)

### 1. 문제 (Problem)
${canvasData.problem}

### 2. 고객군 (Customer Segments)
${canvasData.customerSegments}

### 3. 고유 가치 제안 (Unique Value Proposition)
${canvasData.uniqueValueProposition}

### 4. 솔루션 (Solution)
${canvasData.solution}

### 5. 경쟁 우위 (Unfair Advantage)
${canvasData.unfairAdvantage}

### 6. 채널 (Channels)
${canvasData.channels}

### 7. 핵심 지표 (Key Metrics)
${canvasData.keyMetrics}

### 8. 비용 구조 (Cost Structure)
${canvasData.costStructure}

### 9. 수익원 (Revenue Streams)
${canvasData.revenueStreams}
    `.trim();

    onApply(formattedContent);
    onOpenChange(false);
    toast.success("프로젝트 설명에 적용되었습니다.");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-[1400px] h-[90vh] flex flex-col p-0 overflow-hidden bg-gray-50/95 backdrop-blur-sm">
        <DialogHeader className="px-6 py-4 bg-white border-b border-gray-200 flex flex-row items-center justify-between shrink-0">
          <div className="flex flex-col gap-1">
             <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <Wand2 className="w-5 h-5 text-purple-600" />
                AI 린 캔버스 생성기
             </DialogTitle>
             <p className="text-sm text-gray-500">
                 {step === 'chat' ? "AI와 대화하며 비즈니스 아이디어를 구체화해보세요." : "생성된 린 캔버스를 확인하고 수정할 수 있습니다."}
             </p>
          </div>
          {step === 'result' && (
              <Button variant="ghost" size="sm" onClick={() => setStep('chat')} className="text-gray-500 gap-1">
                  <MessageSquare className="w-4 h-4" /> 채팅으로 돌아가기
              </Button>
          )}
        </DialogHeader>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden relative flex flex-col">
            {step === 'chat' ? (
                // Chat View
                <>
                    <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
                        {messages.map((m) => (
                            <div key={m.id} className={`flex gap-4 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                {m.role === 'assistant' && (
                                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                                        <Bot className="w-6 h-6 text-purple-600" />
                                    </div>
                                )}
                                <div className={`p-4 rounded-2xl max-w-[80%] md:max-w-[70%] text-sm md:text-base shadow-sm leading-relaxed whitespace-pre-wrap ${
                                    m.role === 'user' 
                                    ? 'bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-tr-none' 
                                    : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none'
                                }`}>
                                    {m.content}
                                </div>
                                {m.role === 'user' && (
                                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                                        <User className="w-6 h-6 text-gray-500" />
                                    </div>
                                )}
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex gap-4 justify-start">
                                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                                    <Bot className="w-6 h-6 text-purple-600" />
                                </div>
                                <div className="p-4 rounded-2xl bg-white border border-gray-100 text-gray-500 rounded-tl-none flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    생각 중입니다...
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} className="h-4" />
                    </div>

                    {/* Chat Input Area */}
                    <div className="p-4 md:p-6 bg-white border-t border-gray-200 shrink-0">
                        <div className="max-w-4xl mx-auto flex gap-4 items-end">
                            <Textarea 
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if(e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendMessage();
                                    }
                                }}
                                placeholder="아이디어를 자유롭게 설명해주세요..."
                                className="min-h-[60px] max-h-[120px] resize-none border-gray-200 focus:border-purple-500 focus:ring-purple-500 p-4"
                            />
                            <div className="flex flex-col gap-2 shrink-0">
                                <Button 
                                    onClick={handleSendMessage} 
                                    disabled={!input.trim() || isLoading}
                                    className="h-[60px] w-[60px] rounded-xl bg-purple-600 hover:bg-purple-700"
                                >
                                    <Send className="w-5 h-5" />
                                </Button>
                            </div>
                        </div>
                        <div className="max-w-4xl mx-auto mt-3 flex justify-end">
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={handleCreateCanvas}
                                disabled={isLoading}
                                className="text-purple-600 border-purple-200 hover:bg-purple-50 gap-2"
                            >
                                <Wand2 className="w-4 h-4" />
                                현재 대화로 린 캔버스 생성하기
                            </Button>
                        </div>
                    </div>
                </>
            ) : (
                // Result View (Grid)
                <div className="flex-1 overflow-y-auto p-6 scrollbar-thin bg-gray-50">
                    <div className="bg-white border border-black shadow-xl mx-auto max-w-[1300px]" style={{ minHeight: '600px' }}>
                        {/* Grid implementation same as before */}
                        <div className="grid grid-cols-1 md:grid-cols-10 border-b-0 min-h-[600px]">
                            {/* 1. Problem */}
                            <div className="md:col-span-2 md:row-span-2 border-r border-b border-gray-200 md:border-black flex flex-col">
                                <CanvasHeader number="1" title="Problem" subtitle="고객의 문제" icon="🔥" />
                                <CanvasBody value={canvasData.problem} onChange={(v) => handleChange("problem", v)} />
                            </div>
                            
                            {/* 4. Solution */}
                            <div className="md:col-span-2 md:row-span-1 border-r border-b border-gray-200 md:border-black flex flex-col">
                                <CanvasHeader number="4" title="Solution" subtitle="해결책" icon="💡" />
                                <CanvasBody value={canvasData.solution} onChange={(v) => handleChange("solution", v)} />
                            </div>

                            {/* 3. UVP */}
                            <div className="md:col-span-2 md:row-span-2 border-r border-b border-gray-200 md:border-black flex flex-col bg-purple-50/30">
                                <CanvasHeader number="3" title="Value Prop" subtitle="가치 제안" icon="💎" className="text-purple-700" />
                                <CanvasBody value={canvasData.uniqueValueProposition} onChange={(v) => handleChange("uniqueValueProposition", v)} className="text-center font-medium" />
                            </div>

                            {/* 9. Advantage */}
                            <div className="md:col-span-2 md:row-span-1 border-r border-b border-gray-200 md:border-black flex flex-col">
                                <CanvasHeader number="9" title="Advantage" subtitle="경쟁 우위" icon="🛡️" />
                                <CanvasBody value={canvasData.unfairAdvantage} onChange={(v) => handleChange("unfairAdvantage", v)} />
                            </div>

                            {/* 2. Segments */}
                            <div className="md:col-span-2 md:row-span-2 border-b border-gray-200 md:border-black flex flex-col">
                                <CanvasHeader number="2" title="Segments" subtitle="고객군" icon="🎯" />
                                <CanvasBody value={canvasData.customerSegments} onChange={(v) => handleChange("customerSegments", v)} />
                            </div>

                            {/* 8. Key Metrics */}
                            <div className="md:col-start-3 md:col-end-5 md:row-start-2 border-r border-b border-gray-200 md:border-black flex flex-col">
                                <CanvasHeader number="8" title="Metrics" subtitle="핵심 지표" icon="📊" />
                                <CanvasBody value={canvasData.keyMetrics} onChange={(v) => handleChange("keyMetrics", v)} />
                            </div>

                            {/* 5. Channels */}
                            <div className="md:col-start-7 md:col-end-9 md:row-start-2 border-r border-b border-gray-200 md:border-black flex flex-col">
                                <CanvasHeader number="5" title="Channels" subtitle="유통 채널" icon="📢" />
                                <CanvasBody value={canvasData.channels} onChange={(v) => handleChange("channels", v)} />
                            </div>

                            {/* 7. Cost Structure */}
                            <div className="md:col-span-5 md:row-start-3 border-r md:border-r border-gray-200 md:border-black flex flex-col min-h-[150px]">
                                <CanvasHeader number="7" title="Cost Structure" subtitle="비용 구조" icon="💸" />
                                <CanvasBody value={canvasData.costStructure} onChange={(v) => handleChange("costStructure", v)} />
                            </div>

                            {/* 6. Revenue Streams */}
                            <div className="md:col-span-5 md:row-start-3 border-gray-200 md:border-black flex flex-col min-h-[150px]">
                                <CanvasHeader number="6" title="Revenue Streams" subtitle="수익원" icon="💰" className="text-green-700" />
                                <CanvasBody value={canvasData.revenueStreams} onChange={(v) => handleChange("revenueStreams", v)} className="text-green-900" />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>

        <div className="p-4 bg-white border-t border-gray-200 flex justify-end gap-3 z-10 shrink-0">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
                닫기
            </Button>
            {step === 'result' && (
                <>
                     {onSave && (
                        <Button onClick={handleSave} className="bg-black text-white hover:bg-gray-800 gap-2">
                            <Check className="w-4 h-4" />
                            저장하기
                        </Button>
                    )}
                    {onApply && (
                        <Button onClick={handleApplyToProject} className="bg-blue-600 text-white hover:bg-blue-700 gap-2">
                            <Check className="w-4 h-4" />
                            프로젝트에 적용하기
                        </Button>
                    )}
                </>
            )}
            {step === 'chat' && (
                 <Button onClick={handleCreateCanvas} className="bg-purple-600 hover:bg-purple-700 text-white gap-2">
                    <Wand2 className="w-4 h-4" />
                    결과물 바로 생성
                </Button>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CanvasHeader({ number, title, subtitle, icon, className }: { number: string, title: string, subtitle: string, icon: string, className?: string }) {
    return (
        <div className={`px-4 py-2 border-b border-gray-200/50 border-dashed flex justify-between items-center ${className} select-none`}>
           <div>
               <h4 className="font-extrabold text-xs uppercase tracking-wide flex items-center gap-2">
                   {title}
               </h4>
               <p className="text-[10px] text-gray-400 font-medium">{subtitle}</p>
           </div>
           <div className="flex items-center gap-2 opacity-50">
               <span className="text-sm grayscale">{icon}</span>
               <span className="text-[10px] font-black border border-current rounded-full w-4 h-4 flex items-center justify-center">{number}</span>
           </div>
        </div>
    )
}

function CanvasBody({ value, onChange, className }: { value: string, onChange: (v: string) => void, className?: string }) {
    return (
        <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={`flex-1 w-full h-full resize-none border-0 bg-transparent p-3 text-sm leading-relaxed focus-visible:ring-0 placeholder:text-gray-300 ${className}`}
            placeholder="..."
        />
    )
}
