"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Heart, Folder, Upload, Settings, Grid, Send, MessageCircle, Eye, EyeOff, Lock, Trash2, Camera, UserMinus, AlertTriangle, Loader2, Plus, Edit, Rocket, Sparkles, Wand2, Lightbulb, Zap, UserCircle2, Search, Clock, BarChart, ChefHat, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProfileManager } from "@/components/ProfileManager";
import { ImageCard } from "@/components/ImageCard";
import { ProposalCard } from "@/components/ProposalCard";
import { CommentCard } from "@/components/CommentCard";
import { ProjectDetailModalV2 } from "@/components/ProjectDetailModalV2";
import { ProposalDetailModal } from "@/components/ProposalDetailModal";
import { FeedbackReportModal } from "@/components/FeedbackReportModal";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/AuthContext";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type TabType = 'projects' | 'likes' | 'collections' | 'proposals' | 'comments' | 'ai_tools' | 'settings';
type AiToolType = 'lean-canvas' | 'persona' | 'assistant' | 'job' | 'trend' | 'recipe' | 'tool' | 'api-settings';

import { LeanCanvasModal, type LeanCanvasData } from "@/components/LeanCanvasModal";
import { PersonaDefinitionModal } from "@/components/PersonaDefinitionModal";
import { AiOpportunityExplorer } from "@/components/tools/AiOpportunityExplorer";
import { AiLeanCanvasChat } from "@/components/tools/AiLeanCanvasChat";
import { AiOpportunityChat } from "@/components/tools/AiOpportunityChat";
import { AiPersonaChat } from "@/components/tools/AiPersonaChat";
import { AiAssistantChat, type AssistantData } from "@/components/tools/AiAssistantChat";
import { AssistantResultModal } from "@/components/AssistantResultModal";
import { PersonaData } from "@/components/PersonaDefinitionModal";
import { ApiKeyManager } from "@/components/ApiKeyManager";

export default function MyPage() {
  const router = useRouter();
  
  // 기본 상태
  const [activeTab, setActiveTab] = useState<TabType>('projects');
  const [projectFilter, setProjectFilter] = useState<'all' | 'audit' | 'active'>('all');
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [activeAiTool, setActiveAiTool] = useState<AiToolType>('api-settings');
  const [isExplorationStarted, setIsExplorationStarted] = useState(false);
  
  // [New] Feedback Report Modal State
  const [feedbackReportOpen, setFeedbackReportOpen] = useState(false);
  const [currentFeedbackProject, setCurrentFeedbackProject] = useState<{id: string, title: string} | null>(null);

  // AI 도구 데이터 지속성 상태
  const [savedLeanCanvas, setSavedLeanCanvas] = useState<LeanCanvasData | null>(null);
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
  const [assistantModalOpen, setAssistantModalOpen] = useState(false);

  const [savedPersona, setSavedPersona] = useState<PersonaData | null>(null);
  const [savedAssistant, setSavedAssistant] = useState<AssistantData | null>(null);
  
  const handleLeanCanvasGenerate = (data: LeanCanvasData) => {
    setSavedLeanCanvas(data);
    setLeanModalOpen(true);
  };

  const handlePersonaGenerate = (data: PersonaData) => {
    setSavedPersona(data);
    setPersonaModalOpen(true);
  };

  const handleAssistantGenerate = (data: AssistantData) => {
    setSavedAssistant(data);
    setAssistantModalOpen(true);
  };
  
  // 회원탈퇴 관련 상태
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const { user: authUser, userProfile: authProfile, loading: authLoading } = useAuth();
  
  // 1. 초기화 - 사용자 정보 및 통계 로드
  const initStats = async () => {
      if (!authUser) return;
      setUserId(authUser.id);
      
      try {
        const { data: dbProfile } = await supabase
          .from('profiles')
          .select('username, nickname, bio, cover_image_url, social_links, interests, is_public')
          .eq('id', authUser.id)
          .single();

        setUserProfile({
          username: (dbProfile as any)?.nickname || (dbProfile as any)?.username || authProfile?.username || (authProfile as any)?.full_name || '사용자',
          email: authUser.email,
          profile_image_url: authProfile?.profile_image_url || '/globe.svg',
          role: authProfile?.role || 'user',
          bio: (dbProfile as any)?.bio || '',
          cover_image_url: (dbProfile as any)?.cover_image_url || null,
          social_links: (dbProfile as any)?.social_links || {},
          interests: (dbProfile as any)?.interests,
          is_public: (dbProfile as any)?.is_public,
          id: authUser.id, 
        });

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

  useEffect(() => {
    if (authLoading) return;
    if (!authUser) {
      router.push('/login');
      return;
    }
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
            .select('project_id, title, thumbnail_url, likes_count, views_count, created_at, updated_at, content_text, rendering_type, custom_data, scheduled_at, visibility, audit_deadline')
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
            scheduled_at: p.scheduled_at,
            visibility: p.visibility || 'public',
            updated_at: p.updated_at,
            userId: userId,
            audit_deadline: p.audit_deadline,
            user: { 
                username: userProfile?.username || 'Me', 
                profile_image: { 
                    small: userProfile?.profile_image_url || '/globe.svg', 
                    large: userProfile?.profile_image_url || '/globe.svg' 
                } 
            }
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
  }, [userId, activeTab, initialized, userProfile]);

  const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

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
      
      setProjects(prev => prev.filter(p => String(p.id) !== String(projectId)));
      setStats(prev => ({ ...prev, projects: prev.projects - 1 }));
      alert("프로젝트가 삭제되었습니다.");
    } catch (err) {
      alert("삭제에 실패했습니다.");
    }
  };

  // 프로젝트 공개여부 토글
  const handleToggleVisibility = async (projectId: string, currentVisibility: string) => {
    const newVisibility = currentVisibility === 'public' ? 'private' : 'public';
    try {
      const { error } = await supabase
        .from('Project')
        .update({ visibility: newVisibility })
        .eq('project_id', parseInt(projectId));

      if (error) throw error;

      setProjects(prev => prev.map(p => 
        p.id === projectId ? { ...p, visibility: newVisibility } : p
      ));
      
      // toast success (optional)
    } catch (err) {
      console.error(err);
      alert("상태 변경에 실패했습니다.");
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
    { id: 'proposals' as TabType, label: '피드백 관리', icon: Zap, color: 'text-indigo-600', bgColor: 'bg-indigo-600' },
    { id: 'comments' as TabType, label: '내 댓글', icon: MessageCircle, color: 'text-orange-500', bgColor: 'bg-orange-500' },
    { id: 'settings' as TabType, label: '설정', icon: Settings, color: 'text-gray-700', bgColor: 'bg-gray-700' },
  ];

  return (
    <div className="w-full min-h-screen bg-gray-50 pt-20 pb-12">
      <div className="w-full max-w-[1400px] mx-auto px-4 md:px-8">
        
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
                {userProfile?.id && (
                  <Button onClick={() => setActiveTab('settings')} variant="outline" size="sm" className="gap-2 rounded-full border-gray-200">
                    <Settings className="w-4 h-4" /> 설정
                  </Button>
                )}
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
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        ) : (
          <>
            {/* 내 프로젝트 탭 */}
            {activeTab === 'projects' && (
              <div className="space-y-6">
                {/* [New] Project Sub-filters */}
                <div className="flex gap-2">
                   <button onClick={() => setProjectFilter('all')} className={cn("px-4 py-2 rounded-full text-xs font-bold transition-all", projectFilter === 'all' ? "bg-slate-900 text-white" : "bg-white border border-gray-200 text-slate-500")}>전체</button>
                   <button onClick={() => setProjectFilter('audit')} className={cn("px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2", projectFilter === 'audit' ? "bg-orange-600 text-white" : "bg-white border border-gray-200 text-orange-600")}><Zap size={12} /> 전문 피드백 요청</button>
                   <button onClick={() => setProjectFilter('active')} className={cn("px-4 py-2 rounded-full text-xs font-bold transition-all", projectFilter === 'active' ? "bg-green-600 text-white" : "bg-white border border-gray-200 text-green-600")}>발행 중</button>
                </div>

                {projects.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
                    {/* 프로젝트 등록 카드 */}
                    <div 
                      onClick={() => router.push('/project/upload')}
                      className="bg-white rounded-[2rem] border-2 border-dashed border-gray-100 hover:border-green-400 overflow-hidden hover:shadow-xl transition-all cursor-pointer group flex flex-col items-center justify-center min-h-[300px] bg-gray-50/30"
                    >
                      <div className="w-16 h-16 rounded-3xl bg-white group-hover:bg-green-50 flex items-center justify-center mb-4 transition-all shadow-sm group-hover:shadow-md">
                        <Plus className="w-8 h-8 text-gray-300 group-hover:text-green-500 transition-colors" />
                      </div>
                      <p className="text-gray-400 group-hover:text-green-600 font-bold transition-colors">새 프로젝트 등록</p>
                    </div>
                    
                    {projects.filter(p => {
                      if (projectFilter === 'audit') return p.custom_data?.audit_config || p.audit_deadline;
                      if (projectFilter === 'active') return p.visibility === 'public';
                      return true;
                    }).map((project) => (
                      <div key={project.id} className="h-full">
                        <ImageCard 
                          props={project} 
                          onClick={() => { setSelectedProject(project); setModalOpen(true); }}
                          onDelete={handleDeleteProject}
                          className="w-full h-full"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[2.5rem] border border-dashed border-gray-200 relative overflow-hidden group hover:border-green-400/30 transition-colors">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-green-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="w-24 h-24 rounded-full bg-gray-50 flex items-center justify-center mb-6 relative z-10 group-hover:scale-110 transition-transform duration-300">
                      <Upload className="w-10 h-10 text-green-500" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2 z-10">아직 캔버스가 비어있어요</h3>
                    <p className="text-gray-500 text-sm mb-8 z-10 text-center max-w-sm px-4 leading-relaxed">
                      첫 번째 프로젝트를 업로드하고<br/>당신의 크리에이티브를 전 세계에 공유해보세요! 🎨
                    </p>
                    <Button onClick={() => router.push('/project/upload')} className="bg-green-600 hover:bg-green-700 text-white rounded-full px-8 h-14 text-base font-bold shadow-lg shadow-green-200">
                      첫 프로젝트 시작하기
                    </Button>
                  </div>
                )}
              </div>
            )}
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
              <div className="space-y-6">
                 {/* Feedback Status Header */}
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
                       <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center"><Zap size={20}/></div>
                       <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase">Received Feedback</p>
                          <p className="text-lg font-black text-gray-900">전문 피드백</p>
                       </div>
                    </div>
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
                       <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center"><Send size={20}/></div>
                       <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase">Collaboration Proposals</p>
                          <p className="text-lg font-black text-gray-900">협업 제안</p>
                       </div>
                    </div>
                 </div>

                 {projects.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-12">
                      {projects.map((item) => (
                        <ProposalCard key={item.proposal_id || item.id} proposal={item} type="received" onClick={() => { setSelectedProposal(item); setProposalModalOpen(true); }} />
                      ))}
                    </div>
                 ) : (
                    <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[2.5rem] border border-dashed border-gray-200">
                      <BarChart3 className="w-16 h-16 text-gray-200 mb-4" />
                      <h3 className="text-xl font-bold text-gray-900 mb-1">도착한 피드백이 없습니다</h3>
                      <p className="text-gray-400 text-sm">프로젝트를 업로드하고 전문가들의 의견을 받아보세요.</p>
                      <Button onClick={() => router.push('/project/upload')} className="mt-6 rounded-full bg-slate-900 text-white font-bold px-8">프로젝트 등록하기</Button>
                    </div>
                 )}
              </div>
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
                    { id: 'job', label: 'AI 채용 정보', icon: Search, desc: '실시간 채용 & 공모전' },
                    { id: 'trend', label: 'AI 트렌드', icon: Rocket, desc: '최신 AI 뉴스 & 동향' },
                    { id: 'recipe', label: 'AI 레시피', icon: Lightbulb, desc: '프롬프트 & 워크플로우' },
                    { id: 'tool', label: 'AI 도구 추천', icon: Zap, desc: '유용한 에이전트 & 서비스' },
                    { type: 'divider' },

                    { id: 'lean-canvas', label: 'AI 린 캔버스', icon: Grid, desc: '사업 모델 구조화' },
                    { id: 'persona', label: 'AI 고객 페르소나', icon: UserCircle2, desc: '고객 정의 및 분석' },
                    { id: 'assistant', label: 'AI 콘텐츠 어시스턴트', icon: Wand2, desc: '텍스트 생성 및 다듬기' },
                  ].map((tool, idx) => {
                    if (tool.type === 'divider') {
                        return <div key={`div-${idx}`} className="h-px bg-gray-100 my-2 mx-4" />;
                    }
                    const menuItem = tool as { id: string, label: string, icon: any, desc: string };
                    return (
                        <button
                        key={menuItem.id}
                        onClick={() => {
                            setActiveAiTool(menuItem.id as AiToolType);
                            setIsExplorationStarted(false); 
                        }}
                        className={`flex items-start gap-4 p-4 rounded-2xl transition-all text-left group ${
                            activeAiTool === menuItem.id 
                            ? 'bg-white border-2 border-purple-100 shadow-md ring-4 ring-purple-50/50' 
                            : 'hover:bg-white/50 border-2 border-transparent text-gray-500'
                        }`}
                        >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                            activeAiTool === menuItem.id ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-400 group-hover:bg-purple-50 group-hover:text-purple-500'
                        }`}>
                            <menuItem.icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className={`font-bold text-sm ${activeAiTool === menuItem.id ? 'text-gray-900' : 'text-gray-600'}`}>{menuItem.label}</p>
                            <p className="text-[10px] text-gray-400 mt-0.5 truncate">{menuItem.desc}</p>
                        </div>
                        </button>
                    )
                  })}
                </div>

                {/* 오른쪽 콘텐츠 영역 */}
                <div className="flex-1 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-0 md:p-0 relative overflow-hidden group">
                  {/* Futuristic Background Decor */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-purple-50 rounded-full blur-3xl opacity-20 -mr-32 -mt-32 transition-all group-hover:opacity-40 pointer-events-none" />
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl opacity-20 -ml-16 -mb-16 transition-all group-hover:opacity-40 pointer-events-none" />
                  
                  {['job', 'trend', 'recipe', 'tool'].includes(activeAiTool) ? (
                       <div className="h-full flex flex-col relative z-10">
                           <div className="p-8 pb-4 border-b border-gray-50 bg-white/50 backdrop-blur-sm">
                               <h2 className="text-xl font-black text-gray-900 flex items-center gap-2 mb-1">
                                  {activeAiTool === 'job' && <><Search className="text-blue-500 w-6 h-6"/> AI 채용 정보</>}
                                  {activeAiTool === 'trend' && <><Rocket className="text-purple-500 w-6 h-6"/> AI 트렌드</>}
                                  {activeAiTool === 'recipe' && <><Lightbulb className="text-amber-500 w-6 h-6"/> AI 레시피</>}
                                  {activeAiTool === 'tool' && <><Zap className="text-yellow-500 w-6 h-6"/> AI 도구 추천</>}
                               </h2>
                               <p className="text-sm text-gray-500 pl-8">
                                  {activeAiTool === 'job' && "최신 AI 프롬프트 엔지니어링 채용 공고와 해커톤 정보를 확인하세요."}
                                  {activeAiTool === 'trend' && "매일 업데이트되는 글로벌 AI 업계의 최신 동향과 뉴스 링크를 제공합니다."}
                                  {activeAiTool === 'recipe' && "다양한 이미지 생성 프롬프트 스타일과 워크플로우를 발견하고 적용해보세요."}
                                  {activeAiTool === 'tool' && "작업 효율을 극대화해줄 최신 AI 에이전트와 서비스를 추천해드립니다."}
                               </p>
                           </div>
                           <div className="flex-1 overflow-hidden">
                               <AiOpportunityChat category={activeAiTool as 'job' | 'trend' | 'recipe' | 'tool'} />
                           </div>
                       </div>
                   ) : activeAiTool === 'lean-canvas' ? (
                        <div className="h-full relative z-10">
                             <AiLeanCanvasChat onGenerate={handleLeanCanvasGenerate} />
                        </div>
                   ) : activeAiTool === 'persona' ? (
                        <div className="h-full relative z-10">
                             <AiPersonaChat onGenerate={handlePersonaGenerate} />
                        </div>
                   ) : activeAiTool === 'assistant' ? (
                        <div className="h-full relative z-10">
                             <AiAssistantChat onGenerate={handleAssistantGenerate} />
                        </div>
                   ) : (
                    <div className="h-full flex items-center justify-center text-gray-400">
                       <p>도구를 선택해주세요</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 설정 탭 */}
            {activeTab === 'settings' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                <ProfileManager 
                   user={userProfile} 
                   onUpdate={() => initStats()}
                   onDeleteClick={() => setDeleteModalOpen(true)}
                />
                 <ApiKeyManager />
              </div>
            )}
          </>
        )}
      </div>

      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" /> 회원탈퇴
            </DialogTitle>
            <DialogDescription>
              탈퇴 시 작성한 모든 프로젝트, 컬렉션, 좋아요 정보가 영구적으로 삭제되며 복구할 수 없습니다.
              <br /><br />
              계속하시려면 아래 입력창에 <strong>회원탈퇴</strong>를 입력해주세요.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="회원탈퇴"
              className="border-red-200 focus:ring-red-500"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>취소</Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteAccount}
              disabled={deleteConfirmText !== "회원탈퇴" || isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserMinus className="mr-2 h-4 w-4" />}
              탈퇴하기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* 상세 모달들 */}
      {/* 상세 모달들 */}
      {selectedProject && (
        <ProjectDetailModalV2
          open={modalOpen}
          onOpenChange={setModalOpen}
          project={{
             ...selectedProject,
             user: {
                username: selectedProject.user?.username || 'Unknown',
                profile_image: { small: selectedProject.user?.profile_image?.small || '/globe.svg', large: selectedProject.user?.profile_image?.large || '/globe.svg' }
             }
          }}
        />
      )}

      {selectedProposal && (
        <ProposalDetailModal
          open={proposalModalOpen}
          onOpenChange={setProposalModalOpen}
          proposal={selectedProposal}
        />
      )}
      
      {/* AI 결과 모달들 */}
      {leanModalOpen && savedLeanCanvas && (
        <LeanCanvasModal
          open={leanModalOpen}
          onOpenChange={setLeanModalOpen}
          initialData={savedLeanCanvas}
        />
      )}

      {personaModalOpen && savedPersona && (
        <PersonaDefinitionModal
          open={personaModalOpen}
          onOpenChange={setPersonaModalOpen}
          initialData={savedPersona}
        />
      )}

      {assistantModalOpen && savedAssistant && (
        <AssistantResultModal
           open={assistantModalOpen}
           onOpenChange={setAssistantModalOpen}
           initialData={savedAssistant}
        />
      )}

      {/* [New] Report Modal */}
      {feedbackReportOpen && currentFeedbackProject && (
         <FeedbackReportModal
            open={feedbackReportOpen}
            onOpenChange={setFeedbackReportOpen}
            projectId={currentFeedbackProject.id}
            projectTitle={currentFeedbackProject.title}
         />
      )}
    </div>
  );
}
