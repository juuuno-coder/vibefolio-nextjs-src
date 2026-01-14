"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Wand2, Rocket, Download, ArrowRight, User, Quote, Target, AlertCircle } from "lucide-react";
import { toast, Toaster } from "sonner";
import html2canvas from "html2canvas";

// --- Types ---
interface PersonaData {
  name: string;
  age: string;
  job: string;
  location: string;
  quote: string;
  bio: string;
  goals: string[];
  frustrations: string[];
  brands: string[];
  mbti: string;
  image: string;
}

const initialData: PersonaData = {
  name: "김민준",
  age: "28세",
  job: "스타트업 마케터",
  location: "서울 마포구",
  quote: "트렌드는 놓치기 싫은데, 업무 때문에 여유 시간이 너무 부족해요.",
  bio: "빠르게 변화하는 트렌드에 민감하며 자기계발 욕구가 강합니다. 효율성을 중시하여 다양한 생산성 도구를 적극적으로 활용하지만, 정작 본인의 건강과 휴식은 챙기지 못하는 경우가 많습니다.",
  goals: [
    "빠르고 정확한 트렌드 파악",
    "업무 자동화를 통한 워라밸 확보",
    "사이드 프로젝트로 추가 수익 창출"
  ],
  frustrations: [
    "정보 과부하로 인한 피로감",
    "반복적인 단순 업무",
    "네트워킹 기회 부족"
  ],
  brands: ["Apple", "Notion", "Tesla", "Starbucks"],
  mbti: "ENTJ",
  image: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=1000&auto=format&fit=crop"
};

// --- Page Component ---

export default function PersonaPage() {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerated, setIsGenerated] = useState(false);
  const [persona, setPersona] = useState<PersonaData>(initialData);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast.error("서비스에 대해 설명해주세요!");
      return;
    }

    setIsLoading(true);
    
    try {
        const response = await fetch('/api/ai/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'persona', topic })
        });

        if (!response.ok) {
             const errData = await response.json();
             throw new Error(errData.error || 'AI 생성 실패');
        }

        const data = await response.json();
        setPersona(data);
        setIsGenerated(true);
        toast.success("페르소나가 정의되었습니다!");
    } catch (error) {
        console.error(error);
        toast.error("생성에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
        setIsLoading(false);
    }
  };

  const handleDownloadImage = async () => {
    if (!cardRef.current) return;
    try {
      const canvas = await html2canvas(cardRef.current, { scale: 2, backgroundColor: null });
      const link = document.createElement("a");
      link.download = `persona-${persona.name}.png`;
      link.href = canvas.toDataURL();
      link.click();
      toast.success("프로필 카드가 저장되었습니다.");
    } catch (e) {
      console.error(e);
      toast.error("저장에 실패했습니다.");
    }
  };

  const handleStartProject = () => {
     // Save Data to LocalStorage
    const content = `
## 👤 타겟 페르소나 정의

![Persona](${persona.image})

### 1. 기본 정보 (Profile)
- **이름:** ${persona.name} (${persona.age})
- **직업:** ${persona.job}
- **거주지:** ${persona.location}
- **MBTI:** ${persona.mbti}

> "${persona.quote}"

### 2. 소개 (Bio)
${persona.bio}

### 3. 목표 (Goals)
${persona.goals.map(g => `- ${g}`).join('\n')}

### 4. 고충 (Frustrations)
${persona.frustrations.map(f => `- ${f}`).join('\n')}
    `.trim();

    localStorage.setItem('project_import_content', content);
    localStorage.setItem('project_import_title', topic);
    localStorage.setItem('project_import_type', 'persona');
    
    toast.success("프로젝트 에디터로 이동합니다...");
    setTimeout(() => {
        router.push('/project/upload');
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-center" richColors />
      
      {/* Hero Section */}
      <div className="bg-[#0a0a0a] text-white pt-24 pb-32 px-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-[0.15] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
        {/* Different Gradient Blob colors for Persona */}
        <div className="absolute -top-[20%] left-[20%] w-[500px] h-[500px] bg-blue-900/40 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] bg-pink-900/30 rounded-full blur-[100px]"></div>

        <div className="max-w-4xl mx-auto text-center relative z-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full text-xs font-bold text-blue-400 mb-6 border border-white/10 backdrop-blur-sm">
            <User className="w-3 h-3" />
            Vibefolio AI Labs
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight tracking-tight">
            내 고객은 <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-pink-400">누구일까요?</span>
          </h1>
          <p className="text-lg text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            서비스 아이디어를 입력하면, <br className="hidden md:block"/>
            AI가 가장 반응할 만한 <b>핵심 고객(페르소나)</b>을 찾아 구체화해드립니다.
          </p>

          <div className="max-w-xl mx-auto relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-pink-600 rounded-2xl blur opacity-30 group-hover:opacity-50 transition-opacity"></div>
            <div className="relative bg-white rounded-xl p-2 flex items-center shadow-2xl">
              <Input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                placeholder="어떤 서비스인지 설명해주세요 (예: AI 타로 상담 앱)"
                className="border-0 h-12 text-lg text-black placeholder:text-gray-400 focus-visible:ring-0 bg-transparent px-4 font-medium"
              />
              <Button 
                onClick={handleGenerate} 
                disabled={isLoading}
                className="h-12 px-6 bg-black hover:bg-gray-800 text-white rounded-lg font-bold text-base gap-2 transition-all min-w-[120px]"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
                {isLoading ? "분석 중" : "찾기"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Result Section */}
      <div className="-mt-12 container mx-auto px-4 pb-20 relative z-20">
        
        {/* Tool Switcher Tabs */}
        <div className="flex justify-center mb-10">
            <div className="bg-white/10 backdrop-blur-md p-1.5 rounded-2xl flex gap-1 border border-white/20 shadow-xl">
                <button 
                    onClick={() => router.push('/tools/lean-canvas')}
                    className="px-6 py-3 text-white/70 hover:text-white hover:bg-white/10 rounded-xl font-medium text-sm transition-all flex items-center gap-2"
                >
                    <span className="text-lg opacity-70">📊</span> 린 캔버스
                </button>
                <button className="px-6 py-3 bg-white text-black rounded-xl font-bold text-sm shadow-lg transition-all flex items-center gap-2">
                     <span className="text-lg">👤</span> 페르소나 정의
                </button>
            </div>
        </div>

        <div className={`transition-all duration-1000 ${isGenerated ? 'opacity-100 translate-y-0' : 'opacity-100 translate-y-0'}`}>
             {/* Toolbar */}
             <div className="flex justify-between items-center mb-6 pl-2 pr-2 max-w-5xl mx-auto">
                <h2 className="text-xl font-bold flex items-center gap-2 text-white/90">
                    <span className="bg-white/10 p-1.5 rounded-md"><User className="w-4 h-4 text-blue-400" /></span>
                    타겟 페르소나 프로필
                </h2>
                <div className="flex gap-3">
                    <Button variant="secondary" onClick={handleDownloadImage} disabled={!isGenerated} className="gap-2 bg-white hover:bg-gray-100 text-black border border-transparent shadow-lg text-sm font-semibold">
                        <Download className="w-4 h-4" /> 카드 저장
                    </Button>
                    <Button onClick={handleStartProject} disabled={!isGenerated} className="bg-blue-600 hover:bg-blue-700 text-white gap-2 font-bold shadow-lg shadow-blue-900/20 hover:translate-y-[-2px] transition-all">
                        프로젝트 시작 <ArrowRight className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Persona ID Card Design */}
            <div ref={cardRef} className="max-w-5xl mx-auto bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[600px]">
                
                 {/* Left: Profile Image & Basic Info */}
                 <div className="md:w-[38%] bg-slate-50 border-r border-gray-100 p-12 flex flex-col items-center text-center relative justify-center">
                     <div className="w-48 h-48 rounded-full border-8 border-white shadow-2xl overflow-hidden mb-8 relative group">
                         <img src={persona.image} alt={persona.name} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" />
                         <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors"></div>
                     </div>
                     
                     <h2 className="text-4xl font-black text-gray-900 mb-2 tracking-tight">{persona.name}</h2>
                     <p className="text-xl text-gray-500 font-medium mb-8">{persona.age}, {persona.job}</p>
                     
                     <div className="flex flex-wrap justify-center gap-2 mb-10">
                         <span className="px-4 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-bold shadow-sm">{persona.mbti}</span>
                         <span className="px-4 py-1.5 bg-white border border-gray-200 text-gray-600 rounded-full text-sm font-bold shadow-sm">{persona.location}</span>
                     </div>

                     {/* Brands */}
                     <div className="mt-auto w-full pt-8 border-t border-gray-200/60">
                         <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-4">Favorite Brands</p>
                         <div className="flex flex-wrap justify-center gap-3">
                             {persona.brands.map(brand => (
                                 <span key={brand} className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-600 shadow-sm">{brand}</span>
                             ))}
                         </div>
                     </div>
                 </div>

                 {/* Right: Details */}
                 <div className="md:w-[62%] p-14 flex flex-col justify-center bg-white relative">
                     {/* Decorative Quote Mark */}
                     <Quote className="absolute top-12 left-10 w-20 h-20 text-blue-50 -z-0 rotate-180" />
                     
                     {/* Quote */}
                     <div className="mb-12 relative z-10 pl-2">
                         <h3 className="text-3xl font-bold text-gray-900 leading-normal tracking-tight">"{persona.quote}"</h3>
                     </div>

                     {/* Bio */}
                     <div className="mb-10 pl-2">
                         <p className="text-gray-600 leading-loose text-lg font-medium">{persona.bio}</p>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-auto">
                         {/* Goals */}
                         <div className="bg-gradient-to-br from-green-50 to-emerald-50/30 rounded-2xl p-6 border border-green-100/50">
                             <h4 className="flex items-center gap-2 font-extrabold text-green-700 mb-4 uppercase text-xs tracking-widest">
                                 <Target className="w-4 h-4" /> Goals & Needs
                             </h4>
                             <ul className="space-y-3">
                                 {persona.goals.map((goal, i) => (
                                     <li key={i} className="flex items-start gap-2.5 text-sm text-green-900 font-semibold leading-relaxed">
                                         <span className="text-green-500 mt-1.5 w-1.5 h-1.5 rounded-full bg-green-500 shrink-0"></span> {goal}
                                     </li>
                                 ))}
                             </ul>
                         </div>

                         {/* Frustrations */}
                         <div className="bg-gradient-to-br from-red-50 to-pink-50/30 rounded-2xl p-6 border border-red-100/50">
                             <h4 className="flex items-center gap-2 font-extrabold text-red-700 mb-4 uppercase text-xs tracking-widest">
                                 <AlertCircle className="w-4 h-4" /> Frustrations
                             </h4>
                             <ul className="space-y-3">
                                 {persona.frustrations.map((item, i) => (
                                     <li key={i} className="flex items-start gap-2.5 text-sm text-red-900 font-semibold leading-relaxed">
                                         <span className="text-red-500 mt-1.5 w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></span> {item}
                                     </li>
                                 ))}
                             </ul>
                         </div>
                     </div>
                 </div>
            </div>

            <div className="text-center mt-6 text-white/30 text-xs">
                AI can make mistakes. Please review.
            </div>
        </div>
      </div>
    </div>
  );
}
