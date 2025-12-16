"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Heart, Folder, Upload, Settings, Grid, Send, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImageCard } from "@/components/ImageCard";
import { ProposalCard } from "@/components/ProposalCard";
import { CommentCard } from "@/components/CommentCard";
import { ProjectDetailModalV2 } from "@/components/ProjectDetailModalV2";
import { ProposalDetailModal } from "@/components/ProposalDetailModal";
import { supabase } from "@/lib/supabase/client";

// 탭 타입 정의
type TabType = 'projects' | 'likes' | 'collections' | 'proposals' | 'comments';

// 프로필 타입
interface UserProfile {
  nickname: string;
  email: string;
  profile_image_url: string;
  cover_image_url: string | null;
  bio: string;
}

// 통계 타입
interface Stats {
  projects: number;
  likes: number;
  collections: number;
  followers: number;
  following: number;
}

export default function MyPage() {
  const router = useRouter();
  
  // 기본 상태
  const [activeTab, setActiveTab] = useState<TabType>('projects');
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  
  // 프로필 및 통계
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<Stats>({
    projects: 0,
    likes: 0,
    collections: 0,
    followers: 0,
    following: 0
  });
  
  // 데이터 상태
  const [projects, setProjects] = useState<any[]>([]);
  const [collections, setCollections] = useState<any[]>([]);
  const [activeCollectionId, setActiveCollectionId] = useState<string | null>(null);
  
  // 모달 상태
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<any>(null);
  const [proposalModalOpen, setProposalModalOpen] = useState(false);

  // 초기 사용자 정보 로드
  useEffect(() => {
    const initUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error || !user) {
          router.push('/login');
          return;
        }
        
        setUserId(user.id);
        
        // 기본 프로필 데이터
        const defaultProfile: UserProfile = {
          nickname: user.user_metadata?.nickname || user.email?.split('@')[0] || '사용자',
          email: user.email || '',
          profile_image_url: '/globe.svg',
          cover_image_url: null,
          bio: '',
        };
        
        // DB에서 프로필 조회
        const { data: dbUser } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single() as any;
        
        if (dbUser) {
          setUserProfile({
            nickname: dbUser.nickname || defaultProfile.nickname,
            email: dbUser.email || defaultProfile.email,
            profile_image_url: dbUser.profile_image_url || defaultProfile.profile_image_url,
            cover_image_url: dbUser.cover_image_url || null,
            bio: dbUser.bio || '',
          });
        } else {
          setUserProfile(defaultProfile);
        }
        
        // 통계 로드
        await loadStats(user.id);
        
      } catch (err) {
        console.error('사용자 초기화 실패:', err);
        router.push('/login');
      } finally {
        setInitialLoading(false);
      }
    };
    
    initUser();
  }, [router]);

  // 통계 로드 함수
  const loadStats = async (uid: string) => {
    try {
      const [projectsRes, likesRes, collectionsRes, followersRes, followingRes] = await Promise.all([
        supabase.from('Project').select('*', { count: 'exact', head: true }).eq('user_id', uid),
        supabase.from('Like').select('*', { count: 'exact', head: true }).eq('user_id', uid),
        supabase.from('Collection').select('*', { count: 'exact', head: true }).eq('user_id', uid),
        supabase.from('Follow').select('*', { count: 'exact', head: true }).eq('following_id', uid),
        supabase.from('Follow').select('*', { count: 'exact', head: true }).eq('follower_id', uid),
      ]);
      
      setStats({
        projects: projectsRes.count || 0,
        likes: likesRes.count || 0,
        collections: collectionsRes.count || 0,
        followers: followersRes.count || 0,
        following: followingRes.count || 0,
      });
    } catch (err) {
      console.error('통계 로드 실패:', err);
    }
  };

  // 탭 데이터 로드 함수
  const loadTabData = useCallback(async () => {
    if (!userId) return;
    
    setLoading(true);
    
    try {
      if (activeTab === 'projects') {
        const { data, error } = await supabase
          .from('Project')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        const mapped = (data || []).map((item: any) => ({
          id: item.project_id,
          title: item.title,
          urls: {
            full: item.thumbnail_url || item.image_url || '/placeholder.jpg',
            regular: item.thumbnail_url || item.image_url || '/placeholder.jpg'
          },
          user: {
            username: userProfile?.nickname || 'Me',
            profile_image: {
              small: userProfile?.profile_image_url || '/globe.svg',
              large: userProfile?.profile_image_url || '/globe.svg'
            }
          },
          likes: item.likes_count || 0,
          views: item.views_count || 0,
          created_at: item.created_at
        }));
        
        setProjects(mapped);
        
      } else if (activeTab === 'likes') {
        const { data, error } = await supabase
          .from('Like')
          .select('*, Project(*)')
          .eq('user_id', userId)
          .order('created_at', { ascending: false }) as any;
        
        if (error) throw error;
        
        const mapped = (data || [])
          .filter((item: any) => item.Project)
          .map((item: any) => {
            const p = item.Project;
            return {
              id: p.project_id,
              title: p.title,
              urls: {
                full: p.thumbnail_url || '/placeholder.jpg',
                regular: p.thumbnail_url || '/placeholder.jpg'
              },
              user: {
                username: 'Creator',
                profile_image: { small: '/globe.svg', large: '/globe.svg' }
              },
              likes: p.likes_count || 0,
              views: p.views_count || 0,
            };
          });
        
        setProjects(mapped);
        
      } else if (activeTab === 'collections') {
        // 컬렉션 목록이 없으면 먼저 로드
        if (collections.length === 0) {
          const { data: colsData, error: colsError } = await supabase
            .from('Collection')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false }) as any;
          
          if (colsError) throw colsError;
          
          const cols = colsData || [];
          setCollections(cols);
          
          if (cols.length > 0 && !activeCollectionId) {
            setActiveCollectionId(cols[0].collection_id);
          }
          
          // 첫 번째 컬렉션의 아이템 로드
          if (cols.length > 0) {
            await loadCollectionItems(cols[0].collection_id);
          } else {
            setProjects([]);
          }
        } else if (activeCollectionId) {
          await loadCollectionItems(activeCollectionId);
        } else {
          setProjects([]);
        }
        
      } else if (activeTab === 'proposals') {
        const { data, error } = await supabase
          .from('Proposal')
          .select('*')
          .eq('receiver_id', userId)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        setProjects(data || []);
        
      } else if (activeTab === 'comments') {
        const { data, error } = await supabase
          .from('Comment')
          .select('*, Project(project_id, title, thumbnail_url)')
          .eq('user_id', userId)
          .order('created_at', { ascending: false }) as any;
        
        if (error) throw error;
        setProjects(data || []);
      }
      
    } catch (err) {
      console.error('탭 데이터 로드 실패:', err);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, [userId, activeTab, activeCollectionId, collections.length, userProfile]);

  // 컬렉션 아이템 로드
  const loadCollectionItems = async (collectionId: string) => {
    try {
      const { data, error } = await supabase
        .from('CollectionItem')
        .select('*, Project(*)')
        .eq('collection_id', collectionId)
        .order('added_at', { ascending: false }) as any;
      
      if (error) throw error;
      
      const mapped = (data || [])
        .filter((item: any) => item.Project)
        .map((item: any) => {
          const p = item.Project;
          return {
            id: p.project_id,
            title: p.title,
            urls: {
              full: p.thumbnail_url || '/placeholder.jpg',
              regular: p.thumbnail_url || '/placeholder.jpg'
            },
            user: {
              username: 'Creator',
              profile_image: { small: '/globe.svg', large: '/globe.svg' }
            },
            likes: p.likes_count || 0,
            views: p.views_count || 0,
          };
        });
      
      setProjects(mapped);
    } catch (err) {
      console.error('컬렉션 아이템 로드 실패:', err);
      setProjects([]);
    }
  };

  // 탭 변경 시 데이터 로드
  useEffect(() => {
    if (userId && !initialLoading) {
      loadTabData();
    }
  }, [userId, activeTab, initialLoading, loadTabData]);

  // 컬렉션 선택 변경 시
  useEffect(() => {
    if (activeTab === 'collections' && activeCollectionId && !initialLoading) {
      loadCollectionItems(activeCollectionId);
    }
  }, [activeCollectionId]);

  // 초기 로딩 화면
  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  // 탭 설정
  const tabs = [
    { id: 'projects' as TabType, label: '내 프로젝트', icon: Grid, color: 'text-primary', bgColor: 'bg-primary' },
    { id: 'likes' as TabType, label: '좋아요', icon: Heart, color: 'text-red-500', bgColor: 'bg-red-500' },
    { id: 'collections' as TabType, label: '컬렉션', icon: Folder, color: 'text-blue-500', bgColor: 'bg-blue-500' },
    { id: 'proposals' as TabType, label: '받은 제안', icon: Send, color: 'text-green-500', bgColor: 'bg-green-500' },
    { id: 'comments' as TabType, label: '내가 쓴 댓글', icon: MessageCircle, color: 'text-orange-500', bgColor: 'bg-orange-500' },
  ];

  return (
    <div className="w-full min-h-screen bg-gray-50 pt-20 pb-12">
      <div className="w-full max-w-[1400px] mx-auto px-4 md:px-8">
        
        {/* 프로필 섹션 */}
        <div className="bg-white rounded-xl mb-6 border border-gray-100 shadow-sm overflow-hidden">
          {/* 커버 이미지 */}
          <div className="h-40 md:h-56 bg-gradient-to-r from-[#4ACAD4] to-[#05BCC6] relative">
            {userProfile?.cover_image_url && (
              <img 
                src={userProfile.cover_image_url} 
                alt="Cover" 
                className="w-full h-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-black/5"></div>
          </div>
          
          {/* 프로필 정보 */}
          <div className="px-6 pb-6 md:px-8 md:pb-8">
            <div className="flex flex-col md:flex-row md:items-end -mt-12 md:-mt-16 mb-4 gap-4 md:gap-6">
              {/* 아바타 */}
              <div className="relative z-10 shrink-0">
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-white shadow-lg bg-white">
                  <img 
                    src={userProfile?.profile_image_url || '/globe.svg'} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = '/globe.svg'; }}
                  />
                </div>
              </div>

              {/* 사용자 정보 */}
              <div className="flex-1 md:pb-2">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                  {userProfile?.nickname || '사용자'}
                </h1>
                <p className="text-gray-500 text-sm md:text-base mt-1">
                  {userProfile?.email}
                </p>
              </div>

              {/* 설정 버튼 */}
              <div className="md:pb-2">
                <Button 
                  variant="outline" 
                  onClick={() => router.push('/mypage/profile')}
                  className="w-full md:w-auto"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  프로필 설정
                </Button>
              </div>
            </div>
            
            {/* 자기소개 */}
            {userProfile?.bio && (
              <p className="text-gray-700 text-sm md:text-base max-w-3xl mb-6">
                {userProfile.bio}
              </p>
            )}
            
            {/* 통계 */}
            <div className="flex gap-6 md:gap-10 pt-4 border-t border-gray-100">
              {[
                { label: 'Projects', value: stats.projects },
                { label: 'Likes', value: stats.likes },
                { label: 'Collections', value: stats.collections },
                { label: 'Followers', value: stats.followers },
                { label: 'Following', value: stats.following }
              ].map((stat) => (
                <div key={stat.label} className="text-center md:text-left">
                  <div className="text-lg md:text-xl font-bold text-gray-900">{stat.value}</div>
                  <div className="text-xs md:text-sm text-gray-500">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div className="flex border-b border-gray-200 mb-6 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  if (tab.id !== activeTab) {
                    setActiveTab(tab.id);
                    if (tab.id !== 'collections') {
                      setCollections([]);
                      setActiveCollectionId(null);
                    }
                  }
                }}
                className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors relative whitespace-nowrap ${
                  isActive ? tab.color : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <Icon size={18} fill={tab.id === 'likes' && isActive ? 'currentColor' : 'none'} />
                {tab.label}
                {isActive && (
                  <div className={`absolute bottom-0 left-0 w-full h-0.5 ${tab.bgColor}`} />
                )}
              </button>
            );
          })}
        </div>

        {/* 컬렉션 서브 탭 */}
        {activeTab === 'collections' && collections.length > 0 && (
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {collections.map((col: any) => (
              <button
                key={col.collection_id}
                onClick={() => setActiveCollectionId(col.collection_id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                  activeCollectionId === col.collection_id
                    ? 'bg-blue-500 text-white'
                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {col.name}
              </button>
            ))}
          </div>
        )}

        {/* 콘텐츠 영역 */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <>
            {/* 프로젝트/좋아요/컬렉션 탭 */}
            {(activeTab === 'projects' || activeTab === 'likes' || activeTab === 'collections') && (
              projects.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-12">
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
              ) : (
                <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-gray-200 border-dashed">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                    {activeTab === 'projects' && <Upload className="text-gray-300" size={24} />}
                    {activeTab === 'likes' && <Heart className="text-gray-300" size={24} />}
                    {activeTab === 'collections' && <Folder className="text-gray-300" size={24} />}
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {activeTab === 'projects' && '아직 업로드한 프로젝트가 없습니다'}
                    {activeTab === 'likes' && '좋아요한 프로젝트가 없습니다'}
                    {activeTab === 'collections' && '컬렉션이 비어있습니다'}
                  </h3>
                  {activeTab === 'projects' && (
                    <Button 
                      onClick={() => router.push('/project/upload')} 
                      className="mt-4 bg-[#4ACAD4] hover:bg-[#3ab8c2]"
                    >
                      프로젝트 업로드
                    </Button>
                  )}
                  {(activeTab === 'likes' || activeTab === 'collections') && (
                    <Button variant="outline" onClick={() => router.push('/')} className="mt-4">
                      둘러보기
                    </Button>
                  )}
                </div>
              )
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
              ) : (
                <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-gray-200 border-dashed">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                    <Send className="text-gray-300" size={24} />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">받은 제안이 없습니다</h3>
                </div>
              )
            )}

            {/* 내가 쓴 댓글 탭 */}
            {activeTab === 'comments' && (
              projects.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 pb-12">
                  {projects.map((item: any) => (
                    <CommentCard 
                      key={item.comment_id} 
                      comment={item}
                      onClick={() => {
                        if (item.Project) {
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
                                small: userProfile?.profile_image_url || '/globe.svg',
                                large: userProfile?.profile_image_url || '/globe.svg'
                              }
                            },
                            likes: 0,
                            views: 0,
                          };
                          setSelectedProject(projectData);
                          setModalOpen(true);
                        }
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-gray-200 border-dashed">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                    <MessageCircle className="text-gray-300" size={24} />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">작성한 댓글이 없습니다</h3>
                </div>
              )
            )}
          </>
        )}
      </div>

      {/* 모달들 */}
      <ProjectDetailModalV2
        open={modalOpen}
        onOpenChange={setModalOpen}
        project={selectedProject}
      />

      <ProposalDetailModal
        open={proposalModalOpen}
        onOpenChange={setProposalModalOpen}
        proposal={selectedProposal}
      />
    </div>
  );
}
