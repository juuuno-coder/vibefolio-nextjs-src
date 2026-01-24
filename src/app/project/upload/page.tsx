"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faArrowLeft, 
  faCamera, 
  faImage, 
  faTrash, 
  faPlus,
  faStar
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@/lib/auth/AuthContext";
import { uploadImage } from "@/lib/supabase/storage";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, LayoutTemplate, Zap, BarChart3 } from "lucide-react";
import dynamic from "next/dynamic";
import { genreCategories } from "@/lib/categoryMap";
import { Editor } from '@tiptap/react'; 

// Dynamic Imports
const TiptapEditor = dynamic(() => import("@/components/editor/TiptapEditor.client"), { ssr: false });
import { EditorSidebar } from "@/components/editor/EditorSidebar";

export default function ProjectUploadPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  
  // 모드 설정
  const mode = searchParams.get('mode');
  const editId = searchParams.get('edit');
  const isVersionMode = mode === 'version';
  
  // 기본 정보 상태
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [showInDiscover, setShowInDiscover] = useState(true);
  const [showInGrowth, setShowInGrowth] = useState(false); 
  const [auditDeadline, setAuditDeadline] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7); 
    return d.toISOString().split('T')[0];
  });
  
  // 평가 항목
  const [customCategories, setCustomCategories] = useState<any[]>([
    { id: 'score_1', label: '독창성', desc: '아이디어가 참신한가요?', sticker: '/review/s1.png' },
    { id: 'score_2', label: '완성도', desc: '시각적 완성도가 높은가요?', sticker: '/review/s2.png' },
    { id: 'score_3', label: '시장성', desc: '실제 사용 가치가 있나요?', sticker: '/review/s3.png' }
  ]);
  
  // 스티커 폴
  const [pollOptions, setPollOptions] = useState<any[]>([
    { id: 'p1', label: '당장 쓸게요!', desc: '매우 만족스러운 결과물입니다.', image_url: '/review/a1.jpeg' },
    { id: 'p2', label: '조금 아쉬워요', desc: '개선이 필요해 보입니다.', image_url: '/review/a2.jpeg' },
    { id: 'p3', label: '더 연구해 주세요', desc: '방향성 재검토가 필요합니다.', image_url: '/review/a3.jpeg' }
  ]);
  
  // 심층 질문
  const [auditQuestions, setAuditQuestions] = useState<string[]>(["가장 인상적인 부분은 어디인가요?"]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editor, setEditor] = useState<Editor | null>(null);

  // 데이터 로딩 및 초기 설정
  useEffect(() => {
    if (mode === 'audit') {
      setShowInGrowth(true);
      setShowInDiscover(true);
    }
    
    if (editId) {
      const loadProject = async () => {
        try {
          const res = await fetch(`/api/projects/${editId}`);
          const data = await res.json();
          if (data.project) {
            const p = data.project;
            setTitle(p.title || "");
            setContent(p.content_text || "");
            setCoverPreview(p.thumbnail_url);
            
            const cData = typeof p.custom_data === 'string' ? JSON.parse(p.custom_data) : p.custom_data;
            setSelectedGenres(cData?.genres || []);
            
            if (p.audit_deadline) setAuditDeadline(p.audit_deadline.split('T')[0]);
            
            if (cData?.audit_config) {
              const cfg = cData.audit_config;
              if (cfg.categories) setCustomCategories(cfg.categories);
              if (cfg.poll) {
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
        content_text: content,
        thumbnail_url: coverUrl,
        visibility: showInDiscover ? 'public' : 'unlisted',
        category_id: selectedGenres[0],
        audit_deadline: showInGrowth ? auditDeadline : null,
        custom_data: {
          genres: selectedGenres,
          show_in_discover: showInDiscover,
          show_in_growth: showInGrowth,
          audit_config: showInGrowth ? {
            type: 'image',
            mediaA: coverUrl, 
            isAB: false,
            categories: customCategories,
            poll: { desc: "이 작품에 대해 어떻게 생각하시나요?", options: pollOptions },
            questions: auditQuestions
          } : null
        },
        is_growth_requested: showInGrowth
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

         {/* 1. Michelin Categories */}
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

          {/* 2. Sticker Poll */}
          <section className="space-y-8">
             <div className="flex items-center justify-between bg-white p-6 rounded-3xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center text-xl"><BarChart3 size={20} /></div>
                   <h3 className="text-xl font-black text-gray-900">2. 스티커 투표 설정</h3>
                </div>
                <Button 
                   variant="outline" 
                   onClick={() => setPollOptions([...pollOptions, { id: `p${Date.now()}`, label: "", desc: "", image_url: "" }])} 
                   disabled={pollOptions.length >= 6} 
                   className="rounded-xl font-bold gap-2"
                >
                   <FontAwesomeIcon icon={faPlus} size="sm" /> 옵션 추가
                </Button>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {pollOptions.map((opt, idx) => (
                   <div key={opt.id} className="bg-white rounded-[2.5rem] border border-gray-100 p-8 relative group shadow-sm hover:shadow-lg transition-all">
                      <button 
                         onClick={() => setPollOptions(pollOptions.filter((_, i) => i !== idx))}
                         className="absolute top-6 right-6 w-8 h-8 rounded-full bg-red-50 text-red-400 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white"
                      >
                         <FontAwesomeIcon icon={faTrash} size="xs" />
                      </button>
                      
                      <div className="aspect-square bg-gray-50 rounded-2xl mb-6 flex items-center justify-center border-2 border-dashed border-gray-100 overflow-hidden relative">
                         {opt.image_url ? (
                           <>
                             <img src={opt.image_url} className="w-full h-full object-cover" />
                             <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                                <span className="text-white text-[10px] font-black uppercase">Change</span>
                                <input type="file" className="hidden" onChange={async e => {
                                   const file = e.target.files?.[0];
                                   if (file) {
                                      const url = await uploadImage(file);
                                      const next = [...pollOptions];
                                      next[idx].image_url = url;
                                      setPollOptions(next);
                                   }
                                }} />
                             </label>
                           </>
                         ) : (
                           <label className="text-center cursor-pointer hover:bg-gray-100 w-full h-full flex flex-col items-center justify-center transition-colors">
                              <FontAwesomeIcon icon={faImage} className="text-slate-300 text-xl mb-2" />
                              <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Upload Sticker</p>
                              <input type="file" className="hidden" onChange={async e => {
                                 const file = e.target.files?.[0];
                                 if (file) {
                                    const url = await uploadImage(file);
                                    const next = [...pollOptions];
                                    next[idx].image_url = url;
                                    setPollOptions(next);
                                 }
                              }} />
                           </label>
                         )}
                      </div>
                      <input value={opt.label} onChange={e => {
                         const next = [...pollOptions];
                         next[idx].label = e.target.value;
                         setPollOptions(next);
                      }} className="w-full font-black text-gray-900 outline-none text-center text-lg mb-2 bg-transparent placeholder:text-slate-200" placeholder="옵션 이름 (ex. 합격!)" />
                      <textarea value={opt.desc} onChange={e => {
                         const next = [...pollOptions];
                         next[idx].desc = e.target.value;
                         setPollOptions(next);
                      }} className="w-full text-xs text-gray-400 text-center bg-transparent resize-none font-bold placeholder:text-slate-200" rows={2} placeholder="짧은 설명" />
                   </div>
                ))}
             </div>
          </section>

          {/* 3. Deep Questions */}
          <section className="space-y-8">
             <div className="flex items-center justify-between bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-slate-100 text-slate-900 rounded-2xl flex items-center justify-center text-xl">💬</div>
                   <h3 className="text-xl font-black text-gray-900">3. 심층 피드백 질문</h3>
                </div>
                <Button 
                   variant="outline" 
                   onClick={() => setAuditQuestions([...auditQuestions, ""])} 
                   disabled={auditQuestions.length >= 5} 
                   className="rounded-xl font-bold gap-2"
                >
                   <FontAwesomeIcon icon={faPlus} size="sm" /> 질문 추가
                </Button>
             </div>
             <div className="space-y-4">
                {auditQuestions.map((q, idx) => (
                   <div key={idx} className="flex gap-4 group items-center">
                      <div className="shrink-0 w-14 h-14 bg-slate-950 text-white rounded-2xl flex items-center justify-center font-black text-lg shadow-xl shadow-slate-200">Q{idx+1}</div>
                      <div className="flex-1 relative">
                         <Input 
                            value={q}
                            onChange={e => {
                               const next = [...auditQuestions];
                               next[idx] = e.target.value;
                               setAuditQuestions(next);
                            }}
                            className="h-14 rounded-2xl border-2 border-slate-50 focus:border-slate-900 text-lg font-bold transition-all px-6 placeholder:text-slate-200"
                            placeholder="평가자에게 묻고 싶은 질문을 입력하세요"
                         />
                         {auditQuestions.length > 1 && (
                            <button 
                               onClick={() => setAuditQuestions(auditQuestions.filter((_, i) => i !== idx))}
                               className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-red-500 transition-colors"
                            >
                               <FontAwesomeIcon icon={faTrash} />
                            </button>
                         )}
                      </div>
                   </div>
                ))}
             </div>
          </section>
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
      
      <div className="flex justify-center min-h-[calc(100vh-64px)] relative bg-[#fafafa]">
        <div className="flex w-full max-w-[1600px] relative">
        
        {/* Left Sidebar - Versions / Navigation */}
        <aside className="hidden lg:block w-[300px] flex-shrink-0 pt-12 px-6 sticky top-24 self-start h-[calc(100vh-120px)] overflow-y-auto no-scrollbar">
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

        {/* Center content */}
        <main className="flex-1 w-full max-w-[900px] mx-auto py-12 px-6 bg-white shadow-sm min-h-screen border-x border-slate-50 relative">
           {mode === 'audit' && (
              <div className="mb-8 p-4 bg-orange-50 border border-orange-100 rounded-2xl flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center text-lg">🌱</div>
                    <div>
                       <p className="text-sm font-bold text-gray-900">전문가 피드백 요청 모드</p>
                       <p className="text-xs text-gray-500">작품을 등록하면 자동으로 성장하기 메뉴에 노출됩니다.</p>
                    </div>
                 </div>
                 <div className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-[10px] font-bold text-gray-400">AUTO-ON</div>
              </div>
           )}

           {/* Title Input Section */}
           <div className="space-y-2 group mb-12">
             <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest opacity-0 group-focus-within:opacity-100 transition-opacity">Project Title</span>
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{title.length} / 50</span>
             </div>
             <Input 
               autoFocus
               placeholder="프로젝트 제목을 입력하세요" 
               className="h-20 text-4xl font-black border-none bg-transparent focus-visible:ring-0 px-0 placeholder:text-slate-100 transition-all caret-orange-500" 
               value={title}
               maxLength={50}
               onChange={e => setTitle(e.target.value)}
             />
             <div className="h-1 bg-slate-50 relative overflow-hidden rounded-full">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(title.length / 50) * 100}%` }}
                  className="absolute h-full bg-slate-900 origin-left transition-all duration-300"
                />
             </div>
           </div>

           {/* Editor */}
           <div className="min-h-[500px]">
              <TiptapEditor 
                content={content} 
                onChange={setContent} 
                onEditorReady={setEditor}
              />
           </div>

           <div className="h-px bg-slate-100 my-16" />

           <div className="space-y-16 pb-20">
              {/* Basic Settings */}
              <section className="grid grid-cols-1 md:grid-cols-2 gap-12">
                 <div className="space-y-6">
                    <h2 className="text-xl font-black text-gray-900 flex items-center gap-2"><FontAwesomeIcon icon={faCamera} className="text-slate-300"/> 커버 이미지</h2>
                    <div className="aspect-video bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200 flex items-center justify-center relative overflow-hidden group hover:border-orange-500 transition-colors">
                       {coverPreview ? (
                         <img src={coverPreview} className="w-full h-full object-cover" />
                       ) : (
                         <div className="text-center">
                            <p className="text-sm text-gray-400 font-bold">대표 이미지를 등록하세요</p>
                         </div>
                       )}
                       <label className="absolute inset-0 cursor-pointer flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="outline" className="bg-white text-black font-bold">이미지 선택</Button>
                          <input type="file" className="hidden" onChange={async e => {
                             const file = e.target.files?.[0];
                             if (file) {
                               const url = await uploadImage(file);
                               setCoverPreview(url);
                             }
                          }} />
                       </label>
                    </div>
                 </div>

                 <div className="space-y-6">
                    <h2 className="text-xl font-black text-gray-900">장르 섹션</h2>
                    <div className="flex flex-wrap gap-2">
                       {genreCategories.map(cat => (
                         <button 
                            key={cat.id} 
                            onClick={() => setSelectedGenres(prev => prev.includes(cat.id) ? prev.filter(i => i !== cat.id) : [...prev, cat.id])} 
                            className={cn("px-4 py-2 rounded-xl border-2 transition-all font-bold text-sm", selectedGenres.includes(cat.id) ? "bg-slate-900 border-slate-900 text-white shadow-md" : "border-gray-100 text-gray-400 hover:border-gray-300 bg-white")}
                         >
                           {cat.label}
                         </button>
                       ))}
                    </div>
                 </div>
              </section>

              {/* Visibility Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <button 
                    onClick={() => setShowInDiscover(!showInDiscover)}
                    className={cn("p-6 rounded-[2rem] text-left transition-all border-2", showInDiscover ? "bg-slate-900 border-slate-900 text-white" : "bg-white border-gray-100 text-gray-400")}
                 >
                    <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-50">Public Feed</p>
                    <h3 className="text-lg font-black">발견하기 메뉴에 등록</h3>
                 </button>
                 <button 
                    onClick={() => setShowInGrowth(!showInGrowth)}
                    className={cn("p-6 rounded-[2rem] text-left transition-all border-2", showInGrowth ? "bg-orange-500 border-orange-500 text-white" : "bg-white border-gray-100 text-gray-400")}
                 >
                    <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-50">Feedback Mode</p>
                    <h3 className="text-lg font-black">성장하기 메뉴에 등록</h3>
                 </button>
              </div>

              <AnimatePresence>
                 {showInGrowth && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                       {renderFeedbackSettings()}
                    </motion.div>
                 )}
              </AnimatePresence>

              <div className="flex justify-end pt-8">
                <Button disabled={isSubmitting} onClick={handleSubmit} className="h-20 px-24 rounded-full bg-black text-white text-2xl font-black shadow-2xl hover:scale-105 active:scale-95 transition-all w-full md:w-auto">
                   {isSubmitting ? "발행 중..." : "발행하기"}
                </Button>
              </div>
           </div>
        </main>

        {/* Right Sidebar - Toolbox */}
        <aside className="hidden lg:block w-[320px] flex-shrink-0 pt-12 pr-6 sticky top-24 self-start h-[calc(100vh-120px)] overflow-y-auto no-scrollbar">
           {editor && (
              <EditorSidebar 
                 onAddText={() => editor.chain().focus().setParagraph().run()}
                 onAddImage={() => document.querySelector<HTMLInputElement>('input[type="file"].hidden')?.click()}
                 onAddVideo={() => {
                    const url = window.prompt("YouTube URL:");
                    if(url) {
                        try {
                            const newUrl = new URL(url);
                            editor.commands.setYoutubeVideo({ src: url });
                        } catch (e) {
                            toast.error("올바른 YouTube URL을 입력해주세요.");
                        }
                    }
                 }}
                 onStyleClick={() => toast.info("준비 중")}
                 onSettingsClick={() => toast.info("준비 중")}
                 isGrowthMode={showInGrowth}
              />
           )}
        </aside>

        </div>
      </div>
    </div>
  );
}
