// src/app/mypage/projects/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Upload, ArrowLeft, Trash2, Eye, Heart, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import dayjs from "dayjs";
import { supabase } from "@/lib/supabase/client";

interface Project {
  id: string;
  title: string;
  thumbnail_url: string;
  likes_count: number;
  views_count: number;
  created_at: string;
  custom_data?: any;
}

export default function MyProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          router.push('/login');
          return;
        }

        const { data, error: queryError } = await supabase
          .from('Project')
          .select('project_id, title, thumbnail_url, likes_count, views_count, created_at, custom_data')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (queryError) {
          console.error('쿼리 오류:', queryError);
          setError('프로젝트를 불러오는데 실패했습니다.');
          return;
        }

        const mapped = (data || []).map((p: any) => ({
          id: String(p.project_id),
          title: p.title || '제목 없음',
          thumbnail_url: p.thumbnail_url || '/placeholder.jpg',
          likes_count: p.likes_count || 0,
          views_count: p.views_count || 0,
          created_at: p.created_at,
          custom_data: typeof p.custom_data === 'string' ? JSON.parse(p.custom_data) : p.custom_data
        }));

        setProjects(mapped);
      } catch (err: any) {
        console.error('프로젝트 로딩 실패:', err);
        setError(err.message || '오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [router]);

  const handleDelete = async (projectId: string) => {
    if (!confirm("정말로 이 프로젝트를 삭제하시겠습니까?")) {
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        alert('로그인이 필요합니다.');
        router.push('/login');
        return;
      }

      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '삭제에 실패했습니다.');
      }

      setProjects(prev => prev.filter(p => p.id !== projectId));
      alert("프로젝트가 삭제되었습니다.");
    } catch (err: any) {
      console.error("프로젝트 삭제 실패:", err);
      alert(err.message || "프로젝트 삭제에 실패했습니다.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12">
      <div className="max-w-6xl mx-auto px-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft size={20} />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Upload className="text-[#16A34A]" size={24} />
                내 프로젝트
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                총 {projects.length}개의 프로젝트를 관리하고 있습니다
              </p>
            </div>
          </div>
          <Button 
            onClick={() => router.push('/project/upload')}
            className="bg-[#16A34A] hover:bg-[#3ab8c2]"
          >
            <Upload className="w-4 h-4 mr-2" />
            새 프로젝트
          </Button>
        </div>

        {/* 콘텐츠 */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#16A34A]"></div>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-red-500 mb-4">{error}</p>
            <Button variant="outline" onClick={() => window.location.reload()}>
              다시 시도
            </Button>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
            <Upload className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              아직 업로드한 프로젝트가 없습니다
            </h2>
            <p className="text-gray-500 mb-6">
              멋진 작품을 공유해보세요!
            </p>
            <Button 
              onClick={() => router.push('/project/upload')}
              className="bg-[#16A34A] hover:bg-[#3ab8c2]"
            >
              첫 프로젝트 업로드
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => {
              const isAuditActive = project.custom_data?.is_feedback_requested;
              
              return (
                <div 
                  key={project.id}
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow group"
                >
                  {/* 썸네일 */}
                  <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
                    <Image 
                      src={project.thumbnail_url}
                      alt={project.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                    
                    {isAuditActive && (
                      <div className="absolute top-3 left-3 px-3 py-1 bg-green-500 text-white text-[10px] font-black rounded-full shadow-lg flex items-center gap-1 animate-pulse">
                        <div className="w-2 h-2 bg-white rounded-full" />
                        V-AUDIT ACTIVE
                      </div>
                    )}

                    {/* 호버 오버레이 */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <Link href={`/project/${project.id}`}>
                        <Button size="sm" variant="secondary" className="bg-white/90 hover:bg-white text-xs font-bold">
                          <Eye className="w-3 h-3 mr-1" /> 작품 보기
                        </Button>
                      </Link>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        className="text-xs font-bold"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDelete(project.id);
                        }}
                      >
                        <Trash2 className="w-3 h-3 mr-1" /> 삭제
                      </Button>
                    </div>
                  </div>
                  
                  {/* 정보 */}
                  <div className="p-5 flex flex-col h-full">
                    <h3 className="font-bold text-gray-900 truncate mb-1 text-lg">
                      {project.title}
                    </h3>
                    
                    <div className="flex items-center justify-between text-[11px] text-gray-400 mb-4">
                        <span>{dayjs(project.created_at).format('YYYY.MM.DD')}</span>
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Heart className="w-3 h-3" /> {project.likes_count}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" /> {project.views_count}
                          </span>
                        </div>
                    </div>

                    {isAuditActive ? (
                      <Link href={`/mypage/projects/${project.id}/audit`} className="mt-auto">
                        <Button className="w-full bg-slate-900 hover:bg-green-600 text-white rounded-xl py-6 font-black text-sm shadow-xl transition-all group/btn overflow-hidden relative">
                           <span className="relative z-10 flex items-center justify-center gap-2">
                             진단 인사이트 리포트
                             <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                           </span>
                           <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-600 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                        </Button>
                      </Link>
                    ) : (
                      <Button variant="outline" disabled className="mt-auto w-full border-gray-100 text-gray-300 rounded-xl py-6 font-bold text-sm">
                        일반 배포 모드
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
