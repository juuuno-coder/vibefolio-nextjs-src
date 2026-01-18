"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";  // Ensure Textarea is used for content
import { Wand2, Check } from "lucide-react";
import { toast } from "sonner";
import { AssistantData } from "./tools/AiAssistantChat";

interface AssistantResultModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply?: (content: string) => void;
  onSave?: (data: AssistantData) => void;
  initialData?: AssistantData;
}

export function AssistantResultModal({ open, onOpenChange, onApply, onSave, initialData }: AssistantResultModalProps) {
  const [data, setData] = useState<AssistantData>({ type: '', content: '' });

  useEffect(() => {
    if (open && initialData) {
       setData(initialData);
    }
  }, [open, initialData]);

  const handleSave = () => {
    if (onSave) {
        onSave(data);
        toast.success("저장되었습니다.");
        onOpenChange(false);
    }
  };

  const handleApplyToProject = () => {
    if (!onApply) return;
    onApply(data.content);
    onOpenChange(false);
    toast.success("프로젝트 설명에 적용되었습니다.");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-[1400px] h-[85vh] flex flex-col p-0 overflow-hidden bg-gray-50/95 backdrop-blur-sm">
        <DialogHeader className="px-6 py-4 bg-white border-b border-gray-200 flex flex-row items-center justify-between shrink-0">
          <div className="flex flex-col gap-1">
             <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <Wand2 className="w-5 h-5 text-purple-600" />
                AI 콘텐츠 생성 결과
             </DialogTitle>
             <p className="text-sm text-gray-500">생성된 콘텐츠를 확인하고 편집할 수 있습니다.</p>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin bg-gray-50">
            <div className="max-w-4xl mx-auto h-full flex flex-col">
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 flex-1 flex flex-col p-6 min-h-[500px]">
                    <Textarea 
                        value={data.content} 
                        onChange={(e) => setData({ ...data, content: e.target.value })}
                        className="flex-1 w-full h-full resize-none border-0 p-4 text-base leading-relaxed focus-visible:ring-0 placeholder:text-gray-300"
                        placeholder="내용이 여기에 표시됩니다..."
                    />
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
                <Button onClick={handleApplyToProject} className="bg-purple-600 text-white hover:bg-purple-700 gap-2">
                    <Check className="w-4 h-4" />
                    프로젝트에 적용하기
                </Button>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
