"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Monitor, 
  Smartphone, 
  Maximize2, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2, 
  Star,
  ChefHat,
  X,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { MichelinRating } from '@/components/MichelinRating';
import { FeedbackPoll } from '@/components/FeedbackPoll';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';

// --- Type Definitions ---
type ReviewPhase = 'cloche' | 'viewer';
type ViewerMode = 'desktop' | 'mobile' | 'split';

function ReviewContent() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId');
  
  const [phase, setPhase] = useState<ReviewPhase>('cloche');
  const [viewerMode, setViewerMode] = useState<ViewerMode>('desktop');
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Review State
  const [currentStep, setCurrentStep] = useState(0); // 0: rating, 1: voting, 2: proposal
  const [steps, setSteps] = useState(['rating', 'voting', 'proposal']);
  const [proposalContent, setProposalContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    if (!projectId) return;

    const fetchProject = async () => {
      try {
        const { data, error } = await supabase
          .from('Project')
          .select('*')
          .eq('project_id', Number(projectId))
          .single();

        if (error) throw error;
        setProject(data);
        
        // Check if project has specific review steps
        if (data.custom_data?.review_steps) {
          setSteps(data.custom_data.review_steps);
        }
      } catch (e) {
        console.error("Failed to load project", e);
        toast.error("프로젝트를 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [projectId]);

  // Persist review draft to localStorage
  useEffect(() => {
    if (!projectId) return;
    const key = `v-audit-draft-${projectId}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.proposalContent) setProposalContent(parsed.proposalContent);
      if (parsed.currentStep !== undefined) setCurrentStep(parsed.currentStep);
    }
  }, [projectId]);

  useEffect(() => {
    if (!projectId) return;
    const key = `v-audit-draft-${projectId}`;
    localStorage.setItem(key, JSON.stringify({ proposalContent, currentStep }));
  }, [projectId, proposalContent, currentStep]);

  // Auto-open review panel on desktop with delay
  useEffect(() => {
    if (phase === 'viewer' && viewerMode === 'desktop') {
      const timer = setTimeout(() => {
        setIsReviewOpen(true);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [phase, viewerMode]);

  const handleFinishCloche = () => {
    setPhase('viewer');
  };

  const handleNextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Final Submit or Show Completion
      setIsSubmitted(true);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  if (!projectId) return <ReviewLanding />;
  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-50 font-black text-2xl animate-pulse">ANALYZING PROJECT...</div>;

  const url1 = project?.primary_url || project?.preview_url || project?.url;

  // --- Render Helpers ---
  const renderReviewStep = () => {
    const stepType = steps[currentStep];
    switch (stepType) {
      case 'rating': 
        return <MichelinRating projectId={projectId} />;
      case 'voting':
        return <FeedbackPoll projectId={projectId} />;
      case 'proposal':
        return (
          <div className="space-y-6">
             <div className="bg-slate-900 rounded-3xl p-8 text-white">
                <h4 className="text-xl font-black mb-2 tracking-tight">Expert Feedback</h4>
                <p className="text-slate-400 text-sm leading-relaxed">작업물의 완성도를 높이기 위한 구체적인 제안을 남겨주세요.</p>
             </div>
             <textarea 
               value={proposalContent}
               onChange={(e) => setProposalContent(e.target.value)}
               placeholder="기획, 디자인, 기술적 관점에서 개선할 수 있는 점들을 자유롭게 적어주세요..."
               className="w-full h-64 bg-white border-2 border-slate-100 rounded-3xl p-6 text-slate-800 placeholder:text-slate-300 focus:border-slate-900 transition-all outline-none resize-none font-medium text-lg leading-relaxed shadow-sm"
             />
          </div>
        );
      default: return null;
    }
  };

  return (
    <main className="relative w-full h-screen overflow-hidden bg-slate-50 font-pretendard">
      {/* 1. Cloche Intro Layer */}
      <AnimatePresence>
        {phase === 'cloche' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ y: "-100%", opacity: 0, transition: { duration: 0.8, ease: [0.33, 1, 0.68, 1] } }}
            className="absolute inset-0 z-[100] bg-white flex flex-col items-center justify-center p-8 text-center"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="max-w-2xl w-full"
            >
              <div className="mb-12 inline-flex flex-col items-center">
                 <div className="w-20 h-20 bg-black rounded-3xl flex items-center justify-center mb-6 shadow-2xl">
                    <ChefHat size={40} className="text-orange-400" />
                 </div>
                 <h2 className="text-5xl font-black text-slate-900 tracking-tighter mb-4 leading-tight">
                    Preparing <span className="text-orange-500">Expert Audit</span>
                 </h2>
                 <p className="text-slate-400 font-bold text-lg uppercase tracking-widest">Vibefolio Selection Committee</p>
              </div>

              <div className="space-y-8 mb-12">
                 <div className="flex flex-col gap-2">
                    <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                       <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: "100%" }}
                          transition={{ duration: 2 }}
                          onAnimationComplete={handleFinishCloche}
                          className="h-full bg-slate-900" 
                       />
                    </div>
                    <div className="flex justify-between text-[10px] font-black text-slate-300 uppercase tracking-widest">
                       <span>Loading Assets</span>
                       <span>Expert Diagnostic Ready</span>
                    </div>
                 </div>
                 <div className="grid grid-cols-3 gap-4">
                    {['기획력', '완성도', '독창성'].map(item => (
                       <div key={item} className="bg-slate-50 px-4 py-3 rounded-2xl text-xs font-bold text-slate-400 border border-slate-100">
                          {item} 분석 준비
                       </div>
                    ))}
                 </div>
              </div>

              <p className="text-slate-400 text-sm font-medium italic">당신의 전문적인 한 표가 창작자에게 큰 영감이 됩니다.</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Main Split View Layout - Only Render in Viewer Phase to prevent overlap */}
      {phase === 'viewer' && (
        <div className="relative w-full h-full flex p-4 md:p-6 gap-6">
          {/* Left: Project Viewer Container (Browser Style - Image 2 Ref) */}
          <div className={cn(
            "flex-1 relative transition-all duration-500 ease-in-out flex flex-col min-w-0 h-full",
            viewerMode === 'desktop' && isReviewOpen ? "md:mr-[450px]" : ""
          )}>
          {phase === 'viewer' && (
            <div className="w-full h-full flex flex-col bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
              {/* Browser Header Section */}
              <div className="h-14 border-b border-slate-100 px-6 flex items-center justify-between bg-white shrink-0">
                <div className="flex items-center gap-4">
                  {/* macOS Dots */}
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
                    <div className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
                    <div className="w-3 h-3 rounded-full bg-[#28C840]" />
                  </div>
                  <div className="h-4 w-px bg-slate-100 mx-2" />
                  <span className="text-sm font-bold text-slate-400 tracking-tight">Project Live Preview</span>
                </div>
                
                {/* Desktop View Switchers */}
                <div className="hidden md:flex items-center gap-3">
                  <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100 shadow-inner">
                    <button 
                      onClick={() => setViewerMode('desktop')}
                      className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                        viewerMode === 'desktop' ? "bg-white text-green-600 shadow-sm" : "text-slate-400 hover:text-slate-600 font-medium"
                      )}
                    >
                      <Monitor size={14} /> PC
                    </button>
                    <button 
                      onClick={() => setViewerMode('mobile')}
                      className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                        viewerMode === 'mobile' ? "bg-white text-green-600 shadow-sm" : "text-slate-400 hover:text-slate-600 font-medium"
                      )}
                    >
                      <Smartphone size={14} /> Mobile
                    </button>
                  </div>
                  <div className="h-4 w-px bg-slate-100" />
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-9 px-3 text-slate-400 hover:text-slate-900 font-bold text-xs gap-2 rounded-xl"
                    onClick={() => window.open(url1 || '', '_blank')}
                  >
                    <Maximize2 size={14} /> 새 창 열기
                  </Button>
                </div>
              </div>

              {/* Iframe Content Area */}
              <div className="flex-1 bg-slate-50 flex items-center justify-center p-4 md:p-10 overflow-auto custom-scrollbar">
                <div className={cn(
                  "transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] shadow-[0_30px_100px_rgba(0,0,0,0.1)] overflow-hidden bg-white",
                  viewerMode === 'mobile' 
                    ? "w-[375px] h-[812px] flex-shrink-0 rounded-[3rem] border-[8px] border-slate-900" 
                    : "w-full h-full rounded-2xl"
                )}>
                  {url1 ? (
                    <iframe 
                      src={url1} 
                      className="w-full h-full border-none" 
                      title="Project Preview"
                      allow="fullscreen; accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-4">
                      <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center">
                         <Monitor size={32} />
                      </div>
                      <p className="font-bold">미리보기할 URL이 없습니다.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Review Panel (Fixed Side Panel Style - Image 3 Ref) */}
        <AnimatePresence>
          {isReviewOpen && (
            <motion.div
              initial={{ x: "100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className={cn(
                "fixed top-0 right-0 bottom-0 z-[55] bg-white flex flex-col shadow-[-10px_0_40px_rgba(0,0,0,0.05)] border-l border-slate-100",
                "w-full h-full md:w-[450px]"
              )}
            >
              <div className="flex flex-col h-full">
                {/* Panel Header */}
                <div className="p-6 md:p-8 border-b border-slate-50 flex items-center justify-between shrink-0">
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Selection Audit</h3>
                    <p className="text-[10px] font-black text-green-600 uppercase tracking-widest mt-1">Step {currentStep + 1} of {steps.length}</p>
                  </div>
                  <button 
                    onClick={() => setIsReviewOpen(false)}
                    className="p-3 hover:bg-slate-50 rounded-2xl text-slate-400 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Main Evaluation Form */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
                   {renderReviewStep()}
                </div>

                {/* Bottom Navigation */}
                <div className="p-6 md:p-8 border-t border-slate-50 bg-white shrink-0 space-y-4">
                  <div className="flex gap-4">
                    {currentStep > 0 && (
                      <Button 
                        variant="outline" 
                        size="lg" 
                        onClick={handlePrevStep}
                        className="flex-1 h-16 rounded-2xl border-2 border-slate-100 font-bold text-slate-600 hover:bg-slate-50"
                      >
                        <ChevronLeft className="mr-2" size={20} /> 이전으로
                      </Button>
                    )}
                    <Button 
                      size="lg" 
                      onClick={handleNextStep}
                      className="flex-[2] h-16 rounded-2xl bg-slate-900 text-white font-black text-lg shadow-xl hover:shadow-green-500/20 active:scale-95 transition-all"
                    >
                      {currentStep < steps.length - 1 ? (
                        <>다음 단계 <ChevronRight className="ml-2" size={20} /></>
                      ) : (
                        <>평가 완료 <CheckCircle2 className="ml-2" size={20} /></>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 3. Floating Evaluation Trigger (Desktop Only when closed) */}
      {phase === 'viewer' && viewerMode === 'desktop' && !isReviewOpen && (
        <div className="absolute bottom-10 right-10 z-[40]">
           <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsReviewOpen(true)}
              className="flex items-center gap-3 px-8 py-5 bg-slate-900 text-white rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.4)] hover:shadow-green-500/30 transition-all group"
           >
              <ChefHat size={24} className="text-green-400 group-hover:rotate-12 transition-transform" />
              <span className="text-lg font-black tracking-tight">분석 패널 열기</span>
           </motion.button>
        </div>
      )}

      {/* 4. Completion Modal */}
      {isSubmitted && (
         <div className="fixed inset-0 z-[200] bg-slate-900/40 backdrop-blur-xl flex items-center justify-center p-6">
            <motion.div 
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               className="bg-white rounded-[3rem] p-12 max-w-lg w-full text-center shadow-2xl relative overflow-hidden"
            >
               <div className="w-20 h-20 bg-green-500 text-white rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl">
                  <CheckCircle2 size={40} />
               </div>
               <h3 className="text-3xl font-black text-slate-900 mb-4 tracking-tighter">평가가 제출되었습니다!</h3>
               <p className="text-slate-500 font-medium leading-relaxed mb-10">
                  작성해주신 전문적인 데이터가 작가에게 큰 힘이 됩니다.<br/>
                  이제 결과를 공유하거나 메인으로 돌아가 보세요.
               </p>
               <div className="flex flex-col gap-3">
                  <Button size="xl" className="h-16 rounded-2xl bg-slate-900 text-white font-bold text-lg" onClick={() => window.location.href = '/'}>메인페이지로 이동</Button>
                  <Button variant="ghost" className="h-14 font-bold text-slate-400" onClick={() => setIsSubmitted(false)}>다시 확인하기</Button>
               </div>
            </motion.div>
         </div>
      )}
    </main>
  );
}

// --- Placeholder Components ---
function ReviewLanding() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8 space-y-12">
      <div className="text-center space-y-4">
        <h1 className="text-6xl font-black text-slate-900 tracking-tighter">V-Audit System</h1>
        <p className="text-xl text-slate-500 font-medium">바이브폴리오 선정위원회의 전문 평가 시스템입니다.</p>
      </div>
      <Button size="lg" className="h-16 px-10 rounded-2xl bg-slate-900 font-black text-xl" asChild>
        <Link href="/">홈으로 돌아가기</Link>
      </Button>
    </div>
  );
}

export default function ReviewPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ReviewContent />
    </Suspense>
  );
}
