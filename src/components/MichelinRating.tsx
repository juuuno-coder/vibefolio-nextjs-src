"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Star, Info, Target, Zap, Lightbulb, TrendingUp, Sparkles, MessageSquareQuote } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer,
  Text
} from 'recharts';

interface MichelinRatingProps {
  projectId: string;
  ratingId?: string; 
  isDemo?: boolean; 
  activeCategoryIndex?: number; // [New] 단계별 노출을 위한 인덱스
}

const DEFAULT_CATEGORIES = [
  { id: 'score_1', label: '기획력', icon: Lightbulb, color: '#f59e0b', desc: '논리적 구조와 의도', sticker: '/review/s1.png' },
  { id: 'score_2', label: '완성도', icon: Zap, color: '#3b82f6', desc: '디테일과 마감 수준', sticker: '/review/s2.png' },
  { id: 'score_3', label: '독창성', icon: Target, color: '#10b981', desc: '작가 고유의 스타일', sticker: '/review/s3.png' },
  { id: 'score_4', label: '상업성', icon: TrendingUp, color: '#ef4444', desc: '시장 가치와 잠재력', sticker: '/review/s4.png' },
];

const ICON_MAP: Record<string, any> = {
  Lightbulb, Zap, Target, TrendingUp, Star, Info, Sparkles, MessageSquareQuote
};

export function MichelinRating({ projectId, ratingId, isDemo = false, activeCategoryIndex }: MichelinRatingProps) {
  const [projectData, setProjectData] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>(DEFAULT_CATEGORIES);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [averages, setAverages] = useState<Record<string, number>>({});
  const [totalAvg, setTotalAvg] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [analysis, setAnalysis] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // 현재 내 점수들의 평균 계산 (실시간)
  const currentTotalAvg = useMemo(() => {
    const activeScores = Object.values(scores);
    if (activeScores.length === 0) return 0;
    const sum = activeScores.reduce((a, b) => a + b, 0);
    return Number((sum / activeScores.length).toFixed(1));
  }, [scores]);

  const fetchAIAnalysis = async (scoresToAnalyze: any) => {
    if (isDemo) {
        setAnalysis("이것은 데모 분석 결과입니다. 작가의 의도가 명확하며, 특히 독창성 부분에서 높은 점수를 기록했습니다. 상업적 가능성 또한 충분하여 발전 가능성이 기대되는 작품입니다.");
        return;
    }
    setIsAnalyzing(true);
    try {
      // AI 분석 서비스 일시 중단
      setAnalysis("현재 서비스 안정화를 위해 AI 정밀 분석 기능이 잠시 중단되었습니다. 곧 더 나은 서비스로 찾아뵙겠습니다.");
    } catch (e) {
      console.error("AI Analysis error:", e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const fetchRatingData = async () => {
    if (isDemo) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: any = {};
      if (session) headers['Authorization'] = `Bearer ${session.access_token}`;

      const res = await fetch(`/api/projects/${projectId}/rating`, { headers });
      const data = await res.json();

      if (data.success) {
        setProjectData(data.project);
        
        // 커스텀 카테고리 설정 확인 (audit_config.categories 또는 legacy custom_categories)
        const customCategories = data.project?.custom_data?.audit_config?.categories || data.project?.custom_data?.custom_categories;
        
        if (customCategories) {
          const custom = customCategories.map((c: any) => ({
            ...c,
            icon: ICON_MAP[c.icon] || Target
          }));
          setCategories(custom);
          
          // 초기 점수 셋팅
          const initialScores: Record<string, number> = {};
          custom.forEach((c: any) => initialScores[c.id] = 0);
          
          if (data.myRating) {
            custom.forEach((c: any) => {
              initialScores[c.id] = Number(data.myRating[c.id] || 0);
            });
          }
          setScores(initialScores);
          setAverages(data.averages || {});
        } else {
          // 기본 카테고리 사용 시
          const initial: Record<string, number> = {};
          DEFAULT_CATEGORIES.forEach(c => initial[c.id] = 0);
          
          if (data.myRating) {
            DEFAULT_CATEGORIES.forEach(c => {
               initial[c.id] = Number(data.myRating[c.id] || 0);
            });
          }
          setScores(initial);
          setAverages(data.averages || {});
        }
        
        setTotalAvg(data.totalAvg);
        setTotalCount(data.totalCount);

        // ratingId가 전달된 경우 해당 특정 평가 데이터를 강제로 덮어씀
        if (ratingId) {
          const { data: specificRating, error: sError } = await (supabase as any)
            .from('ProjectRating')
            .select('*')
            .eq('id', Number(ratingId))
            .single();
          
          if (!sError && specificRating) {
            const updatedScores: Record<string, number> = { ...scores };
            categories.forEach((c: any) => {
              updatedScores[c.id] = Number(specificRating[c.id] || 0);
            });
            setScores(updatedScores);
          }
        }

        // fetchAIAnalysis(data.averages);
      }
    } catch (e) {
      console.error("Failed to load ratings", e);
    }
  };

  useEffect(() => {
    if (projectId) fetchRatingData();
    else if (isDemo) {
        // 데모 모드 초기화
        const initial: Record<string, number> = {};
        DEFAULT_CATEGORIES.forEach(c => initial[c.id] = 0);
        setScores(initial);
    }
  }, [projectId]);

  useEffect(() => {
    const hasValues = Object.values(scores).some(v => v > 0);
    if (!hasValues) return;

    const timer = setTimeout(() => {
      handleRatingSubmit();
    }, 1500);

    return () => clearTimeout(timer);
  }, [scores]);

  const handleRatingSubmit = async () => {
    if (isDemo) {
        toast.success(`[데모] 평가가 반영되었습니다! (평균 ${currentTotalAvg}점)`);
        setIsEditing(false);
        // fetchAIAnalysis(scores);
        return;
    }
    const { data: { session } } = await supabase.auth.getSession();
    
    setIsSubmitting(true);
    try {
      if (!session) {
          // [Guest Mode]
          toast.success(`[비회원] 평가가 반영되었습니다! (평균 ${currentTotalAvg}점)`);
          setIsEditing(false);
          // fetchAIAnalysis(scores);
          return;
      }
      const res = await fetch(`/api/projects/${projectId}/rating`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          ...scores,
          score: currentTotalAvg,
          rating_id: ratingId ? Number(ratingId) : undefined // 수정 시 ID 포함
        })
      });

      if (!res.ok) throw new Error('Failed to submit rating');
      
      setIsEditing(false);
      toast.success(ratingId ? "평가가 수정되었습니다!" : "전문 평가가 등록되었습니다!");
      fetchRatingData();
      
      // 내 점수 기반으로 분석 갱신
      // fetchAIAnalysis(scores);
    } catch (e) {
      console.error(e);
      toast.error("평가 등록에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Recharts Data Transformation
  const chartData = useMemo(() => {
    return categories.map(cat => ({
      subject: cat.label,
      A: scores[cat.id] || 0,
      B: averages[cat.id] || 0,
      fullMark: 5,
    }));
  }, [categories, scores, averages]);

  // 커스텀 라벨 렌더러
  const renderCustomPolarAngleAxis = ({ payload, x, y, cx, cy, ...rest }: any) => {
    return (
      <Text
        {...rest}
        verticalAnchor="middle"
        y={y + (y > cy ? 10 : -10)}
        x={x + (x > cx ? 10 : -10)}
        className="text-[12px] font-black fill-slate-900 uppercase tracking-tighter"
      >
        {payload.value}
      </Text>
    );
  };

  // 단계별 모드일 때 렌더링할 특정 카테고리
  const activeCategory = typeof activeCategoryIndex === 'number' ? categories[activeCategoryIndex] : null;

  if (activeCategory) {
    return (
      <div className="w-full space-y-10 animate-in fade-in slide-in-from-right-8 duration-500">
        <div className="flex flex-col items-center gap-6">
           <div className="relative group">
              <div className="w-32 h-32 rounded-[2.5rem] bg-slate-900 flex items-center justify-center shadow-2xl transition-transform group-hover:scale-110 duration-500">
                 {activeCategory.sticker ? (
                   <Image src={activeCategory.sticker} alt={activeCategory.label} width={80} height={80} className="object-contain" />
                 ) : (
                   React.createElement(activeCategory.icon || Target, { className: "w-12 h-12 text-white" })
                 )}
              </div>
              <div className="absolute -top-2 -right-2 w-10 h-10 bg-white rounded-full shadow-lg border border-slate-100 flex items-center justify-center font-black text-slate-900">
                {activeCategoryIndex! + 1}
              </div>
           </div>
           <div className="text-center">
              <h4 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-2">{activeCategory.label}</h4>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">{activeCategory.desc}</p>
           </div>
        </div>

        <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-xl space-y-8">
           <div className="flex justify-between items-end">
              <div className="flex gap-2">
                 {[1, 2, 3, 4, 5].map(i => (
                    <Star key={i} className={cn("w-6 h-6", (scores[activeCategory.id] || 0) >= i ? "text-amber-400 fill-current" : "text-slate-100")} />
                 ))}
              </div>
              <div className="text-right">
                 <span className="text-6xl font-black tabular-nums tracking-tighter" style={{ color: activeCategory.color || '#f59e0b' }}>
                    {(scores[activeCategory.id] || 0).toFixed(1)}
                 </span>
                 <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Score / 5.0</p>
              </div>
           </div>

           <div className="relative h-12 flex items-center">
              <input 
                 type="range" 
                 min="0" 
                 max="5" 
                 step="0.1" 
                 value={scores[activeCategory.id] || 0} 
                 onChange={(e) => { 
                   setScores(prev => ({ ...prev, [activeCategory.id]: parseFloat(e.target.value) })); 
                   setIsEditing(true); 
                 }} 
                 className="w-full h-4 bg-slate-100 rounded-full appearance-none cursor-pointer accent-amber-500 hover:accent-amber-600 transition-all z-10" 
              />
              <div className="absolute inset-0 flex justify-between px-1 pointer-events-none items-center">
                 {[0, 1, 2, 3, 4, 5].map(v => (
                   <div key={v} className="flex flex-col items-center gap-2">
                      <div className="w-1 h-3 bg-slate-200 mt-8" />
                      <span className="text-[10px] font-bold text-slate-300">{v}</span>
                   </div>
                 ))}
              </div>
           </div>
        </div>

        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 italic text-slate-400 text-sm text-center font-medium">
           "이 항목은 프로젝트의 {activeCategory.label}을(를) 중점적으로 평가합니다."
        </div>
      </div>
    );
  }

  return (
    <div className="w-full relative overflow-hidden group">
      {/* Header Section */}
      <div className="flex flex-col gap-12 items-center">
        {/* Radar Chart Visual with Recharts */}
        <div className="relative w-full aspect-square max-w-[400px] flex justify-center items-center py-8">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                <PolarGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                <PolarAngleAxis 
                  dataKey="subject" 
                  tick={renderCustomPolarAngleAxis}
                />
                <PolarRadiusAxis 
                  angle={30} 
                  domain={[0, 5]} 
                  tick={false} 
                  axisLine={false} 
                />
                
                {/* Community Average */}
                {totalAvg > 0 && (
                  <Radar
                    name="Community"
                    dataKey="B"
                    stroke="#cbd5e1"
                    strokeWidth={1}
                    fill="#f1f5f9"
                    fillOpacity={0.4}
                  />
                )}
                
                {/* My Score */}
                <Radar
                  name="My Score"
                  dataKey="A"
                  stroke={activeCategoryIndex !== undefined ? categories[activeCategoryIndex]?.color || "#f59e0b" : "#f59e0b"}
                  strokeWidth={4}
                  fill="#f59e0b"
                  fillOpacity={0.15}
                  animationBegin={0}
                  animationDuration={500}
                />
              </RadarChart>
            </ResponsiveContainer>
           
           {/* Center Score Badge */}
           <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none scale-110">
              <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-xl border border-white/50 flex flex-col items-center">
                <span className="text-4xl font-black text-gray-900 tabular-nums leading-none mb-1">{currentTotalAvg.toFixed(1)}</span>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className={`w-3 h-3 ${currentTotalAvg >= i ? 'text-amber-400 fill-current' : 'text-gray-200'}`} />
                  ))}
                </div>
              </div>
           </div>
        </div>

        <div className="w-full space-y-8 max-w-lg">
          <div className="grid grid-cols-1 gap-8">
            {categories.map((cat) => (
              <div key={cat.id} className="space-y-3 group/item">
                <div className="flex justify-between items-end px-1">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-lg transition-transform group-hover/item:scale-110">
                      {React.createElement(cat.icon || Target, { className: "w-6 h-6" })}
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{cat.label}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">{cat.desc}</p>
                    </div>
                  </div>
                  <div className="text-center">
                    <span className="text-3xl font-black tabular-nums tracking-tighter" style={{ color: cat.color || '#f59e0b' }}>
                      {(scores[cat.id] || 0) > 0 ? (scores[cat.id] || 0).toFixed(1) : "0.0"}
                    </span>
                    <p className="text-[8px] font-black text-slate-300 uppercase">Score</p>
                  </div>
                </div>
                
                <div className="relative h-6 flex items-center">
                   <input 
                     type="range" 
                     min="0" 
                     max="5" 
                     step="0.1" 
                     value={scores[cat.id] || 0} 
                     onChange={(e) => { 
                       setScores(prev => ({ ...prev, [cat.id]: parseFloat(e.target.value) })); 
                       setIsEditing(true); 
                     }} 
                     className="w-full h-2 bg-slate-100 rounded-full appearance-none cursor-pointer accent-amber-500 hover:accent-amber-600 transition-all z-10" 
                   />
                   <div className="absolute inset-0 flex justify-between px-1 pointer-events-none">
                     {[0, 1, 2, 3, 4, 5].map(v => (
                       <div key={v} className="w-0.5 h-1 bg-slate-200 mt-5" />
                     ))}
                   </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 flex items-center justify-center gap-2 text-xs text-gray-400 font-medium italic">
         <Info className="w-4 h-4 flex-shrink-0" />
         <p>평가 완료 시 작가에게 분석 레포트 데이터가 전달됩니다. 각 항목을 신중히 조절하여 작품의 다면적인 가치를 기록해 주세요.</p>
      </div>
    </div>
  );
}
