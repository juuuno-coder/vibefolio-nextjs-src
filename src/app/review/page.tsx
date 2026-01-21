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
import { ReviewReportModal } from '@/components/ReviewReportModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';

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
  const [viewerMode, setViewerMode] = useState<'desktop' | 'mobile'>('desktop');
  const [isExternalView, setIsExternalView] = useState(false); // New: Track if reviewing in external tab
  const [project, setProject] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [evaluationStep, setEvaluationStep] = useState<number>(1);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [vote, setVote] = useState<VoteChoice>(null);
  
  // Modals
  const [proposalOpen, setProposalOpen] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  // Embedded Proposal State
  const [proposalData, setProposalData] = useState({
    title: "",
    content: "",
    contact: ""
  });
  const [isSubmittingProposal, setIsSubmittingProposal] = useState(false);

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

  // --- Persistence Logic ---
  // Load saved data when projectId changes
  useEffect(() => {
    if (!projectId) return;
    const saved = localStorage.getItem(`review_draft_${projectId}`);
    if (saved) {
      try {
        const { proposalData: savedData, step, timestamp } = JSON.parse(saved);
        // Only load if it's less than 24 hours old
        if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
          if (savedData) setProposalData(savedData);
          if (step) setEvaluationStep(step);
          console.log("[Review] Restored draft from persistence.");
        }
      } catch (e) {
        console.error("Failed to restore review draft", e);
      }
    }
  }, [projectId]);

  // Save draft whenever it changes
  useEffect(() => {
    if (!projectId) return;
    // Don't save empty/initial state unnecessarily, but save most changes
    const draft = {
      proposalData,
      step: evaluationStep,
      timestamp: Date.now()
    };
    localStorage.setItem(`review_draft_${projectId}`, JSON.stringify(draft));
  }, [projectId, proposalData, evaluationStep]);

  // Clear draft helper
  const clearDraft = React.useCallback(() => {
    if (projectId) {
      localStorage.removeItem(`review_draft_${projectId}`);
    }
  }, [projectId]);

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
  if (!projectId || !url1) return <ReviewLanding />;

  return (
    <div className="relative w-full h-[100dvh] overflow-hidden bg-slate-950 text-slate-900 font-sans">
      
      {/* Top Utility Bar (Toggle for PC/Mobile) */}
      <div className="absolute top-6 left-6 z-[60] flex items-center gap-2">
         <div className="bg-white/80 backdrop-blur-md p-1 rounded-2xl border border-slate-200 shadow-xl flex">
            <Button 
               variant={viewerMode === 'desktop' ? 'default' : 'ghost'} 
               size="sm" 
               className={cn("rounded-xl h-10 px-4 font-bold", viewerMode === 'desktop' ? "bg-slate-900 text-white" : "text-slate-500")}
               onClick={() => setViewerMode('desktop')}
            >
               <Monitor size={16} className="mr-2" /> PC
            </Button>
            <Button 
               variant={viewerMode === 'mobile' ? 'default' : 'ghost'} 
               size="sm" 
               className={cn("rounded-xl h-10 px-4 font-bold", viewerMode === 'mobile' ? "bg-slate-900 text-white" : "text-slate-500")}
               onClick={() => setViewerMode('mobile')}
            >
               <Smartphone size={16} className="mr-2" /> Mobile
            </Button>
            <Button 
               variant="ghost" 
               size="sm" 
               className="rounded-xl h-10 px-4 font-bold text-slate-500 hover:text-slate-900"
               onClick={() => {
                  window.open(url1 || '', '_blank');
                  setIsExternalView(true); // Switch to companion mode
               }}
            >
               <Maximize2 size={16} className="mr-2" /> 새 창 열기
            </Button>
         </div>
      </div>

      {/* Phase 2 Layered Viewer */}
      <div className={cn(
        "absolute inset-0 transition-opacity duration-1000",
        phase === 'viewer' ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      )}>
        {/* Viewer Content - Full Screen Iframe */}
        <div className="w-full h-full bg-slate-100 flex items-center justify-center overflow-hidden">
            <div className={cn(
                "flex transition-all duration-500 ease-in-out h-full",
                viewerMode === 'mobile' ? "w-[375px] h-[812px] bg-white rounded-[3rem] border-[8px] border-slate-900 shadow-2xl my-auto scale-90 md:scale-100" : "w-full h-full"
            )}>
                {/* View A */}
                <div className={cn(
                  "h-full relative overflow-hidden",
                  isAB ? "w-1/2 border-r border-slate-200" : "w-full",
                  viewerMode === 'mobile' && "rounded-[1.8rem]"
                )}>
                  <iframe 
                    src={url1 || undefined} 
                    className="w-full h-full border-none"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
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
                  <div className={cn(
                      "h-full w-1/2 relative overflow-hidden",
                      viewerMode === 'mobile' && "rounded-[1.8rem]"
                  )}>
                    <iframe 
                      src={url2 || undefined} 
                      className="w-full h-full border-none"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                      title="Preview B" 
                    />
                    <div className="absolute top-4 left-4 bg-amber-500/80 backdrop-blur-md text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest z-10 border border-white/20">
                      Option B
                    </div>
                  </div>
                )}
            </div>
            
            {/* Companion Mode Overlay (When External Tab is Open) */}
            <AnimatePresence>
               {isExternalView && (
                  <motion.div 
                     initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
                     animate={{ opacity: 1, backdropFilter: "blur(12px)" }}
                     exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
                     className="absolute inset-0 bg-slate-900/60 z-20 flex flex-col items-center justify-center text-white"
                  >
                     <div className="bg-white/10 p-8 rounded-[2.5rem] backdrop-blur-md border border-white/20 text-center max-w-md shadow-2xl">
                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 text-slate-900 shadow-lg">
                           <Monitor size={32} />
                        </div>
                        <h3 className="text-2xl font-black mb-2">외부 창에서 평가 중...</h3>
                        <p className="text-slate-300 font-medium mb-8 leading-relaxed">
                           새 탭에서 콘텐츠를 충분히 경험하고<br/>
                           이곳에서 당신의 소중한 평가를 남겨주세요.
                        </p>
                        <div className="space-y-3">
                           <Button 
                              onClick={() => {
                                 setPhase('viewer');
                                 setIsReviewOpen(true);
                                 // Optionally open review form directly?
                              }}
                              className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-indigo-500/30"
                           >
                              <MessageSquareText size={20} className="mr-2" /> 평가 의견 작성하기
                           </Button>
                           <Button 
                              variant="ghost"
                              onClick={() => setIsExternalView(false)}
                              className="w-full h-12 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl"
                           >
                              다시 내부 뷰어로 보기
                           </Button>
                        </div>
                     </div>
                  </motion.div>
               )}
            </AnimatePresence>
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
                   <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-red-500 to-purple-600">제 평가는요?</span>
                </h1>
                <p className="text-slate-400 text-sm md:text-lg font-medium mb-16 max-w-md mx-auto leading-relaxed">
                   바이브폴리오 평가단이 되어<br/>
                   이 작품의 가치를 객관적으로 평가해 주세요.
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
                평가 시작하기
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
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-10 max-w-4xl mx-auto"
                  >
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                           <Badge className="bg-indigo-600 px-3 py-1 text-xs">3차 의견</Badge>
                           <h4 className="text-2xl font-black text-slate-900 tracking-tight">종합 평가 의견 및 솔루션</h4>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-rose-50 rounded-full border border-rose-100">
                           <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" />
                           <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Required</span>
                        </div>
                     </div>

                     <div className="bg-white rounded-[3rem] border border-slate-100 p-10 md:p-14 shadow-[0_40px_100px_rgba(0,0,0,0.08)] relative overflow-hidden">
                        {/* Decorative Background Elements */}
                        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-indigo-50/50 rounded-full blur-3xl -z-10" />
                        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-64 h-64 bg-blue-50/50 rounded-full blur-3xl -z-10" />

                        <div className="flex flex-col md:flex-row items-start gap-8 mb-12">
                           <div className="w-16 h-16 rounded-3xl bg-indigo-600 flex items-center justify-center shrink-0 shadow-xl shadow-indigo-100 rotate-3">
                              <MessageSquareText className="text-white w-8 h-8" />
                           </div>
                           <div>
                              <h4 className="text-2xl font-black text-slate-900 mb-2">시크릿 평가 의견</h4>
                              <p className="text-base text-slate-500 font-bold leading-relaxed max-w-md">
                                 작성하신 내용은 공개되지 않으며 오직 <span className="text-indigo-600 font-black">창작자에게만</span> 전달됩니다.
                              </p>
                           </div>
                        </div>

                        <div className="space-y-8">
                           <div className="relative group">
                              <div className="absolute -top-3 left-6 px-3 py-1 bg-white border border-slate-100 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-widest z-10 shadow-sm group-focus-within:border-indigo-500 group-focus-within:text-indigo-500 transition-colors">Your Review</div>
                               <Textarea 
                                  placeholder={`프로젝트의 핵심 가치, 아쉬운 점, 그리고 구체적인 개선 방향을 동료의 마음으로 남겨주세요.\n\n※ 익명성이 보장되지만 타인에 대한 비방이나 모욕적인 표현은 제재의 대상이 될 수 있습니다.`}
                                  value={proposalData.content}
                                  onChange={(e) => setProposalData(prev => ({ ...prev, content: e.target.value }))}
                                  className="min-h-[320px] rounded-[2rem] border-2 border-slate-100 bg-slate-50/30 focus:bg-white focus:border-indigo-500/30 focus:ring-0 transition-all p-8 text-lg leading-relaxed resize-none font-medium placeholder:text-slate-300"
                                  required
                               />
                           </div>

                           <div className="w-full space-y-3">
                              <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-2">향후 업데이트 소식 받기 (이메일)</p>
                              <Input 
                                 placeholder="개선된 결과물에 대한 업데이트 소식을 이메일로 받아보실 수 있습니다."
                                 value={proposalData.contact}
                                 onChange={(e) => setProposalData(prev => ({ ...prev, contact: e.target.value }))}
                                 className="h-16 rounded-2xl border-2 border-slate-100 bg-slate-50/30 focus:bg-white focus:border-indigo-500/30 px-6 font-bold text-slate-900 transition-all"
                              />
                           </div>
                        </div>
                     </div>
                  </motion.div>
                )}

               </div>

                {/* Bottom CTA Bar */}
               <div className="absolute bottom-0 left-0 right-0 p-6 bg-white/95 backdrop-blur-2xl border-t border-slate-100 flex items-center justify-between gap-6 z-[999] shadow-[0_-15px_50px_rgba(0,0,0,0.1)]">
                  <div className="hidden md:block">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Step {evaluationStep} of {availableSteps.length}</p>
                     <p className="text-sm font-bold text-slate-900 mt-1">평가 결과는 단계별로 즉시 반영됩니다.</p>
                  </div>
                  
                  <div className="flex gap-3 flex-1 md:flex-none">
                    {evaluationStep > 1 && (
                      <Button 
                        variant="outline"
                        className="h-15 px-8 rounded-2xl border-slate-200 font-bold hover:bg-slate-50 transition-colors"
                        onClick={() => setEvaluationStep(prev => (prev - 1) as any)}
                        disabled={isSubmittingProposal}
                      >
                        이전
                      </Button>
                    )}
                    <Button 
                      className={cn(
                        "flex-1 md:px-20 h-15 rounded-2xl font-black text-white shadow-2xl transition-all uppercase tracking-widest text-base",
                        evaluationStep === availableSteps.length ? "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200 hover:scale-[1.02] active:scale-95" : "bg-slate-950 hover:bg-slate-800 shadow-slate-300 hover:scale-[1.02] active:scale-95"
                      )}
                      disabled={isSubmittingProposal}
                      onClick={async () => {
                        if (evaluationStep < availableSteps.length) {
                          setEvaluationStep(prev => (prev + 1) as any);
                        } else {
                          // Final Step: Submit Proposal if exists
                          if (currentStep?.id === 'proposal') {
                             if (!proposalData.content.trim()) {
                                toast.error("평가 의견 내용을 입력해 주세요.");
                                return;
                             }
                             
                             setIsSubmittingProposal(true);
                             try {
                                const { data: { session } } = await supabase.auth.getSession();
                                const res = await fetch("/api/proposals", {
                                  method: "POST",
                                  headers: { 
                                    "Content-Type": "application/json",
                                    ...(session ? { "Authorization": `Bearer ${session.access_token}` } : {})
                                  },
                                  body: JSON.stringify({
                                    project_id: Number(projectId),
                                    receiver_id: project?.user_id,
                                    title: proposalData.title || `[평가 의견] ${project?.title}에 대한 전문 의견`,
                                    content: proposalData.content,
                                    contact: proposalData.contact,
                                  }),
                                });
                                
                                if (!res.ok) {
                                  const err = await res.json();
                                  throw new Error(err.message || "평가 의견 전송 실패");
                                }
                                
                                toast.success("소중한 평가 의견이 기록되었습니다.");
                                clearDraft(); // Draft cleared after successful submission
                                setShowResultModal(true);
                             } catch (err: any) {
                                toast.error(err.message);
                             } finally {
                                setIsSubmittingProposal(false);
                             }
                          } else {
                            setShowResultModal(true);
                          }
                        }
                      }}
                    >
                      {isSubmittingProposal ? (
                        <Loader2 className="animate-spin" />
                      ) : (
                        evaluationStep < availableSteps.length 
                          ? "다음 단계로" 
                          : currentStep?.id === 'proposal' ? "평가평 전송 및 완료" : "평가 완료"
                      )}
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
          onShowReport={() => setShowReportModal(true)}
        />
      )}

      <ReviewReportModal 
         open={showReportModal}
         onOpenChange={setShowReportModal}
         projectId={projectId || ""}
         projectTitle={project?.title || "프로젝트"}
      />

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

function FinalReviewModal({ open, onOpenChange, projectTitle, onClose, onShowReport }: { open: boolean, onOpenChange: (o: boolean) => void, projectTitle: string, onClose: () => void, onShowReport: () => void }) {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
  }, []);

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
           <h2 className="text-3xl font-black mb-2 tracking-tight">평가 완료!</h2>
           <p className="text-slate-400 font-medium">소중한 전문 의견을 정성껏 전달했습니다.</p>
        </div>

        <div className="p-8 space-y-4">
           {!session && (
              <div className="p-6 bg-indigo-50 rounded-3xl border border-indigo-100 mb-2 animate-bounce-subtle">
                 <p className="text-xs font-black text-indigo-500 uppercase tracking-widest mb-2 font-poppins">Wait! You're a Guest</p>
                 <p className="text-sm font-bold text-slate-800 leading-tight mb-3">
                    지금 회원가입하고 <span className="text-indigo-600">1,000 내공</span>을 받으세요!<br/>
                    내가 남긴 평가 의견과 결과를 마이페이지에서 관리할 수 있습니다.
                 </p>
                 <Button 
                    className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200"
                    onClick={() => router.push('/signup')}
                 >
                    내공 1,000점 받고 가입하기
                 </Button>
              </div>
           )}

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
              <Compass size={20} /> 다른 우수 프로젝트 평가하기
           </Button>

           <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                className="h-14 rounded-2xl border-slate-200 font-bold text-slate-600 hover:bg-slate-50 gap-2"
                onClick={() => {
                   onOpenChange(false);
                   onShowReport();
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

/**
 * review.vibefolio.net (projectId 없는 경우)에 노출될 랜딩 페이지
 */
function ReviewLanding() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-indigo-500/30">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full" />
        <div className="absolute top-[20%] -right-[5%] w-[30%] h-[30%] bg-purple-600/10 blur-[100px] rounded-full" />
        <div className="absolute -bottom-[5%] left-[20%] w-[25%] h-[25%] bg-blue-600/10 blur-[80px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-24 pb-32 font-sans">
        {/* Navigation / Header Area */}
        <nav className="flex items-center justify-between mb-24 transition-all">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-2xl">
                 <ChefHat size={22} className="text-slate-900" />
              </div>
              <span className="text-xl font-black tracking-tighter uppercase font-poppins">V-Audit</span>
           </div>
           <Button 
             variant="ghost" 
             className="text-slate-400 hover:text-white hover:bg-white/5 font-bold"
             onClick={() => router.push('/')}
           >
             메인 서비스로 돌아가기
           </Button>
        </nav>

        {/* Hero Section */}
        <section className="max-w-4xl mb-32">
           <motion.div
             initial={{ opacity: 0, y: 30 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.8 }}
           >
              <Badge className="bg-indigo-500/20 text-indigo-400 border-indigo-500/30 px-4 py-1.5 mb-8 rounded-full text-sm font-black">Professional Evaluation System</Badge>
              <h1 className="text-5xl md:text-8xl font-black leading-[1.05] tracking-tight mb-8">
                창작물의 한계를<br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-rose-400">데이터로 진단합니다.</span>
              </h1>
              <p className="text-xl md:text-2xl text-slate-400 font-medium leading-relaxed max-w-2xl mb-12">
                 단순한 좋아요가 아닌, 실무진과 동료들의 전문적인 시각으로 당신의 프로젝트를 완성하세요. 
                 V-Audit은 더 나은 결과물을 위한 가장 객관적인 여정입니다.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                 <Button 
                   className="h-16 px-10 rounded-2xl bg-white text-slate-900 font-black text-lg hover:bg-slate-100 transition-all shadow-xl shadow-white/5"
                   onClick={() => router.push('/')}
                 >
                   평가 대기중인 프로젝트 찾기
                 </Button>
                 <Button 
                   variant="outline"
                   className="h-16 px-10 rounded-2xl border-slate-800 bg-slate-900/50 text-white font-black text-lg hover:bg-slate-800"
                   onClick={() => router.push('/growth')}
                 >
                   내 프로젝트 진단 신청하기
                 </Button>
              </div>
           </motion.div>
        </section>

        {/* Audit Steps Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-40">
           {[
             { 
               icon: Star, 
               title: "Michelin Rating", 
               desc: "전문가용 5개 지표를 통해 디자인과 기획의 완성도를 분석합니다.",
               color: "text-amber-400"
             },
             { 
               icon: CheckCircle, 
               title: "Final Verdict", 
               desc: "익명 투표와 합격/불합격 판정을 통해 시장 가치를 빠르게 검증합니다.",
               color: "text-emerald-400"
             },
             { 
               icon: MessageSquareText, 
               title: "Private Solution", 
               desc: "평가평을 통해 창작자에게만 전달되는 구체적인 솔루션을 제안합니다.",
               color: "text-indigo-400"
             }
           ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 * idx }}
                  className="bg-slate-900/50 border border-slate-800 p-10 rounded-[3rem] backdrop-blur-xl group hover:border-indigo-500/50 transition-all"
                >
                   <div className={cn("w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-8", item.color)}>
                      <Icon size={30} />
                   </div>
                   <h3 className="text-2xl font-black mb-4">{item.title}</h3>
                   <p className="text-slate-400 leading-relaxed font-medium">{item.desc}</p>
                </motion.div>
              )
           })}
        </section>

        {/* CTA Banner */}
        <section className="relative overflow-hidden bg-gradient-to-br from-indigo-900 to-slate-900 rounded-[4rem] p-12 md:p-24 text-center">
           <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
              <div className="grid grid-cols-12 h-full opacity-30">
                 {Array.from({ length: 48 }).map((_, i) => (
                    <div key={i} className="border-[0.5px] border-white/20" />
                 ))}
              </div>
           </div>
           
           <h2 className="text-3xl md:text-5xl font-black mb-8 relative z-10 leading-tight">
              당신의 성장을 위한<br className="md:hidden font-sans"/> 바이브폴리오의 평가 전문 시스템
           </h2>
           <p className="text-slate-300 text-lg mb-12 max-w-xl mx-auto font-medium">
              지금 바로 동료들의 피드백을 통해 프로젝트의 완성도를 한 단계 업그레이드 하세요.
           </p>
           <Button 
             className="h-14 px-12 rounded-full bg-indigo-500 hover:bg-indigo-400 text-white font-black text-lg transition-all shadow-2xl shadow-indigo-500/20"
             onClick={() => router.push('/signup')}
           >
             평가단 커뮤니티 합류하기
           </Button>
        </section>
      </div>
      
      {/* Footer Area */}
      <footer className="py-20 border-t border-slate-900 text-center">
         <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">© 2025 Vibefolio V-Audit System. All rights reserved.</p>
      </footer>
    </div>
  );
}
