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
import { ChefHat, Clock, Sparkles, Rocket } from "lucide-react";
import dynamic from "next/dynamic";
import { genreCategories, fieldCategories } from "@/lib/categoryMap";

// Dynamic Imports
const TiptapEditor = dynamic(() => import("@/components/editor/TiptapEditor.client"), { ssr: false });
const CollaboratorManager = dynamic(() => import("@/components/CollaboratorManager").then(mod => mod.CollaboratorManager), { ssr: false });

export default function ProjectUploadPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const userId = user?.id;
  
  // 모드 설정
  const mode = searchParams.get('mode');
  const editId = searchParams.get('edit');
  const isAuditMode = mode === 'audit'; // 제 평가는요? (전문 진단)
  const isVersionMode = mode === 'version';
  
  // Step 관리
  const [step, setStep] = useState<'content' | 'info'>(isAuditMode ? 'info' : 'content');
  
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

  // V-Audit 전용 상태
  const [isFeedbackRequested, setIsFeedbackRequested] = useState(false); // Default to NO
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
  const [auditStep, setAuditStep] = useState(1); // 1: Project & Media, 2: Criteria, 3: Poll & Questions

  // 모드 및 데이터 로딩
  useEffect(() => {
    if (isAuditMode) {
      setIsFeedbackRequested(true);
    }
    
    if (editId) {
      const loadProject = async () => {
        try {
          const res = await fetch(`/api/projects?id=${editId}`);
          const data = await res.json();
          if (data.success && data.project) {
            const p = data.project;
            setTitle(p.title || "");
            setSummary(p.summary || "");
            setContent(p.content_text || "");
            setCoverPreview(p.thumbnail_url);
            setVisibility(p.visibility);
            setSelectedGenres(p.custom_data?.genres || []);
            setSelectedFields(p.custom_data?.fields || []);
            
            if (p.audit_deadline) setAuditDeadline(p.audit_deadline.split('T')[0]);
            
            if (p.custom_data?.audit_config) {
              const cfg = p.custom_data.audit_config;
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
            
            setIsFeedbackRequested(p.is_growth_requested || p.is_feedback_requested || false);
          }
        } catch (e) {
          console.error("Failed to load project", e);
        }
      };
      loadProject();
    }
  }, [isAuditMode, editId]);

  const handleSubmit = async () => {
    if (!title.trim()) return toast.error("제목을 입력해주세요.");
    if (!isAuditMode && selectedGenres.length === 0) return toast.error("최소 1개의 장르를 선택해주세요.");
    
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
        is_published: visibility === 'public',
        visibility: isAuditMode ? 'unlisted' : visibility, // Default unlisted for audit
        category_id: selectedGenres[0],
        audit_deadline: isAuditMode ? auditDeadline : null,
        custom_data: {
          genres: selectedGenres,
          fields: selectedFields,
          is_feedback_requested: isFeedbackRequested,
          audit_config: isAuditMode ? {
            type: auditType,
            mediaA: mediaData,
            mediaB: isAB ? mediaDataB : null,
            isAB,
            categories: customCategories,
            poll: { desc: pollDesc, options: pollOptions },
            questions: auditQuestions
          } : null
        },
        is_growth_requested: isFeedbackRequested,
        collaborators: collaboratorEmails
      } as any;

      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(projectData),
      });

      if (!res.ok) throw new Error("등록 실패");
      
      toast.success(isAuditMode ? "평가 의뢰가 성공적으로 등록되었습니다!" : "프로젝트가 발행되었습니다!");
      router.push(isAuditMode ? "/growth" : "/");
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

  // --- Render Functions ---

  const renderAuditSettings = () => {
    const steps = [
      { id: 1, title: '기본 정보 & 미디어', icon: <Sparkles size={16} /> },
      { id: 2, title: '심사 기준 설정', icon: <ChefHat size={16} /> },
      { id: 3, title: '심층 질문 & 발행', icon: <Rocket className="w-4 h-4" /> }
    ];

    return (
      <div className="space-y-10">
        {/* Step Indicator */}
        <div className="flex items-center justify-between bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden relative">
           <div className="absolute inset-0 bg-gradient-to-r from-orange-50/50 to-transparent pointer-events-none" />
           <div className="flex items-center gap-8 relative z-10 w-full justify-around md:justify-start md:gap-16">
              {steps.map((s, i) => (
                <div key={s.id} className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black transition-all ${auditStep === s.id ? 'bg-orange-600 text-white shadow-lg shadow-orange-200 scale-110' : 'bg-gray-100 text-gray-400'}`}>
                    {auditStep > s.id ? <FontAwesomeIcon icon={faCheck} className="text-orange-600" /> : s.icon}
                  </div>
                  <div className="hidden md:flex flex-col">
                    <span className={`text-[10px] font-black uppercase tracking-widest ${auditStep === s.id ? 'text-orange-600' : 'text-gray-300'}`}>Step 0{s.id}</span>
                    <span className={`text-sm font-bold ${auditStep === s.id ? 'text-gray-900' : 'text-gray-400'}`}>{s.title}</span>
                  </div>
                  {i < steps.length - 1 && <div className="hidden md:block w-12 h-px bg-gray-100 ml-4" />}
                </div>
              ))}
           </div>
        </div>

        <AnimatePresence mode="wait">
          {auditStep === 1 && (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-10"
            >
              <section className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-orange-600 text-white flex items-center justify-center text-xl shadow-lg ring-4 ring-orange-100">🕵️</div>
                  <h2 className="text-3xl font-black text-gray-900 tracking-tight">어떤 프로젝트를 진단할까요?</h2>
                </div>
                <div className="space-y-4">
                  <Input 
                    placeholder="진단받을 제목을 입력하세요" 
                    value={title} 
                    onChange={e => setTitle(e.target.value)}
                    className="h-16 text-2xl font-bold border-2 border-gray-100 focus:border-orange-500 rounded-2xl px-6 transition-all"
                  />
                  <Input 
                    placeholder="전문가들이 참고할 간단한 요약을 적어주세요" 
                    value={summary} 
                    onChange={e => setSummary(e.target.value)}
                    className="h-14 text-lg border-2 border-gray-100 focus:border-orange-500 rounded-xl px-6 transition-all"
                  />
                </div>
              </section>

              <section className="p-8 bg-slate-900 rounded-[2.5rem] text-white shadow-2xl space-y-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl -mr-32 -mt-32" />
                <div className="flex justify-between items-center relative z-10">
                  <h3 className="text-xl font-black flex items-center gap-2">
                    <FontAwesomeIcon icon={faCamera} className="text-orange-500" />
                    진단 미디어 및 기한 설정
                  </h3>
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end">
                       <span className="text-[10px] font-black text-white/40 uppercase mb-1">진단 마감일</span>
                       <input 
                         type="date" 
                         value={auditDeadline} 
                         onChange={e => setAuditDeadline(e.target.value)}
                         className="bg-white/10 border-none rounded-lg px-3 py-1 text-xs font-bold text-orange-400 outline-none focus:ring-1 focus:ring-orange-500"
                       />
                    </div>
                    <button onClick={() => setIsAB(!isAB)} className={cn("px-4 py-2 rounded-full text-xs font-bold transition-all h-fit", isAB ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20" : "bg-white/10 text-gray-400 hover:bg-white/20")}>
                       A/B 테스트 {isAB ? "활성" : "비활성"}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 relative z-10">
                  {['link', 'image', 'video'].map((t) => (
                    <button key={t} onClick={() => setAuditType(t as any)} className={cn("py-4 rounded-2xl border-2 transition-all font-bold text-sm", auditType === t ? "bg-white text-black border-orange-500 shadow-xl scale-105" : "bg-white/5 border-white/5 text-gray-500 hover:bg-white/10")}>
                      {t === 'link' ? "웹 링크" : t === 'image' ? "이미지 갤러리" : "유튜브 영상"}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                   <div className="space-y-4">
                      <label className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Version A (Main)</label>
                      {auditType === 'image' ? (
                        <div className="flex flex-wrap gap-2 p-4 bg-white/5 rounded-2xl border border-white/10">
                           {Array.isArray(mediaData) && (mediaData as string[]).map((img, i) => (
                             <div key={i} className="w-20 h-20 rounded-xl overflow-hidden relative shadow-lg group/img">
                               <img src={img} className="w-full h-full object-cover" />
                               <button onClick={() => setMediaData((mediaData as string[]).filter((_, j) => j !== i))} className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                 <FontAwesomeIcon icon={faTrash} size="xs" />
                               </button>
                             </div>
                           ))}
                           <label className="w-20 h-20 rounded-xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center cursor-pointer hover:bg-white/10 transition-colors">
                              <FontAwesomeIcon icon={faPlus} className="text-gray-500 mb-1" />
                              <span className="text-[9px] font-bold text-gray-500">추가</span>
                              <input type="file" multiple className="hidden" onChange={async e => {
                                 if (e.target.files) {
                                   const urls = await Promise.all(Array.from(e.target.files).map(f => uploadImage(f)));
                                   setMediaData([...(Array.isArray(mediaData) ? mediaData : []), ...urls]);
                                 }
                              }} />
                           </label>
                        </div>
                      ) : (
                        <Input className="bg-white/5 border-white/10 h-14 text-white rounded-xl focus:border-orange-500 transition-all px-5" placeholder="URL을 입력하세요 (예: https://...)" value={typeof mediaData === 'string' ? mediaData : ''} onChange={e => setMediaData(e.target.value)} />
                      )}
                   </div>
                   {isAB && (
                     <div className="space-y-4">
                        <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Version B (Comparator)</label>
                        <Input className="bg-white/5 border-white/10 h-14 text-white rounded-xl focus:border-blue-400 transition-all px-5" placeholder="비교할 URL을 입력하세요" value={typeof mediaDataB === 'string' ? mediaDataB : ''} onChange={e => setMediaDataB(e.target.value)} />
                     </div>
                   )}
                </div>
              </section>

              <div className="flex justify-end pt-4">
                <Button onClick={() => setAuditStep(2)} className="h-14 px-12 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-black text-lg shadow-xl shadow-orange-100 transition-all group">
                  다음 단계로 <FontAwesomeIcon icon={faCheck} className="ml-3 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </motion.div>
          )}

          {auditStep === 2 && (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-10"
            >
              <section className="space-y-8">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                       <div className="w-14 h-14 rounded-[1.2rem] bg-orange-500 text-white flex items-center justify-center text-2xl shadow-lg shadow-orange-200">🎯</div>
                       <div>
                          <h3 className="text-2xl font-black text-gray-900 tracking-tight">2. 미술랭처럼 평가받기</h3>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">EVALUATION METRICS (RADAR CHART)</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-4">
                       <span className="text-xs font-black text-gray-300">{customCategories.length}/6</span>
                       <Button 
                          variant="outline" 
                          onClick={() => setCustomCategories([...customCategories, { id: `cat-${Date.now()}`, label: "", desc: "", sticker: "" }])}
                          className="rounded-xl border-gray-100 h-10 font-bold hover:bg-gray-50 flex items-center gap-2 px-4"
                          disabled={customCategories.length >= 6}
                       >
                          <FontAwesomeIcon icon={faPlus} className="text-[10px]" /> 추가
                       </Button>
                    </div>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {customCategories.map((cat, idx) => (
                      <div key={idx} className="flex items-center gap-5 p-6 rounded-[2rem] border border-gray-50 bg-white relative group shadow-sm hover:shadow-md transition-all">
                        <label className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 cursor-pointer overflow-hidden shrink-0 group/img relative">
                          {cat.sticker ? (
                            <img src={cat.sticker} className="w-full h-full object-contain" />
                          ) : (
                            <FontAwesomeIcon icon={faStar} className="text-sm" />
                          )}
                          <input type="file" className="hidden" onChange={async e => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const url = await uploadImage(file);
                              const next = [...customCategories];
                              next[idx].sticker = url;
                              setCustomCategories(next);
                            }
                          }} />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                            <FontAwesomeIcon icon={faCamera} className="text-white text-[10px]" />
                          </div>
                        </label>

                        <div className="flex-1 space-y-1">
                          <input value={cat.label} onChange={e => {
                            const next = [...customCategories];
                            next[idx].label = e.target.value;
                            setCustomCategories(next);
                          }} className="font-black text-gray-900 outline-none w-full bg-transparent text-lg placeholder:text-gray-200" placeholder="항목 이름" />
                          <input value={cat.desc} onChange={e => {
                            const next = [...customCategories];
                            next[idx].desc = e.target.value;
                            setCustomCategories(next);
                          }} className="text-xs text-gray-400 outline-none w-full bg-transparent font-bold" placeholder="항목에 대한 간단한 가이드" />
                        </div>
                        {customCategories.length > 1 && (
                          <button 
                            onClick={() => setCustomCategories(customCategories.filter((_, i) => i !== idx))}
                            className="opacity-0 group-hover:opacity-100 absolute top-4 right-4 text-gray-200 hover:text-red-500 transition-all"
                          >
                            <FontAwesomeIcon icon={faTrash} size="xs" />
                          </button>
                        )}
                      </div>
                    ))}
                 </div>
              </section>

              <div className="flex justify-between pt-4">
                <Button variant="ghost" onClick={() => setAuditStep(1)} className="h-14 px-8 rounded-2xl font-bold text-gray-400 hover:text-gray-900">
                   <FontAwesomeIcon icon={faArrowLeft} className="mr-2" /> 이전으로
                </Button>
                <Button onClick={() => setAuditStep(3)} className="h-14 px-12 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-black text-lg shadow-xl shadow-orange-100 transition-all group">
                  마지막 단계로 <FontAwesomeIcon icon={faCheck} className="ml-3 transition-transform" />
                </Button>
              </div>
            </motion.div>
          )}

          {auditStep === 3 && (
            <motion.div 
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-12"
            >
              {/* 스티커 투표 설정 */}
              <section className="space-y-8">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                       <div className="w-14 h-14 rounded-[1.2rem] bg-indigo-600 text-white flex items-center justify-center text-2xl shadow-lg shadow-indigo-200">📊</div>
                       <div>
                          <h3 className="text-2xl font-black text-gray-900 tracking-tight">3. 스티커 투표 항목 설정</h3>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">STICKER POLL (2-6 OPTIONS WITH ICONS)</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-4">
                       <span className="text-xs font-black text-gray-300">{pollOptions.length}/6</span>
                       <Button 
                          variant="outline" 
                          onClick={() => setPollOptions([...pollOptions, { id: `p-${Date.now()}`, label: "", desc: "", image_url: "" }])}
                          className="rounded-xl border-gray-100 h-10 font-bold hover:bg-gray-50 flex items-center gap-2 px-4"
                          disabled={pollOptions.length >= 6}
                       >
                          <FontAwesomeIcon icon={faPlus} className="text-[10px]" /> 추가
                       </Button>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {pollOptions.map((opt, idx) => (
                       <div key={opt.id} className="bg-white p-8 rounded-[2.5rem] border border-gray-50 relative group hover:shadow-xl transition-all pt-12">
                          {/* Sticker Badge */}
                          <div className="absolute top-4 left-4 bg-slate-900 text-white px-3 py-1 rounded-full text-[8px] font-black tracking-tighter uppercase z-20">
                             STICKER {idx + 1}
                          </div>

                          <label className="w-full aspect-square bg-white rounded-[2rem] flex items-center justify-center cursor-pointer overflow-hidden border-2 border-dashed border-gray-100 hover:border-indigo-400 transition-all group/sticker relative mb-8">
                             {opt.image_url ? (
                                <img src={opt.image_url} className="w-full h-full object-cover" />
                             ) : (
                                <div className="flex flex-col items-center gap-3">
                                   <FontAwesomeIcon icon={faCamera} className="text-gray-200 text-2xl" />
                                   <div className="bg-gray-50 text-gray-400 px-4 py-1.5 rounded-full text-[9px] font-bold">스티커 이미지 첨부</div>
                                </div>
                             )}
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

                          <div className="space-y-6">
                             <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-gray-300 uppercase tracking-widest pl-1">항목 명칭</label>
                                <input 
                                   value={opt.label}
                                   onChange={e => {
                                      const next = [...pollOptions];
                                      next[idx].label = e.target.value;
                                      setPollOptions(next);
                                   }}
                                   className="w-full font-black text-gray-900 outline-none text-xl placeholder:text-gray-200 leading-tight"
                                   placeholder="옵션 입력"
                                />
                             </div>
                             <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-gray-300 uppercase tracking-widest pl-1">투표 가이드라인</label>
                                <textarea 
                                   value={opt.desc}
                                   onChange={e => {
                                      const next = [...pollOptions];
                                      next[idx].desc = e.target.value;
                                      setPollOptions(next);
                                   }}
                                   className="w-full text-sm text-gray-500 bg-transparent resize-none outline-none leading-relaxed font-bold placeholder:text-gray-200"
                                   placeholder="설명을 입력하세요"
                                   rows={3}
                                />
                             </div>
                          </div>
                          {pollOptions.length > 2 && (
                             <button 
                                onClick={() => setPollOptions(pollOptions.filter((_, i) => i !== idx))}
                                className="opacity-0 group-hover:opacity-100 absolute top-4 right-4 text-gray-200 hover:text-red-500 transition-all"
                             >
                                <FontAwesomeIcon icon={faTrash} size="xs" />
                             </button>
                          )}
                       </div>
                    ))}
                 </div>
              </section>

              {/* 주관식 질문 설정 */}
              <section className="space-y-8">
                 <div className="flex flex-col gap-2">
                    <h3 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-xl shadow-lg ring-4 ring-indigo-100">💬</div>
                      심층 진단 질문
                    </h3>
                    <p className="text-sm text-gray-400 font-medium pl-14">전문가들에게 직접 물어보고 싶은 내용을 적어주세요</p>
                 </div>
                 
                 <div className="space-y-4">
                    {auditQuestions.map((q, idx) => (
                       <div key={idx} className="flex gap-4 group">
                          <div className="shrink-0 w-14 h-14 bg-slate-950 text-white rounded-[1.2rem] flex items-center justify-center font-black text-lg shadow-xl shadow-slate-200">Q{idx+1}</div>
                          <div className="flex-1 relative">
                             <Input 
                                value={q}
                                onChange={e => {
                                   const next = [...auditQuestions];
                                   next[idx] = e.target.value;
                                   setAuditQuestions(next);
                                }}
                                placeholder="질문 내용을 입력하세요 (예: 가장 인상적인 부분은 어디인가요?)"
                                className="h-14 pr-14 rounded-2xl border-2 border-gray-100 focus:border-indigo-600 text-lg font-bold transition-all px-6 shadow-sm"
                             />
                             {auditQuestions.length > 1 && (
                                <button 
                                   onClick={() => setAuditQuestions(auditQuestions.filter((_, i) => i !== idx))}
                                   className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-200 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                >
                                   <FontAwesomeIcon icon={faTrash} />
                                </button>
                             )}
                          </div>
                       </div>
                    ))}
                    <Button 
                       variant="ghost" 
                       onClick={() => setAuditQuestions([...auditQuestions, ""])}
                       className="w-full h-14 rounded-2xl border-2 border-dashed border-gray-100 text-gray-400 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600 font-bold transition-all"
                       disabled={auditQuestions.length >= 5}
                    >
                       <FontAwesomeIcon icon={faPlus} className="mr-2" /> 새 질문 추가하기
                    </Button>
                 </div>
              </section>

              {/* 성장하기 갤러리 */}
              <section className="p-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-[3rem] text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl shadow-orange-200 relative overflow-hidden group">
                 <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[80px] -mr-32 -mt-32" />
                 <div className="flex items-center gap-6 relative z-10">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center text-3xl shadow-xl">🌱</div>
                    <div className="space-y-1">
                       <h3 className="font-black text-2xl tracking-tight">성장하기 갤러리에 동시 공개</h3>
                       <p className="text-orange-50/80 text-sm font-medium">Vibefolio AI 피드백과 동료들의 소중한 조언을 함께 받으시겠습니까?</p>
                    </div>
                 </div>
                 <button 
                    type="button"
                    onClick={() => setIsFeedbackRequested(!isFeedbackRequested)}
                    className={cn("w-20 h-10 rounded-full transition-all relative flex items-center px-1.5 shadow-inner z-10", isFeedbackRequested ? "bg-white" : "bg-black/20")}
                 >
                    <div className={cn("w-7 h-7 rounded-full shadow-lg transition-all flex items-center justify-center font-black text-[10px]", isFeedbackRequested ? "translate-x-10 bg-orange-600 text-white" : "translate-x-0 bg-white text-gray-300")}>
                       {isFeedbackRequested ? "YES" : "NO"}
                    </div>
                 </button>
              </section>

              <div className="flex justify-between pt-6">
                <Button variant="ghost" onClick={() => setAuditStep(2)} className="h-16 px-10 rounded-3xl font-black text-gray-400 hover:text-gray-900 text-lg">
                   <FontAwesomeIcon icon={faArrowLeft} className="mr-3" /> 이전 단계
                </Button>
                <Button onClick={handleSubmit} disabled={isSubmitting} className="h-20 px-16 rounded-[2.5rem] bg-slate-950 hover:bg-black text-white text-2xl font-black transition-all shadow-2xl shadow-slate-300 hover:scale-105 active:scale-95 flex items-center gap-4">
                  {isSubmitting ? (
                     <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : <ChefHat className="w-8 h-8" />}
                  진단 의뢰 게시하기
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-6 h-16">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-black transition-colors flex items-center gap-2">
          <FontAwesomeIcon icon={faArrowLeft} />
          <span className="text-sm font-bold uppercase tracking-wider">Back</span>
        </button>
        <h1 className="text-sm font-black text-gray-900 uppercase tracking-[0.2em]">
          {isAuditMode ? "평가 의뢰하기" : isVersionMode ? "새 버전 등록" : "프로젝트 등록"}
        </h1>
        <div className="w-10" />
      </header>

      <main className="max-w-4xl mx-auto py-12 px-6">
        {isAuditMode ? renderAuditSettings() : (
          <div className="space-y-12">
            {step === 'content' ? (
              <>
                <div className="space-y-4">
                   <Input 
                     autoFocus
                     placeholder="프로젝트 제목" 
                     className="h-20 text-4xl font-black border-none bg-transparent focus-visible:ring-0 px-0 placeholder:text-gray-200" 
                     value={title}
                     onChange={e => setTitle(e.target.value)}
                   />
                   <div className="h-px bg-gray-100" />
                </div>
                <TiptapEditor 
                  content={content} 
                  onChange={setContent} 
                  placeholder="당신의 멋진 에디터 이야기를 들려주세요..." 
                />
                <div className="flex justify-end pt-8">
                  <Button onClick={() => setStep('info')} className="bg-green-600 hover:bg-green-700 text-white px-10 h-14 rounded-full text-lg font-bold">
                    다음 단계로
                  </Button>
                </div>
              </>
            ) : (
              <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-300">
                 {/* 발행용 각종 설정 (커버, 장르 등) */}
                 <section className="space-y-6">
                    <h2 className="text-2xl font-black text-gray-900">발행 설정</h2>
                    <div className="aspect-video bg-gray-100 rounded-[2rem] border-2 border-dashed border-gray-200 flex items-center justify-center relative overflow-hidden group">
                       {coverPreview ? (
                         <img src={coverPreview} className="w-full h-full object-cover" />
                       ) : (
                         <div className="text-center">
                            <FontAwesomeIcon icon={faCamera} className="text-gray-300 text-4xl mb-2" />
                            <p className="text-sm text-gray-400 font-bold">커버 이미지를 등록해주세요</p>
                         </div>
                       )}
                       <label className="absolute inset-0 cursor-pointer flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="outline" className="bg-white text-black">이미지 선택</Button>
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
                        <button key={cat.id} onClick={() => setSelectedGenres(prev => prev.includes(cat.id) ? prev.filter(i => i !== cat.id) : [...prev, cat.id])} className={cn("px-4 py-2 rounded-full border-2 transition-all font-bold text-sm", selectedGenres.includes(cat.id) ? "bg-green-500 border-green-500 text-white" : "border-gray-200 text-gray-400 hover:border-green-200")}>
                          {cat.label}
                        </button>
                      ))}
                   </div>
                 </section>

                 <section className="p-6 bg-orange-50 rounded-3xl border border-orange-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-xl shadow-sm">🌱</div>
                       <div>
                          <h3 className="font-bold text-gray-900">성장 피드백 요청</h3>
                          <p className="text-xs text-gray-500 mt-0.5">성장하기 탭에 노출되어 동료들의 조언을 받을 수 있습니다.</p>
                       </div>
                    </div>
                    <button 
                       type="button"
                       onClick={() => setIsFeedbackRequested(!isFeedbackRequested)}
                       className={cn("w-14 h-8 rounded-full transition-all relative flex items-center px-1", isFeedbackRequested ? "bg-orange-500" : "bg-gray-200")}
                    >
                       <div className={cn("w-6 h-6 bg-white rounded-full shadow-sm transition-all", isFeedbackRequested ? "translate-x-6" : "translate-x-0")} />
                    </button>
                 </section>

                 <Button disabled={isSubmitting} onClick={handleSubmit} className="w-full h-16 rounded-full bg-black text-white text-xl font-black hover:bg-slate-900 transition-all">
                    지금 발행하기
                 </Button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
