"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { MainBanner } from "@/components/MainBanner";
import { ImageCard } from "@/components/ImageCard";
import { StickyMenu } from "@/components/StickyMenu";
import { ProjectDetailModalV2 } from "@/components/ProjectDetailModalV2";
import { supabase } from "@/lib/supabase/client";
import { getUserInfo } from "@/lib/getUserInfo";

interface ImageDialogProps {
  id: string;
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
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ImageDialogProps | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const observerTarget = useRef(null);

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

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // 프로젝트 정렬 함수
  const sortProjects = useCallback((projectList: ImageDialogProps[], sortType: string) => {
    const sorted = [...projectList];
    switch (sortType) {
      case 'latest':
        return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      case 'popular':
      case 'views':
        return sorted.sort((a, b) => (b.views || 0) - (a.views || 0));
      case 'likes':
        return sorted.sort((a, b) => (b.likes || 0) - (a.likes || 0));
      default:
        return sorted;
    }
  }, []);

  // 프로젝트 로딩
  const loadProjects = useCallback(async (pageNum: number, reset: boolean = false) => {
    if (loading) return;
    setLoading(true);

    try {
      const response = await fetch(`/api/projects?page=${pageNum}&limit=20`);
      const data = await response.json();

      if (response.ok && data.projects && data.projects.length > 0) {
        // 각 프로젝트의 작성자 정보를 병렬로 가져오기
        const projectsWithUsers = await Promise.all(
          data.projects.map(async (project: any) => {
            let userInfo = {
              username: 'Unknown',
              profile_image_url: '/globe.svg',
            };

            if (project.user_id) {
              userInfo = await getUserInfo(project.user_id);
            }

            return {
              id: project.project_id.toString(),
              title: project.title,
              urls: {
                full: project.thumbnail_url || '/placeholder.jpg',
                regular: project.thumbnail_url || '/placeholder.jpg',
              },
              user: {
                username: userInfo.username,
                profile_image: {
                  small: userInfo.profile_image_url,
                  large: userInfo.profile_image_url,
                },
              },
              likes: 0,
              views: project.views || 0,
              description: project.content_text,
              alt_description: project.title,
              created_at: project.created_at,
              width: 400,
              height: 300,
              category: project.Category?.name || 'korea',
              userId: project.user_id,
            };
          })
        );

        if (reset) {
          setProjects(projectsWithUsers);
        } else {
          setProjects(prev => [...prev, ...projectsWithUsers]);
        }

        setHasMore(data.projects.length === 20);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('프로젝트 로딩 실패:', error);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [loading]);

  // 초기 로드
  useEffect(() => {
    loadProjects(1, true);
  }, []);

  // 무한 스크롤
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          const nextPage = page + 1;
          setPage(nextPage);
          loadProjects(nextPage);
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [hasMore, loading, page, loadProjects]);

  // 카테고리 필터링
  const filteredProjects = selectedCategory === "korea" || selectedCategory === "all"
    ? projects
    : projects.filter(project => project.category === selectedCategory);

  // 정렬 적용
  const sortedProjects = sortProjects(filteredProjects, sortBy);

  // 프로젝트 클릭 핸들러
  const handleProjectClick = (project: ImageDialogProps) => {
    setSelectedProject(project);
    setModalOpen(true);
  };

  // 프로젝트 업로드 핸들러
  const handleUploadClick = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert('프로젝트 등록을 위해 로그인이 필요합니다.');
      router.push('/login');
    } else {
      router.push('/project/upload');
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <main className="w-full">
        {/* 1. 메인 배너 */}
        <section className="w-full">
          <MainBanner loading={loading} gallery={[]} />
        </section>

        {/* 2. Sticky 카테고리 메뉴 */}
        <StickyMenu
          props={selectedCategory}
          onSetCategory={setSelectedCategory}
          onSetSort={setSortBy}
          currentSort={sortBy}
        />

        {/* 3. 프로젝트 그리드 */}
        <section className="w-full px-4 md:px-20 py-12">
          <div className="masonry-grid">
            {sortedProjects.map((project) => (
              <ImageCard
                key={project.id}
                props={project}
                onClick={() => handleProjectClick(project)}
              />
            ))}
          </div>

          {/* 무한 스크롤 트리거 */}
          {hasMore && (
            <div ref={observerTarget} className="h-20 flex items-center justify-center">
              {loading && (
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4ACAD4]"></div>
              )}
            </div>
          )}

          {/* 프로젝트가 없을 때 */}
          {!loading && sortedProjects.length === 0 && (
            <div className="text-center py-20">
              <p className="text-gray-500 text-lg mb-4">프로젝트가 없습니다.</p>
              <Button onClick={handleUploadClick} className="bg-[#4ACAD4] hover:bg-[#3db8c0]">
                첫 프로젝트 등록하기
              </Button>
            </div>
          )}
        </section>

        {/* 프로젝트 상세 모달 */}
        <ProjectDetailModalV2
          open={modalOpen}
          onOpenChange={setModalOpen}
          project={selectedProject}
        />

        {/* 4. 회원가입 및 로그인 유도 영역 */}
        {!isLoggedIn && (
          <section className="w-full bg-gradient-to-r from-[#4ACAD4] to-[#3db8c0] py-16 px-4 md:px-20">
            <div className="max-w-4xl mx-auto text-center text-white">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                크리에이터와 함께하세요
              </h2>
              <p className="text-lg md:text-xl mb-8 opacity-90">
                프로젝트를 공유하고, 영감을 받고, 함께 성장하세요
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/signup">
                  <Button
                    size="lg"
                    className="bg-white text-[#4ACAD4] hover:bg-gray-100 font-semibold px-8"
                  >
                    회원가입
                  </Button>
                </Link>
                <Link href="/login">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-2 border-white text-white hover:bg-white/10 font-semibold px-8"
                  >
                    로그인
                  </Button>
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* 5. 프로젝트 업로드 CTA */}
        <section className="w-full py-16 px-4 md:px-20 bg-gray-50">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
              당신의 작품을 공유하세요
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              전 세계 크리에이터들과 당신의 프로젝트를 공유하고 피드백을 받아보세요
            </p>
            <Button
              onClick={handleUploadClick}
              size="lg"
              className="bg-[#4ACAD4] hover:bg-[#3db8c0] font-semibold px-8"
            >
              프로젝트 등록하기
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}
