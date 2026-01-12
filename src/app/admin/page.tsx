// src/app/admin/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Image as ImageIcon,
  Users,
  Briefcase,
  MessageCircle,
  FileText,
  Settings,
  BarChart3,
  Shield,
  Eye,
  Trash2,
  AlertCircle,
  Loader2,
  Megaphone,
  HelpCircle,
  ChevronRight,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { useAdmin } from "@/hooks/useAdmin";
import { supabase } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";

export default function AdminPage() {
  const router = useRouter();
  const { isAdmin, isLoading: isAdminLoading, userId } = useAdmin();
  const [stats, setStats] = useState({
    todayVisits: 0,
    totalProjects: 0,
    totalUsers: 0,
    totalInquiries: 0,
    totalRecruitItems: 0,
    totalBanners: 0,
    totalNotices: 0,
    totalFaqs: 0,
    totalPopups: 0,
    projectGrowth: 0,
  });
  const [activeTab, setActiveTab] = useState<'projects' | 'inquiries'>('projects');
  const [hoveredChartData, setHoveredChartData] = useState<any | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [recentProjects, setRecentProjects] = useState<any[]>([]);
  const [recentInquiries, setRecentInquiries] = useState<any[]>([]);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);

  // 관리자가 아니면 접근 차단
  useEffect(() => {
    if (!isAdminLoading && !isAdmin) {
      alert('관리자 권한이 필요합니다.');
      router.push('/');
    }
  }, [isAdmin, isAdminLoading, router]);

  // 통계 및 최근 데이터 로드 (CSR 안전)
  useEffect(() => {
    // 클라이언트 사이드에서만 실행
    if (typeof window === 'undefined') return;
    if (!isAdmin) return;

    const loadStats = async () => {
      setIsLoadingStats(true);
      try {
        // 프로젝트 수
        const { count: projectCount } = await supabase
          .from('Project')
          .select('*', { count: 'exact', head: true });

        // 사용자 수
        const { count: userCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        // 공지사항 수
        const { count: noticeCount } = await supabase
          .from('notices')
          .select('*', { count: 'exact', head: true });

        // 문의사항 수
        const { count: inquiryCount } = await supabase
          .from('inquiries')
          .select('*', { count: 'exact', head: true });

        // 채용/공모전 수
        const { count: recruitCount } = await supabase
          .from('recruit_items')
          .select('*', { count: 'exact', head: true });

        // 활성 배너 수
        const { count: bannerCount } = await supabase
          .from('banners')
          .select('*', { count: 'exact', head: true });

        // FAQ 수
        const { count: faqCount } = await supabase
          .from('faqs')
          .select('*', { count: 'exact', head: true });

        // 팝업 수 (공지사항 중 팝업으로 설정된 것)
        const { count: popupCount } = await supabase
          .from('notices')
          .select('*', { count: 'exact', head: true })
          .eq('is_popup', true);

        // 최근 프로젝트
        const { data: projects } = await supabase
          .from('Project')
          .select(`
            *,
            profiles (username, avatar_url)
          `)
          .order('created_at', { ascending: false })
          .limit(5);

        // 최근 문의
        const { data: recentInqs } = await supabase
          .from('inquiries')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);

        setRecentInquiries(recentInqs || []);

        // 주간 데이터 (최근 7일) - 실제 데이터 병렬 조회
        const days = ['일', '월', '화', '수', '목', '금', '토'];
        const weeklyStats = [];
        let currentWeekProjectCount = 0; // 성장률 계산용

        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          
          // [Fix] UTC(`toISOString`)가 아닌 KST(로컬) 기준으로 날짜 생성
          // 새벽 시간에 UTC 변환 시 전날로 잡히는 문제 해결
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          const dateStr = `${year}-${month}-${day}`;

          // DB 쿼리 시 KST(+09:00) 타임존 명시 (한국 시간 기준 00:00~23:59)
          const queryDateStart = `${dateStr}T00:00:00+09:00`;
          const queryDateEnd = `${dateStr}T23:59:59+09:00`;

          // 4가지 지표 병렬 조회
          const [visitRes, userRes, projectRes, recruitRes] = await Promise.all([
            (supabase as any).from('site_stats').select('visits').eq('date', dateStr).single(),
            supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', queryDateStart).lte('created_at', queryDateEnd),
            supabase.from('Project').select('project_id', { count: 'exact', head: true }).gte('created_at', queryDateStart).lte('created_at', queryDateEnd),
            supabase.from('recruit_items').select('id', { count: 'exact', head: true }).gte('created_at', queryDateStart).lte('created_at', queryDateEnd),
          ]);
          
          const pCount = projectRes.count || 0;
          currentWeekProjectCount += pCount;

          weeklyStats.push({
            day: days[d.getDay()],
            visits: visitRes.data?.visits || 0,
            users: userRes.count || 0,
            projects: pCount,
            recruits: recruitRes.count || 0,
          });
        }
        
        // 성장률 계산을 위한 지난주 데이터 (프로젝트 기준)
        const prevWeekStart = new Date();
        prevWeekStart.setDate(prevWeekStart.getDate() - 14);
        const prevWeekEnd = new Date();
        prevWeekEnd.setDate(prevWeekEnd.getDate() - 8);
        
        const { count: lastWeekCount } = await supabase
          .from('Project')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', prevWeekStart.toISOString())
          .lt('created_at', prevWeekEnd.toISOString());

        // 성장률 계산 (기존 로직 유지)
        const growth = (lastWeekCount || 0) === 0 ? (currentWeekProjectCount > 0 ? 100 : 0) : Math.round(((currentWeekProjectCount - (lastWeekCount || 0)) / (lastWeekCount || 0)) * 100);

        setWeeklyData(weeklyStats);

        // 오늘 방문자수 조회
        let todayVisits = 0;
        try {
          const { data: visitData } = await (supabase as any)
            .from('site_stats')
            .select('visits')
            .eq('date', `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`)
            .single();
          todayVisits = visitData?.visits || 0;
        } catch (e) { console.warn('site_stats error', e); }

        setStats({
          todayVisits,
          totalProjects: projectCount || 0,
          totalUsers: userCount || 0,
          totalInquiries: inquiryCount || 0,
          totalRecruitItems: recruitCount || 0,
          totalBanners: bannerCount || 0,
          totalNotices: noticeCount || 0,
          totalFaqs: faqCount || 0,
          totalPopups: popupCount || 0,
          projectGrowth: growth,
        });

        setRecentProjects(projects || []);
      } catch (error) {
        console.error('통계 로드 실패:', error);
      } finally {
        setIsLoadingStats(false);
      }
    };

    loadStats();
  }, [isAdmin]);

  const adminMenus = [
    {
      title: "공지사항 관리",
      description: "서비스 공지 및 이벤트 소식 등록",
      icon: Megaphone,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      path: "/admin/notices",
      count: stats.totalNotices,
    },
    {
      title: "FAQ 관리",
      description: "자주 묻는 질문 등록 및 관리",
      icon: HelpCircle,
      color: "text-green-600",
      bgColor: "bg-green-50",
      path: "/admin/faqs",
      count: stats.totalFaqs,
    },
    {
      title: "배너 관리",
      description: "메인 페이지 배너 업로드 및 관리",
      icon: ImageIcon,
      color: "text-purple-500",
      bgColor: "bg-purple-50",
      path: "/admin/banners",
      count: stats.totalBanners,
    },
    {
      title: "프로젝트 관리",
      description: "등록된 프로젝트 조회 및 관리",
      icon: FileText,
      color: "text-blue-500",
      bgColor: "bg-blue-50",
      path: "/admin/projects",
      count: stats.totalProjects,
    },
    {
      title: "채용/공모전 관리",
      description: "채용, 공모전, 이벤트 관리",
      icon: Briefcase,
      color: "text-green-500",
      bgColor: "bg-green-50",
      path: "/admin/recruit",
      count: stats.totalRecruitItems,
    },
    {
      title: "문의 관리",
      description: "1:1 문의 내역 조회 및 답변",
      icon: MessageCircle,
      color: "text-orange-500",
      bgColor: "bg-orange-50",
      path: "/admin/inquiries",
      count: stats.totalInquiries,
    },
    {
      title: "사용자 관리",
      description: "회원 정보 조회 및 관리",
      icon: Users,
      color: "text-pink-500",
      bgColor: "bg-pink-50",
      path: "/admin/users",
      count: stats.totalUsers,
    },
    {
      title: "통계",
      description: "사이트 통계 및 분석",
      icon: BarChart3,
      color: "text-indigo-500",
      bgColor: "bg-indigo-50",
      path: "/admin/stats",
      count: 0,
    },
  ];

  // 로딩 중일 때
  if (isAdminLoading || isLoadingStats) {
    return (
      <div className="h-[80vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={40} className="animate-spin text-slate-300 mx-auto mb-4" />
          <p className="text-slate-400 font-medium">관리자 데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // const maxVal = Math.max(...weeklyData.map(d => d.value), 1); // 삭제

  return (
    <div className="space-y-10 pb-20">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            반가워요, <span className="text-[#16A34A]">관리자님!</span> 👋
          </h1>
          <p className="text-slate-500 mt-2 font-medium">오늘의 바이브폴리오 현황을 요약해 드립니다.</p>
        </div>
        <div className="flex items-center gap-3">
           <div className="px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-sm flex items-center gap-2">
             <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
             <span className="text-sm font-bold text-slate-600">시스템 정상 작동 중</span>
           </div>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "오늘 방문자수", value: stats.todayVisits, icon: Eye, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "전체 회원수", value: stats.totalUsers, icon: Users, color: "text-pink-600", bg: "bg-pink-50" },
          { label: "프로젝트 등록수", value: stats.totalProjects, icon: FileText, color: "text-indigo-600", bg: "bg-indigo-50" },
          { label: "채용/공모 등록수", value: stats.totalRecruitItems, icon: Briefcase, color: "text-green-600", bg: "bg-green-50" },
        ].map((item, i) => (
          <Card key={i} className="border-none shadow-sm hover:shadow-md transition-shadow duration-300 rounded-[24px] overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`${item.bg} ${item.color} p-3 rounded-2xl`}>
                  <item.icon size={22} />
                </div>
                <div className="text-[10px] font-black uppercase text-slate-300 tracking-widest leading-none bg-slate-50 px-2 py-1 rounded">Total</div>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 mb-1 uppercase tracking-tight">{item.label}</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-black text-slate-900">{item.value.toLocaleString()}</p>
                  {i === 0 && (
                    <span className={`text-[10px] font-bold ${stats.projectGrowth >= 0 ? 'text-green-500 bg-green-50' : 'text-red-500 bg-red-50'} px-1 rounded`}>
                      {stats.projectGrowth >= 0 ? `+${stats.projectGrowth}%` : `${stats.projectGrowth}%`}
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Weekly Activity Chart (CSS Pure) */}
        <Card className="lg:col-span-2 border-none shadow-sm rounded-[32px] overflow-hidden p-8 flex flex-col justify-between min-h-[400px] bg-white">
          <div>
            <div className="flex items-center justify-between mb-8">
              <CardTitle className="text-xl font-black flex items-center gap-2">
                <BarChart3 className="text-[#16A34A]" />
                주간 프로젝트 등록 현황
              </CardTitle>
              <select className="bg-slate-50 border-none text-[10px] font-bold text-slate-500 rounded-lg px-3 py-1.5 focus:ring-0 cursor-pointer">
                <option>최근 7일</option>
                <option>최근 30일</option>
              </select>
            </div>
            
            {/* Combined Chart (Bar + Lines) */}
            <div 
              className="w-full h-64 mt-6 relative"
              onMouseLeave={() => setHoveredChartData(null)}
            >
              {(() => {
                 const data = weeklyData.length > 0 ? weeklyData : Array(7).fill({day: '-', visits:0, users:0, projects:0, recruits:0});
                 // 1. Max Scales
                 const maxVisits = Math.max(...data.map((d: any) => d.visits), 10); // 막대용 (최소 10)
                 const maxOthers = Math.max(...data.map((d: any) => Math.max(d.users, d.projects, d.recruits)), 5); // 선 그래프용 (최소 5)

                 return (
                   <div className="w-full h-full relative font-bold text-[10px] text-slate-400">
                     {/* 범례 */}
                     <div className="absolute top-0 right-0 flex items-center gap-3">
                       <div className="flex items-center gap-1"><div className="w-2 h-2 bg-slate-200"></div> 방문자</div>
                       <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-pink-500"></div> 가입</div>
                       <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-indigo-500"></div> 프로젝트</div>
                       <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500"></div> 채용/공모</div>
                     </div>

                     {/* SVG Chart */}
                     <svg viewBox="0 0 100 50" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                       {/* Grid Lines (Horizontal) */}
                       {[0, 25, 50, 75, 100].map(y => ( <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="#f1f5f9" strokeWidth="0.5" /> ))}

                       {/* Bars (Visits) */}
                       {data.map((d: any, i: number) => {
                         const barHeight = (d.visits / maxVisits) * 50;
                         return (
                           <rect 
                             key={`bar-${i}`}
                             x={i * (100/7) + 2} 
                             y={50 - barHeight} 
                             width={(100/7) - 4} 
                             height={barHeight} 
                             fill="#e2e8f0" 
                             rx="1"
                             className="hover:fill-slate-300 transition-all"
                           >
                             <title>{d.visits} View</title>
                           </rect>
                         );
                       })}

                       {/* Lines (Others) using polyline */}
                         {/* Users (Pink) */}
                         <polyline 
                           fill="none" 
                           stroke="#ec4899" 
                           strokeWidth="1" 
                           strokeLinecap="round"
                           strokeLinejoin="round"
                           points={data.map((d: any, i: number) => `${i * (100/7) + (100/7)/2},${50 - (d.users / maxOthers) * 50}`).join(" ")}
                         />
                         {/* Projects (Indigo) */}
                         <polyline 
                           fill="none" 
                           stroke="#6366f1" 
                           strokeWidth="1" 
                           strokeLinecap="round"
                           strokeLinejoin="round"
                           points={data.map((d: any, i: number) => `${i * (100/7) + (100/7)/2},${50 - (d.projects / maxOthers) * 50}`).join(" ")}
                         />
                         {/* Recruits (Green) */}
                         <polyline 
                           fill="none" 
                           stroke="#22c55e" 
                           strokeWidth="1" 
                           strokeLinecap="round"
                           strokeLinejoin="round"
                           points={data.map((d: any, i: number) => `${i * (100/7) + (100/7)/2},${50 - (d.recruits / maxOthers) * 50}`).join(" ")}
                         />

                     {/* Interaction Layer (Full height columns) */}
                     {data.map((d: any, i: number) => (
                       <rect
                         key={`touch-${i}`}
                         x={i * (100/7)}
                         y="0"
                         width={100/7}
                         height="50"
                         fill="transparent"
                         className="cursor-pointer hover:fill-slate-900/5 transition-colors"
                         onMouseEnter={() => setHoveredChartData({ ...d, index: i })}
                       />
                     ))}
                   </svg>

                   {/* Hover Tooltip (Absolute Position) */}
                   {hoveredChartData && (
                     <div 
                       className="absolute bg-slate-900 text-white text-[10px] p-3 rounded-xl shadow-xl z-50 pointer-events-none transition-all duration-200 ease-out transform -translate-x-1/2 -translate-y-2"
                       style={{ 
                         left: `${hoveredChartData.index * (100/7) + (100/7)/2}%`, 
                         top: '10%' // 차트 중간쯤이나 위쪽에 표시. 막대 높이에 따라 유동적으로 하면 좋지만 고정 위치가 깔끔함.
                       }}
                     >
                       <p className="font-bold text-slate-300 mb-2 border-b border-white/10 pb-1 text-center whitespace-nowrap">
                         {hoveredChartData.day}요일 ({hoveredChartData.date?.slice(5)})
                       </p>
                       <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-left min-w-[100px]">
                         <div className="flex items-center justify-between"><span className="text-slate-400">방문</span> <span className="font-bold">{hoveredChartData.visits}</span></div>
                         <div className="flex items-center justify-between"><span className="text-pink-400">가입</span> <span className="font-bold">{hoveredChartData.users}</span></div>
                         <div className="flex items-center justify-between"><span className="text-indigo-400">등록</span> <span className="font-bold">{hoveredChartData.projects}</span></div>
                         <div className="flex items-center justify-between"><span className="text-green-400">공모</span> <span className="font-bold">{hoveredChartData.recruits}</span></div>
                       </div>
                       {/* 화살표 */}
                       <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-slate-900"></div>
                     </div>
                   )}

                   {/* X-axis Labels */}
                   <div className="flex justify-between mt-2 px-1">
                     {data.map((d: any, i: number) => (
                       <div key={i} className={`flex-1 text-center transition-colors ${hoveredChartData?.index === i ? 'text-slate-900 font-bold scale-110' : ''}`}>{d.day}</div>
                     ))}
                   </div>
                 </div>
               );
            })()}
          </div>
          </div>
          
          <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500 italic">
              플랫폼 활성도가 전주 대비 <span className={`font-bold ${stats.projectGrowth >= 0 ? 'text-[#16A34A]' : 'text-red-600'}`}>
                {Math.abs(stats.projectGrowth)}% {stats.projectGrowth >= 0 ? '개선' : '정체'}
              </span>되었습니다.
            </p>
            <Button variant="ghost" className="text-[#16A34A] font-bold text-xs hover:bg-[#16A34A]/5 rounded-xl" onClick={() => router.push('/admin/stats')}>상세 리포트 보기</Button>
          </div>
        </Card>

        {/* Recent Activities (Combined Tab) */}
        <Card className="border-none shadow-sm rounded-[32px] overflow-hidden p-6 flex flex-col bg-white h-full min-h-[400px]">
          <div className="flex items-center justify-between mb-6">
            <CardTitle className="text-lg font-black italic">RECENT ACTIVITIES</CardTitle>
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button 
                onClick={() => setActiveTab('projects')}
                className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all ${
                  activeTab === 'projects' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                PROJECTS
              </button>
              <button 
                onClick={() => setActiveTab('inquiries')}
                className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all ${
                  activeTab === 'inquiries' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                INQUIRIES {recentInquiries.length > 0 && <span className="ml-1 w-1.5 h-1.5 inline-block rounded-full bg-red-500"></span>}
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {activeTab === 'projects' ? (
              <div className="space-y-4">
                {recentProjects.length > 0 ? recentProjects.map((project, idx) => (
                   <div key={idx} className="flex items-center gap-4 group cursor-pointer hover:bg-slate-50 p-2 rounded-xl transition-colors">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 bg-cover bg-center flex-shrink-0 border border-slate-100" style={{ backgroundImage: `url(${project.thumbnail_url || '/globe.svg'})` }} />
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-slate-900 text-xs truncate group-hover:text-[#16A34A] transition-colors">{project.title || "제목 없음"}</p>
                        <div className="flex items-center gap-2 mt-1">
                           <span className="text-[10px] text-slate-400 font-bold">@{project.profiles?.username || "익명"}</span>
                           <span className="text-[9px] text-slate-300">|</span>
                           <span className="text-[10px] text-slate-400">{new Date(project.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-900" />
                   </div>
                )) : (
                  <div className="text-center py-12 text-slate-300 text-xs">최근 등록된 프로젝트가 없습니다.</div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {recentInquiries.length > 0 ? recentInquiries.map((inq, idx) => (
                   <div key={idx} className="flex items-start gap-3 group cursor-pointer hover:bg-slate-50 p-2 rounded-xl transition-colors">
                      <div className="mt-1 w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-orange-500 shrink-0">
                        <MessageCircle size={14} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-slate-900 text-xs truncate max-w-[120px]">{inq.title || "문의"}</p>
                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${inq.status === 'resolved' ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-500'}`}>
                            {inq.status === 'resolved' ? '완료' : '대기'}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">{inq.content || "내용 없음"}</p>
                        <span className="text-[9px] text-slate-300 mt-1 block">{new Date(inq.created_at).toLocaleDateString()}</span>
                      </div>
                   </div>
                )) : (
                  <div className="text-center py-12 text-slate-300 text-xs">새로운 문의사항이 없습니다.</div>
                )}
              </div>
            )}
          </div>
          
          <Link href={activeTab === 'projects' ? '/admin/projects' : '/admin/inquiries'} className="mt-6 w-full py-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-900 text-xs font-bold text-center transition-colors flex items-center justify-center gap-2">
            전체 보기 <ChevronRight size={12} />
          </Link>
        </Card>
      </div>
    </div>
  );
}
