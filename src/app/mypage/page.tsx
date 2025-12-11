"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, Bookmark, Upload, Settings, Grid, MessageSquare, Send, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImageCard } from "@/components/ImageCard";
import { supabase } from "@/lib/supabase/client";

export default function MyPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'projects' | 'likes' | 'bookmarks' | 'inquiries' | 'proposals' | 'comments'>('projects');
  
  // Data States
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Stats
  const [stats, setStats] = useState({
    projects: 0,
    likes: 0,
    bookmarks: 0
  });

  const [userProfile, setUserProfile] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // 초기 로드: 사용자 정보 및 통계
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUserId(user.id);

      // Auth user_metadata에서 프로필 가져오기
      setUserProfile({
        nickname: user.user_metadata?.nickname || user.email?.split('@')[0] || '사용자',
        email: user.email,
        profile_image_url: user.user_metadata?.profile_image_url || '/globe.svg',
      });

      // 통계 카운트 가져오기 (Promise.all로 병렬 처리)
      const [projectsCount, likesCount, bookmarksCount] = await Promise.all([
        supabase.from('Project').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('Like').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('Wishlist').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
      ]);

      setStats({
        projects: projectsCount.count || 0,
        likes: likesCount.count || 0,
        bookmarks: bookmarksCount.count || 0
      });
    };
    init();
  }, [router]);

  // 탭 변경 시 데이터 로드
  useEffect(() => {
    if (!userId) return;

    const loadTabData = async () => {
      setLoading(true);
      try {
        let data: any[] = [];
        let query;

        if (activeTab === 'projects') {
          // 내 프로젝트
          query = supabase
            .from('Project')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        } else if (activeTab === 'likes') {
          // 좋아요한 프로젝트
          query = supabase
            .from('Like')
            .select(`
              created_at,
              Project (*)
            `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        } else {
          // 북마크한 프로젝트
          query = supabase
            .from('Wishlist')
            .select(`
              created_at,
              Project (*)
            `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        }

        const { data: result, error } = await query;
        if (error) throw error;

        // 데이터 매핑 (일관된 Project 구조로 변환)
        const mappedData = result?.map((item: any) => {
          // Like/Wishlist는 Project 객체가 중첩되어 있음
          const p = activeTab === 'projects' ? item : item.Project;
          if (!p) return null; // 삭제된 프로젝트일 경우

          return {
            id: p.project_id,
            title: p.title,
            urls: {
              full: p.thumbnail_url || "https://images.unsplash.com/photo-1600607686527-6fb886090705?auto=format&fit=crop&q=80&w=2000",
              regular: p.thumbnail_url || "https://images.unsplash.com/photo-1600607686527-6fb886090705?auto=format&fit=crop&q=80&w=800"
            },
            user: {
              username: userProfile?.nickname || "Unknown",
              profile_image: {
                small: userProfile?.profile_image_url || "/globe.svg",
                large: userProfile?.profile_image_url || "/globe.svg"
              }
            },
            likes: p.likes || 0,
            views: p.views || 0,
            description: p.content_text,
            alt_description: p.title,
            created_at: p.created_at, // 정렬용
          };
        }).filter(Boolean) || [];

        setProjects(mappedData);
      } catch (e) {
        console.error("데이터 로딩 실패", e);
      } finally {
        setLoading(false);
      }
    };

    loadTabData();
  }, [activeTab, userId]);

  return (
    <div className="w-full min-h-screen bg-gray-50 pt-24">
      <div className="max-w-7xl mx-auto px-6 py-8">
        
        {/* 프로필 섹션 */}
        <div className="bg-white rounded-xl p-8 mb-8 border border-gray-100 shadow-sm flex flex-col md:flex-row items-center md:items-start gap-8">
          {/* 아바타 */}
          <div className="relative group">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg">
              <img 
                src={userProfile?.profile_image_url || "/globe.svg"} 
                alt="Profile" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          
          {/* 정보 */}
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{userProfile?.nickname || "사용자"}</h1>
            <p className="text-gray-500 mb-6">{userProfile?.email}</p>
            
            <div className="flex justify-center md:justify-start gap-8 text-center">
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.projects}</div>
                <div className="text-sm text-gray-500">Projects</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.likes}</div>
                <div className="text-sm text-gray-500">Likes</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.bookmarks}</div>
                <div className="text-sm text-gray-500">Bookmarks</div>
              </div>
            </div>
          </div>

          {/* 설정 버튼 */}
          <Button variant="outline" onClick={() => router.push('/mypage/profile')}>
            <Settings className="w-4 h-4 mr-2" />
            프로필 설정
          </Button>
        </div>

        {/* 탭 네비게이션 */}
        <div className="flex border-b border-gray-200 mb-8 overflow-x-auto">
          <button
            onClick={() => setActiveTab('projects')}
            className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors relative whitespace-nowrap ${
              activeTab === 'projects' ? 'text-primary' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Grid size={18} />
            내 프로젝트
            {activeTab === 'projects' && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('likes')}
            className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors relative whitespace-nowrap ${
              activeTab === 'likes' ? 'text-red-500' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Heart size={18} fill={activeTab === 'likes' ? "currentColor" : "none"} />
            좋아요
            {activeTab === 'likes' && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-red-500" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('bookmarks')}
            className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors relative whitespace-nowrap ${
              activeTab === 'bookmarks' ? 'text-blue-500' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Bookmark size={18} fill={activeTab === 'bookmarks' ? "currentColor" : "none"} />
            북마크
            {activeTab === 'bookmarks' && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500" />
            )}
          </button>
        </div>

        {/* 콘텐츠 그리드 */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : projects.length > 0 ? (
          <div className="masonry-grid pb-20">
            {projects.map((project: any) => (
              <ImageCard key={project.id} props={project} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-gray-100 border-dashed">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              {activeTab === 'projects' && <Upload className="text-gray-300" />}
              {activeTab === 'likes' && <Heart className="text-gray-300" />}
              {activeTab === 'bookmarks' && <Bookmark className="text-gray-300" />}
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              {activeTab === 'projects' && "아직 업로드한 프로젝트가 없습니다"}
              {activeTab === 'likes' && "좋아요한 프로젝트가 없습니다"}
              {activeTab === 'bookmarks' && "북마크한 프로젝트가 없습니다"}
            </h3>
            <p className="text-gray-500 mb-6">
              {activeTab === 'projects' && "멋진 작품을 공유해보세요!"}
              {(activeTab === 'likes' || activeTab === 'bookmarks') && "마음에 드는 작품을 찾아보세요!"}
            </p>
            {activeTab === 'projects' ? (
              <Button onClick={() => router.push('/project/upload')} className="bg-[#4ACAD4] hover:bg-[#3db8c0]">프로젝트 업로드</Button>
            ) : (
              <Button onClick={() => router.push('/')} variant="outline">둘러보기</Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
