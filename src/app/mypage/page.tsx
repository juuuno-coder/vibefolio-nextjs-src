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
  const [collections, setCollections] = useState<any[]>([]);
  const [activeCollectionId, setActiveCollectionId] = useState<string | null>(null);

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
        cover_image_url: user.user_metadata?.cover_image_url || null,
        bio: user.user_metadata?.bio || '',
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
          cover_image_url: dbUser.cover_image_url || profileData.cover_image_url,
          bio: dbUser.bio || profileData.bio,
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
          
          const { data: result, error } = await query;
          if (error) throw error;
          
          const mappedData = result?.map((item: any) => ({
            id: item.project_id,
            title: item.title,
            urls: {
              full: item.thumbnail_url || item.image_url || "/placeholder.jpg",
              regular: item.thumbnail_url || item.image_url || "/placeholder.jpg"
            },
            user: { username: "Me", profile_image: { small: "/globe.svg", large: "/globe.svg" } },
            likes: item.likes_count || 0,
            views: item.views_count || 0,
            created_at: item.created_at
          })) || [];
          setProjects(mappedData);

        } else if (activeTab === 'likes') {
          // 좋아요한 프로젝트
          query = supabase
            .from('Like')
            .select('created_at, Project(*)')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

          const { data: result, error } = await query;
          if (error) throw error;

          const mappedData = result?.map((item: any) => {
             const p = item.Project;
             if (!p) return null;
             return {
                id: p.project_id,
                title: p.title,
                urls: { full: p.thumbnail_url, regular: p.thumbnail_url },
                user: { username: "Unknown", profile_image: { small: "/globe.svg", large: "/globe.svg" } },
                likes: p.likes_count,
                views: p.views_count,
             };
          }).filter(Boolean) || [];
          setProjects(mappedData);

        } else if (activeTab === 'collections') {
          // 1. 컬렉션 목록 조회
          if (collections.length === 0) {
             const { data: cols, error: colError } = await supabase
               .from('Collection')
               .select('*')
               .eq('user_id', userId)
               .order('created_at', { ascending: false });
             
             if (colError) throw colError;
             setCollections(cols || []);
             
             // 첫 진입 시 첫번째 컬렉션 선택
             if (cols && cols.length > 0 && !activeCollectionId) {
                setActiveCollectionId((cols[0] as any).collection_id);
             }
          }

          // 2. 선택된 컬렉션이 있으면 해당 아이템 조회
          let targetCollectionId = activeCollectionId;
          if (!targetCollectionId && collections.length > 0) {
              targetCollectionId = collections[0].collection_id;
              setActiveCollectionId(targetCollectionId);
          }

          if (targetCollectionId) {
             const { data: items, error: itemsError } = await supabase
               .from('CollectionItem')
               .select(`
                  Project (*)
               `)
               .eq('collection_id', targetCollectionId)
               .order('added_at', { ascending: false });
             
             if (itemsError) throw itemsError;

             const mappedData = items?.map((item: any) => {
                const p = item.Project;
                if (!p) return null;
                return {
                   id: p.project_id,
                   title: p.title,
                   urls: { full: p.thumbnail_url, regular: p.thumbnail_url },
                   user: { username: "Unknown", profile_image: { small: "/globe.svg", large: "/globe.svg" } },
                   likes: p.likes_count,
                   views: p.views_count,
                 };
             }).filter(Boolean) || [];
             setProjects(mappedData);
          } else {
             setProjects([]);
          }

        } else if (activeTab === 'proposals') {
           // ... (existing logic)
           query = supabase.from('Proposal').select('*').eq('receiver_id', userId).order('created_at', { ascending: false });
           const { data: result } = await query;
           setProjects(result || []);
        } else if (activeTab === 'comments') {
           // ... (existing logic)
           query = supabase.from('Comment').select('*, Project(project_id, title, thumbnail_url)').eq('user_id', userId).order('created_at', { ascending: false });
           const { data: result } = await query;
           setProjects(result || []);
        }

      } catch (e) {
        console.error("데이터 로딩 실패", e);
      } finally {
        setLoading(false);
      }
    };

    loadTabData();
  }, [activeTab, userId, activeCollectionId]); // activeCollectionId dependency added

  return (
    <div className="w-full min-h-screen bg-gray-50 pt-20 pb-12">
      <div className="w-full max-w-[1600px] mx-auto px-4 md:px-8">
        
        {/* 프로필 섹션 */}
        <div className="bg-white rounded-xl mb-6 border border-gray-100 shadow-sm overflow-hidden">
          {/* ... Cover Image logic same ... */}
          <div className="h-48 md:h-72 bg-gray-200 relative group">
            {userProfile?.cover_image_url ? (
               <img src={userProfile.cover_image_url} alt="Cover" className="w-full h-full object-cover"/>
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-[#4ACAD4] to-[#05BCC6]"></div>
            )}
             <div className="absolute inset-0 bg-black/10"></div>
          </div>
          
          <div className="px-6 pb-6 md:px-8 md:pb-8">
            <div className="flex flex-col md:flex-row md:items-end -mt-12 md:-mt-20 mb-6 gap-6">
              <div className="relative z-10 shrink-0">
                <div className="w-24 h-24 md:w-36 md:h-36 rounded-full overflow-hidden border-4 border-white shadow-lg bg-white box-content"> 
                   {/* box-content added to ensure border adds to size */}
                  <img 
                    src={userProfile?.profile_image_url || "/globe.svg"} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              {/* ... User Info ... */}
               <div className="flex-1 pt-2 md:pt-0 md:pb-2">
                 <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
                    {userProfile?.nickname || "사용자"}
                 </h1>
                 <p className="text-gray-500 text-sm md:text-base mt-1">{userProfile?.email}</p>
               </div>
                <div className="md:pb-2 flex-shrink-0 w-full md:w-auto mt-4 md:mt-0">
                  <Button variant="outline" onClick={() => router.push('/mypage/profile')} className="w-full md:w-auto">
                    <Settings className="w-4 h-4 mr-2" />
                    프로필 설정
                  </Button>
                </div>
            </div>
            {/* ... Bio & Stats ... */}
             <p className="text-gray-700 text-sm md:text-base max-w-3xl mb-8 leading-relaxed">
               {userProfile?.bio || `안녕하세요! 크리에이티브한 작품을 공유하는 ${userProfile?.nickname || "사용자"}입니다.`}
             </p>
            <div className="flex gap-8 md:gap-12 pt-6 border-t border-gray-100">
               {/* Stats Rendering */}
               {[
                 { label: 'Projects', value: stats.projects },
                 { label: 'Likes', value: stats.likes },
                 { label: 'Collections', value: stats.collections },
                 { label: 'Followers', value: stats.followers },
                 { label: 'Following', value: stats.following }
               ].map((stat) => (
                  <div key={stat.label} className="text-center md:text-left">
                    <div className="text-xl md:text-2xl font-bold text-gray-900">{stat.value}</div>
                    <div className="text-xs md:text-sm text-gray-500">{stat.label}</div>
                  </div>
               ))}
            </div>
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div className="flex border-b border-gray-200 mb-6 overflow-x-auto hide-scrollbar">
           {/* ... Main Tabs ... */}
          {['projects', 'likes', 'collections', 'proposals', 'comments'].map((tab) => (
             <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors relative whitespace-nowrap ${
                  activeTab === tab 
                    ? (tab === 'likes' ? 'text-red-500' : tab === 'collections' ? 'text-blue-500' : tab === 'proposals' ? 'text-green-500' : tab === 'comments' ? 'text-orange-500' : 'text-primary') 
                    : 'text-gray-500 hover:text-gray-900'
                }`}
             >
                {tab === 'projects' && <Grid size={18} />}
                {tab === 'likes' && <Heart size={18} fill={activeTab === 'likes' ? "currentColor" : "none"} />}
                {tab === 'collections' && <Folder size={18} />}
                {tab === 'proposals' && <Send size={18} />}
                {tab === 'comments' && <MessageCircle size={18} />}
                
                {tab === 'projects' && "내 프로젝트"}
                {tab === 'likes' && "좋아요"}
                {tab === 'collections' && "컬렉션"}
                {tab === 'proposals' && "받은 제안"}
                {tab === 'comments' && "내가 쓴 댓글"}

                {activeTab === tab && (
                  <div className={`absolute bottom-0 left-0 w-full h-0.5 ${
                    tab === 'likes' ? 'bg-red-500' : tab === 'collections' ? 'bg-blue-500' : tab === 'proposals' ? 'bg-green-500' : tab === 'comments' ? 'bg-orange-500' : 'bg-primary'
                  }`} />
                )}
             </button>
          ))}
        </div>

        {/* 컬렉션 서브 탭 (컬렉션 탭 선택 시에만 표시) */}
        {activeTab === 'collections' && collections.length > 0 && (
           <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              {collections.map((col) => (
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

        {/* 콘텐츠 그리드 */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <>
            {/* 프로젝트 & 좋아요 & 컬렉션 상세 탭 */}
            {(activeTab === 'projects' || activeTab === 'likes' || activeTab === 'collections') && (
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
            
            {/* ... Other tabs content (Proposals, Comments) ... */}
            {activeTab === 'proposals' && projects.length > 0 && (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-12">
                  {projects.map((item: any) => (
                    <ProposalCard 
                      key={item.proposal_id} 
                      proposal={item} 
                      type="received"
                      onClick={() => { setSelectedProposal(item); setProposalModalOpen(true); }}
                    />
                  ))}
               </div>
            )}

             {activeTab === 'comments' && projects.length > 0 && (
               <div className="grid grid-cols-1 gap-4 pb-12">
                  {projects.map((item: any) => (
                    <CommentCard 
                      key={item.comment_id} 
                      comment={item}
                      onClick={async () => { 
                         // ... logic
                      }}
                    />
                  ))}
               </div>
            )}

            {/* 빈 상태 */}
            {projects.length === 0 && (
               <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-gray-100 border-dashed">
                 {/* ... Empty state icons ... */}
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                     {activeTab === 'collections' ? <Folder className="text-gray-300"/> : <Upload className="text-gray-300"/>}
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">
                     {activeTab === 'collections' ? "이 컬렉션에 저장된 프로젝트가 없습니다" : "항목이 없습니다"}
                  </h3>
                   {activeTab === 'projects' && (
                     <Button onClick={() => router.push('/project/upload')} className="mt-4 bg-[#4ACAD4]">프로젝트 업로드</Button>
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
