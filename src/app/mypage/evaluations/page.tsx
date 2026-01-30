"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReviewReportModal } from "@/components/ReviewReportModal";
import { FontAwesomeIcon } from "@/components/FaIcon";

// ... existing imports ...
import { 
  faStar, 
  faArrowLeft, 
  faPen, 
  faEye, 
  faCalendarAlt, 
  faCommentDots, 
  faChartBar,
  faFileAlt
} from "@fortawesome/free-solid-svg-icons";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import dayjs from "dayjs";
import { supabase } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface Evaluation {
  rating_id: string;
  project_id: string;
  project_title: string;
  thumbnail_url: string;
  score: number;
  comment: string;
  created_at: string;
  project_owner_id: string;
}

interface MyProject {
  id: string;
  title: string;
  thumbnail_url: string;
  created_at: string;
  views: number;
  likes: number;
  is_audit_mode: boolean;
}

export default function MyEvaluationsPage() {
  const router = useRouter();
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [myProjects, setMyProjects] = useState<MyProject[]>([]);
  const [selectedReportProject, setSelectedReportProject] = useState<{id: string, title: string} | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          router.push('/login');
          return;
        }
        setCurrentUserId(user.id);

        // 1. Fetch ratings I WROTE
        const { data: ratingsData, error: ratingsError } = await (supabase as any)
          .from('ProjectRating')
          .select(`
            *,
            Project (
              project_id,
              title,
              thumbnail_url,
              user_id
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (ratingsError) throw ratingsError;

        const mappedEvaluations = (ratingsData || []).map((r: any) => ({
          rating_id: String(r.id),
          project_id: String(r.project_id),
          project_title: r.Project?.title || '제목 없음',
          thumbnail_url: r.Project?.thumbnail_url || '/placeholder.jpg',
          score: r.score || 0,
          comment: r.proposal || r.comment || '',
          created_at: r.created_at,
          project_owner_id: String(r.Project?.user_id || ''),
        }));

        setEvaluations(mappedEvaluations);

        // 2. Fetch MY PROJECTS (for Received Reports)
        // Filter projects where is_growth_requested is true (or check custom_data)
        const { data: projectsData, error: projectsError } = await supabase
          .from('Project')
          .select('id, title, thumbnail_url, created_at, views, likes, custom_data')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (projectsError) throw projectsError;

        // Filter client-side for flexibility with JSONB
        const mappedProjects = (projectsData || [])
          .filter((p: any) => {
             const cData = typeof p.custom_data === 'string' ? JSON.parse(p.custom_data) : p.custom_data;
             return cData?.is_growth_requested === true || cData?.audit_config;
          })
          .map((p: any) => {
             const cData = typeof p.custom_data === 'string' ? JSON.parse(p.custom_data) : p.custom_data;
             return {
               id: String(p.id),
               title: p.title,
               thumbnail_url: p.thumbnail_url || '/placeholder.jpg',
               created_at: p.created_at,
               views: p.views || 0,
               likes: p.likes || 0,
               is_audit_mode: !!cData?.audit_config
             };
          });

        setMyProjects(mappedProjects);

      } catch (err: any) {
        console.error('데이터 로드 실패:', err);
        setError(err.message || '오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-12 font-sans">
      <div className="max-w-5xl mx-auto px-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full bg-white shadow-sm">
              <FontAwesomeIcon icon={faArrowLeft} className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">내 피드백</h1>
              <p className="text-slate-500 text-sm font-medium mt-1">평가 내역과 받은 리포트를 관리합니다.</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Link href="/growth">
              <Button variant="outline" className="hidden md:flex items-center gap-2 border-slate-200 hover:bg-slate-50 text-slate-600 rounded-full px-5 h-11 font-bold transition-all">
                <FontAwesomeIcon icon={faEye} className="w-4 h-4" />
                피드백 게시판
              </Button>
            </Link>
          </div>
        </div>

        {loading ? (
           <div className="flex justify-center items-center py-20">
             <div className="w-10 h-10 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
           </div>
        ) : (
           <Tabs defaultValue="received" className="w-full">
              <TabsList className="mb-8 w-full md:w-auto h-auto p-1 bg-slate-200 rounded-full inline-flex">
                 <TabsTrigger value="received" className="rounded-full px-6 py-2.5 font-bold data-[state=active]:bg-white data-[state=active]:text-black text-slate-500 transition-all">
                    받은 리포트 ({myProjects.length})
                 </TabsTrigger>
                 <TabsTrigger value="written" className="rounded-full px-6 py-2.5 font-bold data-[state=active]:bg-white data-[state=active]:text-black text-slate-500 transition-all">
                    작성한 평가 ({evaluations.length})
                 </TabsTrigger>
              </TabsList>

              {/* === TAB: RECEIVED REPORTS === */}
              <TabsContent value="received" className="mt-0">
                 {error ? (
                    <div className="text-center py-20 bg-white rounded-3xl border border-red-100">
                       <p className="text-red-500 mb-4 font-bold">{error}</p>
                       <Button variant="outline" onClick={() => window.location.reload()}>다시 시도</Button>
                    </div>
                 ) : myProjects.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200 shadow-sm">
                       <FontAwesomeIcon icon={faChartBar} className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                       <h2 className="text-xl font-bold text-slate-900 mb-2">받은 리포트가 없습니다</h2>
                       <p className="text-slate-500 mb-8 max-w-xs mx-auto">내 프로젝트를 등록하고 전문가의 진단을 받아보세요!</p>
                       <Link href="/project/upload?mode=audit">
                         <Button className="bg-slate-900 hover:bg-green-600 transition-all rounded-2xl px-8 h-12 font-black">
                           <FontAwesomeIcon icon={faStar} className="w-4 h-4 mr-2" /> 피드백 요청하기
                         </Button>
                       </Link>
                    </div>
                 ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       {myProjects.map((p) => (
                          <div key={p.id} className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden hover:shadow-xl transition-all group p-6 flex flex-col">
                             <div className="flex items-center gap-4 mb-6">
                                <div className="w-20 h-20 rounded-2xl bg-slate-100 overflow-hidden shrink-0">
                                   <Image 
                                      src={p.thumbnail_url} 
                                      alt={p.title} 
                                      width={80} 
                                      height={80}
                                      className="w-full h-full object-cover"
                                   />
                                </div>
                                <div>
                                   <h3 className="text-lg font-black text-slate-900 line-clamp-1 mb-1">{p.title}</h3>
                                   <p className="text-xs font-bold text-slate-400">
                                      {dayjs(p.created_at).format('YYYY.MM.DD')} • 조회 {p.views}
                                   </p>
                                   {p.is_audit_mode && (
                                      <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 bg-orange-100 text-orange-600 text-[10px] font-black rounded-full">
                                         <FontAwesomeIcon icon={faStar} className="w-2.5 h-2.5" /> AUDIT ACTIVE
                                      </span>
                                   )}
                                </div>
                             </div>
                             
                             <div className="mt-auto">
                                <Button 
                                   onClick={() => setSelectedReportProject({ id: p.id, title: p.title })}
                                   className="w-full h-12 rounded-2xl bg-slate-900 hover:bg-black text-white font-black text-sm gap-2 shadow-lg"
                                >
                                   <FontAwesomeIcon icon={faChartBar} className="w-4 h-4 text-orange-400" />
                                   전문가 진단 리포트 확인
                                </Button>
                             </div>
                          </div>
                       ))}
                    </div>
                 )}
              </TabsContent>

              {/* === TAB: WRITTEN EVALUATIONS === */}
              <TabsContent value="written" className="mt-0">
                 {error ? (
                    <div className="text-center py-20 bg-white rounded-3xl border border-red-100">
                       <p className="text-red-500 mb-4 font-bold">{error}</p>
                       <Button variant="outline" onClick={() => window.location.reload()}>다시 시도</Button>
                    </div>
                 ) : evaluations.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200 shadow-sm">
                       <FontAwesomeIcon icon={faStar} className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                       <h2 className="text-xl font-bold text-slate-900 mb-2">아직 남긴 평가가 없습니다</h2>
                       <p className="text-slate-500 mb-8 max-w-xs mx-auto">새로운 프로젝트들을 진단하고 나만의 인사이트를 공유해보세요!</p>
                       <Button onClick={() => router.push('/growth')} className="bg-slate-900 hover:bg-green-600 transition-all rounded-2xl px-8 h-12 font-black">
                         프로젝트 구경가기
                       </Button>
                    </div>
                 ) : (
                    <div className="grid grid-cols-1 gap-6">
                       {evaluations.map((ev) => (
                         <div key={ev.rating_id} className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden hover:shadow-xl transition-all group flex flex-col md:flex-row">
                           <div className="w-full md:w-64 h-48 md:h-auto bg-slate-100 shrink-0 relative overflow-hidden">
                             <Image 
                               src={ev.thumbnail_url} 
                               alt={ev.project_title} 
                               fill 
                               className="object-cover group-hover:scale-105 transition-transform duration-500"
                               sizes="(max-width: 768px) 100vw, 256px"
                             />
                             <div className="absolute top-4 left-4 flex items-center gap-1.5 px-2.5 py-1 bg-black/60 backdrop-blur-md rounded-full text-white text-[10px] font-black border border-white/20">
                               <FontAwesomeIcon icon={faStar} className="w-3 h-3 text-amber-400" />
                               {ev.score.toFixed(1)}
                             </div>
                           </div>

                           <div className="p-8 flex-1 flex flex-col">
                             <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                               <div>
                                 <h3 className="text-xl font-black text-slate-900 mb-1 group-hover:text-green-600 transition-colors">{ev.project_title}</h3>
                                 <div className="flex items-center gap-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                                   <span className="flex items-center gap-1"><FontAwesomeIcon icon={faCalendarAlt} className="w-3 h-3" /> {dayjs(ev.created_at).format('YYYY.MM.DD')}</span>
                                   <span className="w-1 h-1 bg-slate-200 rounded-full" />
                                   <span className="flex items-center gap-1"><FontAwesomeIcon icon={faCommentDots} className="w-3 h-3" /> 코멘트 작성됨</span>
                                 </div>
                               </div>
                             </div>

                             <div className="bg-slate-50/50 rounded-2xl p-4 mb-6 border border-slate-100">
                               <p className="text-sm text-slate-600 leading-relaxed italic line-clamp-2">
                                 "{ev.comment || "작성된 코멘트가 없습니다."}"
                               </p>
                             </div>

                             <div className="mt-auto flex items-center gap-3">
                               <Link href={`/project/${ev.project_id}`} className="flex-1">
                                 <Button variant="outline" className="w-full h-12 rounded-2xl border-2 border-slate-100 hover:bg-slate-50 font-black text-xs text-slate-600 gap-2">
                                   <FontAwesomeIcon icon={faEye} className="w-4 h-4" /> 프로젝트 다시보기
                                 </Button>
                               </Link>
                               {currentUserId === ev.project_owner_id ? (
                                 <Link href={`/project/upload?mode=audit&edit=${ev.project_id}`} className="flex-1">
                                   <Button className="w-full h-12 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-black text-xs gap-2 transition-all">
                                     <FontAwesomeIcon icon={faPen} className="w-4 h-4" /> 평가 의뢰 수정하기
                                   </Button>
                                 </Link>
                               ) : (
                                 <Link href={`/review/viewer?projectId=${ev.project_id}&ratingId=${ev.rating_id}`} className="flex-1">
                                   <Button className="w-full h-12 rounded-2xl bg-slate-900 hover:bg-green-600 text-white font-black text-xs gap-2 transition-all">
                                     <FontAwesomeIcon icon={faPen} className="w-4 h-4" /> 내 평가 수정하기
                                   </Button>
                                 </Link>
                               )}
                             </div>
                           </div>
                         </div>
                       ))}
                    </div>
                 )}
              </TabsContent>
           </Tabs>
        )}
      </div>

      <ReviewReportModal 
         open={!!selectedReportProject} 
         onOpenChange={(open) => !open && setSelectedReportProject(null)}
         projectId={selectedReportProject?.id || ''}
         projectTitle={selectedReportProject?.title || ''}
      />
    </div>
  );
}
