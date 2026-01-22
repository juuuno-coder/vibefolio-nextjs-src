"use client";

import React, { Suspense, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ChefHat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { motion } from 'framer-motion';

function ReviewRootContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const projectId = searchParams.get('projectId');

  useEffect(() => {
    if (projectId) {
      // If project ID is provided, start with the Intro Clinical Phase
      router.replace(`/review/intro?projectId=${projectId}`);
    }
  }, [projectId, router]);

  // If no projectId, show the attractive V-Audit Landing Page
  if (!projectId) {
    return <ReviewLanding />;
  }

  // Brief fallback while redirecting
  return (
    <div className="h-screen flex items-center justify-center bg-white">
      <div className="w-12 h-12 border-4 border-slate-900 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function ReviewLanding() {
  return (
    <div className="min-h-screen bg-white font-pretendard overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-full text-xs font-black tracking-widest uppercase"
          >
            <ChefHat size={14} className="text-orange-400" />
            Vibefolio Expert Audit System (제 평가는요?)
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-6xl md:text-8xl font-black text-slate-900 tracking-tighter leading-[0.9]"
          >
            전문가의 시각으로<br/>
            <span className="text-slate-400">가치를 증명하세요.</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-2xl mx-auto text-xl text-slate-500 font-medium leading-relaxed"
          >
            V-Audit은 단순한 피드백을 넘어, 업계 전문가들의 기획력, 완성도, 독참성 분석을 통해 
            당신의 프로젝트가 가진 진정한 포텐셜을 진단합니다.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap justify-center gap-4 pt-4"
          >
            <Button size="lg" className="h-16 px-10 rounded-2xl bg-slate-900 text-white font-black text-xl shadow-2xl hover:scale-105 transition-all" asChild>
              <Link href="/growth">진단 시작하기</Link>
            </Button>
            <Button variant="outline" size="lg" className="h-16 px-10 rounded-2xl border-2 border-slate-100 font-black text-xl hover:bg-slate-50 transition-all">
              시스템 가이드라인
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-20 px-6 bg-slate-50">
         <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
            {[
               { title: "Point 01", label: "전문가 진단", desc: "현업 시니어급 전문가들의 정밀한 다각도 분석 시스템" },
               { title: "Point 02", label: "실시간 반응", desc: "사용자들의 실제 투표와 반응을 통한 시장성 검증" },
               { title: "Point 03", label: "인사이트 리포트", desc: "개선 방향과 기획 의도를 보강하는 AI 기반 인플레임" },
            ].map((f, i) => (
               <motion.div 
                 key={i}
                 initial={{ opacity: 0, scale: 0.9 }}
                 whileInView={{ opacity: 1, scale: 1 }}
                 viewport={{ once: true }}
                 className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4"
               >
                  <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">{f.title}</span>
                  <h3 className="text-2xl font-black text-slate-900">{f.label}</h3>
                  <p className="text-slate-500 font-medium leading-relaxed">{f.desc}</p>
               </motion.div>
            ))}
         </div>
      </section>
    </div>
  );
}

export default function ReviewPage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center bg-white"><div className="w-12 h-12 border-4 border-slate-900 border-t-transparent rounded-full animate-spin" /></div>}>
      <ReviewRootContent />
    </Suspense>
  );
}
