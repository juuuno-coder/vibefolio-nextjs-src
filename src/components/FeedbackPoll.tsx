"use client";

import React, { useState } from 'react';
import { Rocket, FlaskConical, HelpCircle, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';

interface FeedbackPollProps {
  projectId: string;
  initialCounts?: {
    launch: number;
    research: number;
    more: number;
  };
  userVote?: 'launch' | 'research' | 'more' | null;
  isDemo?: boolean; // [New] Demo Mode
}

export function FeedbackPoll({ projectId, initialCounts, userVote, isDemo = false }: FeedbackPollProps) {
  const [selected, setSelected] = useState<string | null>(userVote || null);
  const [counts, setCounts] = useState(initialCounts || { launch: 0, research: 0, more: 0 });
  const [isVoting, setIsVoting] = useState(false);

  // Fetch Poll Data on Mount
  React.useEffect(() => {
    if (!projectId || isDemo) return; // Skip in demo
    const fetchPoll = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const headers: Record<string, string> = {};
            if (session) {
                headers['Authorization'] = `Bearer ${session.access_token}`;
            }

            const res = await fetch(`/api/projects/${projectId}/vote`, { headers });
            if (res.ok) {
                const data = await res.json();
                if (data.counts) setCounts(data.counts);
                if (data.myVote !== undefined) setSelected(data.myVote);
            }
        } catch (e) {
            console.error("Failed to load poll", e);
        }
    };
    fetchPoll();
  }, [projectId, isDemo]);

  const handleVote = async (type: 'launch' | 'research' | 'more') => {
    if (isVoting) return;
    
    // Optimistic UI / Demo Logic Base is same
    const prevSelected = selected;
    const prevCounts = { ...counts };
    let newVoteType: string | null = type;

    // Toggle logic
    if (selected === type) {
      // Cancel vote
      setSelected(null);
      newVoteType = null;
      setCounts(prev => {
          const newC = { ...prev };
          newC[type] = Math.max(0, newC[type] - 1);
          return newC;
      });
    } else {
      // New vote or switch
      setSelected(type);
      setCounts(prev => {
        const newCounts = { ...prev };
        newCounts[type] = newCounts[type] + 1;
        if (prevSelected) {
            const key = prevSelected as keyof typeof newCounts;
            newCounts[key] = Math.max(0, newCounts[key] - 1);
        }
        return newCounts;
      });
    }

    if (isDemo) {
        toast.success(newVoteType ? "[데모] 소중한 의견 감사합니다! 🎉" : "[데모] 투표를 취소했습니다.");
        return;
    }

    setIsVoting(true);

    try {
       const { data: { session } } = await supabase.auth.getSession();
       if (!session) {
           // [Guest Mode]
           toast.success(newVoteType ? "[비회원] 소중한 의견 감사합니다! 🎉" : "[비회원] 투표를 취소했습니다.");
           setIsVoting(false);
           return;
       }

       const res = await fetch(`/api/projects/${projectId}/vote`, {
           method: 'POST',
           headers: { 
               'Content-Type': 'application/json',
               'Authorization': `Bearer ${session.access_token}`
           },
           body: JSON.stringify({ voteType: newVoteType })
       });
       
       if (!res.ok) {
           throw new Error('Vote Failed');
       }
       
       if (!newVoteType) {
           toast.info("투표를 취소했습니다.");
       } else {
           toast.success("소중한 의견 감사합니다! 🎉");
       }

    } catch (error) {
      console.error(error);
      toast.error("투표에 실패했습니다.");
      // Rollback
      setSelected(prevSelected);
      setCounts(prevCounts);
    } finally {
      setIsVoting(false);
    }
  };

  const options = [
    {
      id: 'launch',
      icon: CheckCircle2,
      label: "합격입니다. 당장 쓸게요.",
      color: "text-green-500",
      bgFrom: "from-green-500/10",
      bgTo: "to-green-600/20",
      border: "border-green-200",
      activeBorder: "border-green-500",
      count: counts.launch
    },
    {
      id: 'more',
      icon: Clock,
      label: "보류하겠습니다.",
      color: "text-amber-500",
      bgFrom: "from-amber-500/10",
      bgTo: "to-amber-600/20",
      border: "border-amber-200",
      activeBorder: "border-amber-500",
      count: counts.more
    },
    {
      id: 'research',
      icon: XCircle,
      label: "불합격드리겠습니다. 더 연구해 주세요.",
      color: "text-red-500",
      bgFrom: "from-red-500/10",
      bgTo: "to-red-600/20",
      border: "border-red-200",
      activeBorder: "border-red-500",
      count: counts.research
    }
  ] as const;

  return (
    <div className="w-full relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-8 opacity-5">
         <Rocket className="w-32 h-32 text-gray-900" />
      </div>
      
      <div className="relative z-10">

        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {options.map((opt) => {
            const Icon = opt.icon;
            const isSelected = selected === opt.id;
            
            return (
              <button
                key={opt.id}
                onClick={() => handleVote(opt.id)}
                disabled={isVoting}
                className={cn(
                  "relative group flex flex-col items-center justify-center p-8 rounded-[2rem] border-2 transition-all duration-500 overflow-hidden min-h-[220px]",
                  isSelected 
                    ? cn(opt.activeBorder, "bg-gradient-to-br", opt.bgFrom, opt.bgTo, "shadow-2xl scale-[1.03] -translate-y-1") 
                    : cn("bg-gray-50/50 hover:bg-white hover:shadow-xl hover:-translate-y-1 border-gray-100")
                )}
              >
                <div className={cn(
                  "w-16 h-16 rounded-2xl flex items-center justify-center mb-5 shadow-sm transition-all duration-500 group-hover:rotate-12",
                  isSelected ? "bg-white scale-110 shadow-lg rotate-0" : "bg-white"
                )}>
                  <Icon className={cn("w-8 h-8", opt.color)} />
                </div>
                
                <span className={cn(
                  "font-black text-[15px] leading-snug text-center break-keep transition-colors px-2",
                  isSelected ? "text-gray-900" : "text-gray-700"
                )}>{opt.label}</span>
                
                {isSelected && (
                  <div className="absolute top-4 right-4 animate-in zoom-in duration-300">
                    <div className={cn("px-2 py-0.5 rounded-full text-[9px] font-black tracking-widest text-white shadow-sm", opt.id === 'launch' ? 'bg-blue-500' : opt.id === 'more' ? 'bg-green-500' : 'bg-orange-500')}>
                      선택됨
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
        
        {/* Recommendation Guide - Optimized to explain choosing criteria */}
        <div className="mt-10 p-6 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0">
                 <Rocket className="w-5 h-5 text-indigo-500" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">진단 가이드라인</p>
                <div className="text-[13px] font-medium text-slate-600 leading-relaxed grid gap-1">
                   <p><span className="font-black text-green-600">합격:</span> 시장에 바로 출시 가능하며 즉시 사용 가치가 검증된 프로젝트</p>
                   <p><span className="font-black text-amber-500">보류:</span> 기획은 좋으나 디테일이나 UI/UX 측면의 보완이 필요한 경우</p>
                   <p><span className="font-black text-red-500">불합격:</span> 컨셉의 전면적인 재검토나 핵심 기능의 재정의가 필요한 상태</p>
                </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
