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
    // TODO: AI API Integration
    setTimeout(() => {
        // Mocking dynamic data based on input
        // Real implementation would call Gemini API
      setIsLoading(false);
      setIsGenerated(true);
      toast.success("페르소나가 정의되었습니다!");
    }, 2000);
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
      <div className="-mt-20 container mx-auto px-4 pb-20 relative z-20">
        
        {/* Tool Switcher Tabs */}
        <div className="flex justify-center mb-8">
            <div className="bg-white/10 backdrop-blur-md p-1 rounded-xl flex gap-1 border border-white/20">
                <button 
                    onClick={() => router.push('/tools/lean-canvas')}
                    className="px-6 py-2.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg font-medium text-sm transition-all"
                >
                    📊 린 캔버스
                </button>
                <button className="px-6 py-2.5 bg-white text-black rounded-lg font-bold text-sm shadow-lg transition-all">
                    👤 페르소나 정의
                </button>
            </div>
        </div>

        <div className={`transition-all duration-1000 ${isGenerated ? 'opacity-100 translate-y-0' : 'opacity-100 translate-y-0'}`}>
             {/* Toolbar */}
             <div className="flex justify-between items-center mb-6 pl-2 pr-2 max-w-4xl mx-auto">
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
            <div ref={cardRef} className="max-w-4xl mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[500px]">
                
                 {/* Left: Profile Image & Basic Info */}
                 <div className="md:w-1/3 bg-gray-50 border-r border-gray-100 p-8 flex flex-col items-center text-center relative">
                     <div className="w-40 h-40 rounded-full border-4 border-white shadow-xl overflow-hidden mb-6 relative group">
                         <img src={persona.image} alt={persona.name} className="w-full h-full object-cover" />
                         <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors"></div>
                     </div>
                     
                     <h2 className="text-3xl font-black text-gray-900 mb-1">{persona.name}</h2>
                     <p className="text-lg text-gray-500 font-medium mb-4">{persona.age}, {persona.job}</p>
                     
                     <div className="flex gap-2 mb-8">
                         <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">{persona.mbti}</span>
                         <span className="px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-xs font-bold">{persona.location}</span>
                     </div>

                     {/* Brands */}
                     <div className="mt-auto w-full">
                         <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Favorite Brands</p>
                         <div className="flex flex-wrap justify-center gap-2">
                             {persona.brands.map(brand => (
                                 <span key={brand} className="px-2 py-1 border border-gray-200 rounded text-[10px] font-bold text-gray-500">{brand}</span>
                             ))}
                         </div>
                     </div>
                 </div>

                 {/* Right: Details */}
                 <div className="md:w-2/3 p-10 flex flex-col">
                     {/* Quote */}
                     <div className="mb-10 relative">
                         <Quote className="absolute -top-4 -left-4 w-12 h-12 text-blue-100 -z-10" />
                         <h3 className="text-2xl font-bold text-gray-800 italic leading-relaxed">"{persona.quote}"</h3>
                     </div>

                     {/* Bio */}
                     <div className="mb-8">
                         <p className="text-gray-600 leading-relaxed text-lg">{persona.bio}</p>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-auto">
                         {/* Goals */}
                         <div className="bg-green-50 rounded-xl p-5 border border-green-100">
                             <h4 className="flex items-center gap-2 font-bold text-green-800 mb-3 uppercase text-sm tracking-wide">
                                 <Target className="w-4 h-4" /> Goals & Needs
                             </h4>
                             <ul className="space-y-2">
                                 {persona.goals.map((goal, i) => (
                                     <li key={i} className="flex items-start gap-2 text-sm text-green-900 font-medium">
                                         <span className="text-green-500 mt-1">•</span> {goal}
                                     </li>
                                 ))}
                             </ul>
                         </div>

                         {/* Frustrations */}
                         <div className="bg-red-50 rounded-xl p-5 border border-red-100">
                             <h4 className="flex items-center gap-2 font-bold text-red-800 mb-3 uppercase text-sm tracking-wide">
                                 <AlertCircle className="w-4 h-4" /> Frustrations
                             </h4>
                             <ul className="space-y-2">
                                 {persona.frustrations.map((item, i) => (
                                     <li key={i} className="flex items-start gap-2 text-sm text-red-900 font-medium">
                                         <span className="text-red-500 mt-1">•</span> {item}
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
