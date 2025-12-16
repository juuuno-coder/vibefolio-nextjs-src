"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, Folder, Upload, Settings, Grid, MessageSquare, Send, MessageCircle, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImageCard } from "@/components/ImageCard";
import { ProposalCard } from "@/components/ProposalCard";
import { CommentCard } from "@/components/CommentCard";
import { ProjectDetailModalV2 } from "@/components/ProjectDetailModalV2";
import { ProposalDetailModal } from "@/components/ProposalDetailModal";
import { supabase } from "@/lib/supabase/client";

export default function MyPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'projects' | 'likes' | 'collections' | 'proposals' | 'comments'>('projects');
  
  // Data States
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<any>(null);
  const [proposalModalOpen, setProposalModalOpen] = useState(false);
  
  // Stats
  const [stats, setStats] = useState({
    projects: 0,
    likes: 0,
    collections: 0,
    followers: 0,
    following: 0,
    proposals: 0
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

      // Auth user_metadata 조회 (기본)
      let profileData = {
        nickname: user.user_metadata?.nickname || user.email?.split('@')[0] || '사용자',
        email: user.email,
        profile_image_url: user.user_metadata?.profile_image_url || '/globe.svg',
      };

      // public.users 테이블에서 최신 프로필 정보 조회
      const { data: dbUser } = await (supabase
        .from('users') as any)
        .select('*')
        .eq('id', user.id)
        .single();

      if (dbUser) {
        profileData = {
          nickname: dbUser.nickname || profileData.nickname,
          email: dbUser.email || profileData.email,
          profile_image_url: dbUser.profile_image_url || profileData.profile_image_url,
        };
      }

      setUserProfile(profileData);

      // 통계 카운트 가져오기 (Promise.all로 병렬 처리)
      const [projectsCount, likesCount, collectionsCount, followersCount, followingCount, proposalsCount] = await Promise.all([
        supabase.from('Project').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('Like').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('Collection').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('Follow').select('*', { count: 'exact', head: true }).eq('following_id', user.id),
        supabase.from('Follow').select('*', { count: 'exact', head: true }).eq('follower_id', user.id),
        supabase.from('Proposal').select('*', { count: 'exact', head: true }).eq('receiver_id', user.id),
      ]);

      setStats({
        projects: projectsCount.count || 0,
        likes: likesCount.count || 0,
        collections: collectionsCount.count || 0,
        followers: followersCount.count || 0,
        following: followingCount.count || 0,
        proposals: proposalsCount.count || 0
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
        } else if (activeTab === 'collections') {
          // 컬렉션 - Collection과 CollectionItem(Project) 조회
          // NOTE: Supabase 조인 쿼리가 복잡하므로, 일단 컬렉션 목록을 가져온 후 각각의 대표 이미지를 가져오는 방식 사용 (혹은 fetch API 활용)
          const res = await fetch('/api/collections', {
            headers: {
              'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
            }
          });
          if (res.ok) {
            const result = await res.json();
             // 각 컬렉션의 프로젝트 미리보기 가져오기 (클라이언트 측에서)
            const collectionsWithProjects = await Promise.all(
              (result.collections || []).map(async (collection: any) => {
                const { data: items } = await supabase
                  .from('CollectionItem')
                  .select(`
                    Project (
                      thumbnail_url,
                      image_url
                    )
                  `)
                  .eq('collection_id', collection.collection_id)
                  .order('added_at', { ascending: false })
                  .limit(4) as any;

                const previews = items?.map((i: any) => i.Project?.thumbnail_url || i.Project?.image_url).filter(Boolean) || [];
                return { ...collection, previews };
              })
            );
            setProjects(collectionsWithProjects); // projects state 재활용 (타입이 any[]이므로)
            setLoading(false);
            return;
          } else {
             throw new Error("Failed to fetch collections");
          }
        } else if (activeTab === 'proposals') {
          // 받은 제안
          query = supabase
            .from('Proposal')
            .select('*')
            .eq('receiver_id', userId)
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

        if (activeTab === 'proposals') {
          // 제안은 그대로 사용
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
    <div className="w-full min-h-screen bg-gray-50 pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* 프로필 섹션 */}
        <div className="bg-white rounded-xl mb-6 border border-gray-100 shadow-sm overflow-hidden">
          {/* 커버 이미지 */}
          <div className="h-48 md:h-64 bg-gray-200 relative group">
            {userProfile?.cover_image_url ? (
               <img 
                 src={userProfile.cover_image_url} 
                 alt="Cover" 
                 className="w-full h-full object-cover"
               />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-[#4ACAD4] to-[#05BCC6]"></div>
            )}
             <div className="absolute inset-0 bg-black/10"></div>
          </div>
          
          {/* 프로필 정보 */}
          <div className="px-6 pb-6 md:px-8 md:pb-8">
            <div className="flex flex-col md:flex-row md:items-end -mt-12 md:-mt-16 mb-4 gap-4 md:gap-6">
               {/* 아바타 */}
              <div className="relative">
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-white shadow-lg bg-white">
                  <img 
                    src={userProfile?.profile_image_url || "/globe.svg"} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

               {/* 텍스트 정보 */}
               <div className="flex-1 pt-2 md:pt-0 md:pb-4">
                 <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{userProfile?.nickname || "사용자"}</h1>
                 <p className="text-gray-500 text-sm md:text-base">{userProfile?.email}</p>
               </div>

                {/* 설정 버튼 (우측 하단 정렬) */}
                <div className="md:pb-4">
                  <Button variant="outline" onClick={() => router.push('/mypage/profile')} className="w-full md:w-auto">
                    <Settings className="w-4 h-4 mr-2" />
                    프로필 설정
                  </Button>
                </div>
            </div>
            
            {/* 자기소개 */}
            <p className="text-gray-700 text-sm md:text-base max-w-3xl mb-6">
               {userProfile?.bio || `안녕하세요! 크리에이티브한 작품을 공유하는 ${userProfile?.nickname || "사용자"}입니다.`}
            </p>
            
            {/* 통계 */}
            <div className="flex gap-6 md:gap-8 pt-4 border-t border-gray-100">
              <div className="text-center md:text-left">
                <div className="text-xl md:text-2xl font-bold text-gray-900">{stats.projects}</div>
                <div className="text-xs md:text-sm text-gray-500">Projects</div>
              </div>
              <div className="text-center md:text-left">
                <div className="text-xl md:text-2xl font-bold text-gray-900">{stats.likes}</div>
                <div className="text-xs md:text-sm text-gray-500">Likes</div>
              </div>
              <div className="text-center md:text-left">
                <div className="text-xl md:text-2xl font-bold text-gray-900">{stats.collections}</div>
                <div className="text-xs md:text-sm text-gray-500">Collections</div>
              </div>
              <div className="text-center md:text-left">
                <div className="text-xl md:text-2xl font-bold text-gray-900">{stats.followers}</div>
                <div className="text-xs md:text-sm text-gray-500">Followers</div>
              </div>
              <div className="text-center md:text-left">
                <div className="text-xl md:text-2xl font-bold text-gray-900">{stats.following}</div>
                <div className="text-xs md:text-sm text-gray-500">Following</div>
              </div>
            </div>
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div className="flex border-b border-gray-200 mb-6 overflow-x-auto hide-scrollbar">
          <button
            onClick={() => setActiveTab('projects')}
            className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors relative whitespace-nowrap ${
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
            className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors relative whitespace-nowrap ${
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
            onClick={() => setActiveTab('collections')}
            className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors relative whitespace-nowrap ${
              activeTab === 'collections' ? 'text-blue-500' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Folder size={18} />
            컬렉션
            {activeTab === 'collections' && (
               <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('proposals')}
            className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors relative whitespace-nowrap ${
              activeTab === 'proposals' ? 'text-green-500' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Send size={18} />
            받은 제안
            {activeTab === 'proposals' && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-green-500" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('comments')}
            className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors relative whitespace-nowrap ${
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
            {(activeTab === 'projects' || activeTab === 'likes') && (
              projects.length > 0 ? (
                <div className="masonry-grid pb-12">
                  {projects.map((project: any) => (
                    <ImageCard 
                      key={project.id} 
                      props={project} 
                      onClick={() => {
                        setSelectedProject(project);
                        setModalOpen(true);
                      }}
                    />
                  ))}
                </div>
              ) : null
            )}

            {/* 컬렉션 탭 */}
             {activeTab === 'collections' && (
               projects.length > 0 ? (
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
                   {projects.map((collection: any) => (
                     <div 
                       key={collection.collection_id} 
                       className="group bg-white rounded-xl border border-gray-200 overflow-hidden cursor-pointer hover:shadow-lg transition-all"
                       onClick={() => router.push(`/mypage/collections/${collection.collection_id}`)}
                     >
                       <div className="aspect-[4/3] bg-gray-100 p-2 grid grid-cols-2 gap-1 relative">
                          {collection.previews && collection.previews.length > 0 ? (
                             <>
                               {collection.previews.slice(0, 4).map((url: string, idx: number) => (
                                 <img 
                                   key={idx} 
                                   src={url || '/placeholder.jpg'} 
                                   className={`w-full h-full object-cover rounded-sm ${collection.previews.length === 1 ? 'col-span-2 row-span-2' : ''} ${collection.previews.length === 2 && idx === 0 ? 'col-span-2' : ''} ${collection.previews.length === 3 && idx === 0 ? 'col-span-2' : ''}`}
                                   alt="preview"
                                 />
                               ))}
                             </>
                          ) : (
                             <div className="col-span-2 row-span-2 flex items-center justify-center text-gray-300">
                               <Folder size={48} />
                             </div>
                          )}
                       </div>
                       <div className="p-4">
                         <h3 className="font-bold text-gray-900 group-hover:text-[#4ACAD4] transition-colors">{collection.name}</h3>
                         <p className="text-sm text-gray-500 mt-1">{collection.description || "설명이 없습니다"}</p>
                         <div className="flex items-center gap-2 mt-3 text-xs text-gray-400">
                           <Folder size={12} />
                           {collection.previews?.length || 0} items
                         </div>
                       </div>
                     </div>
                   ))}
                 </div>
               ) : null
             )}

            {/* 받은 제안 탭 */}
            {activeTab === 'proposals' && (
              projects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-12">
                  {projects.map((item: any) => (
                    <ProposalCard 
                      key={item.proposal_id} 
                      proposal={item} 
                      type="received"
                      onClick={() => {
                        setSelectedProposal(item);
                        setProposalModalOpen(true);
                      }}
                    />
                  ))}
                </div>
              ) : null
            )}

            {/* 내가 쓴 댓글 탭 */}
            {activeTab === 'comments' && (
              projects.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 pb-12">
                  {projects.map((item: any) => (
                    <CommentCard 
                      key={item.comment_id} 
                      comment={item}
                      onClick={async () => {
                         if (item.Project) {
                           // ... (same as before)
                            const projectData = {
                              id: item.Project.project_id?.toString(),
                              title: item.Project.title,
                              urls: {
                                full: item.Project.thumbnail_url || '/placeholder.jpg',
                                regular: item.Project.thumbnail_url || '/placeholder.jpg'
                              },
                              user: {
                                username: userProfile?.nickname || 'Unknown',
                                profile_image: {
                                  small: userProfile?.profile_image_url || "/globe.svg",
                                  large: userProfile?.profile_image_url || "/globe.svg"
                                }
                              },
                              likes: 0,
                              views: 0,
                              description: item.Project.title,
                              alt_description: item.Project.title,
                              created_at: new Date().toISOString(),
                              width: 800,
                              height: 600,
                              userId: item.Project.user_id
                            };
                            setSelectedProject(projectData);
                            setModalOpen(true);
                         }
                      }}
                    />
                  ))}
                </div>
              ) : null
            )}

            {/* 빈 상태 */}
            {projects.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-gray-100 border-dashed">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              {activeTab === 'projects' && <Upload className="text-gray-300" />}
              {activeTab === 'likes' && <Heart className="text-gray-300" />}
              {activeTab === 'collections' && <Folder className="text-gray-300" />}
              {activeTab === 'proposals' && <Send className="text-gray-300" />}
              {activeTab === 'comments' && <MessageCircle className="text-gray-300" />}
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              {activeTab === 'projects' && "아직 업로드한 프로젝트가 없습니다"}
              {activeTab === 'likes' && "좋아요한 프로젝트가 없습니다"}
              {activeTab === 'collections' && "저장된 컬렉션이 없습니다"}
              {activeTab === 'proposals' && "받은 제안이 없습니다"}
              {activeTab === 'comments' && "작성한 댓글이 없습니다"}
            </h3>
            <p className="text-gray-500 mb-6">
              {activeTab === 'projects' && "멋진 작품을 공유해보세요!"}
              {(activeTab === 'likes' || activeTab === 'collections') && "마음에 드는 작품을 찾아보세요!"}
              {activeTab === 'proposals' && "제안을 확인해보세요!"}
              {activeTab === 'comments' && "프로젝트에 댓글을 남겨보세요!"}
            </p>
            {activeTab === 'projects' ? (
              <Button onClick={() => router.push('/project/upload')} className="bg-[#4ACAD4] hover:bg-[#3db8c0]">프로젝트 업로드</Button>
            ) : (
               activeTab === 'collections' ? (
                  <Button onClick={() => router.push('/')} variant="outline">둘러보기</Button> 
                  // TODO: 컬렉션 생성 기능이 필요할 수 있음
               ) : (
                  <Button onClick={() => router.push('/')} variant="outline">둘러보기</Button>
               )
            )}
          </div>
        )}
          </>
        )}
      </div>

      {/* 프로젝트 상세 모달 */}
      <ProjectDetailModalV2
        open={modalOpen}
        onOpenChange={setModalOpen}
        project={selectedProject}
      />

      {/* 제안 상세 모달 */}
      <ProposalDetailModal
        open={proposalModalOpen}
        onOpenChange={setProposalModalOpen}
        proposal={selectedProposal}
      />
    </div>
  );
}
