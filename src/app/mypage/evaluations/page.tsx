"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Star, ArrowLeft, Edit3, Eye, Calendar, MessageCircle } from "lucide-react";
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
}

export default function MyEvaluationsPage() {
  const router = useRouter();
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvaluations = async () => {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          router.push('/login');
          return;
        }

        // Fetch ratings with project details
        const { data, error: queryError } = await (supabase as any)
          .from('ProjectRating')
          .select(`
            *,
            Project (
              title,
              thumbnail_url
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (queryError) throw queryError;

        const mapped = (data || []).map((r: any) => ({
          rating_id: String(r.id),
          project_id: String(r.project_id),
          project_title: r.Project?.title || '제목 없음',
          thumbnail_url: r.Project?.thumbnail_url || '/placeholder.jpg',
          score: r.score || 0,
          comment: r.proposal || r.comment || '',
          created_at: r.created_at,
        }));

        setEvaluations(mapped);
      } catch (err: any) {
        console.error('평가 로드 실패:', err);
        setError(err.message || '오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchEvaluations();
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-12 font-sans">
      <div className="max-w-5xl mx-auto px-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-10">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full bg-white shadow-sm">
              <ArrowLeft size={20} />
            </Button>
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">내 피드백</h1>
              <p className="text-slate-500 text-sm font-medium mt-1">내가 작성한 총 {evaluations.length}개의 정밀 진단 기록입니다.</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Link href="/growth">
              <Button variant="outline" className="hidden md:flex items-center gap-2 border-slate-200 hover:bg-slate-50 text-slate-600 rounded-full px-5 h-11 font-bold transition-all">
                <Eye className="w-4 h-4" />
                피드백 게시판
              </Button>
            </Link>
            <Link href="/project/upload?mode=audit">
              <Button className="hidden md:flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white rounded-full px-5 h-11 font-black shadow-lg shadow-green-100 transition-all hover:-translate-y-0.5">
                <Star className="w-4 h-4 fill-white" />
                평가 의뢰하기
              </Button>
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-10 h-10 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-red-100">
            <p className="text-red-500 mb-4 font-bold">{error}</p>
            <Button variant="outline" onClick={() => window.location.reload()}>다시 시도</Button>
          </div>
        ) : evaluations.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200 shadow-sm">
            <Star className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">아직 남긴 평가가 없습니다</h2>
            <p className="text-slate-500 mb-8 max-w-xs mx-auto">새로운 프로젝트들을 진단하고 나만의 인사이트를 공유해보세요!</p>
            <Button onClick={() => router.push('/')} className="bg-slate-900 hover:bg-green-600 transition-all rounded-2xl px-8 h-12 font-black">
              프로젝트 구경가기
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {evaluations.map((ev) => (
              <div key={ev.rating_id} className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden hover:shadow-xl transition-all group flex flex-col md:flex-row">
                {/* Image Section */}
                <div className="w-full md:w-64 h-48 md:h-auto bg-slate-100 shrink-0 relative overflow-hidden">
                  <Image 
                    src={ev.thumbnail_url} 
                    alt={ev.project_title} 
                    fill 
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 768px) 100vw, 256px"
                  />
                  <div className="absolute top-4 left-4 flex items-center gap-1.5 px-2.5 py-1 bg-black/60 backdrop-blur-md rounded-full text-white text-[10px] font-black border border-white/20">
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                    {ev.score.toFixed(1)}
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-8 flex-1 flex flex-col">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                    <div>
                      <h3 className="text-xl font-black text-slate-900 mb-1 group-hover:text-green-600 transition-colors">{ev.project_title}</h3>
                      <div className="flex items-center gap-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {dayjs(ev.created_at).format('YYYY.MM.DD')}</span>
                        <span className="w-1 h-1 bg-slate-200 rounded-full" />
                        <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" /> 코멘트 작성됨</span>
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
                        <Eye className="w-4 h-4" /> 프로젝트 다시보기
                      </Button>
                    </Link>
                    <Link href={`/review/viewer?projectId=${ev.project_id}&ratingId=${ev.rating_id}`} className="flex-1">
                      <Button className="w-full h-12 rounded-2xl bg-slate-900 hover:bg-green-600 text-white font-black text-xs gap-2 transition-all">
                        <Edit3 className="w-4 h-4" /> 내 평가 수정하기
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
