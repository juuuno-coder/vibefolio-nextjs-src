// src/app/creator/[username]/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { ImageCard } from "@/components/ImageCard";
import { ProjectDetailModalV2 } from "@/components/ProjectDetailModalV2";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  MapPin,
  Link as LinkIcon,
  Mail,
  Instagram,
  Linkedin,
  User,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

interface UserProfile {
  id: string;
  username: string;
  email: string;
  bio: string;
  location: string;
  website: string;
  profileImage: string;
  skills: string[];
  socialLinks: {
    instagram?: string;
    behance?: string;
    linkedin?: string;
  };
}

interface ImageDialogProps {
  id: string;
  urls: { full: string; regular: string };
  user: {
    username: string;
    profile_image: { small: string; large: string };
  };
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

export default function CreatorProfilePage() {
  const params = useParams();
  const username = decodeURIComponent(params.username as string || '');

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [projects, setProjects] = useState<ImageDialogProps[]>([]);
  const [selectedProject, setSelectedProject] = useState<ImageDialogProps | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [followersCount, setFollowersCount] = useState(0);
  const [totalLikes, setTotalLikes] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    const fetchCreatorData = async () => {
      try {
        // 현재 로그인한 사용자 확인
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUserId(user?.id || null);

        // 사용자 정보 가져오기 (profiles 테이블 사용)
        const { data: userData, error: userError } = await supabase
          .from('profiles')
          .select('*')
          .eq('username', username)
          .maybeSingle();

        if (userError || !userData) {
          console.error('사용자를 찾을 수 없습니다:', userError);
          setLoading(false);
          return;
        }

        setProfile({
          id: userData.id,
          username: userData.username || (userData as any).nickname || username,
          email: (userData as any).email || '',
          bio: userData.bio || '',
          location: (userData as any).location || '',
          website: (userData as any).website || '',
          profileImage: userData.avatar_url || (userData as any).profile_image_url || '',
          skills: (userData as any).skills || [],
          socialLinks: (userData as any).social_links || {},
        });

        // 해당 사용자의 프로젝트 가져오기
        const { data: projectsData, error: projectsError } = await supabase
          .from('Project')
          .select('*')
          .eq('user_id', userData.id)
          .order('created_at', { ascending: false });

        if (projectsError) {
          console.error('프로젝트 로드 실패:', projectsError);
        } else {
          const mappedProjects = projectsData?.map((p: any) => ({
            id: String(p.id || p.project_id),
            urls: {
              full: p.thumbnail_url || p.cover_image_url || "",
              regular: p.thumbnail_url || p.cover_image_url || ""
            },
            user: {
              username: userData.username || (userData as any).nickname || username,
              profile_image: {
                small: userData.avatar_url || (userData as any).profile_image_url || "",
                large: userData.avatar_url || (userData as any).profile_image_url || ""
              }
            },
            likes: p.likes_count || 0,
            views: p.views_count || 0,
            description: p.content_html || p.content_text || "",
            title: p.title || "",
            alt_description: p.title || "",
            created_at: p.created_at,
            width: 800,
            height: 600,
            category: p.category || "general",
            userId: p.user_id,
          })) || [];

          setProjects(mappedProjects);
          setTotalLikes(mappedProjects.reduce((sum: number, p: any) => sum + (p.likes || 0), 0));
        }

        // 팔로워 수 가져오기
        const { count: followersCount } = await supabase
          .from('Follow')
          .select('*', { count: 'exact', head: true })
          .eq('following_id', userData.id);

        setFollowersCount(followersCount || 0);

        // 팔로우 상태 확인
        if (user && userData.id !== user.id) {
          const { data: followData } = await supabase
            .from('Follow')
            .select()
            .eq('follower_id', user.id)
            .eq('following_id', userData.id)
            .maybeSingle();

          setIsFollowing(!!followData);
        }

      } catch (error) {
        console.error('데이터 로드 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCreatorData();
  }, [username]);

  const handleCardClick = (project: ImageDialogProps) => {
    setSelectedProject(project);
    setModalOpen(true);
  };

  const handleFollow = async () => {
    if (!currentUserId || !profile?.id || currentUserId === profile.id) return;

    setFollowLoading(true);
    try {
      const res = await fetch('/api/follows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          follower_id: currentUserId,
          following_id: profile.id,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setIsFollowing(data.following);
        setFollowersCount(prev => data.following ? prev + 1 : prev - 1);
      }
    } catch (error) {
      console.error('팔로우 실패:', error);
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="w-full bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6 py-12">
            <Skeleton className="w-24 h-6 mb-6" />
            <div className="flex gap-8">
              <Skeleton className="w-32 h-32 rounded-full" />
              <div className="flex-1">
                <Skeleton className="w-48 h-10 mb-4" />
                <Skeleton className="w-full h-6 mb-2" />
                <Skeleton className="w-3/4 h-6" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="w-full bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <Link
            href="/"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft size={20} className="mr-2" />
            뒤로 가기
          </Link>

          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* 프로필 이미지 */}
            <Avatar className="w-32 h-32">
              <AvatarImage 
                src={profile?.profileImage} 
                alt={profile?.username || username} 
              />
              <AvatarFallback className="bg-gray-100">
                <User size={48} className="text-gray-400" />
              </AvatarFallback>
            </Avatar>

            {/* 프로필 정보 */}
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-2">
                <h1 className="text-4xl font-bold text-gray-900">
                  {profile?.username || username}
                </h1>
                {/* 팔로우 버튼 */}
                {currentUserId && profile?.id && currentUserId !== profile.id && (
                  <Button
                    onClick={handleFollow}
                    disabled={followLoading}
                    size="sm"
                    className={`rounded-full px-6 ${
                      isFollowing
                        ? 'bg-gray-200 text-gray-700 hover:bg-red-100 hover:text-red-600'
                        : 'btn-primary'
                    }`}
                  >
                    {followLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : isFollowing ? '팔로잉' : '팔로우'}
                  </Button>
                )}
              </div>
              
              {profile?.bio && (
                <p className="text-lg text-gray-600 mb-4">{profile.bio}</p>
              )}

              <div className="flex flex-wrap gap-4 mb-4">
                {profile?.location && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin size={18} />
                    <span>{profile.location}</span>
                  </div>
                )}
                {profile?.email && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail size={18} />
                    <span>{profile.email}</span>
                  </div>
                )}
              </div>

              {/* 스킬 */}
              {profile?.skills && profile.skills.length > 0 && (
                <div className="mb-4">
                  <h3 className="font-semibold text-sm text-gray-700 mb-2">
                    스킬
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="bg-green-100 text-green-700 font-medium px-3 py-1 rounded-full text-sm"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 소셜 링크 */}
              <div className="flex gap-3">
                {profile?.website && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(profile.website, "_blank")}
                  >
                    <LinkIcon size={16} className="mr-2" />
                    웹사이트
                  </Button>
                )}
                {profile?.socialLinks?.instagram && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      window.open(profile.socialLinks.instagram, "_blank")
                    }
                  >
                    <Instagram size={16} className="mr-2" />
                    Instagram
                  </Button>
                )}
                {profile?.socialLinks?.linkedin && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      window.open(profile.socialLinks.linkedin, "_blank")
                    }
                  >
                    <Linkedin size={16} className="mr-2" />
                    LinkedIn
                  </Button>
                )}
              </div>
            </div>
          </div>

          <Separator className="my-8" />

          {/* 통계 */}
          <div className="grid grid-cols-3 gap-6 max-w-md">
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900">
                {projects.length}
              </p>
              <p className="text-sm text-gray-600">프로젝트</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900">
                {totalLikes}
              </p>
              <p className="text-sm text-gray-600">좋아요</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900">{followersCount}</p>
              <p className="text-sm text-gray-600">팔로워</p>
            </div>
          </div>
        </div>
      </div>

      {/* 프로젝트 그리드 */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          프로젝트 ({projects.length})
        </h2>

        {projects.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-xl text-gray-500 mb-4">
              아직 등록된 프로젝트가 없습니다
            </p>
          </div>
        ) : (
          <div className="masonry-grid">
            {projects.map((project, index) => (
              <ImageCard
                key={index}
                props={project}
                onClick={() => handleCardClick(project)}
              />
            ))}
          </div>
        )}
      </div>

      {/* 프로젝트 상세 모달 */}
      <ProjectDetailModalV2
        open={modalOpen}
        onOpenChange={setModalOpen}
        project={selectedProject}
      />
    </div>
  );
}
