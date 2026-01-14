"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Star, Info } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface MichelinRatingProps {
  projectId: string;
}

export function MichelinRating({ projectId }: MichelinRatingProps) {
  const [myScore, setMyScore] = useState(0); // 내가 선택 중인/남긴 점수
  const [displayScore, setDisplayScore] = useState(0); // 화면에 보여줄 임시 점수
  const [average, setAverage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const fetchRatingData = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('ProjectRating')
        .select('score')
        .eq('project_id', parseInt(projectId));

      if (error) throw error;

      if (data && data.length > 0) {
        const sum = data.reduce((acc: number, curr: any) => acc + Number(curr.score), 0);
        setAverage(Number((sum / data.length).toFixed(1)));
        setTotalCount(data.length);
      } else {
        setAverage(0);
        setTotalCount(0);
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: myData } = await (supabase as any)
          .from('ProjectRating')
          .select('score')
          .eq('project_id', parseInt(projectId))
          .eq('user_id', session.user.id)
          .single();
        
        if (myData) {
          const score = Number(myData.score);
          setMyScore(score);
          setDisplayScore(score);
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

    if (displayScore === 0) {
      toast.error("0점 이상의 점수를 선택해주세요.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await (supabase as any)
        .from('ProjectRating')
        .upsert({
          project_id: parseInt(projectId),
          user_id: session.user.id,
          score: displayScore
        }, { onConflict: 'project_id, user_id' });

      if (error) throw error;
      
      setMyScore(displayScore);
      setIsEditing(false);
      toast.success(`${displayScore}점을 남겼습니다! 🌟`);
      fetchRatingData();
    } catch (e) {
      console.error(e);
      toast.error("평점 등록에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 별점 채우기 계산 함수 (소수점 대응)
  const renderStars = (score: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => {
          const fill = Math.max(0, Math.min(1, score - (i - 1)));
          return (
            <div key={i} className="relative w-8 h-8 text-gray-200">
              <Star className="w-full h-full fill-current" />
              <div 
                className="absolute inset-0 text-amber-400 overflow-hidden" 
                style={{ width: `${fill * 100}%` }}
              >
                <Star className="w-8 h-8 fill-current" />
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-3xl p-8 border border-gray-100 shadow-xl mb-8 relative overflow-hidden group">
      {/* Decorative Michelin Background Elements */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-400/5 rounded-full blur-3xl group-hover:bg-amber-400/10 transition-colors" />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 relative z-10">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h4 className="text-xl font-black text-gray-900 tracking-tight">Vibefolio Michelin Score</h4>
            <span className="bg-amber-100 text-amber-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest animate-pulse">Expert Feedback</span>
          </div>
          <p className="text-sm text-gray-500 font-medium">작품의 완성도와 상업적 가치를 0.1 단위로 평가하세요.</p>
        </div>

        <div className="bg-white px-6 py-4 rounded-2xl border border-amber-100 shadow-sm flex items-center gap-4">
          <div className="text-center border-r border-gray-100 pr-4">
             <div className="text-2xl font-black text-amber-500 leading-none">{average > 0 ? average : "?.?"}</div>
             <div className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-tighter">Current Avg</div>
          </div>
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
             Total Reviews<br/>
             <span className="text-gray-900 text-sm leading-none">{totalCount}</span>
          </div>
        </div>
      </div>

      <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-100 relative z-10">
        <div className="flex flex-col items-center gap-6">
          {/* Main Visual Score */}
          <div className="relative pt-4 text-center">
            <div className="text-6xl font-black tracking-tighter text-gray-900 mb-2 tabular-nums">
              {displayScore.toFixed(1)}
            </div>
            {renderStars(displayScore)}
          </div>

          {/* Precision Slider */}
          <div className="w-full max-w-md space-y-4">
            <div className="relative h-10 flex items-center">
              <input 
                type="range"
                min="0"
                max="5"
                step="0.1"
                value={displayScore}
                onChange={(e) => {
                  setDisplayScore(parseFloat(e.target.value));
                  setIsEditing(true);
                }}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-amber-500 hover:accent-amber-600 transition-all"
              />
              {/* Scale Ticks */}
              <div className="absolute top-7 left-0 w-full flex justify-between px-1 text-[9px] font-bold text-gray-300 pointer-events-none">
                <span>0</span>
                <span>1</span>
                <span>2</span>
                <span>3</span>
                <span>4</span>
                <span>5</span>
              </div>
            </div>

            <div className="flex justify-center pt-4">
              <button
                disabled={isSubmitting || !isEditing}
                onClick={handleRatingSubmit}
                className={`flex items-center gap-2 px-10 py-3 rounded-xl font-black transition-all transform active:scale-95 ${
                  isEditing 
                    ? 'bg-gray-900 text-white shadow-xl hover:-translate-y-1 hover:shadow-2xl' 
                    : 'bg-gray-100 text-gray-400 cursor-default'
                }`}
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  myScore > 0 ? "점수 수정하기" : "평가 점수 제출"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-400 font-medium italic">
        <Info className="w-3 h-3" />
        {myScore > 0 
          ? `당신은 ${myScore}점을 부여했습니다. 당신의 의견이 평균 점수에 반영됩니다.` 
          : "슬라이더를 밀어 정밀한 평점을 기록하세요."}
      </div>
    </div>
  );
}
