"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, 
  PieChart, 
  Target, 
  MessageSquare, 
  TrendingUp, 
  Download, 
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Calendar
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ReportData {
  totalReviewers: number;
  michelin: {
    averages: {
      score_1: number;
      score_2: number;
      score_3: number;
      score_4: number;
    };
    totalAvg: number;
    count: number;
  };
  polls: {
    launch: number;
    more: number;
    research: number;
  };
  secretReviews: Array<{
    id: string;
    title: string;
    content: string;
    created_at: string;
    contact: string;
  }>;
}

interface ReviewReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectTitle: string;
}

export function ReviewReportModal({ open, onOpenChange, projectId, projectTitle }: ReviewReportModalProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ReportData | null>(null);

  useEffect(() => {
    if (open) {
      fetchReport();
    }
  }, [open, projectId]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/report`);
      const body = await res.json();
      if (body.success) {
        setData(body.report);
      }
    } catch (e) {
      console.error("Failed to fetch report:", e);
    } finally {
      setLoading(false);
    }
  };

  const getRadarPath = (scores: any, scale: number = 1) => {
    const center = 100;
    const max = 5;
    const radius = 80 * scale;
    const points = [
      [center, center - (scores.score_1 / max) * radius],
      [center + (scores.score_2 / max) * radius, center],
      [center, center + (scores.score_3 / max) * radius],
      [center - (scores.score_4 / max) * radius, center],
    ];
    return `M ${points[0][0]} ${points[0][1]} L ${points[1][0]} ${points[1][1]} L ${points[2][0]} ${points[2][1]} L ${points[3][0]} ${points[3][1]} Z`;
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-[3rem] border-none shadow-2xl p-0 bg-slate-50">
        
        {/* Header - Fixed-ish */}
        <div className="sticky top-0 z-20 bg-white border-b border-slate-100 p-8 flex justify-between items-center">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center text-white shadow-lg">
                  <BarChart3 size={24} />
               </div>
               <div>
                  <h2 className="text-xl font-black text-slate-900 leading-tight">평가 결과 상세 분석 리포트</h2>
                  <p className="text-sm font-bold text-slate-400 mt-1">Project: <span className="text-slate-600">{projectTitle}</span></p>
               </div>
            </div>
            <div className="flex items-center gap-2">
                <Button variant="outline" className="rounded-xl font-bold gap-2" onClick={() => window.print()}>
                    <Download size={16} /> PDF 저장
                </Button>
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center opacity-50 cursor-not-allowed">
                    <ShieldCheck size={20} />
                </div>
            </div>
        </div>

        {loading ? (
            <div className="p-20 flex flex-col items-center justify-center space-y-4">
                <div className="w-12 h-12 border-4 border-slate-200 border-t-black rounded-full animate-spin" />
                <p className="text-slate-400 font-bold animate-pulse">데이터 추출 및 분석 중...</p>
            </div>
        ) : !data ? (
            <div className="p-20 text-center">리포트를 불러오는 데 실패했습니다.</div>
        ) : (
            <div className="p-8 space-y-8 pb-16">
                
                {/* 1. Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        className="bg-white p-6 rounded-[2rem] border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
                    >
                        <p className="text-xs font-black text-slate-400 uppercase mb-2">Total Reviewers</p>
                        <h3 className="text-4xl font-black text-slate-900">{data.totalReviewers}<span className="text-lg font-bold ml-1 text-slate-400">명</span></h3>
                        <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full w-fit">
                            <TrendingUp size={12} /> 실시간 참여 중
                        </div>
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                        className="bg-gradient-to-br from-amber-500 to-orange-600 p-6 rounded-[2rem] text-white shadow-xl shadow-orange-100"
                    >
                        <p className="text-xs font-black text-orange-100 uppercase mb-2">Aggregate Score</p>
                        <h3 className="text-4xl font-black">{data.michelin.totalAvg.toFixed(1)}<span className="text-lg font-bold ml-1 text-orange-200">/ 5.0</span></h3>
                        <div className="mt-4 flex gap-1">
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} className={`w-4 h-1 rounded-full ${data.michelin.totalAvg >= i ? 'bg-white' : 'bg-white/30'}`} />
                            ))}
                        </div>
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                        className="bg-slate-900 p-6 rounded-[2rem] text-white shadow-xl"
                    >
                        <p className="text-xs font-black text-slate-500 uppercase mb-2">Market Sentiment</p>
                        <h3 className="text-2xl font-black text-emerald-400">
                            {data.polls.launch > data.polls.research ? "긍정적 (Launch)" : "보류 (Hold)"}
                        </h3>
                        <p className="text-[10px] text-slate-400 mt-2 font-medium">유저 반응 분포 기반 분석 결과</p>
                    </motion.div>
                </div>

                {/* 2. Visual Analysis Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Radar Chart Section */}
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                        <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-8 flex items-center gap-2">
                            <Target size={16} className="text-orange-500" /> 다면적 가치 분석 (Audit)
                        </h4>
                        <div className="flex justify-center relative py-4">
                            <svg width="240" height="240" viewBox="0 0 200 200" className="overflow-visible drop-shadow-xl">
                                {[1, 0.8, 0.6, 0.4, 0.2].map((s, idx) => (
                                    <path key={s} d={getRadarPath({ score_1: 5, score_2: 5, score_3: 5, score_4: 5 }, s)} fill={idx % 2 === 0 ? "rgba(0,0,0,0.02)" : "none"} stroke="#f1f5f9" strokeWidth="1" />
                                ))}
                                <path d={getRadarPath(data.michelin.averages)} fill="rgba(249, 115, 22, 0.1)" stroke="#f97316" strokeWidth="3" className="drop-shadow-[0_0_8px_rgba(249,115,22,0.3)]" />
                                
                                <text x="100" y="-8" textAnchor="middle" className="text-[10px] font-black fill-slate-400 uppercase tracking-tighter">기획력 ({data.michelin.averages.score_1})</text>
                                <text x="205" y="103" textAnchor="start" className="text-[10px] font-black fill-slate-400 uppercase tracking-tighter">완성도 ({data.michelin.averages.score_2})</text>
                                <text x="100" y="212" textAnchor="middle" className="text-[10px] font-black fill-slate-400 uppercase tracking-tighter">독창성 ({data.michelin.averages.score_3})</text>
                                <text x="-5" y="103" textAnchor="end" className="text-[10px] font-black fill-slate-400 uppercase tracking-tighter">상업성 ({data.michelin.averages.score_4})</text>
                            </svg>
                        </div>
                    </div>

                    {/* Poll Result Chart */}
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                        <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-8 flex items-center gap-2">
                            <PieChart size={16} className="text-indigo-500" /> 유저 반응 분포 (Sentiment)
                        </h4>
                        <div className="space-y-6">
                            {[
                                { id: 'launch', label: '합격 (Launch)', count: data.polls.launch, color: 'bg-green-500' },
                                { id: 'more', label: '보류 (Hold)', count: data.polls.more, color: 'bg-amber-500' },
                                { id: 'research', label: '연구 필요 (Reject)', count: data.polls.research, color: 'bg-red-500' },
                            ].map(item => {
                                const total = data.polls.launch + data.polls.more + data.polls.research || 1;
                                const percentage = (item.count / total) * 100;
                                return (
                                    <div key={item.id} className="space-y-1.5">
                                        <div className="flex justify-between text-xs font-bold">
                                            <span className="text-slate-600">{item.label}</span>
                                            <span className="text-slate-900">{percentage.toFixed(0)}% ({item.count}표)</span>
                                        </div>
                                        <div className="h-2.5 w-full bg-slate-50 rounded-full overflow-hidden">
                                            <motion.div 
                                                initial={{ width: 0 }} animate={{ width: `${percentage}%` }}
                                                className={`h-full ${item.color}`} 
                                            />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>

                {/* 3. Secret Review Feed */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                            <MessageSquare size={16} className="text-pink-500" /> 시크릿 평가 의견 전체보기
                        </h4>
                        <Badge variant="outline" className="rounded-lg text-slate-400">{data.secretReviews.length}건</Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <AnimatePresence>
                            {data.secretReviews.map((review, idx) => (
                                <motion.div 
                                    key={review.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="bg-white p-6 rounded-3xl border border-slate-100 hover:border-indigo-100 transition-all shadow-sm group"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
                                           <Sparkles size={18} className="text-slate-300 group-hover:text-indigo-400" />
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-slate-400 flex items-center justify-end gap-1">
                                                <Calendar size={10} /> {new Date(review.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <h5 className="font-bold text-slate-900 mb-2 truncate">{review.title}</h5>
                                    <p className="text-sm text-slate-500 line-clamp-3 leading-relaxed mb-4">{review.content}</p>
                                    <div className="pt-4 border-t border-slate-50 flex justify-between items-center text-[10px] font-bold">
                                        <span className="text-indigo-500">{review.contact || "비공개 연락처"}</span>
                                        <button className="text-slate-300 hover:text-indigo-500 transition-colors flex items-center gap-1">
                                            전문보기 <ArrowRight size={12} />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        
                        {data.secretReviews.length === 0 && (
                            <div className="col-span-full py-20 bg-white rounded-3xl border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-slate-300">
                                <MessageSquare size={40} className="mb-4 opacity-50" />
                                <p className="font-bold">아직 접수된 시크릿 평가 의견이 없습니다.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Insight */}
                <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-12 opacity-10">
                        <Sparkles size={120} />
                    </div>
                    <div className="relative z-10 max-w-2xl">
                        <Badge className="bg-indigo-500 hover:bg-indigo-500 mb-4 px-3 py-1 font-black">Vibefolio AI Insight</Badge>
                        <h4 className="text-2xl font-black mb-4">"종합 점수 {data.michelin.totalAvg.toFixed(1)}점, {data.totalReviewers}명의 시선을 사로잡았습니다."</h4>
                        <p className="text-slate-400 text-sm leading-relaxed font-medium">
                            본 데이터는 프로젝트의 완성도와 시장성을 다각도로 분석한 결과입니다. 
                            특히 '{Object.entries(data.michelin.averages).sort((a,b) => b[1]-a[1])[0][0] === 'score_1' ? '기획력' : '완성도'}' 부분에서 높은 평가를 받았으며, 
                            전달된 시크릿 평가 의견의 디테일한 조언을 반영하여 다음 단계로 발전시켜보세요.
                        </p>
                    </div>
                </div>
            </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
