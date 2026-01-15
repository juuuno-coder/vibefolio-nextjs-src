"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import dynamic from 'next/dynamic';
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ProjectGridSkeleton } from "@/components/ui/ProjectSkeleton";
import { ImageCard } from "@/components/ImageCard";
import { getCategoryName, getCategoryNameById, getCategoryValue } from "@/lib/categoryMap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRocket, faLock } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@/lib/auth/AuthContext";
import { PopupModal } from "@/components/PopupModal";

interface ImageDialogProps {
  id: string;
  title?: string;
  urls: { full: string; regular: string };
  user: { username: string; profile_image: { small: string; large: string } };
  likes: number;
  views?: number;
  description: string | null;
  alt_description: string | null;
  created_at: string;
  width: number;
  height: number;
  category: string;
  categorySlug?: string;
  categories?: string[];
  field?: string;
  fields?: string[];
  userId?: string;
  rendering_type?: string;
  custom_data?: any;
}

const ProjectDetailModalV2 = dynamic(() => 
  import("@/components/ProjectDetailModalV2").then(mod => mod.ProjectDetailModalV2), 
  { ssr: false }
);

function GrowthContent() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  
  const [projects, setProjects] = useState<ImageDialogProps[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ImageDialogProps | null>(null);

  // 로드
  useEffect(() => {
    if (authLoading) return;
    
    // 비로그인 상태 체크
    if (!isAuthenticated) {
       setLoading(false);
       return; 
    }

    const loadGrowthProjects = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/projects?mode=growth&limit=50`);
        const data = await res.json();
        const projectList = data.data || data.projects || [];

        const enriched = projectList.map((proj: any) => {
          const userInfo = proj.User || proj.users || { username: 'Unknown', profile_image_url: '/globe.svg' };
          const imgUrl = proj.thumbnail_url || proj.image_url || "/placeholder.jpg";
          
          let projectGenres: string[] = [];
          try {
              const cData = typeof proj.custom_data === 'string' ? JSON.parse(proj.custom_data) : proj.custom_data;
              if (cData?.genres) projectGenres = cData.genres;
          } catch {}

          const categoryName = proj.Category?.name || getCategoryNameById(proj.category_id || 1);
          
          return {
            id: proj.project_id.toString(),
            title: proj.title,
            urls: { full: imgUrl, regular: imgUrl },
            user: { 
              username: userInfo.username || 'Unknown', 
              profile_image: { small: userInfo.profile_image_url || '/globe.svg', large: userInfo.profile_image_url || '/globe.svg' } 
            },
            likes: proj.likes_count || 0,
            views: proj.views_count || 0,
            description: proj.content_text,
            alt_description: proj.title,
            created_at: proj.created_at,
            width: 800,
            height: 600,
            category: categoryName,
            categories: projectGenres,
            userId: proj.user_id,
            rendering_type: proj.rendering_type,
            allow_michelin_rating: proj.allow_michelin_rating,
            allow_stickers: proj.allow_stickers,
            allow_secret_comments: proj.allow_secret_comments,
            is_feedback_requested: typeof proj.custom_data === 'string' ? JSON.parse(proj.custom_data)?.is_feedback_requested : proj.custom_data?.is_feedback_requested,
            custom_data: typeof proj.custom_data === 'string' ? JSON.parse(proj.custom_data) : proj.custom_data,
          } as ImageDialogProps;
        });

        setProjects(enriched);
      } catch (e) {
        console.error("Growth load failed:", e);
      } finally {
        setLoading(false);
      }
    };

    loadGrowthProjects();
  }, [isAuthenticated, authLoading]);

  // 비로그인 화면
  if (!authLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
        <div className="bg-white p-10 rounded-3xl shadow-xl text-center max-w-md border border-gray-100">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
             <FontAwesomeIcon icon={faLock} className="text-gray-400 text-3xl" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">로그인이 필요합니다</h2>
          <p className="text-gray-500 mb-8 leading-relaxed">
            성장하기 메뉴는 크리에이터들이 서로 피드백을 주고받는 프라이빗한 공간입니다.<br/>
            로그인하고 서로의 성장을 응원해주세요!
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => router.push('/login')} className="bg-green-600 hover:bg-green-700 rounded-full px-8">
               로그인
            </Button>
            <Button variant="outline" onClick={() => router.push('/signup')} className="rounded-full px-8">
               회원가입
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <main className="w-full max-w-[1800px] mx-auto px-4 md:px-8 pb-20 pt-24">
         {/* Header */}
         <div className="mb-12 text-center space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-green-50 text-green-700 rounded-full text-sm font-bold border border-green-100 mb-2">
               <FontAwesomeIcon icon={faRocket} />
               GROWTH CENTER
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">
               서로의 성장을 위한 <br className="md:hidden" /> 피드백 공간
            </h1>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
               더 나은 작품을 위해 용기 내어 피드백을 요청한 크리에이터들입니다. <br/>
               따뜻한 조언과 냉철한 평가로 성장을 도와주세요.
            </p>
         </div>

         {/* Grid */}
         {loading ? (
           <ProjectGridSkeleton count={8} />
         ) : projects.length > 0 ? (
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-y-12 gap-x-6">
             {projects.map((project) => (
               <div key={project.id} className="w-full relative group">
                 <ImageCard
                   onClick={() => {
                     setSelectedProject(project);
                     setModalOpen(true);
                   }}
                   props={project}
                 />
               </div>
             ))}
           </div>
         ) : (
           <div className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-2">아직 피드백 요청이 없습니다</h3>
              <p className="text-gray-500">첫 번째로 용기 내어 피드백을 요청해보세요!</p>
              <Button onClick={() => router.push('/project/upload')} className="mt-6 rounded-full">
                 프로젝트 등록하기
              </Button>
           </div>
         )}
      </main>

      <PopupModal />
      
      {selectedProject && (
        <ProjectDetailModalV2
          open={modalOpen}
          onOpenChange={setModalOpen}
          project={selectedProject}
        />
      )}
    </div>
  );
}

export default function GrowthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <GrowthContent />
    </Suspense>
  );
}
