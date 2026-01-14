"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Wand2, Check } from "lucide-react";
import { toast } from "sonner";

interface LeanCanvasModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply?: (content: string) => void;
}

interface LeanCanvasData {
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

const initialData: LeanCanvasData = {
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

export function LeanCanvasModal({ open, onOpenChange, onApply }: LeanCanvasModalProps) {
  const [topic, setTopic] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [canvasData, setCanvasData] = useState<LeanCanvasData>(initialData);

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast.error("프로젝트 주제나 아이디어를 입력해주세요.");
      return;
    }

    setIsLoading(true);
    // Mockup Data
    setTimeout(() => {
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
      toast.success("린 캔버스가 생성되었습니다!");
    }, 1500);
  };

  const handleChange = (key: keyof LeanCanvasData, value: string) => {
    setCanvasData((prev) => ({ ...prev, [key]: value }));
  };

  const handleApplyToProject = () => {
    if (!onApply) return;
    
    // Markdown Format
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
             <p className="text-sm text-gray-500">아이디어를 입력하면 AI가 비즈니스 모델을 구조화해줍니다.</p>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          {/* Input Section */}
          <div className="flex gap-2 mb-8 max-w-2xl mx-auto">
            <Input
              placeholder="주제를 입력하세요 (예: 반려견을 위한 AI 음악 추천 앱)"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="h-12 text-lg shadow-sm bg-white"
              onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            />
            <Button 
                onClick={handleGenerate} 
                disabled={isLoading}
                className="h-12 px-6 bg-purple-600 hover:bg-purple-700 text-white font-bold gap-2 shadow-md transition-all hover:scale-105"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
              {isLoading ? "생성 중..." : "AI 생성"}
            </Button>
          </div>

          {/* Canvas Grid (Table Style) */}
          <div className="bg-white border border-black shadow-xl mx-auto max-w-[1300px]" style={{ minHeight: '600px' }}>
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

                {/* 8. Key Metrics (Below Solution) */}
                <div className="md:col-start-3 md:col-end-5 md:row-start-2 border-r border-b border-gray-200 md:border-black flex flex-col">
                     <CanvasHeader number="8" title="Metrics" subtitle="핵심 지표" icon="📊" />
                     <CanvasBody value={canvasData.keyMetrics} onChange={(v) => handleChange("keyMetrics", v)} />
                </div>

                {/* 5. Channels (Below Advantage) */}
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

        <div className="p-4 bg-white border-t border-gray-200 flex justify-end gap-3 z-10 shrink-0">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
                취소
            </Button>
            {onApply && (
                <Button onClick={handleApplyToProject} className="bg-black text-white hover:bg-gray-800 gap-2">
                    <Check className="w-4 h-4" />
                    프로젝트에 적용하기
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
