"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from "@/lib/supabase/client";
import { 
  ArrowLeft, 
  BarChart3, 
  TrendingUp, 
  Users, 
  Star, 
  MessageSquare, 
  ChevronRight,
  Download,
  Share2,
  Rocket
} from 'lucide-react';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell,
  PieChart, Pie
} from 'recharts';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import dayjs from 'dayjs';

export default function AuditReportPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<any>(null);
  const [ratings, setRatings] = useState<any[]>([]);
  const [polls, setPolls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // 1. Fetch Project
        const { data: projectData, error: pError } = await supabase
          .from('Project')
          .select('*')
          .eq('project_id', Number(projectId))
          .single();
        
        if (pError) throw pError;
        
        const customData = typeof projectData.custom_data === 'string' 
          ? JSON.parse(projectData.custom_data) 
          : projectData.custom_data;
        
        setProject({ ...projectData, custom_data: customData });

        // 2. Fetch All Ratings
        const { data: ratingData } = await (supabase
          .from('ProjectRating') as any)
          .select('*')
          .eq('project_id', Number(projectId));
        
        setRatings(ratingData || []);

        // 3. Fetch All Polls
        const { data: pollData } = await (supabase
          .from('ProjectPoll') as any)
          .select('*')
          .eq('project_id', Number(projectId));
        
        setPolls(pollData || []);

      } catch (err) {
        console.error("Fetch report error:", err);
        toast.error("리포트 데이터를 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [projectId]);

  // --- Statistics Calculation ---

  const reportStats = useMemo(() => {
    if (!project || !ratings) return null;

    const categories = project.custom_data?.custom_categories || [
      { id: 'score_1', label: '기획력' },
      { id: 'score_2', label: '완성도' },
      { id: 'score_3', label: '독창성' },
      { id: 'score_4', label: '상업성' }
    ];

    // Radar Data
    const radarData = categories.map((cat: any) => {
      const sum = ratings.reduce((acc, curr) => acc + (curr[cat.id] || 0), 0);
      const avg = ratings.length > 0 ? (sum / ratings.length).toFixed(1) : 0;
      return {
        subject: cat.label,
        value: Number(avg),
        fullMark: 5
      };
    });

    // Poll Data
    const pollCounts: Record<string, number> = {};
    polls.forEach(p => {
      pollCounts[p.vote_type] = (pollCounts[p.vote_type] || 0) + 1;
    });

    const barData = Object.entries(pollCounts).map(([key, val]) => ({
      name: key === 'launch' ? '합격' : key === 'more' ? '보류' : key === 'research' ? '연구 필요' : key,
      value: val
    }));

    // A/B Test Data
    let abData: any[] = [];
    if (project.custom_data?.is_ab) {
       const aCount = polls.filter(p => p.vote_type?.includes('_A')).length;
       const bCount = polls.filter(p => p.vote_type?.includes('_B')).length;
       abData = [
         { name: 'Version A', value: aCount, fill: '#3b82f6' },
         { name: 'Version B', value: bCount, fill: '#f59e0b' }
       ];
    }

    return { radarData, barData, abData, participantCount: ratings.length };
  }, [project, ratings, polls]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="font-black text-xl animate-pulse">인사이트 분석 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-green-500 selection:text-black">
      {/* Sidebar/Header Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/5 px-6 py-4">
         <div className="max-w-7xl mx-auto flex items-center justify-between">
            <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group">
               <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
               <span className="text-sm font-bold">Back to Projects</span>
            </button>
            <div className="flex items-center gap-3">
               <button className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-full text-xs font-bold transition-all border border-white/10">
                  <Download className="w-3 h-3" /> PDF Export
               </button>
               <button className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-400 text-black rounded-full text-xs font-black transition-all shadow-lg shadow-green-500/20">
                  <Share2 className="w-3 h-3" /> Report Share
               </button>
            </div>
         </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 pt-32 pb-24">
         {/* Project Overview */}
         <div className="mb-16">
            <div className="flex items-center gap-3 mb-4">
               <span className="px-3 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-full text-[10px] font-black tracking-widest uppercase">
                  V-Audit Insights
               </span>
               <span className="text-slate-600 font-bold text-[10px]">VER. {project?.id?.slice(0, 8)}</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-6">{project?.title}</h1>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               {[
                 { label: 'Total Audits', value: reportStats?.participantCount, icon: Users, color: 'text-blue-400' },
                 { label: 'Avg Strategy', value: reportStats?.radarData[0]?.value, icon: Star, color: 'text-amber-400' },
                 { label: 'Completion', value: '98%', icon: TrendingUp, color: 'text-emerald-400' },
                 { label: 'Active Period', value: dayjs().diff(dayjs(project?.created_at), 'day') + ' Days', icon: Rocket, color: 'text-green-400' },
               ].map((stat, i) => (
                 <div key={i} className="bg-white/5 border border-white/10 p-6 rounded-[2rem] hover:bg-white/[0.08] transition-colors">
                    <stat.icon className={cn("w-5 h-5 mb-4", stat.color)} />
                    <p className="text-slate-500 text-xs font-bold mb-1 uppercase tracking-tight">{stat.label}</p>
                    <h3 className="text-2xl font-black">{stat.value}</h3>
                 </div>
               ))}
            </div>
         </div>

         {/* Visual Analytics Grid */}
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
            {/* 1. Radar Analysis */}
            <div className="bg-white/5 border border-white/10 p-10 rounded-[3rem] relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
                  <BarChart3 className="w-40 h-40 rotate-12" />
               </div>
               <h3 className="text-2xl font-black mb-8 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-green-500 rounded-full" />
                  Diagnostic Radar
               </h3>
               <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={reportStats?.radarData}>
                      <PolarGrid stroke="#334155" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 'bold' }} />
                      <PolarRadiusAxis angle={30} domain={[0, 5]} tick={{ fill: '#475569' }} />
                      <Radar
                        name="Average Score"
                        dataKey="value"
                        stroke="#22c55e"
                        fill="#22c55e"
                        fillOpacity={0.6}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
               </div>
               <div className="mt-8 grid grid-cols-2 gap-4">
                  {reportStats?.radarData.map((d: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-2xl border border-white/5">
                       <span className="text-xs font-bold text-slate-400">{d.subject}</span>
                       <span className="text-sm font-black text-green-400">{d.value}/5.0</span>
                    </div>
                  ))}
               </div>
            </div>

            {/* 2. Poll & Feedback */}
            <div className="space-y-8">
               <div className="bg-white/5 border border-white/10 p-10 rounded-[3rem]">
                  <h3 className="text-2xl font-black mb-8 flex items-center gap-2">
                     <span className="w-1.5 h-6 bg-blue-500 rounded-full" />
                     Decision Distribution
                  </h3>
                  <div className="h-[250px] w-full">
                     <ResponsiveContainer width="100%" height="100%">
                       <BarChart data={reportStats?.barData}>
                         <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                         <YAxis hide />
                         <Tooltip 
                            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                            itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                         />
                         <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                            {reportStats?.barData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={['#22c55e', '#f59e0b', '#ef4444'][index % 3]} />
                            ))}
                         </Bar>
                       </BarChart>
                     </ResponsiveContainer>
                  </div>
               </div>

               {/* A/B Test Results (Conditional) */}
               {project.custom_data?.is_ab && (
                 <div className="bg-amber-500/5 border border-amber-500/20 p-10 rounded-[3rem]">
                    <h3 className="text-2xl font-black mb-8 flex items-center gap-2">
                       <span className="w-1.5 h-6 bg-amber-500 rounded-full" />
                       A/B Preference Ratio
                    </h3>
                    <div className="flex items-center gap-10">
                       <div className="h-[150px] w-[150px]">
                          <ResponsiveContainer width="100%" height="100%">
                             <PieChart>
                                <Pie
                                  data={reportStats?.abData}
                                  innerRadius={50}
                                  outerRadius={70}
                                  paddingAngle={5}
                                  dataKey="value"
                                >
                                   {reportStats?.abData.map((entry: any, index: number) => (
                                     <Cell key={`cell-${index}`} fill={entry.fill} />
                                   ))}
                                </Pie>
                             </PieChart>
                          </ResponsiveContainer>
                       </div>
                       <div className="flex-1 space-y-4">
                          {reportStats?.abData.map((d: any, i: number) => (
                            <div key={i} className="flex items-center justify-between">
                               <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.fill }} />
                                  <span className="text-sm font-bold text-slate-300">{d.name}</span>
                               </div>
                               <span className="text-lg font-black">{d.value} Votes</span>
                            </div>
                          ))}
                       </div>
                    </div>
                 </div>
               )}
            </div>
         </div>

         {/* Detailed Feedback List */}
         <div className="bg-white/5 border border-white/10 rounded-[3rem] overflow-hidden">
            <div className="p-10 border-b border-white/10 flex items-center justify-between">
               <h3 className="text-2xl font-black flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-white rounded-full" />
                  Voice of Reviewers
               </h3>
               <span className="text-xs font-bold text-slate-500">{ratings.length} Comments Collected</span>
            </div>
            <div className="divide-y divide-white/5">
               {ratings.length > 0 ? (
                ratings.map((r, i) => (
                    <div key={i} className="p-8 hover:bg-white/[0.02] transition-colors group">
                       <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center gap-3">
                             <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-black text-xs border border-white/10 text-slate-400">
                                {i + 1}
                             </div>
                             <div>
                                <h4 className="text-sm font-black">익명의 전문가 {i + 1}</h4>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{dayjs(r.created_at).format('YYYY.MM.DD HH:mm')}</p>
                             </div>
                          </div>
                          <div className="flex items-center gap-1 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-2xl">
                             <Star className="w-3 h-3 text-green-400 fill-green-400" />
                             <span className="text-sm font-black text-green-400">{r.score?.toFixed(1) || '0.0'}</span>
                          </div>
                       </div>

                       {/* Custom Answers Analysis */}
                       {project.custom_data?.audit_questions?.length > 0 && r.custom_answers && (
                          <div className="mb-8 space-y-4">
                             {project.custom_data.audit_questions.map((q: string, qIdx: number) => (
                                <div key={qIdx} className="bg-white/[0.03] rounded-2xl p-5 border border-white/5 group-hover:bg-white/[0.05] transition-colors">
                                   <div className="flex items-start gap-3 mb-2">
                                      <span className="text-[10px] font-black text-slate-500 pt-0.5">Q{qIdx + 1}</span>
                                      <p className="text-xs font-bold text-slate-300 leading-relaxed">{q}</p>
                                   </div>
                                   <p className="text-sm font-medium text-white pl-7 border-l border-white/10 ml-1.5 py-1">
                                      {r.custom_answers[q] || <span className="text-slate-600 italic">답변이 없습니다.</span>}
                                   </p>
                                </div>
                             ))}
                          </div>
                       )}
                       
                       <div className="space-y-3 mb-6">
                          <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                             <MessageSquare className="w-3 h-3" /> 종합 개선 제안
                          </h5>
                          <div className="text-slate-300 text-sm leading-relaxed bg-white/5 p-6 rounded-3xl border border-white/5 italic">
                             "{r.proposal || r.comment || "별도의 총평 제안이 없습니다."}"
                          </div>
                       </div>

                       <div className="flex flex-wrap gap-2">
                          {project.custom_data?.custom_categories ? (
                             project.custom_data.custom_categories.map((cat: any, idx: number) => (
                                <span key={idx} className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-bold text-slate-500 border border-white/5">
                                   {cat.label}: {r[cat.id] || 0}
                                </span>
                             ))
                          ) : (
                             reportStats?.radarData.map((d: any, idx: number) => (
                                <span key={idx} className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-bold text-slate-500 border border-white/5">
                                   {d.subject}: {r[`score_${idx+1}`] || 0}
                                </span>
                             ))
                          )}
                       </div>
                    </div>
                 ))
               ) : (
                 <div className="p-20 text-center">
                    <MessageSquare className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                    <p className="text-slate-500 font-bold">아직 수집된 피드백이 없습니다.</p>
                 </div>
               )}
            </div>
         </div>
      </main>
      
      {/* Footer Branding */}
      <footer className="border-t border-white/5 py-12 px-6">
         <div className="max-w-7xl mx-auto flex items-center justify-between text-slate-600">
            <p className="text-xs font-bold font-mono">V-AUDIT INTELLIGENCE SYSTEM &copy; 2026</p>
            <div className="flex items-center gap-6">
               <button className="text-xs hover:text-white transition-all">Support</button>
               <button className="text-xs hover:text-white transition-all">Privacy</button>
            </div>
         </div>
      </footer>
    </div>
  );
}
