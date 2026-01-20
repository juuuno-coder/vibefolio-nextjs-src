"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
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
  LayoutTemplate
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
}

function ReviewContent() {
  const params = useSearchParams();
  const router = useRouter();
  
  // URL Params
  const projectId = params.get('projectId');
  const userUrl1 = params.get('url') || params.get('url1');
  const userUrl2 = params.get('url2');
  const modeParam = params.get('mode'); // 'single' | 'ab'

  // State
  const [phase, setPhase] = useState<ReviewPhase>('cloche');
  const [project, setProject] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('split'); // For A/B mobile toggle
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [vote, setVote] = useState<VoteChoice>(null);
  
  // Modals
  const [proposalOpen, setProposalOpen] = useState(false);

  // Computed
  const isAB = modeParam === 'ab' || !!userUrl2;
  const url1 = userUrl1 ? decodeURIComponent(userUrl1) : null;
  const url2 = userUrl2 ? decodeURIComponent(userUrl2) : null;

  // 1. Auth & Data Fetch
  useEffect(() => {
    const init = async () => {
      // Auth Check
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("로그인이 필요한 서비스입니다.");
        const currentPath = `/review?${params.toString()}`;
        router.replace(`/login?next=${encodeURIComponent(currentPath)}`);
        return;
      }

      // Project Data Fetch
      if (!projectId) {
        toast.error("프로젝트 ID가 유효하지 않습니다.");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('Project')
        .select('project_id, title, user_id')
        .eq('project_id', Number(projectId))
        .single();

      if (error || !data) {
        console.error("Project fetch error:", error);
        toast.error("프로젝트 정보를 불러올 수 없습니다.");
      } else {
        setProject(data);
      }
      setLoading(false);
    };

    init();
  }, [projectId, router, params]);

  // Handle Resize for A/B view
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        if (viewMode === 'split') setViewMode('a');
      } else {
        setViewMode('split');
      }
    };
    // Init
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [viewMode]);

  if (loading) return <div className="h-[100dvh] bg-slate-950 flex items-center justify-center text-white">Loading...</div>;
  if (!url1) return <div className="h-[100dvh] bg-slate-950 flex items-center justify-center text-white">유효한 URL이 없습니다.</div>;

  return (
    <div className="relative w-full h-[100dvh] overflow-hidden bg-slate-950 text-slate-900 font-sans">
      
      {/* --- Phase 2: Layered Viewer (The Tasting) --- */}
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
           
           {/* Mobile A/B Toggle */}
           {isAB && (
             <div className="flex md:hidden bg-white/10 rounded-lg p-1">
                <button 
                  onClick={() => setViewMode('a')}
                  className={cn("px-3 py-1 rounded text-xs font-bold transition-all", viewMode === 'a' ? "bg-amber-500 text-white" : "text-slate-400")}
                >
                  A안
                </button>
                <button 
                  onClick={() => setViewMode('b')}
                  className={cn("px-3 py-1 rounded text-xs font-bold transition-all", viewMode === 'b' ? "bg-amber-500 text-white" : "text-slate-400")}
                >
                  B안
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
               <div className="absolute top-2 left-2 z-10 bg-black/50 text-white text-xs px-2 py-1 rounded font-bold backdrop-blur">
                  {isAB ? "Option A" : "Preview"}
               </div>
               <iframe 
                 src={url1} 
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
                 <div className="absolute top-2 left-2 z-10 bg-black/50 text-white text-xs px-2 py-1 rounded font-bold backdrop-blur">
                    Option B
                 </div>
                 <iframe 
                   src={url2} 
                   className="w-full h-full border-none"
                   sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
                   title="Preview B" 
                 />
              </div>
            )}
        </div>

        {/* Floating Review Button (Bottom Left as requested) */}
        <div className="absolute bottom-6 left-6 z-[9999]">
           <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsReviewOpen(true)}
              className="flex items-center gap-3 pl-4 pr-6 py-3 bg-slate-900/90 backdrop-blur-xl border border-white/10 text-white rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.5)] hover:shadow-orange-500/20 hover:border-orange-500/50 transition-all group"
           >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-inner">
                 <ChefHat size={20} className="text-white" />
              </div>
              <div className="text-left">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Michelin Review</p>
                  <p className="text-sm font-bold group-hover:text-orange-400 transition-colors">평가서 작성하기</p>
              </div>
           </motion.button>
        </div>
      </div>

      {/* --- Phase 1: Initial Overlay (The Cloche) --- */}
      <AnimatePresence>
        {phase === 'cloche' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ y: "-100%", opacity: 0, transition: { duration: 0.8, ease: [0.33, 1, 0.68, 1] } }} // EaseInOutCubic
            className="absolute inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center p-8 text-center"
          >
             <motion.div 
               initial={{ y: 20, opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               transition={{ delay: 0.2 }}
             >
                <h1 className="text-3xl md:text-5xl font-black text-white mb-2 tracking-tight">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">제평가는요?</span>
                </h1>
                <p className="text-slate-400 text-sm md:text-base font-medium mb-12">
                   공정한 심사를 위한 미슐랭 가이드 레이어
                </p>
             </motion.div>

             <div className="flex items-center justify-center gap-8 md:gap-16 mb-16 relative">
                {/* Cloche A */}
                <motion.div 
                  className="cursor-pointer group relative"
                  whileHover={{ scale: 1.05, y: -10 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setPhase('viewer')}
                >
                   <ClocheIcon className="w-40 h-40 md:w-64 md:h-64 drop-shadow-[0_20px_50px_rgba(249,115,22,0.3)] filter" />
                   {isAB && <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-slate-500 font-bold text-xs uppercase tracking-widest">Option A</div>}
                   <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      <span className="px-4 py-2 bg-white/10 backdrop-blur rounded-full text-white text-sm font-bold border border-white/20">
                         OPEN
                      </span>
                   </div>
                </motion.div>

                {/* Cloche B (if A/B) */}
                {isAB && (
                   <motion.div 
                    className="cursor-pointer group relative"
                    whileHover={{ scale: 1.05, y: -10 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setPhase('viewer')}
                  >
                    <ClocheIcon className="w-40 h-40 md:w-64 md:h-64 drop-shadow-[0_20px_50px_rgba(59,130,246,0.3)] filter" />
                    <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-slate-500 font-bold text-xs uppercase tracking-widest">Option B</div>
                  </motion.div>
                )}
             </div>

             <motion.button
                onClick={() => setPhase('viewer')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-white text-slate-900 rounded-full font-black text-lg shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_rgba(255,255,255,0.5)] transition-all"
             >
                평가 시작하기
             </motion.button>
          </motion.div>
        )}
      </AnimatePresence>


      {/* --- Phase 3: Evaluation Sheet (The Final Review) --- */}
      <AnimatePresence>
        {isReviewOpen && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setIsReviewOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10000]"
            />
            {/* Sheet */}
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 z-[10001] bg-white rounded-t-[2.5rem] shadow-[0_-20px_60px_rgba(0,0,0,0.3)] max-h-[85dvh] overflow-hidden flex flex-col"
            >
               {/* Sheet Header */}
               <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
                  <div>
                    <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                       <ChefHat className="text-orange-500" />
                       심사 평가서
                    </h3>
                    <p className="text-sm text-slate-500">{project?.title || "Project"}에 대한 평가를 남겨주세요.</p>
                  </div>
                  <Button variant="ghost" className="rounded-full" onClick={() => setIsReviewOpen(false)}>
                     <X />
                  </Button>
               </div>

               {/* Sheet Content (Scrollable) */}
               <div className="overflow-y-auto flex-1 p-6 space-y-8 bg-slate-50/50 pb-20">
                  
                  {/* A/B Choice Section */}
                  {isAB && (
                     <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                        <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                           <SplitSquareHorizontal size={20} className="text-blue-500"/>
                           어느 쪽이 더 훌륭한가요?
                        </h4>
                        <div className="grid grid-cols-3 gap-3">
                           <button 
                             onClick={() => setVote('a')}
                             className={cn("p-4 rounded-2xl border-2 transition-all font-bold text-sm", vote === 'a' ? "border-amber-500 bg-amber-50 text-amber-900" : "border-slate-100 hover:border-slate-300 text-slate-500")}
                           >
                              A안 승리
                           </button>
                           <button 
                             onClick={() => setVote('similar')}
                             className={cn("p-4 rounded-2xl border-2 transition-all font-bold text-sm", vote === 'similar' ? "border-slate-500 bg-slate-100 text-slate-900" : "border-slate-100 hover:border-slate-300 text-slate-500")}
                           >
                              비슷함
                           </button>
                           <button 
                             onClick={() => setVote('b')}
                             className={cn("p-4 rounded-2xl border-2 transition-all font-bold text-sm", vote === 'b' ? "border-amber-500 bg-amber-50 text-amber-900" : "border-slate-100 hover:border-slate-300 text-slate-500")}
                           >
                              B안 승리
                           </button>
                        </div>
                     </div>
                  )}

                  {/* 1. Michelin Rating */}
                  <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                      <div className="p-4 bg-slate-900 text-white font-bold flex items-center gap-2">
                         <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"/> 미슐랭 다이그노스틱
                      </div>
                      <div className="p-4">
                        {/* Reuse existing component, ensuring it fits */}
                        {projectId && <MichelinRating projectId={projectId} isDemo={false} />}
                      </div>
                  </div>

                  {/* 2. Feedback Poll (Stickers) */}
                  <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden p-6">
                      <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                         <Trophy size={20} className="text-yellow-500"/>
                         투표하기
                      </h4>
                      {projectId && <FeedbackPoll projectId={projectId} />}
                  </div>

                  {/* 3. Action Buttons */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <Button 
                       variant="outline" 
                       className="h-14 rounded-2xl border-slate-200 hover:bg-slate-50 font-bold text-slate-600"
                       onClick={() => setProposalOpen(true)}
                     >
                        💌 시크릿 제안 보내기
                     </Button>
                     <Button 
                       className="h-14 rounded-2xl bg-slate-900 hover:bg-slate-800 font-bold text-white shadow-lg"
                       onClick={() => {
                         toast.success("평가가 완료되었습니다!");
                         setIsReviewOpen(false);
                         // Logic to save A/B vote to server logic would go here
                       }}
                     >
                        평가 완료
                     </Button>
                  </div>

               </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      
      {/* Proposal Modal (Global Layout) */}
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

// Wrapper for Suspense
export default function ReviewPage() {
    return (
        <Suspense fallback={<div className="h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>}>
            <ReviewContent />
        </Suspense>
    );
}

// Custom Cloche Icon SVG
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
            </radialGradient>
         </defs>
         {/* Drop Shadow Filter */}
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

         {/* Handle/Knob */}
         <circle cx="100" cy="30" r="15" fill="url(#clocheSilver)" filter="url(#shadow)" />
         
         {/* Dome */}
         <path 
           d="M 20 160 Q 20 50 100 50 Q 180 50 180 160" 
           fill="url(#clocheSilver)" 
           stroke="#475569" 
           strokeWidth="2"
           filter="url(#shadow)"
         />
         
         {/* Shine */}
         <path 
           d="M 40 140 Q 50 60 100 60" 
           fill="none" 
           stroke="url(#clocheShine)" 
           strokeWidth="10" 
           strokeLinecap="round" 
           opacity="0.6"
         />

         {/* Bottom Rim */}
         <path 
           d="M 10 160 L 190 160 L 190 170 C 190 175 185 180 180 180 L 20 180 C 15 180 10 175 10 170 Z" 
           fill="#334155"
         />
      </svg>
   )
}
