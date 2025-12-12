// src/app/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton"; // skeleton for cards
import { MainBanner } from "@/components/MainBanner";
import { ImageCard } from "@/components/ImageCard";
import { StickyMenu } from "@/components/StickyMenu";
import { ProjectDetailModalV2 } from "@/components/ProjectDetailModalV2";
import { supabase } from "@/lib/supabase/client";
import { getCategoryName } from "@/lib/categoryMap";

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
  userId?: string;
}

export default function Home() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState("korea");
  const [sortBy, setSortBy] = useState("latest");
  const [projects, setProjects] = useState<ImageDialogProps[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ImageDialogProps | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Auth 상태 확인
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
    };
    checkUser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });
    return () => subscription.unsubscribe();
  }, []);

  // 정렬 함수
  const sortProjects = useCallback((list: ImageDialogProps[], type: string) => {
    const sorted = [...list];
    switch (type) {
      case "latest":
        return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      case "popular":
      case "views":
        return sorted.sort((a, b) => (b.views || 0) - (a.views || 0));
      case "likes":
        return sorted.sort((a, b) => (b.likes || 0) - (a.likes || 0));
      default:
        return sorted;
    }
  }, []);

  // 프로젝트 로드 (API에서 User 정보 포함하여 반환)
  const loadProjects = useCallback(
    async (pageNum = 1, reset = false) => {
      if (loading) return;
      setLoading(true);
      try {
        const limit = pageNum === 1 ? 10 : 20;
        const res = await fetch(`/api/projects?page=${pageNum}&limit=${limit}`);
        const data = await res.json();

        if (res.ok && data.projects?.length) {
          const enriched = data.projects.map((proj: any) => {
            // API에서 User 정보를 함께 받아오므로 getUserInfo 호출 불필요
            const userInfo = proj.User || { username: 'Unknown', profile_image_url: '/globe.svg' };
            
            return {
              id: proj.project_id.toString(),
              title: proj.title,
              urls: { 
                full: proj.thumbnail_url || "/placeholder.jpg", 
                regular: proj.thumbnail_url || "/placeholder.jpg" 
              },
              user: { 
                username: userInfo.username, 
                profile_image: { 
                  small: userInfo.profile_image_url, 
                  large: userInfo.profile_image_url 
                } 
              },
              likes: 0,
              views: proj.views || 0,
              description: proj.content_text,
              alt_description: proj.title,
              created_at: proj.created_at,
              width: 400,
              height: 300,
              category: proj.Category?.name || "korea",
              userId: proj.user_id,
            } as ImageDialogProps;
          });
          
          reset ? setProjects(enriched) : setProjects(prev => [...prev, ...enriched]);
        }
      } catch (e) {
        console.error("프로젝트 로딩 실패:", e);
      } finally {
        setLoading(false);
      }
    },
    [loading]
  );

  // 최초 로드
  useEffect(() => {
    loadProjects(1, true);
  }, []);

  // 카테고리 필터링
  const categoryName = getCategoryName(selectedCategory);
  const filtered = categoryName === "전체" ? projects : projects.filter(p => p.category === categoryName);
  const sortedProjects = sortProjects(filtered, sortBy);

  const handleProjectClick = (proj: ImageDialogProps) => {
    setSelectedProject(proj);
    setModalOpen(true);
  };

  const handleUploadClick = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { alert('프로젝트 등록을 위해 로그인이 필요합니다.'); router.push('/login'); }
    else { router.push('/project/upload'); }
  };

  return (
    <div className="min-h-screen bg-white">
      <main className="w-full">
        {/* 메인 배너 */}
        <section className="w-full">
          <MainBanner loading={loading} gallery={[]} />
        </section>

        {/* 카테고리 메뉴 */}
        <StickyMenu
          props={selectedCategory}
          onSetCategory={setSelectedCategory}
          onSetSort={setSortBy}
          currentSort={sortBy}
        />

        {/* 프로젝트 그리드 */}
        <section className="w-full px-4 md:px-20 py-12">
          <div className="masonry-grid">
            {loading ? (
              // 스켈레톤 카드 6개 표시
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="p-2">
                  <Skeleton className="h-[300px] w-full rounded" />
                </div>
              ))
            ) : (
              sortedProjects.map(project => (
                <ImageCard key={project.id} props={project} onClick={() => handleProjectClick(project)} />
              ))
            )}
          </div>

          {/* 프로젝트가 없을 때 */}
          {!loading && sortedProjects.length === 0 && (
            <div className="text-center py-20">
              <p className="text-gray-500 text-lg mb-4">프로젝트가 없습니다.</p>
              <Button onClick={handleUploadClick} className="bg-[#4ACAD4] hover:bg-[#3db8c0]">첫 프로젝트 등록하기</Button>
            </div>
          )}
        </section>

        {/* 상세 모달 */}
        <ProjectDetailModalV2 open={modalOpen} onOpenChange={setModalOpen} project={selectedProject} />
      </main>
    </div>
  );
}
