"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faArrowLeft, 
  faCamera, 
  faCheck, 
  faRocket, 
  faStar, 
  faVideo, 
  faImage, 
  faUpload, 
  faTrash, 
  faPlus,
  faWandMagicSparkles,
  faUser,
  faPenNib,
  faFilm,
  faClapperboard,
  faMusic,
  faQuoteLeft,
  faCode,
  faMobileScreen,
  faGamepad,
  faStar as faStarIcon
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@/lib/auth/AuthContext";
import { uploadImage } from "@/lib/supabase/storage";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { ChefHat, Clock, Sparkles, Rocket, Zap, Eye, ChevronRight, BarChart3, Image as ImageIcon, Video, Code as CodeIcon, Sticker, LayoutTemplate } from "lucide-react";
import dynamic from "next/dynamic";
import { genreCategories, fieldCategories } from "@/lib/categoryMap";
import { Editor } from '@tiptap/react'; // Type import

// Dynamic Imports
const TiptapEditor = dynamic(() => import("@/components/editor/TiptapEditor.client"), { ssr: false });
const CollaboratorManager = dynamic(() => import("@/components/CollaboratorManager").then(mod => mod.CollaboratorManager), { ssr: false });
import { EditorSidebar } from "@/components/editor/EditorSidebar";

export default function ProjectUploadPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const userId = user?.id;
  
  // 모드 설정
  const mode = searchParams.get('mode');
  const editId = searchParams.get('edit');
  const isVersionMode = mode === 'version';
  
  // Step 관리: content -> info -> audit (optional)
  const [step, setStep] = useState<'content' | 'info' | 'audit'>('content');
  
  // 기본 정보 상태
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [visibility, setVisibility] = useState<'public' | 'unlisted' | 'private'>('public');
  const [collaboratorEmails, setCollaboratorEmails] = useState<string[]>([]);

  // 노출 범위 관리
  const [showInDiscover, setShowInDiscover] = useState(true);
  const [showInGrowth, setShowInGrowth] = useState(false); // Default OFF
  const [auditDeadline, setAuditDeadline] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7); // Default 1 week
    return d.toISOString().split('T')[0];
  });
  const [auditType, setAuditType] = useState<'link' | 'image' | 'video'>('link');
  const [mediaData, setMediaData] = useState<string | string[]>(auditType === 'image' ? [] : "");
  const [isAB, setIsAB] = useState(false);
  const [mediaDataB, setMediaDataB] = useState<string | string[]>(auditType === 'image' ? [] : "");
  const [customCategories, setCustomCategories] = useState<any[]>([
    { id: 'score_1', label: '독창성', desc: '아이디어가 참신한가요?', sticker: '/review/s1.png' },
    { id: 'score_2', label: '완성도', desc: '시각적 완성도가 높은가요?', sticker: '/review/s2.png' },
    { id: 'score_3', label: '시장성', desc: '실제 사용 가치가 있나요?', sticker: '/review/s3.png' }
  ]);
  const [pollOptions, setPollOptions] = useState<any[]>([
    { id: 'p1', label: '당장 쓸게요!', desc: '매우 만족스러운 결과물입니다.', image_url: '/review/a1.jpeg' },
    { id: 'p2', label: '조금 아쉬워요', desc: '개선이 필요해 보입니다.', image_url: '/review/a2.jpeg' },
    { id: 'p3', label: '더 연구해 주세요', desc: '방향성 재검토가 필요합니다.', image_url: '/review/a3.jpeg' }
  ]);
  const [pollDesc, setPollDesc] = useState("이 작품에 대해 어떻게 생각하시나요?");
  const [auditQuestions, setAuditQuestions] = useState<string[]>(["가장 인상적인 부분은 어디인가요?"]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [auditStep, setAuditStep] = useState(1); // Unifed into Step 3 flow
  const [editor, setEditor] = useState<Editor | null>(null); // For sidebar control

  // 데이터 로딩 및 초기 설정
  useEffect(() => {
    if (mode === 'audit') {
      // Force update state immediately when mode is present
      setShowInGrowth(true);
      setShowInDiscover(true);
      // Optional: Set a flag to indicate 'feedback mode' for UI
    }
    
    if (editId) {
      const loadProject = async () => {
        try {
          const res = await fetch(`/api/projects/${editId}`);
          const data = await res.json();
          if (data.project) {
            const p = data.project;
            setTitle(p.title || "");
            setSummary(p.summary || "");
            setContent(p.content_text || "");
            setCoverPreview(p.thumbnail_url);
            setVisibility(p.visibility);
            
            // custom_data 파싱 안전하게 처리
            const cData = typeof p.custom_data === 'string' ? JSON.parse(p.custom_data) : p.custom_data;
            setSelectedGenres(cData?.genres || []);
            setSelectedFields(cData?.fields || []);
            
            if (p.audit_deadline) setAuditDeadline(p.audit_deadline.split('T')[0]);
            
            if (cData?.audit_config) {
              const cfg = cData.audit_config;
              setAuditType(cfg.type || 'link');
              setMediaData(cfg.mediaA || "");
              setMediaDataB(cfg.mediaB || "");
              setIsAB(cfg.isAB || false);
              if (cfg.categories) setCustomCategories(cfg.categories);
              if (cfg.poll) {
                setPollDesc(cfg.poll.desc || "");
                setPollOptions(cfg.poll.options || []);
              }
              if (cfg.questions) setAuditQuestions(cfg.questions);
            }
            
            setShowInGrowth(p.is_growth_requested || cData?.is_feedback_requested || false);
            setShowInDiscover(p.visibility === 'public');
          }
        } catch (e) {
          console.error("Failed to load project", e);
          toast.error("프로젝트 정보를 불러오는데 실패했습니다.");
        }
      };
      loadProject();
    }
  }, [editId, mode]);

  const handleSubmit = async () => {
    if (!title.trim()) return toast.error("제목을 입력해주세요.");
    if (selectedGenres.length === 0) return toast.error("최소 1개의 장르를 선택해주세요.");
    
    setIsSubmitting(true);
    try {
      let coverUrl = coverPreview;
      if (coverImage) {
        coverUrl = await uploadImage(coverImage);
      }

      const projectData = {
        title,
        summary,
        content_text: content,
        thumbnail_url: coverUrl,
        visibility: showInDiscover ? 'public' : 'unlisted',
        category_id: selectedGenres[0],
        audit_deadline: showInGrowth ? auditDeadline : null,
        custom_data: {
          genres: selectedGenres,
          fields: selectedFields,
          show_in_discover: showInDiscover,
          show_in_growth: showInGrowth,
          audit_config: showInGrowth ? {
            type: auditType,
            mediaA: coverUrl, // Use project thumbnail as default media
            mediaB: null,
            isAB: false,
            categories: customCategories,
            poll: { desc: pollDesc, options: pollOptions },
            questions: auditQuestions
          } : null
        },
        is_growth_requested: showInGrowth,
        collaborators: collaboratorEmails
      } as any;

      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(projectData),
      });

      if (!res.ok) throw new Error("등록 실패");
      
      toast.success(showInGrowth ? "전문 피드백 설정이 완료되었습니다!" : "프로젝트가 발행되었습니다!");
      router.push(showInGrowth ? "/growth" : "/discover");
    } catch (error) {
      console.error(error);
      toast.error("등록 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitting) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xl font-bold text-gray-900">프로젝트를 안전하게 등록하고 있습니다...</p>
      </div>
    );
  }

  const renderFeedbackSettings = () => {
    return (
      <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
         {/* Step Indicator Header (Standalone for this part) */}
         <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl -mr-32 -mt-32" />
            <div className="relative z-10 flex items-center justify-between">
               <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-orange-500 rounded-2xl flex items-center justify-center text-2xl shadow-lg">🎯</div>
                  <div>
                     <h2 className="text-2xl font-black">피드백 항목 상세 설정</h2>
                     <p className="text-orange-200/60 text-xs font-bold uppercase tracking-widest mt-0.5">Customizing Professional Feedback</p>
                  </div>
               </div>
               <div className="flex flex-col items-end">
                  <span className="text-[10px] font-black text-white/40 uppercase mb-1">피드백 마감일</span>
                  <input 
                    type="date" 
                    value={auditDeadline} 
                    onChange={e => setAuditDeadline(e.target.value)}
                    className="bg-white/10 border-none rounded-lg px-3 py-1 text-xs font-bold text-orange-400 outline-none focus:ring-1 focus:ring-orange-500"
                  />
               </div>
            </div>
         </div>

         {/* Michelin Categories */}
         <section className="space-y-8">
            <div className="flex items-center justify-between bg-white p-6 rounded-3xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center text-xl"><Zap size={20} /></div>
                  <h3 className="text-xl font-black text-gray-900">1. 평가 항목 설정 (레이더 차트)</h3>
               </div>
               <Button variant="outline" onClick={() => setCustomCategories([...customCategories, { id: `cat-${Date.now()}`, label: "", desc: "", sticker: "" }])} disabled={customCategories.length >= 6} className="rounded-xl font-bold">항목 추가</Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {customCategories.map((cat, idx) => (
                  <div key={cat.id} className="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm relative group">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center border border-gray-200">
                           <FontAwesomeIcon icon={faStar} className="text-gray-300" />
                        </div>
                        <div className="flex-1 space-y-1">
                           <input value={cat.label} onChange={e => {
                              const next = [...customCategories];
                              next[idx].label = e.target.value;
                              setCustomCategories(next);
                           }} className="font-black text-gray-900 outline-none w-full bg-transparent text-lg placeholder:text-gray-200" placeholder="평가 항목" />
                           <input value={cat.desc} onChange={e => {
                              const next = [...customCategories];
                              next[idx].desc = e.target.value;
                              setCustomCategories(next);
                           }} className="text-xs text-gray-400 outline-none w-full bg-transparent font-bold" placeholder="가이드라인" />
                        </div>
                        <button onClick={() => setCustomCategories(customCategories.filter((_, i) => i !== idx))} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all"><FontAwesomeIcon icon={faTrash} /></button>
                     </div>
                  </div>
               ))}
            </div>
         </section>

         {/* Sticker Poll */}
         <section className="space-y-8">
            <div className="flex items-center justify-between bg-white p-6 rounded-3xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center text-xl"><BarChart3 size={20} /></div>
                  <h3 className="text-xl font-black text-gray-900">2. 스티커 투표 설정</h3>
               </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               {pollOptions.map((opt, idx) => (
                  <div key={idx} className="bg-white rounded-[2.5rem] border border-gray-100 p-8 relative group shadow-sm">
                     <div className="aspect-square bg-gray-50 rounded-2xl mb-6 flex items-center justify-center border-2 border-dashed border-gray-100 overflow-hidden">
                        {opt.image_url ? <img src={opt.image_url} className="w-full h-full object-cover" /> : <div className="text-center"><p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Image</p></div>}
                     </div>
                     <input value={opt.label} onChange={e => {
                        const next = [...pollOptions];
                        next[idx].label = e.target.value;
                        setPollOptions(next);
                     }} className="w-full font-black text-gray-900 outline-none text-center text-lg mb-2" placeholder="옵션 이름" />
                     <textarea value={opt.desc} onChange={e => {
                        const next = [...pollOptions];
                        next[idx].desc = e.target.value;
                        setPollOptions(next);
                     }} className="w-full text-xs text-gray-400 text-center bg-transparent resize-none font-bold" rows={2} placeholder="설명" />
                  </div>
               ))}
            </div>
         </section>

         {/* Final Questions */}
         <section className="space-y-8">
            <div className="flex items-center gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
               <div className="w-12 h-12 bg-slate-100 text-slate-900 rounded-2xl flex items-center justify-center text-xl">💬</div>
               <h3 className="text-xl font-black text-gray-900">3. 심층 피드백 질문</h3>
            </div>
            <div className="space-y-4">
               {auditQuestions.map((q, idx) => (
                  <div key={idx} className="flex gap-4 group">
                     <div className="shrink-0 w-14 h-14 bg-slate-950 text-white rounded-2xl flex items-center justify-center font-black text-lg">Q{idx+1}</div>
                     <Input 
                        value={q}
                        onChange={e => {
                           const next = [...auditQuestions];
                           next[idx] = e.target.value;
                           setAuditQuestions(next);
                        }}
                        className="h-14 rounded-2xl border-2 border-gray-100 focus:border-slate-900 text-lg font-bold transition-all px-6"
                     />
                  </div>
               ))}
            </div>
         </section>

         {/* <div className="flex justify-between pt-12">
            <Button variant="ghost" onClick={() => setStep('info')} className="h-16 px-10 rounded-full font-black text-gray-400 hover:text-gray-900 text-lg">이전 단계</Button>
            <Button onClick={handleSubmit} className="h-20 px-20 rounded-full bg-black text-white text-2xl font-black shadow-2xl hover:scale-105 active:scale-95 transition-all">등록 및 발행하기</Button>
         </div> */}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-6 h-16">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-black transition-colors flex items-center gap-2">
          <FontAwesomeIcon icon={faArrowLeft} />
          <span className="text-sm font-bold uppercase tracking-wider">Back</span>
        </button>
        <h1 className="text-sm font-black text-gray-900 uppercase tracking-[0.2em]">
          {showInGrowth ? "포트폴리오 & 전문 피드백" : isVersionMode ? "새 버전 등록" : "프로젝트 등록"}
        </h1>
        <div className="w-10" />
      </header>
      
      </header>
      
      <div className="flex justify-center min-h-[calc(100vh-64px)] relative bg-[#fafafa]">
        <div className="flex w-full max-w-[1600px] relative">
        
        {/* Left Sidebar - Versions / Navigation */}
        <aside className="hidden 2xl:block w-[300px] flex-shrink-0 pt-12 px-6 sticky top-16 h-[calc(100vh-64px)] overflow-y-auto no-scrollbar">
           <div className="space-y-6">
              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                 <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Clock size={12} /> History
                 </h3>
                 {isVersionMode ? (
                    <div className="space-y-2">
                       <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <p className="text-xs font-bold text-slate-900">Current Version</p>
                          <p className="text-[10px] text-slate-400 mt-1">Editing now...</p>
                       </div>
                       <div className="p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer opacity-50">
                          <p className="text-xs font-bold text-slate-700">v1.0.2</p>
                          <p className="text-[10px] text-slate-400 mt-1">Last published</p>
                       </div>
                    </div>
                 ) : (
                    <div className="text-center py-8 opacity-50">
                       <LayoutTemplate className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                       <p className="text-xs text-slate-400">새 프로젝트 작성 중</p>
                    </div>
                 )}
              </div>
              
              <div className="bg-orange-50/50 rounded-2xl p-5 border border-orange-100/50">
                 <h3 className="text-xs font-black text-orange-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                    Tip
                 </h3>
                 <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    <strong className="text-orange-600">Enter</strong> 키로 단락을 나누고, <strong className="text-orange-600">/</strong> 키를 눌러 메뉴를 열 수 있습니다.
                 </p>
              </div>
           </div>
        </aside>

        <main className="flex-1 w-full max-w-[900px] mx-auto py-12 px-6 bg-white shadow-sm min-h-screen border-x border-slate-50">
        {/* [New] Feedback Mode Indicator */}
        {mode === 'audit' && (
           <div className="mb-8 p-4 bg-orange-50 border border-orange-100 rounded-2xl flex items-center justify-between animate-in fade-in slide-in-from-top-4">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center text-lg">🌱</div>
                 <div>
                    <p className="text-sm font-bold text-gray-900">전문가 피드백 요청 모드</p>
                    <p className="text-xs text-gray-500">작품을 등록하면 자동으로 성장하기 메뉴에 노출됩니다.</p>
                 </div>
              </div>
              <div className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-[10px] font-bold text-gray-400">
                 AUTO-ON
              </div>
           </div>
        )}

                <div className="pb-20">
                   <div className="h-px bg-slate-100 my-10" />
                   
                   {/* Inline Project Settings */}
                   <div className="space-y-12">
                      <section className="space-y-6">
                         <h2 className="text-2xl font-black text-gray-900">발행 설정</h2>
                         <div className="aspect-video bg-gray-100 rounded-[2rem] border-2 border-dashed border-gray-200 flex items-center justify-center relative overflow-hidden group hover:border-gray-300 transition-colors">
                            {coverPreview ? (
                              <img src={coverPreview} className="w-full h-full object-cover" />
                            ) : (
                              <div className="text-center">
                                 <FontAwesomeIcon icon={faCamera} className="text-gray-300 text-4xl mb-2" />
                                 <p className="text-sm text-gray-400 font-bold">커버 이미지를 등록해주세요</p>
                              </div>
                            )}
                            <label className="absolute inset-0 cursor-pointer flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                               <Button variant="outline" className="bg-white text-black font-bold">이미지 선택</Button>
                               <input type="file" className="hidden" onChange={e => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    setCoverImage(file);
                                    setCoverPreview(URL.createObjectURL(file));
                                  }
                               }} />
                            </label>
                         </div>
                      </section>

                      <section className="space-y-4">
                         <label className="text-lg font-bold text-gray-900">장르 선택</label>
                         <div className="flex flex-wrap gap-2">
                            {genreCategories.map(cat => (
                              <button key={cat.id} onClick={() => setSelectedGenres(prev => prev.includes(cat.id) ? prev.filter(i => i !== cat.id) : [...prev, cat.id])} className={cn("px-4 py-2 rounded-full border-2 transition-all font-bold text-sm", selectedGenres.includes(cat.id) ? "bg-green-500 border-green-500 text-white shadow-md" : "border-gray-200 text-gray-400 hover:border-green-200 bg-white")}>
                                {cat.label}
                              </button>
                            ))}
                         </div>
                      </section>

                      <section className="p-8 bg-zinc-900 rounded-[2.5rem] text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-[80px] -mr-32 -mt-32" />
                        <div className="flex items-center gap-6 relative z-10">
                           <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-3xl flex items-center justify-center text-3xl">📡</div>
                           <div className="space-y-1">
                              <h3 className="font-black text-2xl tracking-tight">발견하기 메뉴에 등록</h3>
                              <p className="text-gray-400 text-sm font-medium">바이브폴리오의 메인 갤러리 피드에 작업을 노출합니다.</p>
                           </div>
                        </div>
                        <button 
                           type="button"
                           onClick={() => setShowInDiscover(!showInDiscover)}
                           className={cn("w-20 h-10 rounded-full transition-all relative flex items-center px-1.5 shadow-inner z-10", showInDiscover ? "bg-green-500" : "bg-white/10")}
                        >
                           <div className={cn("w-7 h-7 rounded-full shadow-lg transition-all flex items-center justify-center font-black text-[10px]", showInDiscover ? "translate-x-10 bg-white text-green-600" : "translate-x-0 bg-white text-gray-300")}>
                              {showInDiscover ? "YES" : "NO"}
                           </div>
                        </button>
                      </section>

                      <section className="space-y-6">
                         <div className="p-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-[2.5rem] text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden group">
                           <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[80px] -mr-32 -mt-32" />
                           <div className="flex items-center gap-6 relative z-10">
                              <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center text-3xl">🌱</div>
                              <div className="space-y-1">
                                 <h3 className="font-black text-2xl tracking-tight">성장하기 메뉴에 등록</h3>
                                 <p className="text-orange-50/80 text-sm font-medium">전문적인 피드백(미슐랭 평점, 스티커)을 요청합니다.</p>
                              </div>
                           </div>
                           <button 
                              type="button"
                              onClick={() => setShowInGrowth(!showInGrowth)}
                              className={cn("w-20 h-10 rounded-full transition-all relative flex items-center px-1.5 shadow-inner z-10", showInGrowth ? "bg-white" : "bg-black/20")}
                           >
                              <div className={cn("w-7 h-7 rounded-full shadow-lg transition-all flex items-center justify-center font-black text-[10px]", showInGrowth ? "translate-x-10 bg-orange-600 text-white" : "translate-x-0 bg-white text-gray-300")}>
                                 {showInGrowth ? "YES" : "NO"}
                              </div>
                           </button>
                         </div>
                         
                         {/* Conditional Feedback Settings */}
                         <AnimatePresence>
                            {showInGrowth && (
                               <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="overflow-hidden"
                               >
                                  <div className="pt-4 pb-8">
                                     {renderFeedbackSettings()}
                                  </div>
                               </motion.div>
                            )}
                         </AnimatePresence>
                      </section>

                      <div className="flex justify-end pt-8">
                        <Button 
                           disabled={isSubmitting} 
                           onClick={handleSubmit} 
                           className="h-20 px-24 rounded-full bg-black text-white text-2xl font-black shadow-2xl hover:bg-slate-900 hover:scale-105 active:scale-95 transition-all w-full md:w-auto"
                        >
                           {isSubmitting ? "발행 중..." : "발행하기"}
                        </Button>
                      </div>
                   </div>
                </div>
              </>
            ) : null}
      </main>

      <aside className="hidden 2xl:block w-[300px] flex-shrink-0 pt-12 pr-6 sticky top-16 h-[calc(100vh-64px)] overflow-y-auto no-scrollbar">
         {step === 'content' && editor && (
            <EditorSidebar 
               onAddText={() => editor.chain().focus().setParagraph().run()}
               onAddImage={() => document.querySelector<HTMLInputElement>('input[type="file"].hidden')?.click()}
               onAddVideo={() => {
                  const url = window.prompt("YouTube URL:");
                  if(url) editor.commands.setYoutubeVideo({ src: url });
               }}
               onAddGrid={() => toast.info("그리드 기능 준비 중입니다.")}
               onAddCode={() => editor.chain().focus().toggleCodeBlock().run()}
               onAddEmbed={() => {
                  const content = window.prompt("임베드 태그(iframe 등)를 입력하세요:");
                  if (content) editor.chain().focus().insertContent(content).run();
               }}
               // Placeholder handlers for advanced features
               onAddLightroom={() => toast.info("라이트룸 연동 준비 중")}
               onAddPrototype={() => toast.info("프로토타입 연동 준비 중")}
               onAdd3D={() => toast.info("3D 모델 뷰어 준비 중")}
               onStyleClick={() => toast.info("스타일 설정 준비 중")}
               onSettingsClick={() => toast.info("설정 메뉴 준비 중")}
               onAddAsset={() => toast.info("에셋 첨부 기능 준비 중")}
               isGrowthMode={showInGrowth}
            />
         )}
      </aside>

      </div>
      </div>
    </div>
  );
}
