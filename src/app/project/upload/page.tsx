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
import dynamic from "next/dynamic";
import { genreCategories, fieldCategories } from "@/lib/categoryMap";

// Dynamic Imports
const TiptapEditor = dynamic(() => import("@/components/editor/TiptapEditor.client"), { ssr: false });
const CollaboratorManager = dynamic(() => import("@/components/CollaboratorManager"), { ssr: false });

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
  const [isFeedbackRequested, setIsFeedbackRequested] = useState(isAuditMode);
  const [auditType, setAuditType] = useState<'link' | 'image' | 'video'>('link');
  const [mediaData, setMediaData] = useState<string | string[]>(auditType === 'image' ? [] : "");
  const [isAB, setIsAB] = useState(false);
  const [mediaDataB, setMediaDataB] = useState<string | string[]>(auditType === 'image' ? [] : "");
  const [customCategories, setCustomCategories] = useState<any[]>([
    { id: 'creative', label: '독창성', desc: '아이디어가 참신한가요?' },
    { id: 'visual', label: '완성도', desc: '시각적 완성도가 높은가요?' },
    { id: 'usability', label: '시장성', desc: '실제 사용 가치가 있나요?' }
  ]);
  const [pollOptions, setPollOptions] = useState<any[]>([
    { id: 'p1', label: '당장 쓸게요!', desc: '매우 만족스러운 결과물입니다.', image_url: '/review/a1.jpeg' },
    { id: 'p2', label: '조금 아쉬워요', desc: '개선이 필요해 보입니다.', image_url: '/review/a2.jpeg' }
  ]);
  const [pollDesc, setPollDesc] = useState("이 작품에 대해 어떻게 생각하시나요?");
  const [auditQuestions, setAuditQuestions] = useState<string[]>(["가장 인상적인 부분은 어디인가요?"]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // 모드에 따른 초기 테마 설정
  useEffect(() => {
    if (isAuditMode) {
      setIsFeedbackRequested(true);
    }
  }, [isAuditMode]);

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
        visibility,
        category_id: selectedGenres[0],
        custom_data: {
          genres: selectedGenres,
          fields: selectedFields,
          is_feedback_requested: isFeedbackRequested,
          audit_config: isFeedbackRequested ? {
            type: auditType,
            mediaA: mediaData,
            mediaB: isAB ? mediaDataB : null,
            isAB,
            categories: customCategories,
            poll: { desc: pollDesc, options: pollOptions },
            questions: auditQuestions
          } : null
        },
        is_growth_requested: isFeedbackRequested || isAuditMode,
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

  const renderAuditSettings = () => (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* 1. 기본 정보 */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
           <div className="w-12 h-12 rounded-2xl bg-orange-500 text-white flex items-center justify-center text-xl shadow-lg ring-4 ring-orange-100">🕵️</div>
           <h2 className="text-3xl font-black text-gray-900">제 평가는요? 의뢰 정보</h2>
        </div>
        <Input 
          placeholder="진단받을 제목을 입력하세요" 
          value={title} 
          onChange={e => setTitle(e.target.value)}
          className="h-16 text-2xl font-bold border-2 focus:border-orange-500 rounded-2xl px-6"
        />
        <Input 
          placeholder="전문가들이 참고할 간단한 요약을 적어주세요" 
          value={summary} 
          onChange={e => setSummary(e.target.value)}
          className="h-14 text-lg border-2 focus:border-orange-500 rounded-xl px-6"
        />
      </section>

      {/* 2. 진단 미디어 설정 */}
      <section className="p-8 bg-slate-900 rounded-[2.5rem] text-white shadow-2xl space-y-8">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-black flex items-center gap-2">
            <FontAwesomeIcon icon={faCamera} className="text-orange-500" />
            진단 미디어 설정
          </h3>
          <button onClick={() => setIsAB(!isAB)} className={cn("px-4 py-2 rounded-full text-xs font-bold transition-all", isAB ? "bg-orange-500 text-white" : "bg-white/10 text-gray-400")}>
            A/B 테스트 {isAB ? "활성" : "비활성"}
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {['link', 'image', 'video'].map((t) => (
            <button key={t} onClick={() => setAuditType(t as any)} className={cn("py-4 rounded-2xl border-2 transition-all font-bold text-sm", auditType === t ? "bg-white text-black border-orange-500 shadow-xl" : "bg-white/5 border-white/5 text-gray-500 hover:bg-white/10")}>
              {t === 'link' ? "웹 링크" : t === 'image' ? "이미지 갤러리" : "유튜브 영상"}
            </button>
          ))}
        </div>

        {/* Media Input Area */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="space-y-2">
              <label className="text-[10px] font-black text-orange-500 uppercase">Version A (필수)</label>
              {auditType === 'image' ? (
                <div className="flex flex-wrap gap-2 p-4 bg-white/5 rounded-2xl border border-white/10">
                   {Array.isArray(mediaData) && mediaData.map((img, i) => (
                     <div key={i} className="w-16 h-16 rounded-lg overflow-hidden relative">
                       <img src={img} className="w-full h-full object-cover" />
                     </div>
                   ))}
                   <label className="w-16 h-16 rounded-lg border-2 border-dashed border-white/20 flex items-center justify-center cursor-pointer hover:bg-white/10">
                      <FontAwesomeIcon icon={faPlus} className="text-gray-500" />
                      <input type="file" multiple className="hidden" onChange={async e => {
                         if (e.target.files) {
                           const urls = await Promise.all(Array.from(e.target.files).map(f => uploadImage(f)));
                           setMediaData([...(Array.isArray(mediaData) ? mediaData : []), ...urls]);
                         }
                      }} />
                   </label>
                </div>
              ) : (
                <Input className="bg-white/5 border-white/10 h-12 text-white" placeholder="URL을 입력하세요" value={typeof mediaData === 'string' ? mediaData : ''} onChange={e => setMediaData(e.target.value)} />
              )}
           </div>
           {isAB && (
             <div className="space-y-2">
                <label className="text-[10px] font-black text-blue-400 uppercase">Version B (비교군)</label>
                <Input className="bg-white/5 border-white/10 h-12 text-white" placeholder="URL을 입력하세요" value={typeof mediaDataB === 'string' ? mediaDataB : ''} onChange={e => setMediaDataB(e.target.value)} />
             </div>
           )}
        </div>
      </section>

      {/* 3. 평가 항목 구성 */}
      <section className="space-y-8">
         <div className="flex items-center gap-2">
            <h3 className="text-xl font-black text-gray-900">심사 기준 설정</h3>
            <span className="text-xs text-gray-400 font-medium">유저들이 어떤 기준으로 평가할지 정해주세요</span>
         </div>
         
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {customCategories.map((cat, idx) => (
              <div key={idx} className="flex items-center gap-4 p-4 border-2 rounded-2xl border-gray-100 focus-within:border-orange-500 transition-all bg-white">
                <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-500"><FontAwesomeIcon icon={faStar} /></div>
                <div className="flex-1">
                  <input value={cat.label} onChange={e => {
                    const next = [...customCategories];
                    next[idx].label = e.target.value;
                    setCustomCategories(next);
                  }} className="font-bold text-gray-900 outline-none w-full bg-transparent" placeholder="항목 이름 (예: 독창성)" />
                  <input value={cat.desc} onChange={e => {
                    const next = [...customCategories];
                    next[idx].desc = e.target.value;
                    setCustomCategories(next);
                  }} className="text-xs text-gray-500 outline-none w-full bg-transparent" placeholder="상세 설명" />
                </div>
              </div>
            ))}
         </div>
      </section>

      {/* 4. 스티커 투표 설정 */}
      <section className="space-y-8">
         <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
               <h3 className="text-xl font-black text-gray-900">스티커 투표 구성</h3>
               <span className="text-xs text-gray-400 font-medium">유저들의 직관적인 반응을 수집하세요</span>
            </div>
         </div>
         <div className="p-8 bg-blue-50 rounded-[2.5rem] border border-blue-100 space-y-6">
            <Input 
               value={pollDesc} 
               onChange={e => setPollDesc(e.target.value)}
               className="h-12 text-lg font-bold border-none bg-white rounded-xl shadow-sm px-6"
               placeholder="투표 질문을 입력하세요 (예: 이 작품에 대해 어떻게 생각하시나요?)"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {pollOptions.map((opt, idx) => (
                  <div key={opt.id} className="bg-white p-4 rounded-2xl shadow-sm space-y-3">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-bold">#{idx+1}</div>
                        <input 
                           value={opt.label}
                           onChange={e => {
                              const next = [...pollOptions];
                              next[idx].label = e.target.value;
                              setPollOptions(next);
                           }}
                           className="flex-1 font-bold text-gray-900 outline-none"
                           placeholder="옵션 라벨"
                        />
                     </div>
                     <textarea 
                        value={opt.desc}
                        onChange={e => {
                           const next = [...pollOptions];
                           next[idx].desc = e.target.value;
                           setPollOptions(next);
                        }}
                        className="w-full text-xs text-gray-500 bg-gray-50 rounded-lg p-2 resize-none outline-none"
                        placeholder="상세 설명"
                        rows={2}
                     />
                  </div>
               ))}
            </div>
         </div>
      </section>

      {/* 5. 주관식 질문 설정 */}
      <section className="space-y-8">
         <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
               <h3 className="text-xl font-black text-gray-900">심층 질문 리스트</h3>
               <span className="text-xs text-gray-400 font-medium">전문가들에게 직접 물어보고 싶은 내용을 적어주세요</span>
            </div>
            <Button 
               variant="outline" 
               size="sm" 
               onClick={() => setAuditQuestions([...auditQuestions, ""])}
               className="rounded-full border-gray-200"
            >
               <FontAwesomeIcon icon={faPlus} className="mr-2" /> 질문 추가
            </Button>
         </div>
         
         <div className="space-y-4">
            {auditQuestions.map((q, idx) => (
               <div key={idx} className="flex gap-4 animate-in slide-in-from-right-4">
                  <div className="shrink-0 w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black">Q{idx+1}</div>
                  <div className="flex-1 relative">
                     <Input 
                        value={q}
                        onChange={e => {
                           const next = [...auditQuestions];
                           next[idx] = e.target.value;
                           setAuditQuestions(next);
                        }}
                        placeholder="질문 내용을 입력하세요"
                        className="h-12 pr-12 rounded-2xl border-2 focus:border-slate-900"
                     />
                     {auditQuestions.length > 1 && (
                        <button 
                           onClick={() => setAuditQuestions(auditQuestions.filter((_, i) => i !== idx))}
                           className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-red-500 transition-colors"
                        >
                           <FontAwesomeIcon icon={faTrash} />
                        </button>
                     )}
                  </div>
               </div>
            ))}
         </div>
      </section>

      <Button onClick={handleSubmit} className="w-full h-16 rounded-[2rem] bg-orange-600 hover:bg-orange-700 text-xl font-black text-white shadow-xl shadow-orange-200">
        진단 의뢰 게시하기
      </Button>
    </div>
  );

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
