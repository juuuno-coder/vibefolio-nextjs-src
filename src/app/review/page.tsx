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
  Star
} from 'lucide-react';

// Import existing components for reuse
import { MichelinRating } from '@/components/MichelinRating';
import { FeedbackPoll } from '@/components/FeedbackPoll';
import { ProposalModal } from '@/components/ProposalModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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
  const [viewMode, setViewMode] = useState<ViewMode>('split'); // For A/B mobile toggle
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [vote, setVote] = useState<VoteChoice>(null);
  
  // Modals
  const [proposalOpen, setProposalOpen] = useState(false);

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

  // Handle Resize for A/B view
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        if (viewMode === 'split') setViewMode('a');
      } else {
        setViewMode('split');
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [viewMode]);

  const [evaluationTab, setEvaluationTab] = useState<'rating' | 'voting' | 'proposal'>('rating');

  if (loading) return <div className="h-[100dvh] bg-slate-950 flex items-center justify-center text-white font-black tracking-widest text-xl animate-pulse">LOADING...</div>;
  if (!url1) return <div className="h-[100dvh] bg-slate-950 flex items-center justify-center text-white">유효한 URL이 없습니다.</div>;

  return (
    <div className="relative w-full h-[100dvh] overflow-hidden bg-slate-950 text-slate-900 font-sans">
      
      {/* Phase 2 Layered Viewer */}
      <div className={cn(
        "absolute inset-0 transition-opacity duration-1000",
        phase === 'viewer' ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      )}>
        {/* Top Header */}
        <div className="absolute top-0 left-0 right-0 h-14 bg-slate-900/80 backdrop-blur-md flex items-center justify-between px-4 z-40 border-b border-white/10">
           <div className="flex items-center gap-3 text-white">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={() => router.back()}>
                 <ArrowLeft size={20} />
              </Button>
              <span className="font-bold text-sm md:text-base truncate max-w-[200px]">
                {project?.title || "심사 중"}
              </span>
              {isAB && <Badge variant="outline" className="text-amber-400 border-amber-400">A/B Test</Badge>}
           </div>
           
           {isAB && (
             <div className="flex md:hidden bg-white/10 rounded-lg p-1">
                <button 
                  onClick={() => setViewMode('a')}
                  className={cn("px-3 py-1 rounded text-xs font-bold transition-all", viewMode === 'a' ? "bg-amber-500 text-white" : "text-slate-400")}
                >
                  Option A
                </button>
                <button 
                  onClick={() => setViewMode('b')}
                  className={cn("px-3 py-1 rounded text-xs font-bold transition-all", viewMode === 'b' ? "bg-amber-500 text-white" : "text-slate-400")}
                >
                  Option B
                </button>
             </div>
           )}

           <div className="flex items-center gap-2">
              <Button size="sm" variant="ghost" className="text-slate-400 hover:text-white" onClick={() => setPhase('cloche')}>
                 <X size={20} /> 닫기
              </Button>
           </div>
        </div>

        {/* Viewer Content */}
        <div className="w-full h-full pt-14 bg-gray-100 flex">
            {/* View A */}
            <div className={cn(
              "h-full transition-all duration-300 relative",
              isAB ? (viewMode === 'split' ? "w-1/2 border-r border-slate-300" : (viewMode === 'a' ? "w-full" : "w-0 overflow-hidden")) : "w-full"
            )}>
               <div className="absolute top-2 left-2 z-10 bg-black/50 text-white text-[10px] px-2 py-1 rounded font-black tracking-widest backdrop-blur uppercase">
                  {isAB ? "Option A" : "Preview"}
               </div>
               <iframe 
                 src={url1 || undefined} 
                 className="w-full h-full border-none"
                 sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
                 title="Preview A" 
               />
            </div>

            {/* View B */}
            {isAB && url2 && (
              <div className={cn(
                "h-full transition-all duration-300 relative",
                viewMode === 'split' ? "w-1/2" : (viewMode === 'b' ? "w-full" : "w-0 overflow-hidden")
              )}>
                 <div className="absolute top-2 left-2 z-10 bg-black/50 text-white text-[10px] px-2 py-1 rounded font-black tracking-widest backdrop-blur uppercase">
                    Option B
                 </div>
                 <iframe 
                   src={url2 || undefined} 
                   className="w-full h-full border-none"
                   sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
                   title="Preview B" 
                 />
              </div>
            )}
        </div>

        {/* Floating Review Button */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[40]">
           <motion.button
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsReviewOpen(true)}
              className="flex items-center gap-4 pl-5 pr-8 py-4 bg-slate-900/95 backdrop-blur-2xl border border-white/20 text-white rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.6)] hover:shadow-orange-500/40 hover:border-orange-500/50 transition-all group"
           >
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 via-orange-500 to-red-600 flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform">
                 <ChefHat size={24} className="text-white" />
              </div>
              <div className="text-left">
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mb-0.5">Michelin Guide</p>
                  <p className="text-lg font-black tracking-tight group-hover:text-orange-400 transition-colors">심사 평가서 작성</p>
              </div>
           </motion.button>
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

               {/* Evaluation Tabs Header */}
               <div className="px-6 flex border-b border-slate-100 bg-white">
                  {[
                    { id: 'rating', label: '미슐랭 평전', icon: Star, visible: config.showMichelin !== false },
                    { id: 'voting', label: '스티커 투표', icon: LayoutTemplate, visible: config.showStickers !== false },
                    { id: 'proposal', label: '시크릿 제안', icon: '🔒', visible: config.showProposal !== false }
                  ].filter(t => t.visible).map((tab) => {
                    const isActive = evaluationTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setEvaluationTab(tab.id as any)}
                        className={cn(
                          "flex-1 py-6 flex flex-col items-center justify-center gap-1.5 transition-all relative group",
                          isActive ? "text-slate-900" : "text-slate-400 hover:text-slate-600"
                        )}
                      >
                         <div className={cn(
                           "w-10 h-10 rounded-2xl flex items-center justify-center transition-all",
                           isActive ? "bg-slate-900 text-white shadow-lg" : "bg-slate-50 group-hover:bg-slate-100"
                         )}>
                            {tab.id === 'rating' && <Star size={20} className={cn(isActive ? "fill-white" : "fill-none")} />}
                            {tab.id === 'voting' && <LayoutTemplate size={20} />}
                            {tab.id === 'proposal' && <div className="text-xl">🔒</div>}
                         </div>
                         <span className={cn("text-xs font-black tracking-tighter", isActive ? "opacity-100" : "opacity-60")}>
                           {tab.label}
                         </span>
                         {isActive && (
                           <motion.div 
                             layoutId="tabUnderline"
                             className="absolute bottom-0 left-4 right-4 h-1 bg-slate-900 rounded-full"
                           />
                         )}
                      </button>
                    );
                  })}
               </div>

               {/* Sheet Content */}
               <div className="overflow-y-auto flex-1 p-6 md:p-10 space-y-10 bg-white pb-32">
                  
                  {evaluationTab === 'rating' && (
                    <motion.div 
                      key="rating"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="space-y-8"
                    >
                      {isAB && (
                        <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden relative group">
                            <div className="absolute top-0 right-0 p-8 opacity-10">
                               <SplitSquareHorizontal className="w-24 h-24 text-white" />
                            </div>
                            <div className="relative z-10">
                              <h4 className="text-xl font-black text-white mb-6 flex items-center gap-2">
                                <SplitSquareHorizontal size={24} className="text-blue-400"/>
                                어느 프로젝트가 더 뛰어난가요?
                              </h4>
                              <div className="grid grid-cols-3 gap-4">
                                {[
                                  { id: 'a', label: 'A안 승리', color: 'bg-amber-500' },
                                  { id: 'similar', label: '비등비등함', color: 'bg-slate-600' },
                                  { id: 'b', label: 'B안 승리', color: 'bg-blue-50' }
                                ].map(btn => (
                                  <button 
                                    key={btn.id}
                                    onClick={() => setVote(btn.id as any)}
                                    className={cn(
                                      "p-5 rounded-2xl border-2 transition-all font-black text-sm relative overflow-hidden group/btn", 
                                      vote === btn.id 
                                        ? cn("border-transparent text-white", btn.color) 
                                        : "border-white/10 bg-white/5 text-white/50 hover:border-white/20"
                                    )}
                                  >
                                      {btn.label}
                                      {vote === btn.id && (
                                        <motion.div layoutId="voteGlow" className="absolute inset-0 bg-white/20 animate-pulse" />
                                      )}
                                  </button>
                                ))}
                              </div>
                            </div>
                        </div>
                      )}
                    {projectId && <MichelinRating projectId={projectId as string} isDemo={false} />}
                  </motion.div>
                )}

                {evaluationTab === 'voting' && (
                  <motion.div 
                    key="voting"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    {projectId && <FeedbackPoll projectId={projectId as string} />}
                  </motion.div>
                )}

                {evaluationTab === 'proposal' && (
                  <motion.div 
                    key="proposal"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-center py-10"
                  >
                     <div className="w-24 h-24 rounded-[2rem] bg-indigo-50 flex items-center justify-center mb-6 shadow-xl border border-indigo-100">
                        <span className="text-5xl">📧</span>
                     </div>
                     <h4 className="text-2xl font-black text-slate-900 mb-2">시크릿 제안</h4>
                     <p className="text-slate-500 text-center max-w-xs mb-10 leading-relaxed font-medium">
                        협업 요청 부터 <span className="text-indigo-600 font-black">발전을 위한 솔직한 피드백</span>까지 비공개로 전달해보세요.
                     </p>
                     <Button 
                       onClick={() => setProposalOpen(true)}
                       className="px-12 py-6 h-auto rounded-3xl bg-slate-900 border-b-4 border-black hover:bg-black text-white font-black text-lg transition-all shadow-2xl active:translate-y-1 active:border-b-0"
                     >
                        제안서 작성하러 가기
                     </Button>
                  </motion.div>
                )}

               </div>

               {/* Bottom CTA Bar */}
               <div className="absolute bottom-0 left-0 right-0 p-6 bg-white/90 backdrop-blur-xl border-t border-slate-100 flex items-center justify-between gap-6">
                  <div className="hidden md:block">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Status</p>
                     <p className="text-sm font-bold text-slate-900 mt-1">심사 결과가 자동으로 저장됩니다.</p>
                  </div>
                  <Button 
                    className="flex-1 md:flex-none md:px-16 h-14 rounded-2xl bg-slate-950 hover:bg-slate-800 font-black text-white shadow-2xl shadow-slate-200 transition-all uppercase tracking-widest text-base"
                    onClick={() => {
                      toast.success("평가가 완료되었습니다!");
                      setIsReviewOpen(false);
                    }}
                  >
                     Complete Audit
                  </Button>
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
