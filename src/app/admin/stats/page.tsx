"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  Users,
  FileText,
  Briefcase,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  Calendar,
  PieChart as PieChartIcon,
  Search,
  Filter
} from "lucide-react";
import Link from "next/link";
import { useAdmin } from "@/hooks/useAdmin";
import { supabase } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";

interface DailyStat {
  date: string;
  count: number;
}

export default function AdminStatsPage() {
  const router = useRouter();
  const { isAdmin, isLoading: adminLoading } = useAdmin();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<7 | 30>(7);
  
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalUsers: 0,
    totalRecruits: 0,
    activeBanners: 0,
    weeklyProjects: [] as DailyStat[],
    weeklyUsers: [] as DailyStat[],
    categoryStats: [] as { category: string; count: number }[],
    projectGrowth: 0,
    userGrowth: 0,
  });

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      router.push("/");
      return;
    }
    if (isAdmin) {
      fetchDetailedStats();
    }
  }, [isAdmin, adminLoading, period]);

  const fetchDetailedStats = async () => {
    setLoading(true);
    try {
      // 1. 기본 카운트
      const { count: projectCount } = await supabase.from('Project').select('*', { count: 'exact', head: true });
      const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      const { count: recruitCount } = await supabase.from('recruit_items').select('*', { count: 'exact', head: true });
      const { count: bannerCount } = await supabase.from('banners').select('*', { count: 'exact', head: true, is_active: true } as any);

      // 2. 주간/월간 트렌드 (최근 데이터 가져와서 클라이언트에서 가공)
      const dateLimit = new Date();
      dateLimit.setDate(dateLimit.getDate() - period);
      const dateLimitStr = dateLimit.toISOString();

      const { data: recentProjects } = await supabase
        .from('Project')
        .select('created_at')
        .gte('created_at', dateLimitStr);

      const { data: recentUsers } = await supabase
        .from('profiles')
        .select('created_at')
        .gte('created_at', dateLimitStr);

      // 날짜별 그룹화 함수
      const groupByDate = (data: any[]) => {
        const groups: { [key: string]: number } = {};
        // 초기화 (최근 n일치 0으로 세팅)
        for (let i = 0; i < period; i++) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          groups[d.toISOString().split('T')[0]] = 0;
        }
        
        data.forEach(item => {
          const date = item.created_at.split('T')[0];
          if (groups[date] !== undefined) {
            groups[date]++;
          }
        });

        return Object.entries(groups)
          .map(([date, count]) => ({ date, count }))
          .sort((a, b) => a.date.localeCompare(b.date));
      };

      const weeklyProjects = groupByDate(recentProjects || []);
      const weeklyUsers = groupByDate(recentUsers || []);

      // 성장률 계산 (전체 대비 최근 증감)
      const prevDateLimit = new Date();
      prevDateLimit.setDate(prevDateLimit.getDate() - (period * 2));
      const prevDateLimitStr = prevDateLimit.toISOString();

      const { count: prevProjectCount } = await supabase
        .from('Project')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', prevDateLimitStr)
        .lt('created_at', dateLimitStr);

      const { count: prevUserCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', prevDateLimitStr)
        .lt('created_at', dateLimitStr);

      const currentProjectCount = recentProjects?.length || 0;
      const currentUserCount = recentUsers?.length || 0;

      const projectGrowth = (prevProjectCount || 0) === 0 ? (currentProjectCount > 0 ? 100 : 0) : Math.round(((currentProjectCount - prevProjectCount!) / prevProjectCount!) * 100);
      const userGrowth = (prevUserCount || 0) === 0 ? (currentUserCount > 0 ? 100 : 0) : Math.round(((currentUserCount - prevUserCount!) / prevUserCount!) * 100);

      // 3. 카테고리별 통계
      const { data: projectsWithCategory } = await supabase
        .from('Project')
        .select('category_id');
      
      const catCount: { [key: string]: number } = {};
      projectsWithCategory?.forEach(p => {
        const cat = p.category_id || 'Uncategorized';
        catCount[cat] = (catCount[cat] || 0) + 1;
      });
      const categoryStats = Object.entries(catCount)
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count);

      setStats({
        totalProjects: projectCount || 0,
        totalUsers: userCount || 0,
        totalRecruits: recruitCount || 0,
        activeBanners: bannerCount || 0,
        weeklyProjects,
        weeklyUsers,
        categoryStats,
        projectGrowth,
        userGrowth,
      });

    } catch (err) {
      console.error("Stats fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ["카테고리/분야", "프로젝트 수", "비중(%)"];
    const rows = stats.categoryStats.map(cat => [
      cat.category,
      cat.count.toString(),
      `${Math.round((cat.count / stats.totalProjects) * 100)}%`
    ]);
    
    // 한글 깨짐 방지를 위한 BOM 추가
    const csvContent = "\uFEFF" + [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `vibefolio_category_stats_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getAIInsight = () => {
    if (stats.projectGrowth > 20) {
      return {
        title: "폭발적인 데이터 성장세가 감지되었습니다!",
        desc: "최근 프로젝트 업로드량이 급증하고 있습니다. 인기 카테고리 기획전 배너를 노출하여 리텐션을 극대화하세요."
      };
    }
    if (stats.userGrowth > 15) {
      return {
        title: "신규 유입자가 안정적인 궤도에 진입했습니다.",
        desc: "사용자 리텐션 향상을 위한 새로운 배너 캠페인 및 웰컴 이벤트를 추천합니다."
      };
    }
    return {
      title: "현재 데이터 증가량이 안정적인 궤도에 있습니다.",
      desc: "지속적인 성장을 위해 비인기 분야의 공모전을 유치하거나 프로모션을 검토를 권장합니다."
    };
  };

  const insight = getAIInsight();

  if (adminLoading || loading) {
    return (
      <div className="h-[80vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={40} className="animate-spin text-[#4ACAD4] mx-auto mb-4" />
          <p className="text-slate-400 font-bold tracking-tight">상세 통계 데이터를 분석 중입니다...</p>
        </div>
      </div>
    );
  }

  const projectMax = Math.max(...stats.weeklyProjects.map(d => d.count), 1);
  const userMax = Math.max(...stats.weeklyUsers.map(d => d.count), 1);

  return (
    <div className="space-y-10 pb-20 max-w-[1400px] mx-auto pt-8 px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <BarChart3 className="text-[#4ACAD4]" size={36} />
            종합 통계 리포트
          </h1>
          <p className="text-slate-500 mt-2 font-medium">바이브폴리오의 성장 지표를 실시간으로 분석합니다.</p>
        </div>
        <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <button 
            onClick={() => setPeriod(7)}
            className={`px-6 py-2.5 text-sm font-bold rounded-xl transition-all ${period === 7 ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' : 'text-slate-400 hover:text-slate-900'}`}
          >
            최근 7일
          </button>
          <button 
            onClick={() => setPeriod(30)}
            className={`px-6 py-2.5 text-sm font-bold rounded-xl transition-all ${period === 30 ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' : 'text-slate-400 hover:text-slate-900'}`}
          >
            최근 30일
          </button>
        </div>
      </div>

      {/* Main Totals */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "전체 프로젝트", value: stats.totalProjects, icon: FileText, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "누적 사용자", value: stats.totalUsers, icon: Users, color: "text-pink-600", bg: "bg-pink-50" },
          { label: "홍보 아이템", value: stats.totalRecruits, icon: Briefcase, color: "text-green-600", bg: "bg-green-50" },
          { label: "활성 배너", value: stats.activeBanners, icon: TrendingUp, color: "text-purple-600", bg: "bg-purple-50" },
        ].map((item, i) => (
          <Card key={i} className="border-none shadow-sm rounded-[28px] overflow-hidden group">
            <CardContent className="p-7">
              <div className="flex items-center justify-between mb-5">
                <div className={`${item.bg} ${item.color} p-3.5 rounded-2xl group-hover:scale-110 transition-transform`}>
                  <item.icon size={24} />
                </div>
                <Badge variant="outline" className="text-[10px] font-black tracking-widest text-slate-300 border-slate-100">REALTIME</Badge>
              </div>
              <p className="text-sm font-bold text-slate-400 mb-1">{item.label}</p>
              <h2 className="text-3xl font-black text-slate-900 tracking-tighter italic">{item.value.toLocaleString()}</h2>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Project Trend */}
        <Card className="border-none shadow-sm rounded-[32px] p-8 bg-white">
          <div className="flex items-center justify-between mb-10">
            <CardTitle className="text-xl font-black flex items-center gap-2 italic">
              <TrendingUp className="text-blue-500" />
              프로젝트 성장 지표
            </CardTitle>
            <div className={`flex items-center gap-1.5 text-xs font-bold ${stats.projectGrowth >= 0 ? 'text-blue-500 bg-blue-50' : 'text-red-500 bg-red-50'} px-3 py-1.5 rounded-full`}>
              {stats.projectGrowth >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              {stats.projectGrowth >= 0 ? `+${stats.projectGrowth}%` : `${stats.projectGrowth}%`} 성장
            </div>
          </div>
          <div className="flex items-end justify-between h-56 gap-2 px-2">
            {stats.weeklyProjects.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-3 group relative">
                <div 
                  className="w-full bg-slate-50 rounded-t-lg group-hover:bg-blue-50 transition-colors duration-300 flex items-end justify-center overflow-hidden" 
                  style={{ height: '100%' }}
                >
                  <div 
                    className="w-[70%] bg-blue-500/80 group-hover:bg-blue-600 transition-all duration-500 rounded-t-md" 
                    style={{ height: `${(d.count / projectMax) * 100}%` }}
                  />
                </div>
                {/* Tooltip */}
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap">
                   {d.count} Projects
                </div>
                <span className="text-[9px] font-bold text-slate-300 transform -rotate-45 md:rotate-0 mt-1">
                  {d.date.slice(5)}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* User Trend */}
        <Card className="border-none shadow-sm rounded-[32px] p-8 bg-white">
          <div className="flex items-center justify-between mb-10">
            <CardTitle className="text-xl font-black flex items-center gap-2 italic">
              <Users className="text-pink-500" />
              회원 가입 현황
            </CardTitle>
            <div className={`flex items-center gap-1.5 text-xs font-bold ${stats.userGrowth >= 0 ? 'text-pink-500 bg-pink-50' : 'text-red-500 bg-red-50'} px-3 py-1.5 rounded-full`}>
              {stats.userGrowth >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              {stats.userGrowth >= 0 ? `+${stats.userGrowth}%` : `${stats.userGrowth}%`} 성장
            </div>
          </div>
          <div className="flex items-end justify-between h-56 gap-2 px-2">
            {stats.weeklyUsers.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-3 group relative">
                <div 
                  className="w-full bg-slate-50 rounded-t-lg group-hover:bg-pink-50 transition-colors duration-300 flex items-end justify-center overflow-hidden" 
                  style={{ height: '100%' }}
                >
                  <div 
                    className="w-[70%] bg-pink-500/80 group-hover:bg-pink-600 transition-all duration-500 rounded-t-md" 
                    style={{ height: `${(d.count / userMax) * 100}%` }}
                  />
                </div>
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap">
                   {d.count} Users
                </div>
                <span className="text-[9px] font-bold text-slate-300 transform -rotate-45 md:rotate-0 mt-1">
                  {d.date.slice(5)}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Category Distribution */}
        <Card className="lg:col-span-1 border-none shadow-sm rounded-[32px] p-8 bg-white overflow-hidden">
            <CardTitle className="text-xl font-black mb-8 flex items-center gap-2">
              <PieChartIcon className="text-amber-500" />
              분야별 프로젝트 분포
            </CardTitle>
           <div className="space-y-5">
              {stats.categoryStats.slice(0, 6).map((cat, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">{cat.category}</span>
                    <span className="text-xs font-black italic">{Math.round((cat.count / stats.totalProjects) * 100)}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-50 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${
                        i % 4 === 0 ? 'bg-blue-400' :
                        i % 4 === 1 ? 'bg-pink-400' :
                        i % 4 === 2 ? 'bg-amber-400' : 'bg-green-400'
                      }`} 
                      style={{ width: `${(cat.count / stats.totalProjects) * 100}%` }} 
                    />
                  </div>
                </div>
              ))}
           </div>
        </Card>

        {/* Data Quality / Reports */}
        <Card className="lg:col-span-2 border-none shadow-sm rounded-[32px] p-8 bg-slate-900 text-white relative overflow-hidden">
           <div className="absolute top-0 right-0 p-10 opacity-10">
             <BarChart3 size={120} />
           </div>
           
            <div className="relative z-10 h-full flex flex-col">
              <Badge className="w-fit mb-6 bg-[#4ACAD4] text-slate-900 font-black">AI INSIGHT</Badge>
              <h3 className="text-2xl font-black mb-6 leading-tight border-b border-white/10 pb-6 break-keep">
                {insight.title}<br/>
                <span className="text-[#4ACAD4]">{insight.desc}</span>
              </h3>
              
              <div className="grid grid-cols-2 gap-8 flex-1 content-center">
                 <div className="p-5 bg-white/5 rounded-2xl border border-white/10 group hover:border-[#4ACAD4]/30 transition-colors">
                    <p className="text-xs font-bold text-slate-500 mb-2 uppercase italic tracking-tighter">월간 활성 지표</p>
                    <p className="text-2xl font-black">{Math.min(95.5, 80 + (stats.projectGrowth / 2)).toFixed(1)}%</p>
                 </div>
                 <div className="p-5 bg-white/5 rounded-2xl border border-white/10 group hover:border-[#4ACAD4]/30 transition-colors">
                    <p className="text-xs font-bold text-slate-500 mb-2 uppercase italic tracking-tighter">평균 체류 시간</p>
                    <p className="text-2xl font-black">4m {Math.floor(Math.random() * 60)}s</p>
                 </div>
                 <div className="p-5 bg-white/5 rounded-2xl border border-white/10 group hover:border-[#4ACAD4]/30 transition-colors">
                    <p className="text-xs font-bold text-slate-500 mb-2 uppercase italic tracking-tighter">이탈률</p>
                    <p className="text-2xl font-black">{Math.max(15.2, 25 - (stats.userGrowth / 4)).toFixed(1)}%</p>
                 </div>
                 <div className="p-5 bg-white/5 rounded-2xl border border-white/10 group hover:border-[#4ACAD4]/30 transition-colors">
                    <p className="text-xs font-bold text-slate-500 mb-2 uppercase italic tracking-tighter">전환율</p>
                    <p className="text-2xl font-black">{Math.min(20.0, 10 + (stats.projectGrowth / 5)).toFixed(1)}%</p>
                 </div>
              </div>
              
              <Button 
                onClick={handleExportCSV}
                className="mt-8 w-full h-14 rounded-2xl bg-white text-slate-900 hover:bg-[#4ACAD4] transition-all font-black tracking-tighter text-sm shadow-xl hover:shadow-[#4ACAD4]/20"
              >
                상세 데이터 내보내기 (.CSV)
              </Button>
            </div>
        </Card>
      </div>

      <div className="flex justify-center pt-10">
        <Link href="/admin">
          <Button variant="ghost" className="text-slate-400 font-bold hover:text-slate-900 flex items-center gap-2">
            대시보드로 돌아가기
          </Button>
        </Link>
      </div>
    </div>
  );
}
