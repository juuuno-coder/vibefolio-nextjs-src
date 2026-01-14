"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Wand2, Copy, Check } from "lucide-react";
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
    try {
      // TODO: 실제 AI API 연동
      // 임시 Mockup 데이터
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
    } catch (error) {
      console.error(error);
      toast.error("생성에 실패했습니다.");
      setIsLoading(false);
    }
  };

  const handleChange = (key: keyof LeanCanvasData, value: string) => {
    setCanvasData((prev) => ({ ...prev, [key]: value }));
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
      <DialogContent className="max-w-[95vw] w-[1200px] h-[90vh] flex flex-col p-0 overflow-hidden bg-gray-50/95 backdrop-blur-sm">
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
          {/* 입력 섹션 */}
          <div className="flex gap-2 mb-8 max-w-2xl mx-auto">
            <Input
              placeholder="프로젝트 주제나 핵심 아이디어를 입력하세요 (예: 반려견을 위한 AI 음악 추천 앱)"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="h-12 text-lg shadow-sm"
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

          {/* 린 캔버스 그리드 */}
          <div className="grid grid-cols-5 grid-rows-3 gap-3 h-[800px] min-h-[600px] bg-white p-4 rounded-xl shadow-lg border border-gray-200">
            {/* 1. Problem (Row 1-2, Col 1) */}
            <CanvasBlock
              title="1. 문제 (Problem)"
              subtitle="고객이 겪는 상위 3가지 문제"
              value={canvasData.problem}
              onChange={(v) => handleChange("problem", v)}
              className="row-span-2 col-span-1"
              icon="🔥"
            />
            
            {/* 4. Solution (Row 1, Col 2) */}
             <CanvasBlock
              title="4. 솔루션 (Solution)"
              subtitle="각 문제에 대한 해결책"
              value={canvasData.solution}
              onChange={(v) => handleChange("solution", v)}
              className="col-span-1"
              icon="💡"
            />

            {/* 3. UVP (Row 1-2, Col 3) */}
            <CanvasBlock
              title="3. 가치 제안 (UVP)"
              subtitle="차별화된 핵심 가치 메시지"
              value={canvasData.uniqueValueProposition}
              onChange={(v) => handleChange("uniqueValueProposition", v)}
              className="row-span-2 col-span-1 border-purple-100 bg-purple-50/30"
              icon="💎"
              isHighlight
            />

            {/* 9. Unfair Advantage (Row 1, Col 4) */}
            <CanvasBlock
              title="9. 경쟁 우위 (Advantage)"
              subtitle="쉽게 복제할 수 없는 강점"
              value={canvasData.unfairAdvantage}
              onChange={(v) => handleChange("unfairAdvantage", v)}
              className="col-span-1"
              icon="🛡️"
            />

            {/* 2. Customer Segments (Row 1-2, Col 5) */}
            <CanvasBlock
              title="2. 고객군 (Segments)"
              subtitle="목표 고객 및 얼리어답터"
              value={canvasData.customerSegments}
              onChange={(v) => handleChange("customerSegments", v)}
              className="row-span-2 col-span-1"
              icon="🎯"
            />

            {/* 8. Key Metrics (Row 2, Col 2) */}
            <CanvasBlock
              title="8. 핵심 지표 (Metrics)"
              subtitle="성공을 측정하는 핵심 숫자"
              value={canvasData.keyMetrics}
              onChange={(v) => handleChange("keyMetrics", v)}
              className="col-span-1"
              icon="📊"
            />

             {/* 5. Channels (Row 2, Col 4) */}
             <CanvasBlock
              title="5. 채널 (Channels)"
              subtitle="고객에게 도달하는 경로"
              value={canvasData.channels}
              onChange={(v) => handleChange("channels", v)}
              className="col-span-1"
              icon="📢"
            />

            {/* 7. Cost Structure (Row 3, Col 1-2) */}
            <CanvasBlock
              title="7. 비용 구조 (Cost Structure)"
              subtitle="고정비, 변동비 등 주요 비용"
              value={canvasData.costStructure}
              onChange={(v) => handleChange("costStructure", v)}
              className="col-span-2.5 row-span-1"
              icon="💸"
            />

            {/* 6. Revenue Streams (Row 3, Col 3-5) */}
            <CanvasBlock
              title="6. 수익원 (Revenue Streams)"
              subtitle="수익 모델, 가격 정책"
              value={canvasData.revenueStreams}
              onChange={(v) => handleChange("revenueStreams", v)}
              className="col-span-2.5 row-span-1 border-green-100 bg-green-50/30"
              icon="💰"
            />
          </div>
        </div>

        <div className="p-4 bg-white border-t border-gray-200 flex justify-end gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
                취소
            </Button>
            {onApply && (
                <Button onClick={handleApplyToProject} className="bg-black text-white hover:bg-gray-800 gap-2">
                    <Check className="w-4 h-4" />
                    프로젝트 설명에 적용하기
                </Button>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CanvasBlock({ 
    title, 
    subtitle, 
    value, 
    onChange, 
    className, 
    icon,
    isHighlight = false
}: { 
    title: string; 
    subtitle: string; 
    value: string; 
    onChange: (v: string) => void; 
    className?: string;
    icon: string;
    isHighlight?: boolean;
}) {
    return (
        <div className={`flex flex-col border rounded-lg p-3 transition-colors ${isHighlight ? 'border-purple-200' : 'border-gray-200 hover:border-gray-300'} ${className}`}>
            <div className="flex items-center justify-between mb-1">
                <h3 className="font-bold text-sm text-gray-800 flex items-center gap-1.5">
                    <span className="text-base">{icon}</span> {title}
                </h3>
            </div>
            <p className="text-[10px] text-gray-400 mb-2">{subtitle}</p>
            <Textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="flex-1 w-full resize-none text-xs leading-relaxed border-0 bg-transparent p-0 focus-visible:ring-0 placeholder:text-gray-300"
                placeholder="..."
            />
        </div>
    );
}
