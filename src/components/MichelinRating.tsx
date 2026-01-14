"use client";

import React, { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface MichelinRatingProps {
  projectId: string;
}

export function MichelinRating({ projectId }: MichelinRatingProps) {
  const [rating, setRating] = useState(0);
  const [average, setAverage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [isRating, setIsRating] = useState(false);
  const [hover, setHover] = useState(0);

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

      // 내 평점 조회
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: myData } = await (supabase as any)
          .from('ProjectRating')
          .select('score')
          .eq('project_id', parseInt(projectId))
          .eq('user_id', session.user.id)
          .single();
        
        if (myData) setRating(Number(myData.score));
      }
    } catch (e) {
      console.error("Failed to load ratings", e);
    }
  };

  useEffect(() => {
    if (projectId) fetchRatingData();
  }, [projectId]);

  const handleRate = async (score: number) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error("로그인이 필요한 서비스입니다.");
      return;
    }

    setIsRating(true);
    try {
      const { error } = await (supabase as any)
        .from('ProjectRating')
        .upsert({
          project_id: parseInt(projectId),
          user_id: session.user.id,
          score: score
        }, { onConflict: 'project_id, user_id' });

      if (error) throw error;
      
      setRating(score);
      toast.success(`평점 ${score}점을 남겼습니다!`);
      fetchRatingData(); // Re-calculate average
    } catch (e) {
      console.error(e);
      toast.error("평점 등록에 실패했습니다.");
    } finally {
      setIsRating(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="font-bold text-gray-900 group">
            미슐랭 가이드 평점 
            <span className="ml-2 text-xs font-normal text-gray-400">냉정한 실력 평가</span>
          </h4>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1 text-amber-500 font-bold text-xl">
            <Star className="w-5 h-5 fill-current" />
            {average > 0 ? average : "평가 전"}
          </div>
          <div className="text-[10px] text-gray-400">{totalCount}명의 평가</div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 py-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            disabled={isRating}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            onClick={() => handleRate(star)}
            className="transition-transform hover:scale-110 active:scale-95 p-1"
          >
            <Star 
              className={`w-8 h-8 ${
                (hover || rating) >= star 
                  ? 'text-amber-400 fill-current' 
                  : 'text-gray-200'
              } transition-colors duration-200`} 
            />
          </button>
        ))}
      </div>
      
      <p className="text-center text-[10px] text-gray-400 mt-2">
        {rating > 0 ? `당신은 이 작품에 ${rating}점을 주었습니다.` : "당신의 점수를 매겨주세요!"}
      </p>
    </div>
  );
}
