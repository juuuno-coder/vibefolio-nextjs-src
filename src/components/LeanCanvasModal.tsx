"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";  // Ensure Textarea is imported
import { Check, Wand2 } from "lucide-react";
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

export function LeanCanvasModal({ open, onOpenChange, onApply, onSave, initialData }: LeanCanvasModalProps) {
  const [canvasData, setCanvasData] = useState<LeanCanvasData>(defaultData);

  // Sync initialData
  useEffect(() => {
    if (open && initialData) {
       setCanvasData({ ...defaultData, ...initialData });
    } else if (open && !initialData) {
       // Optional: Reset if needed, or keep last state
    }
  }, [open, initialData]);

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
                AI 린 캔버스 결과물
             </DialogTitle>
             <p className="text-sm text-gray-500">
                 생성된 린 캔버스를 확인하고 수정할 수 있습니다.
             </p>
          </div>
        </DialogHeader>

        {/* Result View (Grid) */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin bg-gray-50">
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

        <div className="p-4 bg-white border-t border-gray-200 flex justify-end gap-3 z-10 shrink-0">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
                닫기
            </Button>
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
