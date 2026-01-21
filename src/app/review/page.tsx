"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { 
  X, 
  ChevronLeft, 
  ArrowLeft, 
  Maximize2, 
  Monitor, 
  Smartphone, 
  ChefHat,
  Trophy,
  SplitSquareHorizontal,
  LayoutTemplate,
  Star,
  CheckCircle,
  MessageSquareText,
  ClipboardCheck,
  PartyPopper,
  Compass,
  History
} from 'lucide-react';

// Import existing components for reuse
import { MichelinRating } from '@/components/MichelinRating';
import { FeedbackPoll } from '@/components/FeedbackPoll';
import { ProposalModal } from '@/components/ProposalModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from "@/components/ui/dialog";

// Types
type ReviewPhase = 'cloche' | 'viewer';
type ViewMode = 'split' | 'a' | 'b';
type VoteChoice = 'a' | 'b' | 'similar' | null;

interface ProjectData {
  project_id: number;
  title: string;
  user_id: string; // Owner ID
  custom_data?: {
    showMichelin?: boolean;
    showStickers?: boolean;
    showProposal?: boolean;
    isABMode?: boolean;
    url1?: string;
    url2?: string;
    publicFeedback?: boolean;
  } | null;
}

function ReviewContent() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  
  // URL Params
  const paramProjectId = params.get('projectId');
  const userUrl1 = params.get('url') || params.get('url1');
  const userUrl2 = params.get('url2');
  const modeParam = params.get('mode'); // 'single' | 'ab'

  // Determine Project ID (from param or pathname)
  const projectId = React.useMemo(() => {
    if (paramProjectId) return paramProjectId;
    
    // Try to extract ID from pathname (e.g., "/60")
    const cleanPath = pathname.replace(/\/$/, ""); // Remove trailing slash
    const parts = cleanPath.split('/').filter(Boolean);
    if (parts.length === 1 && !isNaN(Number(parts[0]))) {
      return parts[0];
    }
    // Handle Case where it's /review/60
    if (parts.length === 2 && parts[0] === 'review' && !isNaN(Number(parts[1]))) {
      return parts[1];
    }
    return null;
  }, [paramProjectId, pathname]);

  // State
  const [phase, setPhase] = useState<ReviewPhase>('cloche');
  const [project, setProject] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [evaluationStep, setEvaluationStep] = useState<number>(1);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [vote, setVote] = useState<VoteChoice>(null);
  
  // Modals
  const [proposalOpen, setProposalOpen] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);

  // Computed from Project settings & URL params
  const config = React.useMemo(() => {
    if (!project?.custom_data) return {};
    if (typeof project.custom_data === 'string') {
      try {
        return JSON.parse(project.custom_data);
      } catch (e) {
        console.error("Failed to parse custom_data:", e);
        return {};
      }
    }
    return project.custom_data;
  }, [project]);

  // Dynamic Step Generation
  const availableSteps = React.useMemo(() => {
    const s = [];
    if (config.showMichelin !== false) s.push({ id: 'rating', label: '1차: 분석', icon: Star });
    if (config.showStickers !== false) s.push({ id: 'voting', label: '2차: 판정', icon: LayoutTemplate });
    if (config.showProposal !== false) s.push({ id: 'proposal', label: '3차: 의견', icon: MessageSquareText });
    return s;
  }, [config]);

  // Clamp evaluationStep if steps change
  useEffect(() => {
    if (evaluationStep > availableSteps.length && availableSteps.length > 0) {
      setEvaluationStep(availableSteps.length);
    }
  }, [availableSteps.length, evaluationStep]);

  // Map evaluationStep to current index
  const currentStepIndex = Math.max(0, Math.min(evaluationStep - 1, availableSteps.length - 1));
  const currentStep = availableSteps[currentStepIndex];

  const isAB = config.isABMode || modeParam === 'ab' || !!userUrl2;
  
  // URL Logic: custom_data.url1 -> Query Param -> Project Main Image/URL
  const url1 = React.useMemo(() => {
    if (config.url1) return config.url1;
    if (userUrl1) return decodeURIComponent(userUrl1);
    
    // Fallback to project image/url columns
    const p = project as any;
    if (!p) return null;
    return p.url || p.image_url || p.thumbnail_url || null;
  }, [config.url1, userUrl1, project]);

  const url2 = config.url2 || (userUrl2 ? decodeURIComponent(userUrl2) : null);

  // 1. Auth & Data Fetch
  useEffect(() => {
    const init = async () => {
      console.log("[Review] Detecting projectId...", { 
        paramProjectId, 
        pathname, 
        detectedId: projectId 
      });

      // Project Data Fetch
      if (!projectId) {
        console.warn("[Review] No projectId found.");
        setLoading(false);
        return;
      }

      console.log("[Review] Fetching project data for ID:", projectId);
      const { data, error } = await supabase
        .from('Project')
        .select('*')
        .eq('project_id', Number(projectId))
        .single();

      if (error || !data) {
        console.error("[Review] Project fetch error:", error);
        toast.error(`프로젝트 정보를 불러올 수 없습니다. (ID: ${projectId})`);
        
        // Show more details if it's a permission error
        if (error?.code === 'PGRST116') {
           console.log("No rows found - likely RLS or deleted project.");
        }
      } else {
        console.log("[Review] Project data loaded:", data);
        setProject(data as any);
      }
      setLoading(false);
    };

    init();
  }, [projectId]); // Simplified dependency array to avoid unnecessary re-runs



  if (loading) return <div className="h-[100dvh] bg-slate-950 flex items-center justify-center text-white font-black tracking-widest text-xl animate-pulse">LOADING...</div>;
  if (!url1) return <div className="h-[100dvh] bg-slate-950 flex items-center justify-center text-white">유효한 URL이 없습니다.</div>;

  return (
    <div className="relative w-full h-[100dvh] overflow-hidden bg-slate-950 text-slate-900 font-sans">
      
      {/* Phase 2 Layered Viewer */}
      <div className={cn(
        "absolute inset-0 transition-opacity duration-1000",
        phase === 'viewer' ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      )}>
        {/* Viewer Content - Full Screen Iframe */}
        <div className="w-full h-full bg-slate-100 flex items-center justify-center overflow-hidden">
            <div className="flex w-full h-full">
                {/* View A */}
                <div className={cn(
                  "h-full relative",
                  isAB ? "w-1/2 border-r border-slate-200" : "w-full"
                )}>
                  <iframe 
                    src={url1 || undefined} 
                    className="w-full h-full border-none"
                    sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
                    title="Preview A" 
                  />
                  {isAB && (
                    <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-md text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest z-10 border border-white/20">
                      Option A
                    </div>
                  )}
                </div>

                {/* View B */}
                {isAB && url2 && (
                  <div className="h-full w-1/2 relative">
                    <iframe 
                      src={url2 || undefined} 
                      className="w-full h-full border-none"
                      sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
                      title="Preview B" 
                    />
                    <div className="absolute top-4 left-4 bg-amber-500/80 backdrop-blur-md text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest z-10 border border-white/20">
                      Option B
                    </div>
                  </div>
                )}
            </div>
        </div>


        {/* Single Floating Evaluation Button */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[40]">
           <motion.button
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsReviewOpen(true)}
              className="flex items-center gap-3 px-8 py-5 bg-slate-900 text-white rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.4)] hover:shadow-orange-500/40 transition-all group"
           >
              <ChefHat size={20} className="text-orange-400" />
              <span className="text-lg font-black tracking-tight">평가하기</span>
           </motion.button>
        </div>

        {/* Small Exit Button */}
        <div className="absolute top-6 right-6 z-[40]">
           <Button 
             variant="secondary" 
             size="icon" 
             className="w-12 h-12 rounded-full bg-white/80 backdrop-blur-md shadow-lg border border-slate-200 text-slate-900 hover:bg-white"
             onClick={() => setPhase('cloche')}
           >
              <X size={20} />
           </Button>
        </div>

      </div>

      {/* phase cloche */}
      <AnimatePresence>
        {phase === 'cloche' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ y: "-100%", opacity: 0, transition: { duration: 0.8, ease: [0.33, 1, 0.68, 1] } }}
            className="absolute inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center p-8 text-center"
          >
             <motion.div 
               initial={{ y: 20, opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               transition={{ delay: 0.2 }}
             >
                <h1 className="text-3xl md:text-6xl font-black text-white mb-3 tracking-tighter">
                   <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-red-500 to-purple-600">제평가는요?</span>
                </h1>
                <p className="text-slate-400 text-sm md:text-lg font-medium mb-16 max-w-md mx-auto leading-relaxed">
                   전문가와 유저의 시선으로<br/>
                   당신의 작품을 미슐랭 급으로 진단합니다.
                </p>
             </motion.div>

             <div className="flex items-center justify-center gap-8 md:gap-16 mb-20 relative">
                <motion.div 
                  className="cursor-pointer group relative"
                  whileHover={{ scale: 1.05, y: -10 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setPhase('viewer')}
                >
                   <ClocheIcon className="w-40 h-40 md:w-72 md:h-72 drop-shadow-[0_30px_60px_rgba(249,115,22,0.4)] filter" />
                   {isAB && <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-slate-500 font-black text-[10px] uppercase tracking-[0.3em]">Selection A</div>}
                </motion.div>

                {isAB && (
                   <motion.div 
                    className="cursor-pointer group relative"
                    whileHover={{ scale: 1.05, y: -10 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setPhase('viewer')}
                  >
                    <ClocheIcon className="w-40 h-40 md:w-72 md:h-72 drop-shadow-[0_30px_60px_rgba(59,130,246,0.4)] filter" />
                    <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-slate-500 font-black text-[10px] uppercase tracking-[0.3em]">Selection B</div>
                  </motion.div>
                )}
             </div>

             <motion.button
                onClick={() => setPhase('viewer')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-12 py-5 bg-white text-slate-900 rounded-full font-black text-xl shadow-[0_20px_50px_rgba(255,255,255,0.2)] hover:shadow-[0_30px_70px_rgba(255,255,255,0.4)] transition-all uppercase tracking-widest"
             >
                Start Evaluation
             </motion.button>
          </motion.div>
        )}
      </AnimatePresence>


      {/* --- Phase 3: Evaluation Sheet --- */}
      <AnimatePresence>
        {isReviewOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setIsReviewOpen(false)}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[10000]"
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-[10001] bg-white rounded-t-[3rem] shadow-[0_-20px_80px_rgba(0,0,0,0.5)] max-h-[92dvh] overflow-hidden flex flex-col"
            >
               {/* Drag Handle */}
               <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mt-4 mb-2 shrink-0" />

               {/* Sequential Step Indicator */}
               <div className="px-6 py-4 border-b border-slate-100 bg-white">
                  <div className="flex items-center justify-between max-w-md mx-auto relative">
                      {/* Progress Line */}
                      <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-100 -translate-y-1/2 z-0" />
                      <div 
                        className="absolute top-1/2 left-0 h-0.5 bg-slate-900 -translate-y-1/2 z-0 transition-all duration-500" 
                        style={{ 
                          width: availableSteps.length > 1 
                            ? `${((evaluationStep - 1) / (availableSteps.length - 1)) * 100}%` 
                            : '100%' 
                        }}
                      />

                      {availableSteps.map((item, index) => {
                        const stepNum = index + 1;
                        const isPast = evaluationStep > stepNum;
                        const isCurrent = evaluationStep === stepNum;
                        
                        return (
                          <button
                            key={item.id}
                            onClick={() => setEvaluationStep(stepNum as any)}
                            className="relative z-10 flex flex-col items-center gap-1.5 group"
                          >
                             <div className={cn(
                               "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
                               isCurrent ? "bg-slate-900 text-white shadow-xl scale-110" : 
                               isPast ? "bg-green-500 text-white" : "bg-white border-2 border-slate-100 text-slate-300"
                             )}>
                                {isPast ? <CheckCircle size={18} /> : <item.icon size={18} />}
                             </div>
                             <span className={cn(
                               "text-[10px] font-black transition-colors uppercase tracking-tighter",
                               isCurrent ? "text-slate-900" : "text-slate-400"
                             )}>
                                {item.label}
                             </span>
                          </button>
                        );
                      })}
                  </div>
               </div>

                {/* Sheet Content */}
               <div className="overflow-y-auto flex-1 p-6 md:p-10 space-y-10 bg-white pb-32">
                  
                  {currentStep?.id === 'rating' && (
                    <motion.div 
                      key="rating"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="space-y-8"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <Badge className="bg-slate-900">1차 분석</Badge>
                        <h4 className="text-xl font-black text-slate-900">기획 및 완성도 전문 진단</h4>
                      </div>
                      {isAB && (
                        <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden relative group">
                            <div className="relative z-10">
                              <h4 className="text-xl font-black text-white mb-6 flex items-center gap-2">
                                <SplitSquareHorizontal size={24} className="text-blue-400"/>
                                어느 프로젝트가 더 뛰어난가요?
                              </h4>
                                <div className="grid grid-cols-3 gap-4">
                                    <Button 
                                        variant={vote === 'a' ? 'default' : 'outline'}
                                        className={cn("h-20 rounded-2xl flex flex-col gap-1 border-white/20", vote === 'a' ? "bg-blue-600 text-white border-blue-600" : "bg-white/5 text-white hover:bg-white/10")}
                                        onClick={() => setVote('a')}
                                    >
                                        <span className="text-lg font-black">Option A</span>
                                        <span className="text-[10px] opacity-60">기존 기획안</span>
                                    </Button>
                                    <Button 
                                        variant={vote === 'similar' ? 'default' : 'outline'}
                                        className={cn("h-20 rounded-2xl flex flex-col gap-1 border-white/20", vote === 'similar' ? "bg-slate-700 text-white border-slate-700" : "bg-white/5 text-white hover:bg-white/10")}
                                        onClick={() => setVote('similar')}
                                    >
                                        <span className="text-lg font-black">비슷함</span>
                                        <span className="text-[10px] opacity-60">우열 가리기 힘듦</span>
                                    </Button>
                                    <Button 
                                        variant={vote === 'b' ? 'default' : 'outline'}
                                        className={cn("h-20 rounded-2xl flex flex-col gap-1 border-white/20", vote === 'b' ? "bg-amber-600 text-white border-amber-600" : "bg-white/5 text-white hover:bg-white/10")}
                                        onClick={() => setVote('b')}
                                    >
                                        <span className="text-lg font-black">Option B</span>
                                        <span className="text-[10px] opacity-60">신규 제안안</span>
                                    </Button>
                                </div>
                            </div>
                        </div>
                      )}
                    {projectId && <MichelinRating projectId={projectId as string} isDemo={false} />}
                  </motion.div>
                )}

                {currentStep?.id === 'voting' && (
                  <motion.div 
                    key="voting"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center gap-3">
                      <Badge className="bg-green-600">2차 판정</Badge>
                      <h4 className="text-xl font-black text-slate-900">합격 / 보류 / 불합격 최종 결정</h4>
                    </div>
                    {projectId && <FeedbackPoll projectId={projectId as string} />}
                  </motion.div>
                )}

                {currentStep?.id === 'proposal' && (
                  <motion.div 
                    key="proposal"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-center py-10"
                  >
                     <div className="flex items-center gap-3 mb-10 w-full">
                      <Badge className="bg-indigo-600">3차 의견</Badge>
                      <h4 className="text-xl font-black text-slate-900">종합 심사평 및 솔루션 제안</h4>
                    </div>
                     <div className="w-24 h-24 rounded-[2rem] bg-indigo-50 flex items-center justify-center mb-6 shadow-xl border border-indigo-100">
                        <span className="text-5xl">📧</span>
                     </div>
                     <h4 className="text-2xl font-black text-slate-900 mb-2">시크릿 심사평</h4>
                     <p className="text-slate-500 text-center max-w-sm mb-10 leading-relaxed font-bold">
                        작성하신 심사평은 <span className="text-indigo-600 font-black">개발자에게만 비공개로</span> 전달됩니다.<br/>
                        발전을 위한 솔직한 조언을 남겨주세요.
                     </p>
                     <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 mb-8 max-w-sm">
                        <p className="text-[10px] text-amber-700 font-bold leading-tight">
                           ⚠️ 악성 댓글, 비하 발언, 욕설 등은 인공지능에 의해 자동으로 필터링 및 삭제될 수 있으며, 제재 대상이 될 수 있습니다.
                        </p>
                     </div>
                     <Button 
                       onClick={() => setProposalOpen(true)}
                       className="px-12 py-6 h-auto rounded-3xl bg-slate-900 border-b-4 border-black hover:bg-black text-white font-black text-lg transition-all shadow-2xl active:translate-y-1 active:border-b-0"
                     >
                        심사평 작성하기
                     </Button>
                  </motion.div>
                )}

               </div>

                {/* Bottom CTA Bar */}
               <div className="absolute bottom-0 left-0 right-0 p-6 bg-white/90 backdrop-blur-xl border-t border-slate-100 flex items-center justify-between gap-6">
                  <div className="hidden md:block">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Step {evaluationStep} of {availableSteps.length}</p>
                     <p className="text-sm font-bold text-slate-900 mt-1">심사 결과는 단계별로 즉시 반영됩니다.</p>
                  </div>
                  
                  <div className="flex gap-3 flex-1 md:flex-none">
                    {evaluationStep > 1 && (
                      <Button 
                        variant="outline"
                        className="h-14 px-6 rounded-2xl border-slate-200 font-bold"
                        onClick={() => setEvaluationStep(prev => (prev - 1) as any)}
                      >
                        이전
                      </Button>
                    )}
                    <Button 
                      className={cn(
                        "flex-1 md:px-16 h-14 rounded-2xl font-black text-white shadow-2xl transition-all uppercase tracking-widest text-base",
                        evaluationStep === availableSteps.length ? "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200" : "bg-slate-950 hover:bg-slate-800 shadow-slate-200"
                      )}
                      onClick={() => {
                        if (evaluationStep < availableSteps.length) {
                          setEvaluationStep(prev => (prev + 1) as any);
                        } else {
                          setShowResultModal(true);
                        }
                      }}
                    >
                      {evaluationStep < availableSteps.length ? "다음 단계로" : "평가 완료"}
                    </Button>
                  </div>
               </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      
      {project && proposalOpen && (
        <ProposalModal 
          open={proposalOpen} 
          onOpenChange={setProposalOpen} 
          projectId={String(project.project_id)}
          receiverId={project.user_id}
          projectTitle={project.title}
        />
      )}

      {showResultModal && (
        <FinalReviewModal 
          open={showResultModal} 
          onOpenChange={setShowResultModal}
          projectTitle={project?.title || ""}
          onClose={() => setIsReviewOpen(false)}
        />
      )}

    </div>
  );
}

export default function ReviewPage() {
    return (
        <Suspense fallback={<div className="h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>}>
            <ReviewContent />
        </Suspense>
    );
}

function ClocheIcon({ className }: { className?: string }) {
   return (
      <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
         <defs>
            <linearGradient id="clocheSilver" x1="0" y1="0" x2="200" y2="200" gradientUnits="userSpaceOnUse">
               <stop offset="0" stopColor="#F8FAFC" />
               <stop offset="0.4" stopColor="#CBD5E1" />
               <stop offset="0.6" stopColor="#94A3B8" />
               <stop offset="1" stopColor="#475569" />
            </linearGradient>
            <radialGradient id="clocheShine" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(70 70) rotate(45) scale(80)">
               <stop offset="0" stopColor="white" stopOpacity="0.8"/>
               <stop offset="1" stopColor="white" stopOpacity="0"/>
            </radialGradient> radialGradient
         </defs>
         <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="5" />
            <feOffset dx="0" dy="5" result="offsetblur" />
            <feComponentTransfer>
               <feFuncA type="linear" slope="0.3" />
            </feComponentTransfer>
            <feMerge> 
               <feMergeNode />
               <feMergeNode in="SourceGraphic" /> 
            </feMerge>
         </filter>

         <circle cx="100" cy="30" r="15" fill="url(#clocheSilver)" filter="url(#shadow)" />
         <path 
           d="M 20 160 Q 20 50 100 50 Q 180 50 180 160" 
           fill="url(#clocheSilver)" 
           stroke="#475569" 
           strokeWidth="2"
           filter="url(#shadow)"
         />
         <path 
           d="M 40 140 Q 50 60 100 60" 
           fill="none" 
           stroke="url(#clocheShine)" 
           strokeWidth="10" 
           strokeLinecap="round" 
           opacity="0.6"
         />
         <path 
           d="M 10 160 L 190 160 L 190 170 C 190 175 185 180 180 180 L 20 180 C 15 180 10 175 10 170 Z" 
           fill="#334155"
         />
      </svg>
   )
}

function FinalReviewModal({ open, onOpenChange, projectTitle, onClose }: { open: boolean, onOpenChange: (o: boolean) => void, projectTitle: string, onClose: () => void }) {
  const router = useRouter();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
        <div className="bg-slate-900 p-10 text-center text-white relative overflow-hidden">
           <div className="absolute top-0 right-0 p-10 opacity-10 rotate-12">
              <PartyPopper size={120} />
           </div>
           <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center mx-auto mb-6 backdrop-blur-md border border-white/20">
              <ClipboardCheck size={40} className="text-amber-400" />
           </div>
           <h2 className="text-3xl font-black mb-2 tracking-tight">심사 완료!</h2>
           <p className="text-slate-400 font-medium">소중한 전문 의견을 정성껏 전달했습니다.</p>
        </div>

        <div className="p-8 space-y-4">
           <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 mb-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">AUDIT SUMMARY</p>
              <p className="text-sm font-bold text-slate-700 leading-relaxed">
                "{projectTitle}" 프로젝트에 대한 전문 진단이 성공적으로 마무리되었습니다. 작가는 이를 바탕으로 더욱 성장할 것입니다.
              </p>
           </div>

           <Button 
              className="w-full h-16 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-lg gap-3 shadow-xl shadow-indigo-100"
              onClick={() => {
                onOpenChange(false);
                onClose();
                router.push('/'); // Or specifically to growth section
              }}
            >
              <Compass size={20} /> 다른 우수 프로젝트 심사하기
           </Button>

           <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                className="h-14 rounded-2xl border-slate-200 font-bold text-slate-600 hover:bg-slate-50 gap-2"
                onClick={() => {
                   onOpenChange(false);
                   // Navigate to a results page/tab if available
                   toast.info("집계 데이터 서비스 준비중입니다.");
                }}
              >
                <History size={18} /> 집계 보기
              </Button>
              <Button 
                variant="outline" 
                className="h-14 rounded-2xl border-slate-200 font-bold text-slate-600 hover:bg-slate-50 gap-2"
                onClick={() => onOpenChange(false)}
              >
                닫기
              </Button>
           </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
