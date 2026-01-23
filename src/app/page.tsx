"use client";

import React, { Suspense, useState, useEffect, useCallback } from "react";
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton"; // skeleton for cards
import { ProjectGridSkeleton } from "@/components/ui/ProjectSkeleton";
import { MainBanner } from "@/components/MainBanner";
import { ImageCard } from "@/components/ImageCard";
import { StickyMenu } from "@/components/StickyMenu";
import { EmptyState } from "@/components/ui/EmptyState";
import { getCategoryName, getCategoryNameById, getCategoryValue } from "@/lib/categoryMap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWandSparkles, faXmark, faCheck, faBullhorn } from "@fortawesome/free-solid-svg-icons";
import { Megaphone, ChefHat, Clock } from "lucide-react";


const ProjectDetailModalV2 = dynamic(() => 
  import("@/components/ProjectDetailModalV2").then(mod => mod.ProjectDetailModalV2), 
  { ssr: false }
);
const OnboardingModal = dynamic(() => 
  import("@/components/OnboardingModal").then(mod => mod.OnboardingModal), 
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
  categorySlug?: string; // Slug 추가
  categories?: string[]; // 복수 장르 (Slug)
  field?: string; // 분야 정보 추가
  fields?: string[]; // 복수 분야 (Slug)
  userId?: string;
  rendering_type?: string;
  allow_michelin_rating?: boolean;
  allow_stickers?: boolean;
  allow_secret_comments?: boolean;
  custom_data?: any;
  is_feedback_requested?: boolean;
  is_growth_requested?: boolean;
  audit_deadline?: string;
}

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("q"); // 검색어 가져오기

  const { user, userProfile, isAuthenticated } = useAuth();
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
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  // Ref for checking loading status without triggering re-memoization of loadProjects
  const isFetchingRef = React.useRef(false);

  // 온보딩 트리거 체크
  useEffect(() => {
    // 1. 로그인 상태이고 로딩이 끝났을 때
    if (!loading && user && userProfile) {
      // 2. 프로필 정보가 부실하거나 온보딩 완료 여부 체크
      
      // 관심사 정보가 없는 경우도 신규 유저로 간주 (Google 유저 대응)
      const hasNoInterests = !userProfile.interests || 
        (Array.isArray(userProfile.interests) && userProfile.interests.length === 0) ||
        // @ts-ignore: interests might be an object without genres if type is loose
        (typeof userProfile.interests === 'object' && (!userProfile.interests.genres || userProfile.interests.genres.length === 0));

      const isNewUser = !userProfile.username || 
                       userProfile.username.includes('@') || 
                       userProfile.username === '익명사용자' ||
                       hasNoInterests;
      
      const isSkipped = localStorage.getItem(`onboarding_skipped_${user.id}`);
      
      if (isNewUser && !isSkipped) {
        // 약간의 지연 후 온보딩 모달 표시
        const timer = setTimeout(() => setShowOnboarding(true), 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [user, userProfile, loading]);

  // Auth 상태 변경 시 관심 카테고리 정보만 로드 (userProfile 우선)
  useEffect(() => {
    if (userProfile?.interests) {
      setUserInterests(userProfile.interests);
    } else if (user?.user_metadata?.interests) {
      setUserInterests(user.user_metadata.interests);
    } else {
      setUserInterests(null);
    }
  }, [user, userProfile]);

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

  const loadProjects = useCallback(
    async (pageNum = 1, reset = false) => {
      if (isFetchingRef.current && !reset) return;
      
      if (reset) {
          setLoading(true);
          setHasMore(true);
          isFetchingRef.current = true;
      }
      try {
        const limit = 20;
        const searchParam = searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : "";
        
        let categoryParam = "";
        let modeParam = "";
        if (selectedCategory === 'growth') {
            modeParam = "&mode=growth";
        } else if (selectedCategory === 'audit') {
            modeParam = "&mode=audit";
        } else if (selectedCategory && selectedCategory !== 'all' && selectedCategory !== 'interests') {
            categoryParam = `&category=${selectedCategory}`;
        }

        const fieldParam = selectedFields.length > 0 ? `&field=${selectedFields[0]}` : "";
        
        const res = await fetch(`/api/projects?page=${pageNum}&limit=${limit}${searchParam}${categoryParam}${fieldParam}${modeParam}`);
        const data = await res.json();
        
        // API 응답 키가 'data'일 수도 있고 'projects'일 수도 있음 (Dual Support)
        const projectList = data.data || data.projects;

        if (res.ok && projectList) {
          const enriched = projectList.map((proj: any) => {
            // API에서 User 정보를 함께 받아오므로 getUserInfo 호출 불필요
            // users(소문자) 또는 User(대문자) 모두 체크
            const userInfo = proj.User || proj.users || { username: 'Unknown', profile_image_url: '/globe.svg' };
            
            // 이미지 URL: thumbnail_url, image_url, url 등 가능한 모든 필드 체크
            const imgUrl = proj.thumbnail_url || proj.image_url || proj.url || "/placeholder.jpg";

            // [Enhanced] 복수 필드 & 장르 파싱
            let projectGenres: string[] = [];
            let projectFields: string[] = [];
            let primaryField = "it";
            
            try {
               const cData = typeof proj.custom_data === 'string' ? JSON.parse(proj.custom_data) : proj.custom_data;
               
               // Fields Parsing
               if (cData?.fields && Array.isArray(cData.fields)) {
                  projectFields = cData.fields.map((f: string) => f.toLowerCase());
               }

               // Genres Parsing (New)
               if (cData?.selectedGenres && Array.isArray(cData.selectedGenres)) {
                   projectGenres = cData.selectedGenres;
               } else if (cData?.genres && Array.isArray(cData.genres)) {
                   projectGenres = cData.genres;
               }
            } catch {}

            // Fallback for primaryField
            if (projectFields.length > 0) {
                primaryField = projectFields[0];
            } else if (proj.field) {
                primaryField = proj.field;
                projectFields = [proj.field.toLowerCase()];
            }

            const categoryName = proj.Category?.name || getCategoryNameById(proj.category_id || proj.Category || 1);
            const mainCatSlug = getCategoryValue(categoryName);
            
            // 메인 category_id도 장르에 포함 (중복 방지)
            if (mainCatSlug && mainCatSlug !== 'all' && !projectGenres.includes(mainCatSlug)) {
                projectGenres.push(mainCatSlug);
            }

            return {
              id: proj.project_id.toString(),
              title: proj.title,
              urls: { 
                full: imgUrl, 
                regular: imgUrl 
              },
              user: { 
                username: userInfo.username || userInfo.nickname || 'Unknown', 
                profile_image: { 
                  small: userInfo.profile_image_url || userInfo.avatar_url || '/globe.svg', 
                  large: userInfo.profile_image_url || userInfo.avatar_url || '/globe.svg' 
                } 
              },
              likes: proj.likes_count || proj.likes || 0,
              views: proj.views_count || proj.views || 0,
              description: proj.content_text,
              alt_description: proj.title,
              created_at: proj.created_at,
              width: 400,
              height: 300,
              category: categoryName,
              categorySlug: mainCatSlug,
              categories: projectGenres,
              field: primaryField.toLowerCase(),
              fields: projectFields,
              userId: proj.user_id,
              rendering_type: proj.rendering_type,
              allow_michelin_rating: proj.allow_michelin_rating,
              allow_stickers: proj.allow_stickers,
              allow_secret_comments: proj.allow_secret_comments,
              custom_data: proj.custom_data,
              is_feedback_requested: typeof proj.custom_data === 'string' ? JSON.parse(proj.custom_data)?.is_feedback_requested : proj.custom_data?.is_feedback_requested,
              is_growth_requested: proj.is_growth_requested,
              audit_deadline: proj.audit_deadline,
            } as ImageDialogProps;
          });
          
          reset ? setProjects(enriched) : setProjects(prev => [...prev, ...enriched]);
          
          // 더 이상 불러올 데이터가 없으면 hasMore를 false로 설정
          if (projectList.length < limit) {
            setHasMore(false);
          }
        } else {
          setHasMore(false);
        }
      } catch (e) {
        console.error("프로젝트 로딩 실패:", e);
      } finally {
        setLoading(false);
        isFetchingRef.current = false;
      }
    },
    [searchQuery, selectedCategory, selectedFields]
  );

  // 검색어, 카테고리, 분야 변경 시 데이터 리셋 및 로드
  useEffect(() => {
    loadProjects(1, true);
  }, [searchQuery, selectedCategory, selectedFields, loadProjects]);

  // 카테고리 필터링
  const categoryNames = Array.isArray(selectedCategory) 
    ? selectedCategory.map(c => getCategoryName(c))
    : [getCategoryName(selectedCategory)];
  
  // 필터링 로직 강화 (카테고리 + 분야 + 관심사) - 검색어는 서버 사이드에서 처리됨
  // 필터링 로직 강화 (카테고리 + 분야 + 관심사) - 복수 선택 지원
  const filtered = projects.filter(p => {
    // 0. [New] 성장하기(Growth) 탭 로직
    if (selectedCategory === "growth") {
        return p.is_growth_requested === true || p.is_feedback_requested === true;
    }

    // 1. 관심사 탭 ("interests") 선택 시 로직 (OR 조건: 하나라도 맞으면 노출)
    if (selectedCategory === "interests") {
      if (!userInterests) return false;
      
      const myGenres = userInterests.genres || [];
      const myFields = userInterests.fields || [];
      
      const hasGenres = myGenres.length > 0;
      const hasFields = myFields.length > 0;

      // 둘 다 설정 안했으면 통과 X (관심사 설정 모달이 뜰 것임)
      if (!hasGenres && !hasFields) return false;

      // Genre 매칭 확인
      const isGenreMatched = hasGenres && myGenres.some(g => {
         return p.categories?.includes(g) || 
                p.categories?.includes(getCategoryValue(g)) || 
                (p.category && p.category === g) ||
                (p.category && p.category === getCategoryName(g));
      });

      // Field 매칭 확인
      const isFieldMatched = hasFields && (p.fields && myFields.some(f => 
         p.fields?.includes(f) || 
         p.fields?.includes(getCategoryValue(f)) ||
         p.fields?.includes(f.toLowerCase())
      ));
      
      // 사용자 요구사항: "1개라도 해당되는게 있으면 소팅" -> 합집합(OR)
      return isGenreMatched || isFieldMatched;
    }

    // 2. 일반 카테고리 필터 (복수 매칭)
    const matchCategory = selectedCategory === "all" || (
      Array.isArray(selectedCategory) 
        ? selectedCategory.some(cat => p.categories?.includes(cat))
        : p.categories?.includes(selectedCategory)
    );
    
    // 3. 분야 필터 (복수 매칭)
    const matchField = selectedFields.length === 0 || (
       p.fields && p.fields.some(f => 
          selectedFields.includes(f) || selectedFields.includes(getCategoryName(f))
       )
    );
    
    return matchCategory && matchField;
  });

  // 관심사 탭 선택 시 유효성 검사
  useEffect(() => {
    if (selectedCategory === "interests") {
      if (!isAuthenticated) {
        // 로그인이 안 된 경우 - 토스트로 안내
        import("sonner").then(({ toast }) => {
          toast.error("로그인이 필요한 기능입니다.", {
            description: "관심사 맞춤 추천을 보려면 로그인해주세요.",
            action: {
              label: "로그인하기",
              onClick: () => router.push("/login"),
            },
          });
        });
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
        {/* 메인 배너 - 헤더와 밀착 */}
        <section className="w-full">
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
        
        <div className="max-w-[1800px] mx-auto px-4 md:px-8 pb-20 pt-8">
            {/* [New] Growth Mode Highlighting - Only show in 'growth' category tab */}
            {!searchQuery && selectedCategory === 'growth' && projects.some(p => p.is_growth_requested || p.is_feedback_requested) && (
                 <div className="mb-20 relative px-8 py-10 bg-gradient-to-br from-orange-50 via-white to-white rounded-[3rem] border border-orange-100/50 shadow-sm overflow-hidden group">
                    {/* Background Decor */}
                    <div className="absolute top-0 right-0 w-80 h-80 bg-orange-100/30 rounded-full blur-[80px] -mr-32 -mt-32 animate-pulse" />
                    <div className="absolute bottom-0 left-0 w-40 h-40 bg-orange-50/50 rounded-full blur-[40px] -ml-16 -mb-16" />
                    
                    <div className="relative z-10">
                        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center gap-3">
                                   <div className="bg-orange-600 text-white p-2.5 rounded-2xl shadow-lg shadow-orange-200">
                                      <ChefHat size={22} strokeWidth={2.5} />
                                   </div>
                                   <span className="text-orange-600 font-black text-[10px] tracking-[0.2em] uppercase">Special Mission</span>
                                </div>
                                <h2 className="text-4xl font-black text-slate-950 tracking-tighter leading-tight mt-1">
                                    제 평가는요? <span className="text-orange-600">전문 진단</span> 프로젝트
                                </h2>
                                <p className="text-slate-500 text-[16px] font-medium max-w-lg leading-relaxed">
                                    창작자의 치열한 고민이 담긴 작품들입니다.<br/>
                                    여러분의 냉철한 시선으로 미슐랭 평점을 매겨주세요.
                                </p>
                            </div>
                            <Button 
                              variant="outline"
                              onClick={() => router.push('/growth')}
                              className="rounded-2xl border-slate-200 font-bold h-12 px-8 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 transition-all text-sm shadow-xl shadow-slate-100/50"
                            >
                                가이드 보기
                            </Button>
                        </div>
                        
                        <div className="flex gap-8 overflow-x-auto pb-6 no-scrollbar -mx-4 px-4 h-[440px] items-center">
                            {projects.filter(p => p.is_growth_requested || p.is_feedback_requested).slice(0, 8).map(project => (
                                 <div key={project.id} className="min-w-[320px] md:min-w-[400px] transition-all duration-500 hover:scale-[1.02]">
                                    <ImageCard 
                                        props={project} 
                                        onClick={() => handleProjectClick(project)} 
                                        className="shadow-2xl shadow-slate-200/40" 
                                    />
                                    {/* Mini Info for Audit */}
                                    <div className="mt-6 flex flex-col gap-3 px-2">
                                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-orange-500 w-[65%] animate-pulse" />
                                        </div>
                                        <div className="flex justify-between items-center text-[11px] font-bold">
                                            <div className="flex items-center gap-2 text-slate-400">
                                                <Clock size={14} className="text-orange-500" />
                                                마감 D-3
                                            </div>
                                            <div className="px-2.5 py-1 bg-orange-600 text-white rounded-lg text-[9px] font-black uppercase tracking-tighter shadow-md">
                                                진단 필수
                                            </div>
                                        </div>
                                    </div>
                                 </div>
                            ))}
                        </div>
                    </div>
                 </div>
            )}

            {/* 검색어 표시 */}
            {searchQuery && (
              <div className="pt-10 mb-10 flex items-center justify-between border-b border-gray-100 pb-6 transition-all animate-in fade-in slide-in-from-top-2">
                <h2 className="text-2xl font-bold text-slate-800">
                  '<span className="text-green-600">{searchQuery}</span>' 검색 결과: <span className="text-slate-400 font-medium ml-1">{filtered.length}건</span>
                </h2>
                <Button variant="ghost" size="sm" onClick={() => router.push('/')} className="hover:bg-red-50 hover:text-red-500 rounded-full px-4">
                  <FontAwesomeIcon icon={faXmark} className="mr-2" />
                  검색 취소
                </Button>
              </div>
            )}

            {/* 프로젝트 리스트 (Grid Layout) - 한 줄에 최대 4개 */}
            {sortedProjects.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-y-12 gap-x-6">
                {sortedProjects.map((project) => (
                  <div key={project.id} className="w-full">
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
            
            {loading && <ProjectGridSkeleton count={10} />}
        </div>
      </main>

      {/* 프로젝트 상세 모달 */}
      {/* 프로젝트 상세 모달 */}
      {selectedProject && (
        <ProjectDetailModalV2
          open={modalOpen}
          onOpenChange={setModalOpen}
          project={selectedProject}
        />
      )}
      
      {/* 관심사 설정 모달 */}
      <OnboardingModal
        open={showOnboarding}
        onOpenChange={setShowOnboarding}
        userId={user?.id || ""}
        userEmail={user?.email || ""}
        onComplete={() => {
          setShowOnboarding(false);
          // 관심사 탭 데이터 갱신을 위해 필요한 경우 추가 로직 가동
        }}
      />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <HomeContent />
    </Suspense>
  );
}
