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

interface DailyTableData {
  date: string;
  visits: number;
  users: number;
  projects: number;
  recruits: number;
}

interface ActivityLog {
  id: number;
  action: string;
  target_type: string;
  details: any;
  ip_address: string;
  created_at: string;
  user?: { email: string };
  user_email?: string; // 
}

interface ReferrerStat {
  name: string;
  count: number;
}

interface DeviceStat {
  mobile: number;
  desktop: number;
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
    dailyData: [] as DailyTableData[],
    logs: [] as ActivityLog[],
    topReferrers: [] as ReferrerStat[],
    deviceStats: { mobile: 0, desktop: 0 } as DeviceStat,
  });
  const [activeTab, setActiveTab] = useState<'daily' | 'logs' | 'analytics'>('daily');

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
    let logsData: ActivityLog[] = [];
    let visitData: any[] = [];

    try {
      // 1. 기본 카운트
      const { count: projectCount } = await supabase.from('Project').select('*', { count: 'exact', head: true });
      const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      const { count: recruitCount } = await supabase.from('recruit_items').select('*', { count: 'exact', head: true });
      const { count: bannerCount } = await supabase.from('banners').select('*', { count: 'exact', head: true, is_active: true } as any);

      // 2. 일별 데이터 취합 (최근 30일 고정)
      const days = period === 7 ? 7 : 30;
      const dailyData: DailyTableData[] = [];
      
      const weekDays = ['일', '월', '화', '수', '목', '금', '토'];
      
      for (let i = 0; i < days; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        
        // KST 기준으로 날짜 문자열 생성 (YYYY-MM-DD)
        const dateStr = d.toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
        
        const dayLabel = weekDays[new Date(dateStr).getDay()]; // 로컬 시간 기준 요일
        const queryDateStart = `${dateStr}T00:00:00`;
        const queryDateEnd = `${dateStr}T23:59:59`;

        const [visitRes, userRes, projectRes, recruitRes] = await Promise.all([
          (supabase as any).from('site_stats').select('visits').eq('date', dateStr).single(),
          supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', queryDateStart).lte('created_at', queryDateEnd),
          supabase.from('Project').select('project_id', { count: 'exact', head: true }).gte('created_at', queryDateStart).lte('created_at', queryDateEnd),
          supabase.from('recruit_items').select('id', { count: 'exact', head: true }).gte('created_at', queryDateStart).lte('created_at', queryDateEnd),
        ]);

        dailyData.push({
          date: `${dateStr} (${dayLabel})`,
          visits: visitRes.data?.visits || 0,
          users: userRes.count || 0,
          projects: projectRes.count || 0,
          recruits: recruitRes.count || 0,
        });
      }

      // 3. 로그 조회
      try {
        const { data } = await (supabase as any)
          .from('activity_logs')
          .select(`
            id, action, target_type, details, ip_address, created_at,
            user_id
          `)
          .order('created_at', { ascending: false })
          .limit(50);
          
        logsData = data || [];
      } catch (logErr) {
        console.error("Log fetch error:", logErr);
      }

      // 4. Analytics (방문 분석)
      let topReferrers: ReferrerStat[] = [];
      let deviceStats = { mobile: 0, desktop: 0 };

      try {
        const { data } = await (supabase as any)
          .from('visit_logs')
          .select('referrer, device_type')
          .order('visited_at', { ascending: false })
          .limit(500); // 최근 500건 분석

        visitData = data || [];

        const refMap: Record<string, number> = {};
        const devMap = { mobile: 0, desktop: 0 };

        visitData?.forEach((v: any) => {
          // Device
          const dtype = v.device_type === 'mobile' ? 'mobile' : 'desktop';
          devMap[dtype]++;

          // Referrer (Domain)
          let ref = v.referrer || 'Direct';
          try {
            if (ref.startsWith('http')) {
              const url = new URL(ref);
              ref = url.hostname.replace('www.', '');
            }
          } catch (e) {}
          refMap[ref] = (refMap[ref] || 0) + 1;
        });

        topReferrers = Object.entries(refMap)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);
        
        deviceStats = devMap;
      } catch (anaErr) {
        console.error("Analytics fetch error:", anaErr);
      }

      setStats({
        totalProjects: projectCount || 0,
        totalUsers: userCount || 0,
        totalRecruits: recruitCount || 0,
        activeBanners: bannerCount || 0,
        dailyData,
        logs: logsData,
        topReferrers,
        deviceStats,
      });

    } catch (err) {
      console.error("Stats fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ["날짜", "방문자수", "가입자수", "프로젝트 등록", "채용 공고"];
    const rows = stats.dailyData.map(d => [
      d.date,
      d.visits.toString(),
      d.users.toString(),
      d.projects.toString(),
      d.recruits.toString(),
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

  // const getAIInsight = ... 삭제됨
  
  if (adminLoading || loading) {
    return (
      <div className="h-[80vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={40} className="animate-spin text-[#16A34A] mx-auto mb-4" />
          <p className="text-slate-400 font-bold tracking-tight">상세 통계 데이터를 분석 중입니다...</p>
        </div>
      </div>
    );
  }

  return (


    <div className="space-y-10 pb-20 max-w-[1400px] mx-auto pt-8 px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <BarChart3 className="text-[#16A34A]" size={36} />
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

      <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200 mb-8 w-fit mx-auto md:w-full md:grid md:grid-cols-3">
        <button 
          onClick={() => setActiveTab('daily')}
          className={`px-6 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === 'daily' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
        >
          📅 일별 상세 통계
        </button>
        <button 
          onClick={() => setActiveTab('analytics')}
          className={`px-6 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === 'analytics' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
        >
          📈 유입/기기 분석
        </button>
        <button 
          onClick={() => setActiveTab('logs')}
          className={`px-6 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === 'logs' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
        >
          🕵️ 시스템 활동 로그
        </button>
      </div>

      {activeTab === 'daily' && (
        <Card className="border-none shadow-sm rounded-[32px] overflow-hidden bg-white">
          <div className="p-8 pb-4 flex items-center justify-between">
             <CardTitle className="text-xl font-black italic">DAILY STATISTICS</CardTitle>
             <Button variant="outline" size="sm" onClick={handleExportCSV} className="text-xs">
                데이터 내보내기 (.CSV)
             </Button>
          </div>
          <div className="overflow-x-auto">
             <table className="w-full text-sm text-left">
               <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[11px] tracking-wider">
                 <tr>
                   <th className="px-6 py-4">Date</th>
                   <th className="px-6 py-4">Visits</th>
                   <th className="px-6 py-4">Sign ups</th>
                   <th className="px-6 py-4">Projects</th>
                   <th className="px-6 py-4">Recruits</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                 {stats.dailyData.map((row, i) => (
                   <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                     <td className="px-6 py-4 font-bold text-slate-700">{row.date}</td>
                     <td className="px-6 py-4 text-slate-600">{row.visits}</td>
                     <td className="px-6 py-4">
                       <span className={`px-2 py-1 rounded text-xs font-bold ${row.users > 0 ? 'bg-pink-100 text-pink-600' : 'bg-slate-100 text-slate-400'}`}>
                         +{row.users}
                       </span>
                     </td>
                     <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${row.projects > 0 ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                         +{row.projects}
                       </span>
                     </td>
                     <td className="px-6 py-4 text-slate-600">+{row.recruits}</td>
                   </tr>
                 ))}
               </tbody>
             </table>
          </div>
        </Card>
      )}

      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           {/* Device Ratio */}
           <Card className="lg:col-span-1 border-none shadow-sm rounded-[32px] overflow-hidden bg-white p-8">
              <CardTitle className="text-xl font-black italic mb-6">Device Share</CardTitle>
              <div className="flex flex-col items-center justify-center h-64">
                <div className="flex gap-8 items-end mb-8 w-full px-8 h-40">
                   <div className="flex-1 flex flex-col items-center gap-2 group">
                      <div className="w-full bg-slate-100 rounded-t-xl relative overflow-hidden h-full flex items-end">
                         <div 
                           className="w-full bg-blue-500 group-hover:bg-blue-600 transition-colors" 
                           style={{ height: `${(stats.deviceStats.desktop / (stats.deviceStats.desktop + stats.deviceStats.mobile || 1)) * 100}%` }}
                         />
                      </div>
                      <span className="font-bold text-slate-600">PC ({(stats.deviceStats.desktop / (stats.deviceStats.desktop + stats.deviceStats.mobile || 1) * 100).toFixed(0)}%)</span>
                   </div>
                   <div className="flex-1 flex flex-col items-center gap-2 group">
                      <div className="w-full bg-slate-100 rounded-t-xl relative overflow-hidden h-full flex items-end">
                         <div 
                           className="w-full bg-pink-500 group-hover:bg-pink-600 transition-colors" 
                           style={{ height: `${(stats.deviceStats.mobile / (stats.deviceStats.desktop + stats.deviceStats.mobile || 1)) * 100}%` }}
                         />
                      </div>
                      <span className="font-bold text-slate-600">Mobile ({(stats.deviceStats.mobile / (stats.deviceStats.desktop + stats.deviceStats.mobile || 1) * 100).toFixed(0)}%)</span>
                   </div>
                </div>
                <p className="text-xs text-slate-400 font-medium">* 최근 500명 방문자 기준</p>
              </div>
           </Card>

           {/* Referrer Ranking */}
           <Card className="lg:col-span-2 border-none shadow-sm rounded-[32px] overflow-hidden bg-white">
             <div className="p-8 pb-4 flex items-center justify-between">
                <CardTitle className="text-xl font-black italic">TOP REFERRERS</CardTitle>
             </div>
             <div className="overflow-x-auto">
               <table className="w-full text-sm text-left">
                 <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[11px] tracking-wider">
                   <tr>
                     <th className="px-6 py-4 w-16">Rank</th>
                     <th className="px-6 py-4">Source (Domain)</th>
                     <th className="px-6 py-4">Visits</th>
                     <th className="px-6 py-4">Ratio</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                   {stats.topReferrers.length > 0 ? stats.topReferrers.map((ref, i) => (
                     <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                       <td className="px-6 py-4 font-black text-slate-300 text-lg italic">#{i + 1}</td>
                       <td className="px-6 py-4 text-slate-900 font-bold">{ref.name}</td>
                       <td className="px-6 py-4 text-slate-600 font-medium">{ref.count.toLocaleString()}</td>
                       <td className="px-6 py-4">
                         <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                           <div className="h-full bg-slate-900" style={{ width: `${(ref.count / 500) * 100}%` }} />
                         </div>
                       </td>
                     </tr>
                   )) : (
                      <tr><td colSpan={4} className="p-8 text-center text-slate-400">데이터가 충분하지 않습니다.</td></tr>
                   )}
                 </tbody>
               </table>
             </div>
           </Card>
        </div>
      )}

      {activeTab === 'logs' && (
        <Card className="border-none shadow-sm rounded-[32px] overflow-hidden bg-white">
          <div className="p-8 pb-4 flex items-center justify-between">
             <CardTitle className="text-xl font-black italic">SYSTEM ACTIVITY LOGS</CardTitle>
             <Badge variant="secondary" className="text-[10px] font-bold">최근 50건</Badge>
          </div>
          <div className="overflow-x-auto">
             <table className="w-full text-sm text-left">
               <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[11px] tracking-wider">
                 <tr>
                   <th className="px-6 py-4">Time</th>
                   <th className="px-6 py-4">Action</th>
                   <th className="px-6 py-4">Target</th>
                   <th className="px-6 py-4">User Details</th>
                   <th className="px-6 py-4">IP</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                 {stats.logs.length > 0 ? stats.logs.map((log, i) => (
                   <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                     <td className="px-6 py-4 font-medium text-slate-500 text-xs">
                        {new Date(log.created_at).toLocaleString()}
                     </td>
                     <td className="px-6 py-4 text-slate-900 font-bold">
                        <span className="px-2 py-1 bg-slate-100 rounded text-xs">{log.action}</span>
                     </td>
                     <td className="px-6 py-4 text-slate-600 uppercase text-xs font-bold">{log.target_type}</td>
                     <td className="px-6 py-4 text-slate-600 text-xs max-w-[200px] truncate">
                        {JSON.stringify(log.details)}
                     </td>
                     <td className="px-6 py-4 text-slate-400 text-xs font-mono">{log.ip_address || '-'}</td>
                   </tr>
                 )) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-bold italic">
                        기록된 로그가 없습니다.
                      </td>
                    </tr>
                 )}
               </tbody>
             </table>
          </div>
        </Card>
      )}

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
