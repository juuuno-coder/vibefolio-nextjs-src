"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Star, Info, Target, Zap, Lightbulb, TrendingUp, Sparkles, MessageSquareQuote } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface MichelinRatingProps {
  projectId: string;
}

const CATEGORIES = [
  { id: 'score_1', label: '기획력', icon: Lightbulb, color: '#f59e0b', desc: '논리적 구조와 의도' },
  { id: 'score_2', label: '완성도', icon: Zap, color: '#3b82f6', desc: '디테일과 마감 수준' },
  { id: 'score_3', label: '독창성', icon: Target, color: '#10b981', desc: '작가 고유의 스타일' },
  { id: 'score_4', label: '상업성', icon: TrendingUp, color: '#ef4444', desc: '시장 가치와 잠재력' },
];

export function MichelinRating({ projectId }: MichelinRatingProps) {
  const [scores, setScores] = useState<Record<string, number>>({
    score_1: 0, score_2: 0, score_3: 0, score_4: 0
  });
  const [averages, setAverages] = useState<Record<string, number>>({
    score_1: 0, score_2: 0, score_3: 0, score_4: 0
  });
  const [totalAvg, setTotalAvg] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [analysis, setAnalysis] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // 현재 내 점수들의 평균 계산 (실시간)
  const currentTotalAvg = useMemo(() => {
    const sum = Object.values(scores).reduce((a, b) => a + b, 0);
    return Number((sum / 4).toFixed(1));
  }, [scores]);

  const fetchAIAnalysis = async (scoresToAnalyze: any) => {
    setIsAnalyzing(true);
    try {
      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          scores: scoresToAnalyze,
          projectTitle: "현재 프로젝트",
          category: "포트폴리오"
        })
      });
      const data = await res.json();
      if (data.analysis) setAnalysis(data.analysis);
    } catch (e) {
      console.error("AI Analysis failed:", e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const fetchRatingData = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('ProjectRating')
        .select('*')
        .eq('project_id', parseInt(projectId));

      if (error) throw error;

      if (data && data.length > 0) {
        const aggs = data.reduce((acc: any, curr: any) => {
          acc.score_1 += Number(curr.score_1 || 0);
          acc.score_2 += Number(curr.score_2 || 0);
          acc.score_3 += Number(curr.score_3 || 0);
          acc.score_4 += Number(curr.score_4 || 0);
          return acc;
        }, { score_1: 0, score_2: 0, score_3: 0, score_4: 0 });

        const newAvgs = {
          score_1: Number((aggs.score_1 / data.length).toFixed(1)),
          score_2: Number((aggs.score_2 / data.length).toFixed(1)),
          score_3: Number((aggs.score_3 / data.length).toFixed(1)),
          score_4: Number((aggs.score_4 / data.length).toFixed(1)),
        };
        setAverages(newAvgs);
        setTotalAvg(Number((Object.values(newAvgs).reduce((a,b)=>a+b, 0) / 4).toFixed(1)));
        setTotalCount(data.length);
        
        // 데이터 로드 시 AI 분석 실행
        fetchAIAnalysis(newAvgs);
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: myData } = await (supabase as any)
          .from('ProjectRating')
          .select('*')
          .eq('project_id', parseInt(projectId))
          .eq('user_id', session.user.id)
          .single();
        
        if (myData) {
          setScores({
            score_1: Number(myData.score_1 || 0),
            score_2: Number(myData.score_2 || 0),
            score_3: Number(myData.score_3 || 0),
            score_4: Number(myData.score_4 || 0),
          });
        }
      }
    } catch (e) {
      console.error("Failed to load ratings", e);
    }
  };

  useEffect(() => {
    if (projectId) fetchRatingData();
  }, [projectId]);

  const handleRatingSubmit = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error("로그인이 필요한 서비스입니다.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await (supabase as any)
        .from('ProjectRating')
        .upsert({
          project_id: parseInt(projectId),
          user_id: session.user.id,
          ...scores,
          score: currentTotalAvg
        }, { onConflict: 'project_id, user_id' });

      if (error) throw error;
      
      setIsEditing(false);
      toast.success(`전문 평가가 등록되었습니다! (평균 ${currentTotalAvg}점)`);
      fetchRatingData();
      
      // 내 점수 기반으로 분석 갱신
      fetchAIAnalysis(scores);
    } catch (e) {
      console.error(e);
      toast.error("평가 등록에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 레이더 차트 생성 헬퍼
  const getRadarPath = (data: Record<string, number>, scale: number = 1) => {
    const center = 100;
    const max = 5;
    const radius = 80 * scale;
    const points = [
      [center, center - (data.score_1 / max) * radius],
      [center + (data.score_2 / max) * radius, center],
      [center, center + (data.score_3 / max) * radius],
      [center - (data.score_4 / max) * radius, center],
    ];
    return `M ${points[0][0]} ${points[0][1]} L ${points[1][0]} ${points[1][1]} L ${points[2][0]} ${points[2][1]} L ${points[3][0]} ${points[3][1]} Z`;
  };

  return (
    <div className="bg-white rounded-[2.5rem] p-8 md:p-12 border border-gray-100 shadow-2xl mb-12 relative overflow-hidden group">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 relative z-10">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
                <Star className="w-5 h-5 text-amber-400 fill-current" />
             </div>
             <div>
               <h4 className="text-2xl font-black text-gray-900 tracking-tight">Vibefolio Michelin Diagnostic</h4>
               <p className="text-sm font-bold text-amber-600 uppercase tracking-widest">Expert Multi-Dimension Analysis</p>
             </div>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100 shadow-inner">
           <div className="text-center px-4 border-r border-gray-200">
              <div className="text-3xl font-black text-gray-900 leading-none">{totalAvg > 0 ? totalAvg.toFixed(1) : "?.?"}</div>
              <p className="text-[10px] font-black text-gray-400 mt-2 uppercase">Total Avg Score</p>
           </div>
           <div className="text-[10px] font-bold text-gray-500 uppercase leading-tight">
              Reviewers<br/>
              <span className="text-gray-900 text-lg">{totalCount}</span>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Radar Chart Visual */}
        <div className="relative flex justify-center items-center py-8">
           <svg width="240" height="240" viewBox="0 0 200 200" className="drop-shadow-2xl">
              {[1, 0.8, 0.6, 0.4, 0.2].map((s) => (
                <path key={s} d={getRadarPath({ score_1: 5, score_2: 5, score_3: 5, score_4: 5 }, s)} fill="none" stroke="#f1f5f9" strokeWidth="1" />
              ))}
              <line x1="100" y1="20" x2="100" y2="180" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="20" y1="100" x2="180" y2="100" stroke="#f1f5f9" strokeWidth="1" />
              {totalAvg > 0 && (
                <path d={getRadarPath(averages)} fill="rgba(0, 0, 0, 0.03)" stroke="rgba(0, 0, 0, 0.1)" strokeWidth="1" strokeDasharray="4 4" />
              )}
              <path d={getRadarPath(scores)} fill="rgba(245, 158, 11, 0.15)" stroke="#f59e0b" strokeWidth="3" strokeLinejoin="round" className="transition-all duration-300 ease-out" />
              <text x="100" y="12" textAnchor="middle" className="text-[10px] font-black fill-gray-400">기획력</text>
              <text x="188" y="103" textAnchor="start" className="text-[10px] font-black fill-gray-400">완성도</text>
              <text x="100" y="195" textAnchor="middle" className="text-[10px] font-black fill-gray-400">독창성</text>
              <text x="12" y="103" textAnchor="end" className="text-[10px] font-black fill-gray-400">상업성</text>
           </svg>

           <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-4xl font-black text-gray-900 tabular-nums">{currentTotalAvg.toFixed(1)}</span>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((i) => (
                   <Star key={i} className={`w-3 h-3 ${currentTotalAvg >= i ? 'text-amber-400 fill-current' : 'text-gray-200'}`} />
                ))}
              </div>
           </div>
        </div>

        <div className="space-y-6">
          {CATEGORIES.map((cat) => (
            <div key={cat.id} className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-gray-50 text-gray-600"><cat.icon className="w-4 h-4" /></div>
                  <div><span className="text-sm font-black text-gray-800">{cat.label}</span></div>
                </div>
                <span className="text-lg font-black tabular-nums" style={{ color: cat.color }}>{scores[cat.id].toFixed(1)}</span>
              </div>
              <input type="range" min="0" max="5" step="0.1" value={scores[cat.id]} onChange={(e) => { setScores(prev => ({ ...prev, [cat.id]: parseFloat(e.target.value) })); setIsEditing(true); }} className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-gray-900 hover:accent-amber-500 transition-all" />
            </div>
          ))}

          <div className="pt-6 flex justify-center">
            <button disabled={isSubmitting || !isEditing} onClick={handleRatingSubmit} className={`w-full max-w-xs py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all ${isEditing ? 'bg-black text-white shadow-2xl hover:-translate-y-1' : 'bg-gray-100 text-gray-400 cursor-default'}`}>
              {isSubmitting ? "Submitting..." : (scores.score_1 > 0 ? "Update Diagnostic" : "Confirm Multi-Diagnostic")}
            </button>
          </div>
        </div>
      </div>

      {/* AI Inspector Section */}
      <div className="mt-12 bg-gray-900 rounded-[2rem] p-8 border border-gray-800 relative overflow-hidden group">
         <div className="absolute top-0 right-0 p-8 opacity-10">
            <Sparkles className="w-24 h-24 text-white" />
         </div>
         <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <div className="px-2 py-0.5 bg-green-500 text-white text-[10px] font-bold rounded uppercase tracking-tighter">AI Inspector</div>
              <h5 className="text-white font-bold flex items-center gap-2 italic">
                <MessageSquareQuote className="w-4 h-4 text-gray-400" />
                "인스펙터의 한마디"
              </h5>
            </div>
            
            {isAnalyzing ? (
               <div className="flex items-center gap-3">
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <p className="text-gray-400 text-sm animate-pulse">평점을 바탕으로 전문가의 조언을 생성 중입니다...</p>
               </div>
            ) : analysis ? (
               <p className="text-lg text-white font-medium leading-relaxed font-serif italic">
                 {analysis}
               </p>
            ) : (
               <p className="text-gray-500 text-sm">평가를 완료하면 AI 인스펙터의 전문적인 분석 리포트를 받아보실 수 있습니다.</p>
            )}
         </div>
      </div>

      <div className="mt-8 flex items-center justify-center gap-2 text-xs text-gray-400 font-medium italic">
         <Info className="w-4 h-4 flex-shrink-0" />
         <p>평가 완료 시 작가에게 분석 레포트 데이터가 전달됩니다. 각 항목을 신중히 조절하여 작품의 다면적인 가치를 기록해 주세요.</p>
      </div>
    </div>
  );
}
