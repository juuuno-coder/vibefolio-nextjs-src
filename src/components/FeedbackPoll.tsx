"use client";

import React, { useState } from 'react';
import { Rocket, FlaskConical, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface FeedbackPollProps {
  projectId: string;
  initialCounts?: {
    launch: number;
    research: number;
    more: number;
  };
  userVote?: 'launch' | 'research' | 'more' | null;
}

export function FeedbackPoll({ projectId, initialCounts, userVote }: FeedbackPollProps) {
  const [selected, setSelected] = useState<string | null>(userVote || null);
  const [counts, setCounts] = useState(initialCounts || { launch: 0, research: 0, more: 0 });
  const [isVoting, setIsVoting] = useState(false);

  const handleVote = async (type: 'launch' | 'research' | 'more') => {
    if (isVoting) return;
    
    // Optimistic UI Update
    const prevSelected = selected;
    const prevCounts = { ...counts };

    // Toggle logic
    if (selected === type) {
      // Cancel vote
      setSelected(null);
      setCounts(prev => ({ ...prev, [type]: Math.max(0, prev[type] - 1) }));
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

    setIsVoting(true);

    try {
       // TODO: API Call (DB Migration needed)
       // await fetch(`/api/projects/${projectId}/vote`, { ... });
       
       // Simulate API delay
       await new Promise(r => setTimeout(r, 500));
       
       if (selected === type) {
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
      icon: Rocket,
      label: "당장 쓸게요!",
      color: "text-blue-500",
      bgFrom: "from-blue-500/10",
      bgTo: "to-blue-600/20",
      border: "border-blue-200",
      activeBorder: "border-blue-500",
      count: counts.launch
    },
    {
      id: 'more',
      icon: FlaskConical,
      label: "더 개발해주세요",
      color: "text-green-500",
      bgFrom: "from-green-500/10",
      bgTo: "to-green-600/20",
      border: "border-green-200",
      activeBorder: "border-green-500",
      count: counts.more
    },
    {
      id: 'research',
      icon: HelpCircle,
      label: "연구가 필요해요",
      color: "text-orange-500",
      bgFrom: "from-orange-500/10",
      bgTo: "to-orange-600/20",
      border: "border-orange-200",
      activeBorder: "border-orange-500",
      count: counts.research
    }
  ] as const;

  return (
    <div className="w-full bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        🗳️ 이 프로젝트 어때요? <span className="text-xs text-gray-400 font-normal">익명 투표</span>
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {options.map((opt) => {
          const Icon = opt.icon;
          const isSelected = selected === opt.id;
          
          return (
            <button
              key={opt.id}
              onClick={() => handleVote(opt.id)}
              disabled={isVoting}
              className={cn(
                "relative group flex items-center justify-between p-4 rounded-xl border transition-all duration-300 overflow-hidden",
                isSelected 
                  ? cn(opt.activeBorder, "bg-gradient-to-r", opt.bgFrom, opt.bgTo, "shadow-md scale-[1.02]") 
                  : cn("bg-gray-50 hover:bg-white hover:shadow-md", opt.border)
              )}
            >
              <div className="flex items-center gap-3 z-10">
                <div className={cn(
                  "p-2 rounded-full bg-white shadow-sm transition-transform duration-300 group-hover:scale-110",
                  isSelected ? "scale-110" : ""
                )}>
                  <Icon className={cn("w-5 h-5", opt.color)} />
                </div>
                <span className={cn(
                  "font-bold text-sm transition-colors",
                  isSelected ? "text-gray-900" : "text-gray-600"
                )}>{opt.label}</span>
              </div>
              
              <div className="flex flex-col items-end z-10">
                 <span className={cn(
                    "text-lg font-black font-mono transition-transform", 
                    opt.color,
                    isSelected ? "scale-110" : ""
                 )}>
                    {opt.count}
                 </span>
                 {isSelected && <span className="text-[10px] font-bold text-gray-500 animate-in fade-in slide-in-from-bottom-1">VOTED</span>}
              </div>

              {/* Background Effect */}
              {isSelected && (
                  <div className="absolute inset-0 bg-white/40 opacity-50 z-0" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
