"use client";

import React, { useState } from 'react';
import { Rocket, FlaskConical, HelpCircle, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';
import Image from 'next/image';

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
  const [counts, setCounts] = useState<Record<string, number>>(initialCounts || { launch: 0, research: 0, more: 0 });
  const [isVoting, setIsVoting] = useState(false);

  const [projectData, setProjectData] = useState<any>(null);

  // Fetch Poll Data on Mount
  React.useEffect(() => {
    if (!projectId || isDemo) return;
    const fetchPoll = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const headers: Record<string, string> = {};
            if (session) headers['Authorization'] = `Bearer ${session.access_token}`;

            const res = await fetch(`/api/projects/${projectId}/vote`, { headers });
            if (res.ok) {
                const data = await res.json();
                if (data.counts) setCounts(data.counts);
                if (data.myVote !== undefined) setSelected(data.myVote);
                if (data.project) setProjectData(data.project);
            }
        } catch (e) {
            console.error("Failed to load poll", e);
        }
    };
    fetchPoll();
  }, [projectId, isDemo]);

  const handleVote = async (type: string) => {
    if (isVoting) return;
    
    // Optimistic UI / Demo Logic Base is same
    const prevSelected = selected;
    const prevCounts = { ...counts };
    let newVoteType: string | null = type;

    // Toggle logic
    if (selected === type) {
      setSelected(null);
      newVoteType = null;
      setCounts(prev => {
          const newC = { ...prev };
          newC[type] = Math.max(0, (newC[type] || 0) - 1);
          return newC;
      });
    } else {
      setSelected(type);
      setCounts(prev => {
        const newCounts = { ...prev };
        newCounts[type] = (newCounts[type] || 0) + 1;
        if (prevSelected) {
            newCounts[prevSelected] = Math.max(0, (newCounts[prevSelected] || 0) - 1);
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
           toast.success(newVoteType ? "[비회원] 의견 감사합니다! 🎉" : "투표를 취소했습니다.");
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
       if (!res.ok) throw new Error('Vote Failed');
       
       if (!newVoteType) toast.info("투표를 취소했습니다.");
       else toast.success("참여해주셔서 감사합니다! 🎉");

    } catch (error) {
      console.error(error);
      toast.error("투표에 실패했습니다.");
      setSelected(prevSelected);
      setCounts(prevCounts);
    } finally {
      setIsVoting(false);
    }
  };

  // Dynamic Options Base
  const DEFAULT_OPTIONS = [
    { id: 'launch', icon: CheckCircle2, label: "합격입니다. 당장 쓸게요.", color: "text-green-500", bgFrom: "from-green-500/10", bgTo: "to-green-600/20", border: "border-green-200", activeBorder: "border-green-500", desc: "시장에 바로 출시 가능하며 즉시 사용 가치가 검증된 프로젝트", image_url: '/review/a1.jpeg' },
    { id: 'more', icon: Clock, label: "보류하겠습니다.", color: "text-amber-500", bgFrom: "from-amber-500/10", bgTo: "to-amber-600/20", border: "border-amber-200", activeBorder: "border-amber-500", desc: "기획은 좋으나 디테일이나 UI/UX 측면의 보완이 필요한 경우", image_url: '/review/a2.jpeg' },
    { id: 'research', icon: XCircle, label: "불합격드리겠습니다. 더 연구해 주세요.", color: "text-red-500", bgFrom: "from-red-500/10", bgTo: "to-red-600/20", border: "border-red-200", activeBorder: "border-red-500", desc: "컨셉의 전면적인 재검토나 핵심 기능의 재정의가 필요한 상태", image_url: '/review/a3.jpeg' }
  ];

  const options = React.useMemo(() => {
    const customPoll = projectData?.custom_data?.audit_config?.poll || projectData?.custom_data?.poll_config;
    const customOptions = customPoll?.options || projectData?.custom_data?.poll_options;
    
    if (customOptions && Array.isArray(customOptions)) {
      return customOptions.map((opt: any, idx: number) => ({
        id: opt.id || `opt_${idx}`,
        icon: opt.icon === 'flask' ? FlaskConical : opt.icon === 'help' ? HelpCircle : opt.id === 'launch' ? CheckCircle2 : CheckCircle2,
        image_url: opt.image_url,
        label: opt.label,
        desc: opt.desc,
        color: opt.color || (idx === 0 ? "text-green-500" : idx === 1 ? "text-amber-500" : "text-blue-500"),
        bgFrom: opt.bgFrom || (idx === 0 ? "from-green-500/10" : idx === 1 ? "from-amber-500/10" : "from-blue-500/10"),
        bgTo: opt.bgTo || (idx === 0 ? "to-green-600/20" : idx === 1 ? "to-amber-600/20" : "to-blue-600/20"),
        border: opt.border || (idx === 0 ? "border-green-200" : idx === 1 ? "border-amber-200" : "border-blue-200"),
        activeBorder: opt.activeBorder || (idx === 0 ? "border-green-500" : idx === 1 ? "border-amber-500" : "border-blue-500"),
        count: counts[opt.id] || 0
      }));
    }
    return DEFAULT_OPTIONS.map(opt => ({ ...opt, count: counts[opt.id as keyof typeof counts] || 0 }));
  }, [projectData, counts]);

  const selectedOption = React.useMemo(() => options.find(o => o.id === selected), [options, selected]);

  return (
    <div className="w-full relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-8 opacity-5">
         <Rocket className="w-32 h-32 text-gray-900" />
      </div>
      
      <div className="relative z-10 w-full space-y-3">
        {options.map((opt) => {
          const Icon = opt.icon;
          const isSelected = selected === opt.id;
          
          return (
            <button
              key={opt.id}
              onClick={() => handleVote(opt.id)}
              disabled={isVoting}
              className={cn(
                "w-full group relative flex items-center p-3 rounded-xl border transition-all duration-300 overflow-hidden text-left",
                isSelected 
                  ? cn(opt.activeBorder, "bg-white shadow-md ring-1 ring-[inherit]") 
                  : cn("bg-slate-50 hover:bg-white hover:shadow-sm border-transparent hover:border-slate-200")
              )}
            >
              {/* Sticker / Icon Area */}
              <div className={cn(
                "w-12 h-12 rounded-lg flex items-center justify-center shrink-0 mr-4 transition-transform group-hover:scale-110",
                isSelected ? "bg-white shadow-sm" : "bg-white/50"
              )}>
                {opt.image_url ? (
                  <Image src={opt.image_url} alt={opt.label} width={48} height={48} className="object-cover rounded-md" />
                ) : (
                  <Icon className={cn("w-6 h-6", opt.color)} />
                )}
              </div>
              
              {/* Text Area */}
              <div className="flex-1 min-w-0 pr-8">
                <div className={cn(
                  "font-bold text-sm leading-tight transition-colors mb-0.5",
                  isSelected ? "text-slate-900" : "text-slate-700"
                )}>
                  {opt.label}
                </div>
                <div className="text-[11px] text-slate-500 font-medium line-clamp-1 group-hover:line-clamp-none transition-all">
                  {opt.desc || "상세 설명이 없습니다."}
                </div>
              </div>
              
              {/* Selection Indicator */}
              {isSelected && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 animate-in zoom-in duration-200">
                  <div className={cn("w-6 h-6 rounded-full flex items-center justify-center shadow-sm", opt.color?.includes('green') ? 'bg-green-500' : opt.color?.includes('amber') ? 'bg-amber-500' : 'bg-blue-500')}>
                    <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                  </div>
                </div>
              )}

              {/* Count (Optional visual) */}
              <div className={cn(
                "absolute right-3 top-2 text-[10px] font-black text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity",
                isSelected && "opacity-0"
              )}>
                 {/* {opt.count > 0 && `+${opt.count}`} */}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
