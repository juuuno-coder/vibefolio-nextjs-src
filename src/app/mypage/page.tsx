"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, Folder, Upload, Settings, Grid, MessageSquare, Send, MessageCircle, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImageCard } from "@/components/ImageCard";
import { ProposalCard } from "@/components/ProposalCard";
import { CommentCard } from "@/components/CommentCard";
import { supabase } from "@/lib/supabase/client";

export default function MyPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'projects' | 'likes' | 'collections' | 'inquiries' | 'proposals' | 'comments'>('projects');
  
  // Data States
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Stats
  const [stats, setStats] = useState({
    projects: 0,
    likes: 0,
    collections: 0,
    followers: 0,
    following: 0
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
      const [projectsCount, likesCount, collectionsCount, followersCount, followingCount] = await Promise.all([
        supabase.from('Project').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('Like').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('Collection').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('Follow').select('*', { count: 'exact', head: true }).eq('following_id', user.id),
        supabase.from('Follow').select('*', { count: 'exact', head: true }).eq('follower_id', user.id),
      ]);

      setStats({
        projects: projectsCount.count || 0,
        likes: likesCount.count || 0,
        collections: collectionsCount.count || 0,
        followers: followersCount.count || 0,
        following: followingCount.count || 0
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
        } else if (activeTab === 'inquiries') {
          // 1:1 문의 (받은 문의)
          query = supabase
            .from('Proposal')
            .select('*')
            .eq('receiver_id', userId)
            .order('created_at', { ascending: false });
        } else if (activeTab === 'proposals') {
          // 제안하기 (보낸 제안)
          query = supabase
            .from('Proposal')
            .select('*')
            .eq('sender_id', userId)
            .order('created_at', { ascending: false });
        } else if (activeTab === 'comments') {
          // 내가 쓴 댓글
          query = supabase
            .from('Comment')
            .select(`
              *,
              Project (
                project_id,
                title,
                thumbnail_url
              )
            `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        } else {
          // 기본값 (빈 배열)
          setProjects([]);
          setLoading(false);
          return;
        }

        const { data: result, error } = await query;
        if (error) throw error;

        // 데이터 매핑
        let mappedData;

        if (activeTab === 'inquiries' || activeTab === 'proposals') {
          // 제안/문의는 그대로 사용
          mappedData = result || [];
        } else if (activeTab === 'comments') {
          // 댓글도 그대로 사용
          mappedData = result || [];
        } else {
          // 프로젝트/좋아요는 ImageCard 형식으로 변환
          mappedData = result?.map((item: any) => {
            const p = activeTab === 'projects' ? item : item.Project;
            if (!p) return null;

            return {
              id: p.project_id,
              title: p.title,
              urls: {
                full: p.thumbnail_url || p.image_url || "https://images.unsplash.com/photo-1600607686527-6fb886090705?auto=format&fit=crop&q=80&w=2000",
                regular: p.thumbnail_url || p.image_url || "https://images.unsplash.com/photo-1600607686527-6fb886090705?auto=format&fit=crop&q=80&w=800"
              },
              user: {
                username: userProfile?.nickname || "Unknown",
                profile_image: {
                  small: userProfile?.profile_image_url || "/globe.svg",
                  large: userProfile?.profile_image_url || "/globe.svg"
                }
              },
              likes: p.likes_count || p.likes || 0,
              views: p.views_count || p.views || 0,
              description: p.content_text,
              alt_description: p.title,
              created_at: p.created_at,
            };
          }).filter(Boolean) || [];
        }

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
        <div className="bg-white rounded-xl mb-8 border border-gray-100 shadow-sm overflow-hidden">
          {/* 커버 이미지 */}
          <div className="h-48 bg-gradient-to-r from-[#4ACAD4] to-[#05BCC6] relative">
            <div className="absolute inset-0 bg-black/10"></div>
          </div>
          
          {/* 프로필 정보 */}
          <div className="px-8 pb-8">
            {/* 아바타 (커버 이미지와 겹치게) */}
            <div className="relative -mt-16 mb-4">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg bg-white">
                <img 
                  src={userProfile?.profile_image_url || "/globe.svg"} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            
            {/* 정보 */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{userProfile?.nickname || "사용자"}</h1>
                <p className="text-gray-500 mb-4">{userProfile?.email}</p>
                
                {/* 자기소개 (추후 추가 가능) */}
                <p className="text-gray-700 text-sm max-w-2xl">
                  안녕하세요! 크리에이티브한 작품을 공유하는 {userProfile?.nickname || "사용자"}입니다.
                </p>
              </div>
              
              <Button variant="outline" onClick={() => router.push('/mypage/profile')}>
                <Settings className="w-4 h-4 mr-2" />
                프로필 설정
              </Button>
            </div>
            
            {/* 통계 */}
            <div className="flex gap-8 pt-6 border-t border-gray-100">
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.projects}</div>
                <div className="text-sm text-gray-500">Projects</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.likes}</div>
                <div className="text-sm text-gray-500">Likes</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.collections}</div>
                <div className="text-sm text-gray-500">Collections</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.followers}</div>
                <div className="text-sm text-gray-500">Followers</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.following}</div>
                <div className="text-sm text-gray-500">Following</div>
              </div>
            </div>
          </div>
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
            onClick={() => router.push('/mypage/collections')}
            className="flex items-center gap-2 px-6 py-4 font-medium transition-colors relative whitespace-nowrap text-gray-500 hover:text-gray-900"
          >
            <Folder size={18} />
            컬렉션
          </button>
          <button
            onClick={() => setActiveTab('inquiries')}
            className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors relative whitespace-nowrap ${
              activeTab === 'inquiries' ? 'text-purple-500' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <MessageSquare size={18} />
            1:1 문의
            {activeTab === 'inquiries' && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-purple-500" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('proposals')}
            className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors relative whitespace-nowrap ${
              activeTab === 'proposals' ? 'text-green-500' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Send size={18} />
            제안하기
            {activeTab === 'proposals' && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-green-500" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('comments')}
            className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors relative whitespace-nowrap ${
              activeTab === 'comments' ? 'text-orange-500' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <MessageCircle size={18} />
            내가 쓴 댓글
            {activeTab === 'comments' && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-orange-500" />
            )}
          </button>
        </div>


        {/* 콘텐츠 그리드 */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <>
            {/* 프로젝트 & 좋아요 탭 */}
            {(activeTab === 'projects' || activeTab === 'likes') && projects.length > 0 && (
              <div className="masonry-grid pb-20">
                {projects.map((project: any) => (
                  <ImageCard key={project.id} props={project} />
                ))}
              </div>
            )}

            {/* 1:1 문의 탭 */}
            {activeTab === 'inquiries' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-20">
                {projects.map((item: any) => (
                  <ProposalCard 
                    key={item.proposal_id} 
                    proposal={item} 
                    type="received"
                  />
                ))}
              </div>
            )}

            {/* 제안하기 탭 */}
            {activeTab === 'proposals' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-20">
                {projects.map((item: any) => (
                  <ProposalCard 
                    key={item.proposal_id} 
                    proposal={item} 
                    type="sent"
                  />
                ))}
              </div>
            )}

            {/* 내가 쓴 댓글 탭 */}
            {activeTab === 'comments' && (
              <div className="grid grid-cols-1 gap-4 pb-20">
                {projects.map((item: any) => (
                  <CommentCard 
                    key={item.comment_id} 
                    comment={item}
                  />
                ))}
              </div>
            )}

            {/* 빈 상태 */}
            {projects.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-gray-100 border-dashed">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              {activeTab === 'projects' && <Upload className="text-gray-300" />}
              {activeTab === 'likes' && <Heart className="text-gray-300" />}
              {activeTab === 'collections' && <Folder className="text-gray-300" />}
              {activeTab === 'inquiries' && <MessageSquare className="text-gray-300" />}
              {activeTab === 'proposals' && <Send className="text-gray-300" />}
              {activeTab === 'comments' && <MessageCircle className="text-gray-300" />}
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              {activeTab === 'projects' && "아직 업로드한 프로젝트가 없습니다"}
              {activeTab === 'likes' && "좋아요한 프로젝트가 없습니다"}
              {activeTab === 'collections' && "저장된 컬렉션이 없습니다"}
              {activeTab === 'inquiries' && "받은 문의가 없습니다"}
              {activeTab === 'proposals' && "보낸 제안이 없습니다"}
              {activeTab === 'comments' && "작성한 댓글이 없습니다"}
            </h3>
            <p className="text-gray-500 mb-6">
              {activeTab === 'projects' && "멋진 작품을 공유해보세요!"}
              {(activeTab === 'likes' || activeTab === 'collections') && "마음에 드는 작품을 찾아보세요!"}
              {activeTab === 'inquiries' && "다른 크리에이터들과 소통해보세요!"}
              {activeTab === 'proposals' && "프로젝트에 제안을 보내보세요!"}
              {activeTab === 'comments' && "프로젝트에 댓글을 남겨보세요!"}
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
