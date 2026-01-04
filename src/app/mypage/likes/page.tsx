// src/app/mypage/likes/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImageCard } from "@/components/ImageCard";


interface Project {
  id: string;
  title?: string;
  urls: {
    full: string;
    regular: string;
  };
  user: {
    username: string;
    profile_image: {
      small: string;
      large: string;
    };
  };
  likes: number;
  views?: number;
  description: string | null;
  alt_description: string | null;
  created_at: string;
  width: number;
  height: number;
  category: string;
  tags?: string[];
}

import { supabase } from "@/lib/supabase/client";

// ... (interface는 그대로 사용하거나 필요시 수정, 여기서는 매핑 로직으로 해결)

export default function LikedProjectsPage() {
  const router = useRouter();
  const [likedProjects, setLikedProjects] = useState<Project[]>([]);
  const [totalLikes, setTotalLikes] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLikedProjects = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }

        const { data, count, error } = await supabase
          .from('Like')
          .select(`
            created_at,
            Project (
              project_id,
              title,
              content_text,
              thumbnail_url,
              views,
              views_count,
              likes,
              likes_count,
              created_at,
              category_id,
              users (
                nickname,
                profile_image_url
              )
            )
          `, { count: 'exact' })
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // 데이터 매핑
        const projects = data?.map((item: any) => {
          const p = item.Project;
          return {
            id: p.project_id,
            title: p.title,
            urls: {
              full: p.thumbnail_url || "https://images.unsplash.com/photo-1600607686527-6fb886090705?auto=format&fit=crop&q=80&w=2000",
              regular: p.thumbnail_url || "https://images.unsplash.com/photo-1600607686527-6fb886090705?auto=format&fit=crop&q=80&w=800"
            },
            user: {
              username: p.users?.nickname || "Unknown",
              profile_image: {
                small: p.users?.profile_image_url || "https://images.unsplash.com/placeholder-avatars/extra-large.jpg?auto=format&fit=crop&w=32&h=32&q=60",
                large: p.users?.profile_image_url || "https://images.unsplash.com/placeholder-avatars/extra-large.jpg?auto=format&fit=crop&w=150&h=150&q=60"
              }
            },
            likes: p.likes_count || p.likes || 0,
            views: p.views_count || p.views || 0,
            description: p.content_text,
            alt_description: p.title,
            created_at: p.created_at,
            width: 800, // 임시 값
            height: 600, // 임시 값
            category: "general", // 카테고리 매핑 필요 시 추가 로직
            tags: [] 
          };
        }) || [];

        setLikedProjects(projects);
        setTotalLikes(count || 0);
      } catch (error) {
        console.error("좋아요 목록 조회 실패:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLikedProjects();
  }, [router]);

  return (
    <div className="w-full min-h-screen bg-gray-50 pt-24">
      {/* 헤더 */}
      <div className="w-full bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="flex items-center gap-2 text-secondary hover:text-primary mb-4"
          >
            <ArrowLeft size={20} />
            뒤로 가기
          </Button>

          <div className="flex items-center gap-3 mb-2">
            <Heart size={32} className="text-red-500" fill="currentColor" />
            <h1 className="text-3xl md:text-4xl font-bold text-primary">
              좋아요한 프로젝트
            </h1>
          </div>
          <p className="text-secondary text-lg">
            총 {totalLikes}개의 프로젝트를 좋아요했습니다
          </p>
        </div>
      </div>

      {/* 프로젝트 그리드 */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
             <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
             </div>
        ) : likedProjects.length > 0 ? (
          <div className="masonry-grid">
            {likedProjects.map((project) => (
              <ImageCard key={project.id} props={project} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20">
            <Heart size={64} className="text-gray-300 mb-4" />
            <h2 className="text-2xl font-bold text-primary mb-2">
              좋아요한 프로젝트가 없습니다
            </h2>
            <p className="text-secondary mb-8">
              마음에 드는 프로젝트에 좋아요를 눌러보세요
            </p>
            <Button onClick={() => router.push("/")} className="btn-primary">
              프로젝트 둘러보기
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
