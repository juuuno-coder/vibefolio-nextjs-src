"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ChefHat, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

function IntroContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const projectId = searchParams.get('projectId');
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  useEffect(() => {
    if (!projectId) {
      router.push('/review');
      return;
    }

    const fetchProject = async () => {
      try {
        const { error } = await supabase
          .from('Project')
          .select('project_id')
          .eq('project_id', Number(projectId))
          .single();

        if (error) throw error;
        setIsDataLoaded(true);
      } catch (e) {
        console.error("Failed to load project", e);
        toast.error("프로젝트를 불러오지 못했습니다.");
        router.push('/review');
      }
    };

    fetchProject();
  }, [projectId, router]);

  const handleFinishCloche = () => {
    // Automatic redirect removed as per user request
  };

  const handleStartReview = () => {
    router.push(`/review/viewer?projectId=${projectId}`);
  };

  return (
    <main className="relative w-full h-screen overflow-hidden bg-white font-pretendard text-slate-900">
      <AnimatePresence mode="wait">
        <motion.div
          key="intro-cloche"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ y: "-100%", opacity: 0, transition: { duration: 0.8, ease: [0.33, 1, 0.68, 1] } }}
          className="absolute inset-0 z-[100] bg-white flex flex-col items-center justify-center p-8 text-center"
        >
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl w-full"
          >
            <div className="mb-12 inline-flex flex-col items-center">
               <motion.div 
                 initial={{ y: 20, opacity: 0 }}
                 animate={{ y: 0, opacity: 1 }}
                 transition={{ delay: 0.2 }}
                 className="w-24 h-24 bg-slate-900 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-2xl relative"
               >
                  <ChefHat size={48} className="text-orange-400" />
                  {!isDataLoaded && (
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg border border-slate-100">
                       <Loader2 size={16} className="text-slate-900 animate-spin" />
                    </div>
                  )}
               </motion.div>
               <motion.h2 
                 initial={{ y: 20, opacity: 0 }}
                 animate={{ y: 0, opacity: 1 }}
                 transition={{ delay: 0.3 }}
                 className="text-6xl font-black text-slate-900 tracking-tighter mb-4 leading-tight"
               >
                  Preparing <span className="text-orange-500">Expert Audit</span>
               </motion.h2>
               <motion.p 
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 transition={{ delay: 0.4 }}
                 className="text-slate-400 font-bold text-lg uppercase tracking-[0.3em]"
               >
                 Vibefolio Selection Committee
               </motion.p>
            </div>

            <div className="space-y-10 mb-14 px-10">
               <div className="flex flex-col gap-3">
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                     <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: isDataLoaded ? "100%" : "30%" }}
                        transition={{ duration: isDataLoaded ? 1.5 : 8, ease: "linear" }}
                        className="h-full bg-slate-900" 
                     />
                  </div>
                  <div className="flex justify-between text-[11px] font-black text-slate-300 uppercase tracking-widest">
                     <span>{isDataLoaded ? "Assets Ready" : "Loading Assets..."}</span>
                     <span>Expert Diagnostic</span>
                  </div>
               </div>
               
               <motion.div 
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: 0.5 }}
                 className="grid grid-cols-3 gap-6"
               >
                  {['Planning', 'Quality', 'Orginality'].map((item) => (
                     <div key={item} className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center shadow-sm">
                           <div className={cn("w-2 h-2 rounded-full", isDataLoaded ? "bg-green-500 animate-pulse" : "bg-slate-200")} />
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item}</span>
                     </div>
                  ))}
               </motion.div>
            </div>

            <AnimatePresence>
              {isDataLoaded && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <p className="text-slate-400 text-sm font-medium italic">
                    당신의 전문적인 한 표가 창작자에게 큰 영감이 됩니다.
                  </p>
                  <Button 
                    onClick={handleStartReview}
                    className="h-16 px-12 rounded-2xl bg-slate-900 text-white font-black text-xl shadow-2xl hover:bg-orange-500 transition-all hover:-translate-y-1"
                  >
                    진단 시작하기
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </main>
  );
}

export default function IntroPage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center bg-white"><ChefHat size={40} className="text-slate-200 animate-pulse" /></div>}>
      <IntroContent />
    </Suspense>
  );
}
