"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ChefHat } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';

function IntroContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const projectId = searchParams.get('projectId');
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

  const handleFinishCloche = () => {
    // Redirect to the evaluation viewer
    router.push(`/review/viewer?projectId=${projectId}`);
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-white">
      <div className="w-12 h-12 border-4 border-slate-900 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <main className="relative w-full h-screen overflow-hidden bg-white font-pretendard">
      <AnimatePresence mode="wait">
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
                        transition={{ duration: 2.5 }}
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
      </AnimatePresence>
    </main>
  );
}

export default function IntroPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <IntroContent />
    </Suspense>
  );
}
