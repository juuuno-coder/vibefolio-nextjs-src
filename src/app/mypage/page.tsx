"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, Folder, Upload, Settings, Grid, Send, MessageCircle, Eye, Trash2, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImageCard } from "@/components/ImageCard";
import { ProposalCard } from "@/components/ProposalCard";
import { CommentCard } from "@/components/CommentCard";
import { ProjectDetailModalV2 } from "@/components/ProjectDetailModalV2";
import { ProposalDetailModal } from "@/components/ProposalDetailModal";
import { supabase } from "@/lib/supabase/client";

type TabType = 'projects' | 'likes' | 'collections' | 'proposals' | 'comments';

export default function MyPage() {
  const router = useRouter();
  
  // 기본 상태
  const [activeTab, setActiveTab] = useState<TabType>('projects');
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  
  // 프로필 및 통계
  const [userProfile, setUserProfile] = useState<any>(null);
  const [stats, setStats] = useState({ projects: 0, likes: 0, collections: 0, followers: 0, following: 0 });
  
  // 데이터 상태
  const [projects, setProjects] = useState<any[]>([]);
  const [collections, setCollections] = useState<any[]>([]);
  const [activeCollectionId, setActiveCollectionId] = useState<string | null>(null);
  
  // 모달 상태
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<any>(null);
  const [proposalModalOpen, setProposalModalOpen] = useState(false);

  // 1. 초기화 - 사용자 정보 로드
  useEffect(() => {
    const init = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          console.error("인증 실패:", authError);
          router.push('/login');
          return;
        }
        
        setUserId(user.id);
        
        // 프로필 정보 로드 (실패해도 진행)
        try {
          const { data } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();
            
          const dbUser = data as any;
          
          setUserProfile({
            nickname: dbUser?.nickname || user.user_metadata?.nickname || user.email?.split('@')[0] || '사용자',
            email: user.email,
            profile_image_url: dbUser?.profile_image_url || user.user_metadata?.profile_image_url || '/globe.svg',
            cover_image_url: dbUser?.cover_image_url || null,
            bio: dbUser?.bio || '',
          });
        } catch (e) {
          console.warn("프로필 로드 실패, 기본값 사용:", e);
          setUserProfile({
            nickname: user.user_metadata?.nickname || '사용자',
            email: user.email,
            profile_image_url: user.user_metadata?.profile_image_url || '/globe.svg',
            cover_image_url: null,
            bio: '',
          });
        }
        
        // 통계 로드 (실패해도 0으로 처리)
        try {
          const getCount = async (table: string, query: any) => {
            const { count, error } = await query;
            if (error) throw error;
            return count || 0;
          };

          const [p, l, c, fr, fg] = await Promise.all([
            getCount('Project', supabase.from('Project').select('*', { count: 'exact', head: true }).eq('user_id', user.id)),
            getCount('Like', supabase.from('Like').select('*', { count: 'exact', head: true }).eq('user_id', user.id)),
            getCount('Collection', supabase.from('Collection').select('*', { count: 'exact', head: true }).eq('user_id', user.id)),
            getCount('Follow', supabase.from('Follow').select('*', { count: 'exact', head: true }).eq('following_id', user.id)),
            getCount('Follow', supabase.from('Follow').select('*', { count: 'exact', head: true }).eq('follower_id', user.id)),
          ]);
          
          setStats({ projects: p, likes: l, collections: c, followers: fr, following: fg });
        } catch (e) {
          console.warn("통계 로드 실패:", e);
          // 실패 시 기존 0값 유지
        }
        
      } catch (err) {
        console.error('초기화 치명적 실패:', err);
      } finally {
        // 성공하든 실패하든 로딩 종료
        setInitialized(true);
      }
    };
    
    init();
  }, [router]);

  // 2. 탭 데이터 로드 - userId와 activeTab 변경 시에만
  useEffect(() => {
    if (!userId || !initialized) return;
    
    const loadData = async () => {
      setLoading(true);
      setProjects([]);
      
      try {
        if (activeTab === 'projects') {
          const { data } = await supabase
            .from('Project')
            .select('project_id, title, thumbnail_url, likes_count, views_count, created_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
          
          setProjects((data || []).map((p: any) => ({
            id: String(p.project_id),
            title: p.title || '제목 없음',
            thumbnail_url: p.thumbnail_url || '/placeholder.jpg',
            likes: p.likes_count || 0,
            views: p.views_count || 0,
            created_at: p.created_at,
          })));
          
        } else if (activeTab === 'likes') {
          const { data } = await supabase
            .from('Like')
            .select('*, Project(*)')
            .eq('user_id', userId)
            .order('created_at', { ascending: false }) as any;
          
          setProjects((data || []).filter((i: any) => i.Project).map((i: any) => ({
            id: String(i.Project.project_id),
            title: i.Project.title,
            urls: { full: i.Project.thumbnail_url || '/placeholder.jpg', regular: i.Project.thumbnail_url || '/placeholder.jpg' },
            user: { username: 'Creator', profile_image: { small: '/globe.svg', large: '/globe.svg' } },
            likes: i.Project.likes_count || 0,
            views: i.Project.views_count || 0,
          })));
          
        } else if (activeTab === 'collections') {
          // 컬렉션 목록 로드
          const { data: cols } = await supabase
            .from('Collection')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false }) as any;
          
          setCollections(cols || []);
          
          if (cols && cols.length > 0) {
            const firstId = cols[0].collection_id;
            setActiveCollectionId(firstId);
            
            // 첫 번째 컬렉션의 아이템 로드
            const { data: items } = await supabase
              .from('CollectionItem')
              .select('*, Project(*)')
              .eq('collection_id', firstId)
              .order('added_at', { ascending: false }) as any;
            
            setProjects((items || []).filter((i: any) => i.Project).map((i: any) => ({
              id: String(i.Project.project_id),
              title: i.Project.title,
              urls: { full: i.Project.thumbnail_url || '/placeholder.jpg', regular: i.Project.thumbnail_url || '/placeholder.jpg' },
              user: { username: 'Creator', profile_image: { small: '/globe.svg', large: '/globe.svg' } },
              likes: i.Project.likes_count || 0,
              views: i.Project.views_count || 0,
            })));
          } else {
            setProjects([]);
          }
          
        } else if (activeTab === 'proposals') {
          const { data } = await supabase
            .from('Proposal')
            .select('*')
            .eq('receiver_id', userId)
            .order('created_at', { ascending: false });
          
          setProjects(data || []);
          
        } else if (activeTab === 'comments') {
          const { data } = await supabase
            .from('Comment')
            .select('*, Project(project_id, title, thumbnail_url)')
            .eq('user_id', userId)
            .order('created_at', { ascending: false }) as any;
          
          setProjects(data || []);
        }
      } catch (err) {
        console.error('데이터 로드 실패:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [userId, activeTab, initialized]);

  // 3. 컬렉션 선택 변경 시 아이템 로드
  const handleCollectionChange = async (collectionId: string) => {
    if (collectionId === activeCollectionId) return;
    
    setActiveCollectionId(collectionId);
    setLoading(true);
    
    try {
      const { data: items } = await supabase
        .from('CollectionItem')
        .select('*, Project(*)')
        .eq('collection_id', collectionId)
        .order('added_at', { ascending: false }) as any;
      
      setProjects((items || []).filter((i: any) => i.Project).map((i: any) => ({
        id: String(i.Project.project_id),
        title: i.Project.title,
        urls: { full: i.Project.thumbnail_url || '/placeholder.jpg', regular: i.Project.thumbnail_url || '/placeholder.jpg' },
        user: { username: 'Creator', profile_image: { small: '/globe.svg', large: '/globe.svg' } },
        likes: i.Project.likes_count || 0,
        views: i.Project.views_count || 0,
      })));
    } catch (err) {
      console.error('컬렉션 아이템 로드 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  // 프로젝트 삭제
  const handleDeleteProject = async (projectId: string) => {
    if (!confirm("정말로 이 프로젝트를 삭제하시겠습니까?")) return;
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('로그인이 필요합니다.');
        return;
      }
      
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      
      if (!response.ok) throw new Error('삭제 실패');
      
      setProjects(prev => prev.filter(p => p.id !== projectId));
      setStats(prev => ({ ...prev, projects: prev.projects - 1 }));
      alert("프로젝트가 삭제되었습니다.");
    } catch (err) {
      alert("삭제에 실패했습니다.");
    }
  };
  
  // 커버 이미지 업로드
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    // 용량 제한 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("파일 크기는 5MB 이하여야 합니다.");
      return;
    }

    try {
      setLoading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `cover_${userId}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`; // profiles 버킷 루트에 저장

      // 1. Storage에 업로드
      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Public URL 가져오기
      const { data: { publicUrl } } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath);

      // 3. DB 업데이트
      const { error: updateError } = await supabase
        .from('users')
        .update({ cover_image_url: publicUrl } as any)
        .eq('id', userId);

      if (updateError) throw updateError;

      // 4. 상태 업데이트
      setUserProfile((prev: any) => ({ ...prev, cover_image_url: publicUrl }));
      alert("커버 이미지가 변경되었습니다.");
    } catch (error) {
      console.error('커버 이미지 업로드 실패:', error);
      alert("이미지 업로드에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 초기 로딩 화면
  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#4ACAD4]"></div>
      </div>
    );
  }

  const tabs = [
    { id: 'projects' as TabType, label: '내 프로젝트', icon: Grid, color: 'text-[#4ACAD4]', bgColor: 'bg-[#4ACAD4]' },
    { id: 'likes' as TabType, label: '좋아요', icon: Heart, color: 'text-red-500', bgColor: 'bg-red-500' },
    { id: 'collections' as TabType, label: '컬렉션', icon: Folder, color: 'text-blue-500', bgColor: 'bg-blue-500' },
    { id: 'proposals' as TabType, label: '받은 제안', icon: Send, color: 'text-green-500', bgColor: 'bg-green-500' },
    { id: 'comments' as TabType, label: '내 댓글', icon: MessageCircle, color: 'text-orange-500', bgColor: 'bg-orange-500' },
  ];

  return (
    <div className="w-full min-h-screen bg-gray-50 pt-20 pb-12">
      <div className="w-full max-w-[1400px] mx-auto px-4 md:px-8">
        
        {/* 프로필 섹션 */}
        {/* 프로필 섹션 */}
        <div className="bg-white rounded-xl mb-6 border border-gray-100 shadow-sm overflow-hidden">
          {/* 커버 이미지 (hover 시 변경 버튼 노출) */}
          <div className="h-40 md:h-56 bg-gradient-to-r from-[#4ACAD4] to-[#05BCC6] relative group">
            {userProfile?.cover_image_url && (
              <img src={userProfile.cover_image_url} alt="Cover" className="w-full h-full object-cover" />
            )}
            
            {/* 커버 변경 버튼 */}
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <label 
                htmlFor="cover-upload" 
                className="flex items-center gap-2 px-3 py-2 bg-black/50 hover:bg-black/70 text-white rounded-lg cursor-pointer text-sm font-medium backdrop-blur-sm transition-colors"
                role="button"
              >
                <Camera size={16} />
                배경 변경
              </label>
              <input 
                type="file" 
                id="cover-upload" 
                onChange={handleCoverUpload} 
                className="hidden" 
                accept="image/*"
              />
            </div>
          </div>
          
          <div className="px-6 pb-6 md:px-8 md:pb-8">
            <div className="flex flex-col md:flex-row md:items-end -mt-12 md:-mt-16 mb-4 gap-4 md:gap-6">
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
              {/* 패딩 추가 */}
              <div className="flex-1 md:pb-2 pt-16 md:pt-20 md:pl-8">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{userProfile?.nickname || '사용자'}</h1>
                <p className="text-gray-500 text-sm md:text-base mt-1">{userProfile?.email}</p>
              </div>
              <div className="md:pb-2">
                <Button variant="outline" onClick={() => router.push('/mypage/profile')} className="w-full md:w-auto">
                  <Settings className="w-4 h-4 mr-2" /> 프로필 설정
                </Button>
              </div>
            </div>
            
            {userProfile?.bio && <p className="text-gray-700 text-sm md:text-base max-w-3xl mb-6">{userProfile.bio}</p>}
            
            <div className="flex gap-6 md:gap-10 pt-4 border-t border-gray-100">
              {[
                { label: 'Projects', value: stats.projects },
                { label: 'Likes', value: stats.likes },
                { label: 'Collections', value: stats.collections },
                { label: 'Followers', value: stats.followers },
                { label: 'Following', value: stats.following }
              ].map((s) => (
                <div key={s.label} className="text-center md:text-left">
                  <div className="text-lg md:text-xl font-bold text-gray-900">{s.value}</div>
                  <div className="text-xs md:text-sm text-gray-500">{s.label}</div>
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
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors relative whitespace-nowrap ${isActive ? tab.color : 'text-gray-500 hover:text-gray-900'}`}
              >
                <Icon size={18} fill={tab.id === 'likes' && isActive ? 'currentColor' : 'none'} />
                {tab.label}
                {isActive && <div className={`absolute bottom-0 left-0 w-full h-0.5 ${tab.bgColor}`} />}
              </button>
            );
          })}
        </div>

        {/* 컬렉션 서브탭 */}
        {activeTab === 'collections' && collections.length > 0 && (
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {collections.map((col: any) => (
              <button
                key={col.collection_id}
                onClick={() => handleCollectionChange(col.collection_id)}
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
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4ACAD4]"></div>
          </div>
        ) : (
          <>
            {/* 내 프로젝트 탭 */}
            {activeTab === 'projects' && (
              projects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
                  {projects.map((project) => (
                    <div key={project.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow group">
                      <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
                        <img 
                          src={project.thumbnail_url || '/placeholder.jpg'}
                          alt={project.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.jpg'; }}
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                          <Button size="sm" variant="secondary" className="bg-white/90 hover:bg-white" onClick={() => router.push(`/project/${project.id}`)}>
                            <Eye className="w-4 h-4 mr-1" /> 보기
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDeleteProject(project.id)}>
                            <Trash2 className="w-4 h-4 mr-1" /> 삭제
                          </Button>
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900 truncate mb-2">{project.title}</h3>
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1"><Heart className="w-4 h-4 text-red-400" />{project.likes}</span>
                            <span className="flex items-center gap-1"><Eye className="w-4 h-4 text-blue-400" />{project.views}</span>
                          </div>
                          <span>{project.created_at ? new Date(project.created_at).toLocaleDateString('ko-KR') : ''}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-gray-200 border-dashed">
                  <Upload className="w-16 h-16 text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">아직 업로드한 프로젝트가 없습니다</h3>
                  <Button onClick={() => router.push('/project/upload')} className="mt-4 bg-[#4ACAD4] hover:bg-[#3ab8c2]">첫 프로젝트 업로드</Button>
                </div>
              )
            )}

            {/* 좋아요/컬렉션 탭 */}
            {(activeTab === 'likes' || activeTab === 'collections') && (
              projects.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-12">
                  {projects.map((project) => (
                    <ImageCard key={project.id} props={project} onClick={() => { setSelectedProject(project); setModalOpen(true); }} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-gray-200 border-dashed">
                  {activeTab === 'likes' ? <Heart className="w-16 h-16 text-gray-300 mb-4" /> : <Folder className="w-16 h-16 text-gray-300 mb-4" />}
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {activeTab === 'likes' ? '좋아요한 프로젝트가 없습니다' : '컬렉션이 비어있습니다'}
                  </h3>
                  <Button variant="outline" onClick={() => router.push('/')} className="mt-4">둘러보기</Button>
                </div>
              )
            )}

            {/* 받은 제안 탭 */}
            {activeTab === 'proposals' && (
              projects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-12">
                  {projects.map((item) => (
                    <ProposalCard key={item.proposal_id} proposal={item} type="received" onClick={() => { setSelectedProposal(item); setProposalModalOpen(true); }} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-gray-200 border-dashed">
                  <Send className="w-16 h-16 text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900">받은 제안이 없습니다</h3>
                </div>
              )
            )}

            {/* 내 댓글 탭 */}
            {activeTab === 'comments' && (
              projects.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 pb-12">
                  {projects.map((item) => (
                    <CommentCard 
                      key={item.comment_id} 
                      comment={item}
                      onClick={() => {
                        if (item.Project) {
                          setSelectedProject({
                            id: String(item.Project.project_id),
                            title: item.Project.title,
                            urls: { full: item.Project.thumbnail_url || '/placeholder.jpg', regular: item.Project.thumbnail_url || '/placeholder.jpg' },
                            user: { username: userProfile?.nickname || 'Unknown', profile_image: { small: '/globe.svg', large: '/globe.svg' } },
                            likes: 0, views: 0,
                          });
                          setModalOpen(true);
                        }
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-gray-200 border-dashed">
                  <MessageCircle className="w-16 h-16 text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900">작성한 댓글이 없습니다</h3>
                </div>
              )
            )}
          </>
        )}
      </div>

      {/* 모달 */}
      <ProjectDetailModalV2 open={modalOpen} onOpenChange={setModalOpen} project={selectedProject} />
      <ProposalDetailModal open={proposalModalOpen} onOpenChange={setProposalModalOpen} proposal={selectedProposal} />
    </div>
  );
}
