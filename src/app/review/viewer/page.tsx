"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Monitor, 
  Smartphone, 
  Maximize2, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2, 
  ChefHat,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { MichelinRating } from '@/components/MichelinRating';
import { FeedbackPoll } from '@/components/FeedbackPoll';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';

type ViewerMode = 'desktop' | 'mobile';

function ViewerContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const projectId = searchParams.get('projectId');
  
  const [viewerMode, setViewerMode] = useState<ViewerMode>('desktop');
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [panelWidth, setPanelWidth] = useState(450);
  const [isResizing, setIsResizing] = useState(false);
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Review State
  const [currentStep, setCurrentStep] = useState(0); 
  const [steps, setSteps] = useState(['rating', 'voting', 'proposal']);
  const [proposalContent, setProposalContent] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    if (!projectId) {
      router.push('/review');
      return;
    }

    const fetchProject = async () => {
      try {
        const { data, error } = await supabase
          .from('Project')
          .select('*')
          .eq('project_id', Number(projectId))
          .single();

        if (error) throw error;
        setProject(data);
        if (data.custom_data?.review_steps) setSteps(data.custom_data.review_steps);
      } catch (e) {
        console.error("Failed to load project", e);
        toast.error("프로젝트를 불러오지 못했습니다.");
        router.push('/review');
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [projectId, router]);

  // Resizing Logic
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth > 350 && newWidth < 900) setPanelWidth(newWidth);
    };
    const handleMouseUp = () => setIsResizing(false);

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'default';
    };
  }, [isResizing]);

  // Auto-open panel with delay
  useEffect(() => {
    const timer = setTimeout(() => setIsReviewOpen(true), 800);
    return () => clearTimeout(timer);
  }, []);

  const handleNextStep = () => {
    if (currentStep < steps.length - 1) setCurrentStep(prev => prev + 1);
    else setIsSubmitted(true);
  };

  const handlePrevStep = () => {
    if (currentStep > 0) setCurrentStep(prev => prev - 1);
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-slate-50">
      <div className="w-12 h-12 border-4 border-slate-900 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const url1 = project?.primary_url || project?.preview_url || project?.url;
  const isAB = project?.custom_data?.is_ab_test;
  const url2 = project?.custom_data?.alternate_url;

  const renderReviewStep = () => {
    const stepType = steps[currentStep];
    switch (stepType) {
      case 'rating': return <MichelinRating projectId={projectId} />;
      case 'voting': return <FeedbackPoll projectId={projectId} />;
      case 'proposal': return (
        <div className="space-y-6">
           <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-xl">
              <h4 className="text-xl font-black mb-2 tracking-tight">Expert Feedback</h4>
              <p className="text-slate-400 text-sm leading-relaxed">작업물의 완성도를 높이기 위한 구체적인 제안을 남겨주세요.</p>
           </div>
           <textarea 
             value={proposalContent}
             onChange={(e) => setProposalContent(e.target.value)}
             placeholder="기획, 디자인, 기술적 관점에서 개선할 수 있는 점들을 자유롭게 적어주세요..."
             className="w-full h-64 bg-slate-50 border-2 border-slate-100 rounded-3xl p-6 text-slate-800 focus:border-slate-900 focus:bg-white transition-all outline-none resize-none font-medium text-lg shadow-inner"
           />
        </div>
      );
      default: return null;
    }
  };

  return (
    <main className="relative w-full h-screen overflow-hidden bg-slate-100 font-pretendard">
      <div className="relative w-full h-full flex p-3 md:p-6 gap-4 md:gap-6">
        {/* Project Preview Window (Browser Style) */}
        <div 
          className="flex-1 relative transition-all duration-500 ease-in-out flex flex-col min-w-0 h-full"
          style={{ marginRight: (isReviewOpen && typeof window !== 'undefined' && window.innerWidth > 768) ? panelWidth : 0 }}
        >
          <div className="w-full h-full flex flex-col bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden">
            {/* Browser Header */}
            <div className="h-14 border-b border-slate-100 px-6 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-4">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
                  <div className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
                  <div className="w-3 h-3 rounded-full bg-[#28C840]" />
                </div>
                <div className="h-4 w-px bg-slate-100 mx-2" />
                <span className="text-xs font-black text-slate-300 tracking-widest uppercase">Project Live Preview</span>
              </div>
              
              <div className="hidden md:flex items-center gap-3">
                <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100 shadow-inner">
                  <button onClick={() => setViewerMode('desktop')} className={cn("flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all", viewerMode === 'desktop' ? "bg-white text-slate-900 shadow-md" : "text-slate-400 hover:text-slate-600")}><Monitor size={14} /> PC</button>
                  <button onClick={() => setViewerMode('mobile')} className={cn("flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all", viewerMode === 'mobile' ? "bg-white text-slate-900 shadow-md" : "text-slate-400 hover:text-slate-600")}><Smartphone size={14} /> Mobile</button>
                </div>
                <Button variant="ghost" size="sm" className="h-10 px-4 text-slate-400 hover:text-slate-900 font-bold text-xs gap-2 rounded-xl" onClick={() => window.open(url1 || '', '_blank')}><Maximize2 size={14} /> 새 창</Button>
              </div>
            </div>

            {/* Preview Area */}
            <div className="flex-1 bg-slate-50 flex items-center justify-center p-4 md:p-10 overflow-auto custom-scrollbar">
              <div className={cn(
                "transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] shadow-[0_40px_100px_rgba(0,0,0,0.15)] overflow-hidden bg-white",
                viewerMode === 'mobile' ? "w-[375px] h-[812px] flex-shrink-0 rounded-[3.5rem] border-[12px] border-slate-900" : "w-full h-full rounded-3xl"
              )}>
                <div className="w-full h-full flex flex-col md:flex-row">
                   <div className={cn("h-full relative", isAB ? "w-full md:w-1/2 md:border-r border-slate-100" : "w-full")}>
                      {url1 ? <iframe src={url1} className="w-full h-full border-none" title="Preview A" /> : <div className="h-full flex items-center justify-center text-slate-300 font-bold">URL A Missing</div>}
                      {isAB && <div className="absolute top-4 left-4 bg-slate-900/90 text-white text-[10px] font-black px-3 py-1 rounded-full z-10 backdrop-blur-md border border-white/10 uppercase tracking-widest">Option A</div>}
                   </div>
                   {isAB && url2 && (
                     <div className="w-full md:w-1/2 h-full relative">
                        <iframe src={url2} className="w-full h-full border-none" title="Preview B" />
                        <div className="absolute top-4 left-4 bg-orange-500/90 text-white text-[10px] font-black px-3 py-1 rounded-full z-10 backdrop-blur-md border border-white/10 uppercase tracking-widest">Option B</div>
                     </div>
                   )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Evaluation Right Panel */}
        <AnimatePresence>
          {isReviewOpen && (
            <>
              {/* Resize Handle (Desktop Only) */}
              <div 
                onMouseDown={() => setIsResizing(true)} 
                className="hidden md:flex fixed top-0 bottom-0 z-[60] w-2 cursor-col-resize hover:bg-green-500/40 transition-colors group items-center justify-center" 
                style={{ right: panelWidth - 4 }}
              >
                <div className="w-1 h-16 bg-slate-200 rounded-full group-hover:bg-green-500 transition-colors" />
              </div>

              <motion.div 
                initial={{ x: "100%", opacity: 0 }} 
                animate={{ x: 0, opacity: 1 }} 
                exit={{ x: "100%", opacity: 0 }} 
                transition={{ type: "spring", damping: 28, stiffness: 220 }} 
                className="fixed top-0 right-0 bottom-0 z-[55] bg-white flex flex-col shadow-[-20px_0_60px_rgba(0,0,0,0.08)] border-l border-slate-100 w-full md:w-auto overflow-hidden" 
                style={{ width: (typeof window !== 'undefined' && window.innerWidth > 768) ? panelWidth : '100%' }}
              >
                <div className="flex flex-col h-full bg-slate-50/80">
                  {/* Panel Header */}
                  <div className="p-6 md:p-10 bg-white border-b border-slate-100 flex items-center justify-between shrink-0">
                    <div>
                      <h3 className="text-3xl font-black text-slate-900 tracking-tighter leading-none">Expert Audit</h3>
                      <p className="text-[11px] font-black text-green-600 uppercase tracking-[0.2em] mt-3 bg-green-50 inline-block px-3 py-1 rounded-full">Step {currentStep + 1} of {steps.length}</p>
                    </div>
                    <button onClick={() => setIsReviewOpen(false)} className="p-4 hover:bg-slate-100 rounded-[2rem] text-slate-400 transition-all active:scale-95"><X size={24} /></button>
                  </div>

                  {/* Mobile Viewport Styled Container */}
                  <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8">
                    <motion.div 
                      key={currentStep}
                      initial={{ opacity: 0, scale: 0.98, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      className="mx-auto max-w-[440px] bg-white rounded-[3rem] border border-slate-200 shadow-2xl overflow-hidden min-h-[600px] flex flex-col"
                    >
                      <div className="flex-1 p-8 md:p-10">
                         {renderReviewStep()}
                      </div>
                    </motion.div>
                  </div>

                  {/* Navigation Footer */}
                  <div className="p-8 md:p-10 border-t border-slate-100 bg-white shrink-0">
                    <div className="flex gap-4 max-w-[440px] mx-auto w-full">
                      {currentStep > 0 && (
                        <Button 
                          variant="outline" 
                          size="lg" 
                          onClick={handlePrevStep} 
                          className="w-20 h-20 rounded-[2rem] border-2 border-slate-100 font-bold text-slate-400 hover:text-slate-900 hover:border-slate-900 transition-all flex items-center justify-center shrink-0"
                        >
                          <ChevronLeft size={28} />
                        </Button>
                      )}
                      <Button 
                        size="lg" 
                        onClick={handleNextStep} 
                        className="flex-1 h-20 rounded-[2rem] bg-slate-900 text-white font-black text-xl shadow-2xl hover:bg-green-600 transition-all w-full flex items-center justify-center gap-3 uppercase tracking-tighter"
                      >
                        {currentStep < steps.length - 1 ? (
                          <>Next Audit <ChevronRight size={24} /></>
                        ) : (
                          <>Finish Diagnostic</>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Trigger Button */}
      {!isReviewOpen && (
        <div className="absolute bottom-12 right-12 z-[40]">
           <motion.button initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} whileHover={{ scale: 1.05, y: -5 }} onClick={() => setIsReviewOpen(true)} className="flex items-center gap-4 px-10 py-6 bg-slate-900 text-white rounded-full shadow-[0_30px_70px_rgba(0,0,0,0.5)]">
              <ChefHat size={28} className="text-orange-400" />
              <span className="text-xl font-black tracking-tight">Open Audit Panel</span>
           </motion.button>
        </div>
      )}

      {/* Completion Modal */}
      {isSubmitted && (
         <div className="fixed inset-0 z-[201] bg-slate-900/60 backdrop-blur-2xl flex items-center justify-center p-8">
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} className="bg-white rounded-[4rem] p-16 max-w-xl w-full text-center shadow-2xl relative overflow-hidden">
               <div className="w-24 h-24 bg-green-500 text-white rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-2xl shadow-green-500/30"><CheckCircle2 size={48} /></div>
               <h3 className="text-4xl font-black text-slate-900 mb-6 tracking-tighter">진단이 완료되었습니다!</h3>
               <p className="text-slate-500 text-lg font-medium leading-relaxed mb-12">당신의 전문적인 안목이 바이브폴리오의 퀄리티를 높입니다.<br/>분석된 데이터는 즉시 작가에게 전달됩니다.</p>
               <div className="flex flex-col gap-4">
                  <Button size="lg" className="h-20 rounded-3xl bg-slate-900 text-white font-black text-xl shadow-xl" onClick={() => window.location.href = '/'}>메인으로 돌아가기</Button>
                  <Button variant="ghost" className="h-14 font-bold text-slate-300 hover:text-slate-900" onClick={() => setIsSubmitted(false)}>결과 다시보기</Button>
               </div>
            </motion.div>
         </div>
      )}
    </main>
  );
}

export default function ViewerPage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center bg-slate-50 text-2xl font-black animate-pulse">INITIATING VIEWER...</div>}>
      <ViewerContent />
    </Suspense>
  );
}
