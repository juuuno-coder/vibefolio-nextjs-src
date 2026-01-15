"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, UserCircle2, BrainCircuit, Check } from "lucide-react";
import { toast } from "sonner";

interface PersonaDefinitionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply?: (content: string) => void;
}

interface PersonaData {
  demographics: string;
  bio: string;
  goals: string;
  frustrations: string;
  motivations: string;
  personality: string;
  techSavviness: string;
  preferredChannels: string;
}

const initialData: PersonaData = {
  demographics: "",
  bio: "",
  goals: "",
  frustrations: "",
  motivations: "",
  personality: "",
  techSavviness: "",
  preferredChannels: "",
};

export function PersonaDefinitionModal({ open, onOpenChange, onApply }: PersonaDefinitionModalProps) {
  const [topic, setTopic] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [personaData, setPersonaData] = useState<PersonaData>(initialData);

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast.error("서비스 주제나 타겟 고객층에 대한 힌트를 입력해주세요.");
      return;
    }

    setIsLoading(true);
    // Mockup Data Generation
    setTimeout(() => {
      setPersonaData({
        demographics: `이름: 김민준\n나이: 28세\n직업: 주니어 UI/UX 디자이너\n거주지: 서울 마포구\n상태: 미혼, 1인 가구`,
        bio: `"디자인은 영감 싸움이라고 생각해요. 하지만 효율성도 놓칠 수 없죠."\n\n트렌드에 민감하며 새로운 툴을 배우는 것을 즐깁니다. 업무 시간에는 효율을 극대화하고 퇴근 후에는 자기개발에 힘씁니다.`,
        goals: `1. 3년 안에 시니어 디자이너로 승진\n2. 나만의 디자인 포트폴리오 브랜드화\n3. 업무 자동화를 통한 워라밸 확보`,
        frustrations: `1. 반복적인 디자인 작업 (누끼 따기, 리사이징)\n2. 클라이언트와의 소통 미스\n3. 너무 많은 툴 파편화로 인한 피로감`,
        motivations: `1. 인정 욕구 (동료, SNS)\n2. 성장에 대한 갈증\n3. 시각적 아름다움 추구`,
        personality: `창의적임, 분석적임, 내향적이지만 온라인에선 활발함, 완벽주의 성향`,
        techSavviness: `높음 (Midjourney, Figma, Notion 능숙)`,
        preferredChannels: `Instagram, Pinterest, Brainded, Youtube Tech 리뷰 채널`,
      });
      setIsLoading(false);
      toast.success("AI 페르소나가 정의되었습니다!");
    }, 1500);
  };

  const handleChange = (key: keyof PersonaData, value: string) => {
    setPersonaData((prev) => ({ ...prev, [key]: value }));
  };

  const handleApplyToProject = () => {
    if (!onApply) return;
    
    const formattedContent = `
## 👤 타겟 고객 페르소나 (Target Persona)

### 1. 인구통계 (Demographics)
${personaData.demographics}

### 2. 소개 (Bio)
${personaData.bio}

### 3. 목표 및 니즈 (Goals & Needs)
${personaData.goals}

### 4. 고충 및 페인포인트 (Frustrations)
${personaData.frustrations}

### 5. 행동 패턴 및 성향
- **성격**: ${personaData.personality}
- **동기**: ${personaData.motivations}
- **디지털 친숙도**: ${personaData.techSavviness}
- **주요 채널**: ${personaData.preferredChannels}
    `.trim();

    onApply(formattedContent);
    onOpenChange(false);
    toast.success("프로젝트 설명에 적용되었습니다.");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-[1200px] h-[85vh] flex flex-col p-0 overflow-hidden bg-gray-50/95 backdrop-blur-sm">
        <DialogHeader className="px-6 py-4 bg-white border-b border-gray-200 flex flex-row items-center justify-between shrink-0">
          <div className="flex flex-col gap-1">
             <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <BrainCircuit className="w-5 h-5 text-indigo-600" />
                AI 고객 페르소나 정의
             </DialogTitle>
             <p className="text-sm text-gray-500">우리 서비스의 핵심 사용자를 가상으로 정의해봅니다.</p>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          {/* Input Section */}
          <div className="flex gap-2 mb-8 max-w-2xl mx-auto">
            <Input
              placeholder="서비스 주제 입력 (예: 20대 여성을 위한 비건 화장품 앱)"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="h-12 text-lg shadow-sm bg-white"
              onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            />
            <Button 
                onClick={handleGenerate} 
                disabled={isLoading}
                className="h-12 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-2 shadow-md transition-all hover:scale-105"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserCircle2 className="w-5 h-5" />}
              {isLoading ? "생성 중..." : "페르소나 생성"}
            </Button>
          </div>

          {/* Persona Card Layout */}
          <div className="max-w-5xl mx-auto bg-white rounded-3xl overflow-hidden shadow-xl border border-gray-200 flex flex-col md:flex-row min-h-[600px]">
             {/* Left Column: Profile Image & Basic Info */}
             <div className="md:w-1/3 bg-gray-900 text-white p-8 flex flex-col gap-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full blur-3xl opacity-20 -mr-32 -mt-32"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500 rounded-full blur-3xl opacity-20 -ml-16 -mb-16"></div>

                <div className="relative z-10 flex flex-col items-center text-center">
                    <div className="w-32 h-32 rounded-full bg-gray-800 border-4 border-gray-700 mb-4 flex items-center justify-center overflow-hidden">
                        <UserCircle2 className="w-20 h-20 text-gray-600" />
                    </div>
                    <div className="w-full">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 block">Demographics</label>
                        <Textarea 
                           value={personaData.demographics} 
                           onChange={(e) => handleChange('demographics', e.target.value)}
                           className="bg-gray-800/50 border-gray-700 text-white text-sm min-h-[120px] focus-visible:ring-indigo-500 text-center"
                        />
                    </div>
                </div>

                <div className="relative z-10 flex-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 block">Bio & Quote</label>
                    <Textarea 
                        value={personaData.bio} 
                        onChange={(e) => handleChange('bio', e.target.value)}
                        className="bg-gray-800/50 border-gray-700 text-white text-sm h-full italic focus-visible:ring-indigo-500"
                    />
                </div>
             </div>

             {/* Right Column: Key Attributes */}
             <div className="md:w-2/3 p-8 bg-white text-gray-900 grid grid-cols-1 md:grid-cols-2 gap-6 content-start">
                
                <div className="md:col-span-2">
                    <PersonaSection title="Goals & Needs" icon="🎯" color="text-indigo-600">
                        <Textarea 
                            value={personaData.goals} 
                            onChange={(e) => handleChange('goals', e.target.value)}
                            className="w-full border-gray-200 bg-indigo-50/30 focus-visible:ring-indigo-500"
                        />
                    </PersonaSection>
                </div>

                <div className="md:col-span-2">
                    <PersonaSection title="Frustrations" icon="😩" color="text-red-500">
                        <Textarea 
                            value={personaData.frustrations} 
                            onChange={(e) => handleChange('frustrations', e.target.value)}
                            className="w-full border-gray-200 bg-red-50/30 focus-visible:ring-red-500"
                        />
                    </PersonaSection>
                </div>

                <div>
                    <PersonaSection title="Personality" icon="🧠" color="text-purple-600">
                        <Textarea 
                            value={personaData.personality} 
                            onChange={(e) => handleChange('personality', e.target.value)}
                            className="w-full border-gray-200 focus-visible:ring-purple-500"
                        />
                    </PersonaSection>
                </div>

                <div>
                    <PersonaSection title="Motivations" icon="🔥" color="text-orange-500">
                        <Textarea 
                            value={personaData.motivations} 
                            onChange={(e) => handleChange('motivations', e.target.value)}
                            className="w-full border-gray-200 focus-visible:ring-orange-500"
                        />
                    </PersonaSection>
                </div>

                <div>
                     <PersonaSection title="Tech Savviness" icon="💻" color="text-blue-500">
                        <Input 
                            value={personaData.techSavviness} 
                            onChange={(e) => handleChange('techSavviness', e.target.value)}
                            className="w-full border-gray-200 focus-visible:ring-blue-500"
                        />
                     </PersonaSection>
                </div>

                <div>
                     <PersonaSection title="Preferred Channels" icon="📱" color="text-green-600">
                        <Input 
                            value={personaData.preferredChannels} 
                            onChange={(e) => handleChange('preferredChannels', e.target.value)}
                            className="w-full border-gray-200 focus-visible:ring-green-500"
                        />
                     </PersonaSection>
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

function PersonaSection({ title, icon, color, children }: { title: string, icon: string, color: string, children: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-2 h-full">
            <h4 className={`font-bold text-sm uppercase tracking-wider flex items-center gap-2 ${color}`}>
                <span>{icon}</span> {title}
            </h4>
            <div className="flex-1">
                {children}
            </div>
        </div>
    )
}
