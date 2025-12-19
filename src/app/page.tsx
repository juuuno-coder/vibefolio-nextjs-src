"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton"; // skeleton for cards
import { MainBanner } from "@/components/MainBanner";
import { ImageCard } from "@/components/ImageCard";
import { StickyMenu } from "@/components/StickyMenu";
import { EmptyState } from "@/components/ui/EmptyState";
import { getCategoryName } from "@/lib/categoryMap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWandSparkles, faXmark, faCheck } from "@fortawesome/free-solid-svg-icons";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

// 모달은 초기에 필요 없으므로 Dynamic Import로 지연 로딩
const ProjectDetailModalV2 = dynamic(() => 
  import("@/components/ProjectDetailModalV2").then(mod => mod.ProjectDetailModalV2), 
  { ssr: false }
);
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
  field?: string; // 분야 정보 추가
  userId?: string;
}

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("q"); // 검색어 가져오기

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
  const [interestModalOpen, setInterestModalOpen] = useState(false); // 관심사 모달 상태
  const [selectedProject, setSelectedProject] = useState<ImageDialogProps | null>(null);
  const [userInterests, setUserInterests] = useState<{ genres: string[]; fields: string[] } | null>(null);
  const [usePersonalized, setUsePersonalized] = useState(false);

  // Auth 상태 변경 시 관심 카테고리 정보만 로드 (자동 적용 X)
  useEffect(() => {
    if (user) {
      const interests = user.user_metadata?.interests;
      if (interests) {
        setUserInterests(interests);
      }
    } else {
      setUserInterests(null);
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
              field: proj.field || "IT", // 임시: 분야 정보가 없으면 IT로 설정 (추후 DB 연동 필요)
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
  
  // 필터링 로직 강화 (카테고리 + 분야 + 관심사 + 검색어)
  const filtered = projects.filter(p => {
    // 0. 검색어 필터
    if (searchQuery) {
      const query = searchQuery.toLowerCase().replace(/\s+/g, "");
      const title = (p.title || "").toLowerCase().replace(/\s+/g, "");
      const desc = (p.description || "").toLowerCase().replace(/\s+/g, "");
      const username = (p.user.username || "").toLowerCase().replace(/\s+/g, "");
      
      if (!title.includes(query) && !desc.includes(query) && !username.includes(query)) {
        return false;
      }
    }

    // 1. 관심사 탭 ("interests") 선택 시 로직
    if (selectedCategory === "interests") {
      if (!userInterests) return false; // 데이터 로딩 전이거나 없으면 안 보여줌
      
      const myGenres = userInterests.genres || [];
      const myFields = userInterests.fields || [];

      // 장르 매칭: 내 장르에 포함되거나, 설정한 장르가 없으면 통과
      // p.category는 한글명("포토"), myGenres는 영어코드("photo")일 확률 높음 -> 변환 필요
      const genreMatch = myGenres.length === 0 || myGenres.some(g => getCategoryName(g) === p.category);
      
      // 분야 매칭: 내 분야에 포함되거나, 설정한 분야가 없으면 통과
      const fieldMatch = myFields.length === 0 || (p.field && myFields.includes(p.field));
      
      return genreMatch && fieldMatch;
    }

    // 2. 일반 카테고리 필터
    const catName = p.category;
    const matchCategory = selectedCategory === "all" || categoryNames.includes(catName);
    
    // 3. 분야 필터
    const matchField = selectedFields.length === 0 || (p.field && selectedFields.includes(p.field.toLowerCase()));
    
    return matchCategory && matchField;
  });

  // 관심사 탭 선택 시 유효성 검사
  useEffect(() => {
    if (selectedCategory === "interests") {
      if (!isAuthenticated) {
        // 로그인이 안 된 경우 (임시: confirm 사용 -> 추후 로그인 모달로 대체 가능)
        if (confirm("로그인이 필요한 기능입니다. 로그인 페이지로 이동하시겠습니까?")) {
          router.push("/login");
        }
        setSelectedCategory("all");
      } else if (!userInterests || (userInterests.genres?.length === 0 && userInterests.fields?.length === 0)) {
        // 관심사가 없는 경우 -> 모달 오픈
        setInterestModalOpen(true);
      }
    }
  }, [selectedCategory, isAuthenticated, userInterests, router]);
  
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

  // 무한 스크롤
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY >= document.body.offsetHeight - 500 &&
        !loading &&
        hasMore
      ) {
        setLoadingMore(true);
        setPage(prev => prev + 1);
        loadProjects(page + 1).then(() => setLoadingMore(false));
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [loading, hasMore, page, loadProjects]);

  return (
    <div className="min-h-screen bg-white">
      <main className="w-full">
        {/* 메인 배너 */}
        <section className="w-full pt-4">
          <MainBanner />
        </section>

        {/* 팝업 모달 */}
        <PopupModal />

        {/* StickyMenu */}
        <StickyMenu
          props={selectedCategory}
          onSetCategory={setSelectedCategory}
          onSetSort={setSortBy}
          onSetField={setSelectedFields}
          currentSort={sortBy}
          currentFields={selectedFields}
        />
        
        <div className="max-w-[1800px] mx-auto px-4 md:px-8 pb-20">
            {/* 검색어 표시 */}
            {searchQuery && (
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-800">
                  '<span className="text-green-600">{searchQuery}</span>' 검색 결과: {filtered.length}건
                </h2>
                <Button variant="ghost" size="sm" onClick={() => router.push('/')}>
                  <FontAwesomeIcon icon={faXmark} className="mr-2" />
                  검색 취소
                </Button>
              </div>
            )}

            {/* 프로젝트 리스트 */}
            {sortedProjects.length > 0 ? (
              <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4">
                {sortedProjects.map((project) => (
                  <div key={project.id} className="break-inside-avoid mb-4">
                    <ImageCard
                      onClick={() => handleProjectClick(project)}
                      props={project}
                    />
                  </div>
                ))}
              </div>
            ) : (
               !loading && (
                 <EmptyState 
                   icon="search"
                   title={searchQuery ? "검색 결과가 없습니다" : "등록된 프로젝트가 없습니다"}
                   description={searchQuery ? `'${searchQuery}'에 대한 결과를 찾을 수 없습니다.` : "가장 먼저 프로젝트를 등록해보세요!"}
                   actionLabel={!searchQuery ? "프로젝트 올리기" : undefined}
                   actionLink={!searchQuery ? "/project/upload" : undefined}
                 />
               )
            )}
            
            {loading && (
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mt-4">
               {[...Array(10)].map((_, i) => (
                 <div key={i} className="space-y-3">
                   <Skeleton className="h-64 w-full rounded-xl" />
                   <div className="space-y-2">
                     <Skeleton className="h-4 w-[250px]" />
                     <Skeleton className="h-4 w-[200px]" />
                   </div>
                 </div>
               ))}
             </div>
            )}
        </div>
      </main>

      {/* 프로젝트 상세 모달 */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-5xl h-[90vh] p-0 overflow-hidden bg-white/95 backdrop-blur-xl border-none shadow-2xl">
           {selectedProject && (
             <ProjectDetailModalV2 
               project={selectedProject} 
               onClose={() => setModalOpen(false)}
             />
           )}
        </DialogContent>
      </Dialog>
      
      {/* 관심사 설정 모달 */}
      {/* ... (관심사 모달 구현 생략 - 필요하다면 추가) */}
    </div>
  );
}
