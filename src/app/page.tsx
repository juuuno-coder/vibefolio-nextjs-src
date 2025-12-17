// src/app/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from 'next/dynamic';
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton"; // skeleton for cards
import { MainBanner } from "@/components/MainBanner";
import { ImageCard } from "@/components/ImageCard";
import { StickyMenu } from "@/components/StickyMenu";
import { getCategoryName } from "@/lib/categoryMap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWandSparkles, faXmark, faCheck } from "@fortawesome/free-solid-svg-icons";

// 모달은 초기에 필요 없으므로 Dynamic Import로 지연 로딩
const ProjectDetailModalV2 = dynamic(() => 
  import("@/components/ProjectDetailModalV2").then(mod => mod.ProjectDetailModalV2), 
  { ssr: false }
);
import { useAuth } from "@/lib/auth/AuthContext";

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
  const { user, isAuthenticated } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string | string[]>("all");
  const [sortBy, setSortBy] = useState("latest");
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [projects, setProjects] = useState<ImageDialogProps[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ImageDialogProps | null>(null);
  const [userInterests, setUserInterests] = useState<{ genres: string[]; fields: string[] } | null>(null);
  const [usePersonalized, setUsePersonalized] = useState(false);

  // Auth 상태 변경 시 관심 카테고리 정보만 로드 (자동 적용 X)
  useEffect(() => {
    if (user) {
      const interests = user.user_metadata?.interests;
      // 관심사가 존재하는지만 확인하여 추천 배너 노출 조건 마련
      if (interests && (interests.genres?.length > 0 || interests.fields?.length > 0)) {
        setUserInterests(interests);
      }
    } else {
      setUserInterests(null);
      setUsePersonalized(false);
    }
  }, [user]);

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
      if (loading && !reset) return;
      if (reset) setLoading(true);
      try {
        const limit = 20;
        const res = await fetch(`/api/projects?page=${pageNum}&limit=${limit}`);
        const data = await res.json();

        if (res.ok && data.projects) {
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
              likes: proj.likes_count || proj.likes || 0,
              views: proj.views_count || proj.views || 0,
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
          
          // 더 이상 불러올 데이터가 없으면 hasMore를 false로 설정
          if (data.projects.length < limit) {
            setHasMore(false);
          }
        } else {
          setHasMore(false);
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
  const categoryNames = Array.isArray(selectedCategory) 
    ? selectedCategory.map(c => getCategoryName(c))
    : [getCategoryName(selectedCategory)];
  
  const filtered = categoryNames.includes("전체") || selectedCategory === "all"
    ? projects 
    : projects.filter(p => categoryNames.includes(p.category));
  
  const sortedProjects = sortProjects(filtered, sortBy);

  const handleProjectClick = (proj: ImageDialogProps) => {
    setSelectedProject(proj);
    setModalOpen(true);
  };

  const handleUploadClick = () => {
    if (!isAuthenticated) { 
      alert('프로젝트 등록을 위해 로그인이 필요합니다.'); 
      router.push('/login'); 
    } else { 
      router.push('/project/upload'); 
    }
  };

  const handleApplyPersonalized = () => {
    if (userInterests) {
      if (userInterests.genres?.length > 0) {
        setSelectedCategory(userInterests.genres);
      }
      if (userInterests.fields?.length > 0) {
        setSelectedFields(userInterests.fields);
      }
      setUsePersonalized(true);
    }
  };

  const handleClearPersonalized = () => {
    setUsePersonalized(false);
    setSelectedCategory("all");
    setSelectedFields([]);
  };

  return (
    <div className="min-h-screen bg-white">
      <main className="w-full">
        {/* 메인 배너 */}
        <section className="w-full">
          <MainBanner loading={loading} gallery={[]} />
        </section>

        {/* 개인화 필터 알림 */}
        {/* 개인화 필터 제안 (아직 적용 안함) */}
        {!usePersonalized && userInterests && (
          <div className="bg-gradient-to-r from-violet-50 to-indigo-50 border-b border-indigo-100/50">
            <div className="max-w-screen-xl mx-auto px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faWandSparkles} className="w-4 h-4 text-indigo-500" />
                <span className="text-sm text-gray-700">
                  <span className="font-medium text-indigo-600">회원님을 위한 추천</span>
                  <span className="ml-1">
                    설정하신 관심사를 기반으로 맞춤 피드를 보여드릴까요?
                  </span>
                </span>
              </div>
              <button
                onClick={handleApplyPersonalized}
                className="flex items-center gap-1.5 text-sm bg-indigo-600 text-white px-3 py-1.5 rounded-full hover:bg-indigo-700 transition-all shadow-sm font-medium"
              >
                <FontAwesomeIcon icon={faCheck} className="w-3 h-3" />
                네, 좋아요!
              </button>
            </div>
          </div>
        )}

        {/* 개인화 필터 적용 됨 */}
        {usePersonalized && userInterests && (
          <div className="bg-gradient-to-r from-[#4ACAD4]/10 to-indigo-50 border-b border-[#4ACAD4]/20 fade-in">
            <div className="max-w-screen-xl mx-auto px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faWandSparkles} className="w-4 h-4 text-[#4ACAD4]" />
                <span className="text-sm text-gray-700">
                  <span className="font-medium text-[#4ACAD4]">맞춤 피드</span>
                  {userInterests.genres?.length > 0 && (
                    <span className="ml-1">
                      관심 장르 기반으로 보여드리고 있어요
                    </span>
                  )}
                </span>
              </div>
              <button
                onClick={handleClearPersonalized}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                <FontAwesomeIcon icon={faXmark} className="w-3 h-3" />
                전체 보기
              </button>
            </div>
          </div>
        )}

        {/* 카테고리 메뉴 */}
        <StickyMenu
          props={selectedCategory}
          onSetCategory={setSelectedCategory}
          onSetSort={setSortBy}
          onSetField={setSelectedFields}
          currentSort={sortBy}
          currentFields={selectedFields}
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

          {/* 더 보기 버튼 */}
          {!loading && sortedProjects.length > 0 && hasMore && (
            <div className="text-center py-8">
              <Button 
                onClick={() => {
                  setLoadingMore(true);
                  loadProjects(page + 1, false).finally(() => {
                    setPage(prev => prev + 1);
                    setLoadingMore(false);
                  });
                }}
                disabled={loadingMore}
                variant="outline"
                className="px-8 py-3 text-base"
              >
                {loadingMore ? (
                  <><span className="animate-spin mr-2">⏳</span> 로딩 중...</>
                ) : (
                  '더 보기'
                )}
              </Button>
            </div>
          )}
        </section>

        {/* 상세 모달 */}
        <ProjectDetailModalV2 open={modalOpen} onOpenChange={setModalOpen} project={selectedProject} />
      </main>
    </div>
  );
}
