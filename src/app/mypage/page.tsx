"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, Folder, Upload, Settings, Grid, Send, MessageCircle, Eye, Trash2, Camera, UserMinus, AlertTriangle, Loader2, Plus, Edit, Rocket, Sparkles, Wand2, Lightbulb, Zap, UserCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImageCard } from "@/components/ImageCard";
import { ProposalCard } from "@/components/ProposalCard";
import { CommentCard } from "@/components/CommentCard";
import { ProjectDetailModalV2 } from "@/components/ProjectDetailModalV2";
import { ProposalDetailModal } from "@/components/ProposalDetailModal";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type TabType = 'projects' | 'likes' | 'collections' | 'proposals' | 'comments' | 'ai_tools';
type AiToolType = 'lean-canvas' | 'persona' | 'assistant';
import { LeanCanvasModal } from "@/components/LeanCanvasModal";
import { PersonaDefinitionModal } from "@/components/PersonaDefinitionModal";

export default function MyPage() {
  const router = useRouter();
  
  // 기본 상태
  const [activeTab, setActiveTab] = useState<TabType>('projects');
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [activeAiTool, setActiveAiTool] = useState<AiToolType>('lean-canvas');
  
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
  
  // AI 도구 모달 상태
  const [leanModalOpen, setLeanModalOpen] = useState(false);
  const [personaModalOpen, setPersonaModalOpen] = useState(false);
  
  // 회원탈퇴 관련 상태
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const { user: authUser, userProfile: authProfile, loading: authLoading } = useAuth();
  
  // 1. 초기화 - 사용자 정보 및 통계 로드
  useEffect(() => {
    if (authLoading) return;
    if (!authUser) {
      router.push('/login');
      return;
    }

    const initStats = async () => {
      setUserId(authUser.id);
      
      // 기존에 로드된 프로필이 있으면 즉시 연동하고 추가 정보 로드
      if (authProfile) {
        // ... (existing)
      }
      
      try {
        const { data: dbProfile } = await supabase
          .from('profiles')
          .select('username, nickname, bio, cover_image_url')
          .eq('id', authUser.id)
          .single();

        setUserProfile({
          username: (dbProfile as any)?.nickname || (dbProfile as any)?.username || authProfile?.username || (authProfile as any)?.full_name || '사용자',
          email: authUser.email,
          profile_image_url: authProfile?.profile_image_url || '/globe.svg',
          role: authProfile?.role || 'user',
          bio: (dbProfile as any)?.bio || '',
          cover_image_url: (dbProfile as any)?.cover_image_url || null,
        });
        // 통계 로드 최적화: head: true를 써서 데이터 본문 없이 카운트만 가져옴
        const getCount = async (query: any) => {
          const { count, error } = await query;
          return error ? 0 : (count || 0);
        };

        const [p, l, c, fr, fg] = await Promise.all([
          getCount(supabase.from('Project').select('*', { count: 'exact', head: true }).eq('user_id', authUser.id)),
          getCount(supabase.from('Like').select('*', { count: 'exact', head: true }).eq('user_id', authUser.id)),
          getCount(supabase.from('Collection').select('*', { count: 'exact', head: true }).eq('user_id', authUser.id)),
          getCount(supabase.from('Follow').select('*', { count: 'exact', head: true }).eq('following_id', authUser.id)),
          getCount(supabase.from('Follow').select('*', { count: 'exact', head: true }).eq('follower_id', authUser.id)),
        ]);
        
        setStats({ projects: p, likes: l, collections: c, followers: fr, following: fg });
      } catch (e) {
        console.warn("통계 로드 실패:", e);
      } finally {
        setInitialized(true);
      }
    };
    
    initStats();
  }, [authUser, authProfile, authLoading, router]);

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
            .select('project_id, title, thumbnail_url, likes_count, views_count, created_at, content_text, rendering_type, custom_data')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
          
          setProjects((data || []).map((p: any) => ({
            id: String(p.project_id),
            title: p.title || '제목 없음',
            thumbnail_url: p.thumbnail_url || '/placeholder.jpg',
            likes: p.likes_count || 0,
            views: p.views_count || 0,
            created_at: p.created_at,
            description: p.content_text || '',
            rendering_type: p.rendering_type || 'image',
            alt_description: p.title || '',
            custom_data: p.custom_data,
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
      const { error: updateError } = await (supabase
        .from('profiles') as any)
        .update({ cover_image_url: publicUrl })
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

  // 회원탈퇴 처리
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "회원탈퇴") {
      alert("'회원탈퇴'를 정확히 입력해주세요.");
      return;
    }

    setIsDeleting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('로그인이 필요합니다.');
        return;
      }

      const response = await fetch('/api/auth/delete-account', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '회원탈퇴에 실패했습니다.');
      }

      // 로그아웃 처리
      await supabase.auth.signOut();
      
      alert('계정이 성공적으로 삭제되었습니다. 이용해주셔서 감사합니다.');
      router.push('/');
      
    } catch (error) {
      console.error('회원탈퇴 실패:', error);
      alert(error instanceof Error ? error.message : '회원탈퇴에 실패했습니다.');
    } finally {
      setIsDeleting(false);
      setDeleteModalOpen(false);
      setDeleteConfirmText("");
    }
  };

  // 초기 로딩 화면
  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const tabs = [
    { id: 'projects' as TabType, label: '내 프로젝트', icon: Grid, color: 'text-green-600', bgColor: 'bg-green-600' },
    { id: 'likes' as TabType, label: '좋아요', icon: Heart, color: 'text-red-500', bgColor: 'bg-red-500' },
    { id: 'collections' as TabType, label: '컬렉션', icon: Folder, color: 'text-blue-500', bgColor: 'bg-blue-500' },
    { id: 'proposals' as TabType, label: '받은 제안', icon: Send, color: 'text-green-500', bgColor: 'bg-green-500' },
    { id: 'comments' as TabType, label: '내 댓글', icon: MessageCircle, color: 'text-orange-500', bgColor: 'bg-orange-500' },
    { id: 'ai_tools' as TabType, label: 'AI 도구', icon: Sparkles, color: 'text-purple-600', bgColor: 'bg-purple-600', isNew: true },
  ];

  return (
    <div className="w-full min-h-screen bg-gray-50 pt-20 pb-12">
      <div className="w-full max-w-[1400px] mx-auto px-4 md:px-8">
        
        {/* 프로필 섹션 */}
        {/* 프로필 섹션 */}
        <div className="bg-white rounded-xl mb-6 border border-gray-100 shadow-sm overflow-hidden">
          {/* 커버 이미지 (hover 시 변경 버튼 노출) */}
          <div className="h-40 md:h-56 bg-gradient-to-r from-green-500 to-green-600 relative group">
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
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{userProfile?.username || '사용자'}</h1>
                <p className="text-gray-500 text-sm md:text-base mt-1">{userProfile?.email}</p>
              </div>
              <div className="md:pb-2 flex gap-2">
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
                {tab.isNew && (
                  <span className="ml-1.5 px-1.5 py-0.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[8px] font-black rounded-full shadow-sm animate-pulse">
                    NEW
                  </span>
                )}
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
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        ) : (
          <>
            {/* 내 프로젝트 탭 */}
            {activeTab === 'projects' && (
              projects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
                  {/* 프로젝트 등록 카드 */}
                  <div 
                    onClick={() => router.push('/project/upload')}
                    className="bg-white rounded-xl border-2 border-dashed border-gray-200 hover:border-green-400 overflow-hidden hover:shadow-lg transition-all cursor-pointer group flex flex-col items-center justify-center min-h-[280px]"
                  >
                    <div className="w-16 h-16 rounded-full bg-gray-50 group-hover:bg-green-50 flex items-center justify-center mb-4 transition-colors">
                      <Plus className="w-8 h-8 text-gray-300 group-hover:text-green-500 transition-colors" />
                    </div>
                    <p className="text-gray-400 group-hover:text-green-600 font-medium transition-colors">새 프로젝트 등록</p>
                  </div>
                  
                  {projects.map((project) => (
                    <div key={project.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow group">
                      <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
                        <img 
                          src={project.thumbnail_url || '/placeholder.jpg'}
                          alt={project.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.jpg'; }}
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 px-2">
                          <Button size="sm" variant="secondary" className="bg-white/90 hover:bg-white h-9 px-3 text-xs" onClick={() => {
                             setSelectedProject({
                               ...project,
                               userId: userId,
                               urls: { full: project.thumbnail_url, regular: project.thumbnail_url },
                               user: {
                                 username: userProfile?.username || 'User',
                                 profile_image: { small: userProfile?.profile_image_url || '/globe.svg', large: userProfile?.profile_image_url || '/globe.svg' }
                               }
                             });
                             setModalOpen(true);
                          }}>
                            <Eye className="w-3.5 h-3.5 mr-1" /> 보기
                          </Button>
                          <Button size="sm" variant="secondary" className="bg-white/90 hover:bg-white h-9 px-3 text-xs" onClick={() => router.push(`/project/upload?edit=${project.id}`)}>
                            <Edit className="w-3.5 h-3.5 mr-1" /> 수정
                          </Button>
                          <Button size="sm" variant="secondary" className="bg-indigo-600 hover:bg-indigo-700 text-white border-0 h-9 px-3 text-xs" onClick={() => router.push(`/project/upload?mode=version&projectId=${project.id}`)}>
                            <Rocket className="w-3.5 h-3.5 mr-1" /> 새 에피소드
                          </Button>
                          <Button size="sm" variant="destructive" className="h-9 px-3 text-xs" onClick={() => handleDeleteProject(project.id)}>
                            <Trash2 className="w-3.5 h-3.5 mr-1" /> 삭제
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
                <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-dashed border-gray-200 relative overflow-hidden group hover:border-[#6A5ACD]/30 transition-colors">
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#6A5ACD]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <div className="w-24 h-24 rounded-full bg-gray-50 flex items-center justify-center mb-6 relative z-10 group-hover:scale-110 transition-transform duration-300">
                    <div className="absolute inset-0 bg-[#6A5ACD] rounded-full animate-ping opacity-10" />
                    <Upload className="w-10 h-10 text-[#6A5ACD]" />
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-2 z-10">아직 캔버스가 비어있어요</h3>
                  <p className="text-gray-500 text-sm mb-8 z-10 text-center max-w-sm px-4 leading-relaxed">
                    첫 번째 프로젝트를 업로드하고<br/>당신의 크리에이티브를 전 세계에 공유해보세요! 🎨
                  </p>
                  
                  <Button onClick={() => router.push('/project/upload')} className="btn-primary z-10 rounded-full px-8 py-6 text-base shadow-lg shadow-[#6A5ACD]/20">
                    첫 프로젝트 시작하기
                  </Button>
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
                            user: { username: userProfile?.username || 'Unknown', profile_image: { small: '/globe.svg', large: '/globe.svg' } },
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

            {/* AI 도구 탭 */}
            {activeTab === 'ai_tools' && (
              <div className="flex flex-col md:flex-row gap-8 min-h-[600px] animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* 왼쪽 사이드 탭 */}
                <div className="w-full md:w-64 shrink-0 flex flex-col gap-2">
                  {[
                    { id: 'lean-canvas', label: 'AI 린 캔버스', icon: Grid, desc: '사업 모델 구조화' },
                    { id: 'persona', label: 'AI 고객 페르소나', icon: UserCircle2, desc: '고객 정의 및 분석' },
                    { id: 'assistant', label: 'AI 콘텐츠 어시스턴트', icon: Wand2, desc: '텍스트 생성 및 다듬기' },
                  ].map((tool) => (
                    <button
                      key={tool.id}
                      onClick={() => setActiveAiTool(tool.id as AiToolType)}
                      className={`flex items-start gap-4 p-4 rounded-2xl transition-all text-left group ${
                        activeAiTool === tool.id 
                          ? 'bg-white border-2 border-purple-100 shadow-md ring-4 ring-purple-50/50' 
                          : 'hover:bg-white/50 border-2 border-transparent text-gray-500'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                        activeAiTool === tool.id ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-400 group-hover:bg-purple-50 group-hover:text-purple-500'
                      }`}>
                        {/* icon이 string이 아니라 컴포넌트임 */}
                        <tool.icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className={`font-bold text-sm ${activeAiTool === tool.id ? 'text-gray-900' : 'text-gray-600'}`}>{tool.label}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5 truncate">{tool.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>

                {/* 오른쪽 콘텐츠 영역 */}
                <div className="flex-1 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-8 md:p-12 relative overflow-hidden group">
                  {/* Futuristic Background Decor */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-purple-50 rounded-full blur-3xl opacity-20 -mr-32 -mt-32 transition-all group-hover:opacity-40" />
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl opacity-20 -ml-16 -mb-16 transition-all group-hover:opacity-40" />
                  
                  <div className="relative z-10 flex flex-col items-center justify-center h-full text-center max-w-xl mx-auto space-y-6 py-20">
                    <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-purple-200 animate-bounce-slow">
                      <Sparkles className="w-10 h-10" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-gray-900 mb-3 tracking-tight">
                        {activeAiTool === 'lean-canvas' && "AI 린 캔버스 생성기"}
                        {activeAiTool === 'persona' && "AI 고객 페르소나 정의"}
                        {activeAiTool === 'assistant' && "AI 콘텐츠 어시스턴트"}
                      </h3>
                      <p className="text-gray-500 leading-relaxed font-medium">
                        {activeAiTool === 'lean-canvas' && "아이디어 입력만으로 비즈니스 모델을 한눈에 구조화하세요.\n스타트업과 1인 창업가를 위한 필수 도구입니다."}
                        {activeAiTool === 'persona' && "우리 서비스의 핵심 고객은 누구일까요?\n가상 페르소나를 정의하고 니즈를 파악해보세요."}
                        {activeAiTool === 'assistant' && "더 매력적인 문장을 찾고 계신가요?\nAI가 당신의 글을 다듬어드립니다. (준비 중)"}
                      </p>
                    </div>
                    
                    {activeAiTool === 'lean-canvas' && (
                       <Button onClick={() => setLeanModalOpen(true)} className="btn-primary rounded-full px-8 py-6 text-base shadow-lg shadow-purple-200">
                           <Grid className="w-5 h-5 mr-2" /> 새 린 캔버스 만들기
                       </Button>
                    )}

                    {activeAiTool === 'persona' && (
                       <Button onClick={() => setPersonaModalOpen(true)} className="btn-primary rounded-full px-8 py-6 text-base shadow-lg shadow-purple-200 bg-indigo-600 hover:bg-indigo-700">
                           <UserCircle2 className="w-5 h-5 mr-2" /> 페르소나 정의하기
                       </Button>
                    )}

                    {activeAiTool === 'assistant' && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-600 rounded-full text-xs font-black uppercase tracking-widest border border-purple-100 shadow-sm">
                            <Zap className="w-3 h-3 animate-pulse" />
                            Coming Soon
                        </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* 모달 */}
      <ProjectDetailModalV2 open={modalOpen} onOpenChange={setModalOpen} project={selectedProject} />
      <ProposalDetailModal open={proposalModalOpen} onOpenChange={setProposalModalOpen} proposal={selectedProposal} />
      <LeanCanvasModal 
        open={leanModalOpen} 
        onOpenChange={setLeanModalOpen} 
        onApply={() => {}} // 마이페이지에서는 적용 기능 없이 생성만 체험
      />
      <PersonaDefinitionModal 
        open={personaModalOpen} 
        onOpenChange={setPersonaModalOpen} 
        onApply={() => {}} 
      />
      
      {/* 회원탈퇴 확인 모달 */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <DialogTitle className="text-xl text-red-600">회원탈퇴</DialogTitle>
                <DialogDescription className="text-sm text-gray-500">
                  이 작업은 되돌릴 수 없습니다.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-semibold text-red-800 mb-2">⚠️ 삭제되는 데이터</h4>
              <ul className="text-sm text-red-700 space-y-1">
                <li>• 업로드한 모든 프로젝트</li>
                <li>• 좋아요, 댓글, 팔로우 기록</li>
                <li>• 컬렉션 및 저장된 항목</li>
                <li>• 받은 제안 및 메시지</li>
                <li>• 프로필 정보</li>
              </ul>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                탈퇴를 확인하려면 <span className="font-bold text-red-600">"회원탈퇴"</span>를 입력하세요
              </label>
              <Input
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="회원탈퇴"
                className="border-gray-300 focus:border-red-500 focus:ring-red-500"
              />
            </div>
          </div>
          
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteModalOpen(false);
                setDeleteConfirmText("");
              }}
              disabled={isDeleting}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={deleteConfirmText !== "회원탈퇴" || isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  처리 중...
                </>
              ) : (
                <>
                  <UserMinus className="w-4 h-4 mr-2" />
                  회원탈퇴
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
