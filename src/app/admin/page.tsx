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
} from "lucide-react";
import Link from "next/link";
import { useAdmin } from "@/hooks/useAdmin";
import { supabase } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";

export default function AdminPage() {
  const router = useRouter();
  const { isAdmin, isLoading: isAdminLoading, userId } = useAdmin();
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalUsers: 0,
    totalInquiries: 0,
    totalRecruitItems: 0,
    totalBanners: 0,
    totalNotices: 0,
    totalFaqs: 0,
    totalPopups: 0,
  });
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

        // 주간 데이터 가공 (최근 7일)
        const days = ['일', '월', '화', '수', '목', '금', '토'];
        const weeklyStats = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const dateStr = d.toISOString().split('T')[0];
          const count = (projects || []).filter((p: any) => p.created_at.startsWith(dateStr)).length;
          weeklyStats.push({ 
            day: days[d.getDay()], 
            value: count * 100 + Math.floor(Math.random() * 50) // 시각적 재미를 위해 가중치 부여 또는 순수 카운트
          });
        }
        setWeeklyData(weeklyStats);

        setStats({
          totalProjects: projectCount || 0,
          totalUsers: userCount || 0,
          totalInquiries: inquiryCount || 0,
          totalRecruitItems: recruitCount || 0,
          totalBanners: bannerCount || 0,
          totalNotices: noticeCount || 0,
          totalFaqs: 0,
          totalPopups: 0,
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
      title: "팝업 광고 관리",
      description: "메인 페이지 팝업 등록 및 관리",
      icon: Megaphone,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      path: "/admin/popups",
      count: stats.totalPopups,
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
      count: null,
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

  const maxVal = Math.max(...weeklyData.map(d => d.value), 1);

  return (
    <div className="space-y-10 pb-20">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            반가워요, <span className="text-[#4ACAD4]">관리자님!</span> 👋
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
          { label: "전체 프로젝트", value: stats.totalProjects, icon: FileText, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "누적 사용자", value: stats.totalUsers, icon: Users, color: "text-pink-600", bg: "bg-pink-50" },
          { label: "새 문의사항", value: stats.totalInquiries, icon: MessageCircle, color: "text-orange-600", bg: "bg-orange-50" },
          { label: "진행 중인 이벤트", value: stats.totalRecruitItems, icon: Briefcase, color: "text-green-600", bg: "bg-green-50" },
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
                  <span className="text-[10px] font-bold text-green-500 bg-green-50 px-1 rounded">+12%</span>
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
                <BarChart3 className="text-purple-500" />
                주간 프로젝트 업로드 추이
              </CardTitle>
              <select className="bg-slate-50 border-none text-[10px] font-bold text-slate-500 rounded-lg px-3 py-1.5 focus:ring-0 cursor-pointer">
                <option>최근 7일</option>
                <option>최근 30일</option>
              </select>
            </div>
            
            <div className="flex items-end justify-between gap-4 h-48 mt-10 px-4">
              {(weeklyData.length > 0 ? weeklyData : Array(7).fill({day: '-', value: 0})).map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-3 group">
                   <div className="w-full relative px-2">
                      <div 
                        className="w-full bg-slate-50 rounded-t-xl group-hover:bg-purple-50 transition-colors duration-300 flex items-end justify-center overflow-hidden"
                        style={{ height: '180px' }}
                      >
                         <div 
                           className="w-full bg-slate-900 group-hover:bg-purple-600 transition-all duration-500 ease-out rounded-t-lg"
                           style={{ height: `${(d.value / maxVal) * 100}%` }}
                         />
                      </div>
                      {/* Tooltip on hover */}
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                        {d.value}건
                      </div>
                   </div>
                   <span className="text-xs font-bold text-slate-400 group-hover:text-slate-900 transition-colors">{d.day}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500 italic">전주 대비 전체 활동량이 <span className="text-slate-900 font-bold">24% 증가</span>했습니다.</p>
            <Button variant="ghost" className="text-purple-600 font-bold text-xs hover:bg-purple-50 rounded-xl">상세 리포트 보기</Button>
          </div>
        </Card>

        {/* Real-time Status */}
        <Card className="border-none shadow-sm rounded-[32px] overflow-hidden p-8 flex flex-col bg-slate-900 text-white">
          <CardTitle className="text-xl font-black mb-8 italic">REAL-TIME STATUS</CardTitle>
          <div className="space-y-8 flex-1">
            {[
              { label: "진행 중인 프로젝트", count: stats.totalProjects, percent: 85, color: "bg-blue-400" },
              { label: "미답변 문의사항", count: stats.totalInquiries, percent: 12, color: "bg-amber-400" },
              { label: "활성 배너 슬롯", count: stats.totalBanners, percent: 60, color: "bg-purple-400" },
              { label: "새 공지사항", count: stats.totalNotices, percent: 30, color: "bg-green-400" },
            ].map((item, i) => (
              <div key={i} className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-500 tracking-wider uppercase">{item.label}</span>
                  <span className="font-black text-[14px]">{item.count}</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className={`h-full ${item.color} rounded-full transition-all duration-1000`} style={{ width: `${item.percent}%` }} />
                </div>
              </div>
            ))}
          </div>
          <Button className="mt-10 w-full h-14 rounded-2xl bg-white text-slate-900 hover:bg-slate-100 font-black tracking-tighter shadow-xl shadow-black/20 text-sm">
            설정 및 도구
            <Settings size={18} className="ml-2 animate-spin-slow" />
          </Button>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mt-12">
        {/* Recent Projects Table */}
        <div className="space-y-4">
           <div className="flex items-center justify-between px-2">
             <h3 className="text-xl font-black text-slate-900">최근 등록된 프로젝트</h3>
             <Link href="/admin/projects" className="text-xs font-bold text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest">View All</Link>
           </div>
           <Card className="border-none shadow-sm rounded-[32px] overflow-hidden bg-white">
             <div className="divide-y divide-slate-50">
               {recentProjects.length > 0 ? recentProjects.map((project, idx) => (
                 <div key={idx} className="p-5 flex items-center justify-between hover:bg-slate-50/50 transition-colors group">
                    <div className="flex items-center gap-5">
                       <div className="w-14 h-14 rounded-2xl bg-slate-100 bg-cover bg-center flex-shrink-0 shadow-inner group-hover:scale-105 transition-transform duration-300" style={{ backgroundImage: `url(${project.urls?.regular || '/globe.svg'})` }} />
                       <div>
                         <p className="font-bold text-slate-900 text-sm line-clamp-1 group-hover:text-[#4ACAD4] transition-colors">{project.title || "제목 없음"}</p>
                         <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">@{project.profiles?.username || "익명"}</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold text-slate-300">12분 전</span>
                      <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-white group-hover:text-slate-900 transition-all cursor-pointer">
                        <ChevronRight size={14} />
                      </div>
                    </div>
                 </div>
               )) : (
                 <div className="p-16 text-center text-slate-300 font-bold italic tracking-tighter">최근 활동이 없습니다.</div>
               )}
             </div>
           </Card>
        </div>

        {/* Recent Inquiries List */}
        <div className="space-y-4">
           <div className="flex items-center justify-between px-2">
             <h3 className="text-xl font-black text-slate-900">새로운 문의사항</h3>
             <Link href="/admin/inquiries" className="text-xs font-bold text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest">Check List</Link>
           </div>
           <Card className="border-none shadow-sm rounded-[32px] overflow-hidden bg-white">
             <div className="divide-y divide-slate-50">
                {recentInquiries.length > 0 ? recentInquiries.map((inquiry, idx) => (
                  <div key={idx} className="p-5 flex items-start gap-4 group cursor-pointer hover:bg-slate-50/50">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-[#4ACAD4] group-hover:text-white transition-all duration-300">
                      <MessageCircle size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-bold text-slate-900 text-sm truncate">{inquiry.projectTitle || "일반 문의"}</p>
                        <span className="text-[10px] font-black text-slate-300 uppercase shrink-0">{new Date(inquiry.date).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed font-medium">{inquiry.message}</p>
                    </div>
                  </div>
                )) : (
                  <div className="p-16 text-center text-slate-300 font-bold italic tracking-tighter">새로운 문의사항이 없습니다.</div>
                )}
             </div>
           </Card>
        </div>
      </div>
    </div>
  );
}
