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
  Share2,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { MichelinRating } from '@/components/MichelinRating';
import { FeedbackPoll } from '@/components/FeedbackPoll';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';
import { MediaPreview } from '@/components/Review/MediaPreview';

type ViewerMode = 'desktop' | 'mobile';

function ViewerContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const projectId = searchParams.get('projectId');
  const ratingId = searchParams.get('ratingId');
  
  const [viewerMode, setViewerMode] = useState<ViewerMode>('desktop');
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [panelWidth, setPanelWidth] = useState(450);
  const [isResizing, setIsResizing] = useState(false);
  const [project, setProject] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAuditExpired, setIsAuditExpired] = useState(false);

  // Review State
  const [currentStep, setCurrentStep] = useState(0); 
  const [steps, setSteps] = useState(['rating', 'voting', 'proposal']);
  const [proposalContent, setProposalContent] = useState("");
  const [customAnswers, setCustomAnswers] = useState<Record<string, string>>({});
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
        if ((data as any).custom_data?.review_steps) setSteps((data as any).custom_data.review_steps);

        // Check deadline
        if ((data as any).audit_deadline && new Date((data as any).audit_deadline) < new Date()) {
          setIsAuditExpired(true);
        }
      } catch (e) {
        console.error("Failed to load project", e);
        toast.error("프로젝트를 불러오지 못했습니다.");
        router.push('/review');
      }
    };

    const checkUser = async () => {
       const { data: { user } } = await supabase.auth.getUser();
       setUser(user);
    };

    const fetchMyRating = async () => {
       const { data: { user } } = await supabase.auth.getUser();
       if (!user) return;
       
       const { data } = await (supabase as any)
         .from('ProjectRating')
         .select('proposal, custom_answers')
         .eq('project_id', Number(projectId))
         .eq('user_id', user.id)
         .single();
       
       if (data) {
          if (data.proposal) setProposalContent(data.proposal);
          if (data.custom_answers) setCustomAnswers(data.custom_answers);
       }
    };

    Promise.all([fetchProject(), checkUser(), fetchMyRating()]).finally(() => setLoading(false));
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
    if (!user) {
      toast.error("진단 완료를 위해 로그인이 필요합니다.");
      router.push(`/login?returnUrl=${encodeURIComponent(window.location.href)}`);
      return;
    }
    if (isAuditExpired) {
      toast.error("진단 기한이 만료되었습니다.");
      return;
    }
    if (currentStep < steps.length - 1) setCurrentStep(prev => prev + 1);
    else handleFinalSubmit();
  };

  const handleFinalSubmit = async () => {
    if (!user) {
      toast.error("진단 완료를 위해 로그인이 필요합니다.");
      router.push(`/login?returnUrl=${encodeURIComponent(window.location.href)}`);
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(`/api/projects/${projectId}/rating`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          proposal: proposalContent,
          custom_answers: customAnswers
        })
      });

      if (!res.ok) throw new Error("Failed to save evaluation");
      
      setIsSubmitted(true);
      toast.success("진단이 최종 완료되었습니다! 🎉");
    } catch (e) {
      console.error(e);
      toast.error("진단 저장 중 오류가 발생했습니다.");
    }
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

  const auditType = project?.custom_data?.audit_type || 'link';
  const mediaData = project?.custom_data?.media_data || project?.primary_url || project?.preview_url || project?.url;
  const mediaDataB = project?.custom_data?.media_data_b || project?.custom_data?.alternate_url;

  const renderReviewStep = () => {
    const stepType = steps[currentStep];
    switch (stepType) {
      case 'rating': return <MichelinRating projectId={projectId || ""} ratingId={ratingId || undefined} />;
      case 'voting': return <FeedbackPoll projectId={projectId || ""} />;
      case 'proposal': 
        const customQuestions = project?.custom_data?.audit_questions || [];
        return (
          <div className="space-y-8 pb-10">
             <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                   <Monitor size={80} />
                </div>
                <h4 className="text-xl font-black mb-2 tracking-tight flex items-center gap-2">
                   <ChevronRight className="text-green-500" /> 핵심 역량 및 개선 제안
                </h4>
                <p className="text-slate-400 text-sm leading-relaxed">작업물의 가치를 높이기 위한 구체적인 제안을 남겨주세요.</p>
             </div>

             {/* Custom Questions Section */}
             {customQuestions.length > 0 && (
               <div className="space-y-8">
                  {customQuestions.map((q: string, idx: number) => (
                    <div key={idx} className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
                       <div className="flex items-start gap-3">
                          <span className="shrink-0 w-8 h-8 rounded-xl bg-green-500/10 text-green-600 flex items-center justify-center text-xs font-black border border-green-500/20">Q{idx+1}</span>
                          <h5 className="text-lg font-black text-slate-900 leading-snug pt-1">{q}</h5>
                       </div>
                       <textarea 
                         value={customAnswers[q] || ""}
                         onChange={(e) => setCustomAnswers(prev => ({ ...prev, [q]: e.target.value }))}
                         placeholder="이 질문에 대한 당신의 안목을 공유해 주세요..."
                         className="w-full h-40 bg-white border-2 border-slate-100 rounded-[2.5rem] p-8 text-slate-800 focus:border-green-500 focus:ring-4 focus:ring-green-500/5 transition-all outline-none resize-none font-medium text-lg shadow-sm"
                       />
                    </div>
                  ))}
               </div>
             )}

             <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-3">
                   <span className="shrink-0 w-8 h-8 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center text-xs font-black">C</span>
                   <h5 className="text-sm font-black text-slate-400 uppercase tracking-widest leading-snug">종합 총평 및 제안</h5>
                </div>
                <textarea 
                  value={proposalContent}
                  onChange={(e) => setProposalContent(e.target.value)}
                  placeholder="기획, 디자인, 기술적 관점에서 전체적인 소감을 자유롭게 적어주세요..."
                  className="w-full h-64 bg-slate-50 border-2 border-slate-100 rounded-[2.5rem] p-8 text-slate-800 focus:border-slate-900 focus:bg-white transition-all outline-none resize-none font-medium text-lg shadow-inner"
                />
             </div>
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
                "transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] shadow-[0_40px_100px_rgba(0,0,0,0.15)] overflow-hidden bg-white relative",
                viewerMode === 'mobile' ? "w-[375px] h-[812px] flex-shrink-0 rounded-[3.5rem] border-[12px] border-slate-900" : "w-full h-full rounded-3xl"
              )}>
                <MediaPreview 
                  type={auditType as any} 
                  data={mediaData} 
                  isAB={isAB} 
                  dataB={mediaDataB} 
                />
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
                  <div className="p-6 md:p-8 bg-white border-b border-slate-100 flex items-center justify-between shrink-0">
                    <div>
                      <h3 className="text-2xl font-black text-slate-900 tracking-tighter leading-none">
                        {currentStep === 0 ? "항목별 상세 진단" : currentStep === 1 ? "최종 합불 판정" : "상세 개선 제안"}
                      </h3>
                      <p className="text-[11px] font-black text-green-600 uppercase tracking-[0.2em] mt-3 bg-green-50 inline-block px-3 py-1 rounded-full">{currentStep + 1} / {steps.length} 단계</p>
                    </div>
                    <button onClick={() => setIsReviewOpen(false)} className="p-3 hover:bg-slate-100 rounded-2xl text-slate-400 transition-all active:scale-95"><X size={20} /></button>
                  </div>

                  {/* Main Evaluation Area - Optimized for direct content flow */}
                  <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <motion.div 
                      key={currentStep}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-6 md:p-10"
                    >
                       {renderReviewStep()}
                    </motion.div>
                  </div>

                  {/* Navigation Footer - Optimized Size */}
                  <div className="p-6 md:p-8 border-t border-slate-100 bg-white shrink-0">
                    <div className="flex gap-3 max-w-[440px] mx-auto w-full">
                      {currentStep > 0 && (
                        <Button 
                          variant="outline" 
                          size="lg" 
                          onClick={handlePrevStep} 
                          className="w-14 h-14 rounded-2xl border-2 border-slate-100 font-bold text-slate-400 hover:text-slate-900 hover:border-slate-900 transition-all flex items-center justify-center shrink-0"
                        >
                          <ChevronLeft size={24} />
                        </Button>
                      )}
                      <Button 
                        size="lg" 
                        onClick={handleNextStep} 
                        className="flex-1 h-14 rounded-2xl bg-slate-900 text-white font-black text-lg shadow-xl hover:bg-green-600 transition-all w-full flex items-center justify-center gap-2 uppercase tracking-tighter"
                      >
                        {currentStep < steps.length - 1 ? (
                          <>다음 단계로 <ChevronRight size={20} /></>
                        ) : (
                          <>진단 최종 완료</>
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

      {/* Completion Modal - Upgraded for V-Audit Experience */}
      {isSubmitted && (
         <div className="fixed inset-0 z-[201] bg-slate-900/80 backdrop-blur-3xl flex items-center justify-center p-4 md:p-8">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 50 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              className="bg-white rounded-[3rem] md:rounded-[4rem] p-8 md:p-16 max-w-2xl w-full text-center shadow-[0_50px_100px_rgba(0,0,0,0.5)] relative overflow-hidden"
            >
               {/* Decorative Background Elements */}
               <div className="absolute -top-24 -left-24 w-64 h-64 bg-green-500/10 rounded-full blur-3xl animate-pulse" />
               <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />

               <div className="relative z-10">
                 <motion.div 
                   initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring' }}
                   className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-green-400 to-green-600 text-white rounded-[2rem] md:rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-green-500/40"
                 >
                   <CheckCircle2 size={48} className="md:w-12 md:h-12" />
                 </motion.div>

                 <h3 className="text-3xl md:text-5xl font-black text-slate-900 mb-4 tracking-tighter leading-tight">진단이 성공적으로<br/>기록되었습니다!</h3>
                 <p className="text-slate-500 text-base md:text-xl font-medium leading-relaxed mb-10 max-w-md mx-auto">
                   당신의 안목이 담긴 데이터가 작가에게 전달되었습니다.<br/>
                   <span className="text-green-600 font-bold">V-Audit</span>의 통계 시스템으로 가치를 증명하세요.
                 </p>

                 {/* Actions */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md mx-auto">
                    <Button 
                      size="lg" 
                      className="h-16 md:h-20 rounded-3xl bg-slate-900 text-white font-black text-lg md:text-xl shadow-xl hover:bg-green-600 transition-all hover:-translate-y-1" 
                      onClick={() => window.location.href = '/'}
                    >
                      홈으로 이동
                    </Button>
                    <Button 
                      variant="outline"
                      size="lg" 
                      className="h-16 md:h-20 rounded-3xl border-2 border-slate-100 bg-white font-black text-lg md:text-xl shadow-lg hover:border-slate-900 transition-all hover:-translate-y-1 gap-2" 
                      onClick={() => {
                        navigator.clipboard.writeText(window.location.href);
                        toast.success("링크가 복사되었습니다! 친구들에게 공유하세요.");
                      }}
                    >
                      진단 링크 공유
                    </Button>
                 </div>
                 
                 <button 
                   className="mt-8 text-slate-400 hover:text-slate-900 font-bold text-sm transition-colors border-b border-transparent hover:border-slate-900"
                   onClick={() => setIsSubmitted(false)}
                 >
                   내 진단 결과 다시보기
                 </button>
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
