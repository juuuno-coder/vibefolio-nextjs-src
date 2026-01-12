"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Heart,
  Share2,
  MessageCircle,
  Bookmark,
  Send,
  User,
  X,
  UserPlus,
  UserCheck,
  Loader2,
} from "lucide-react";
import { OptimizedImage } from '@/components/OptimizedImage';
import { addCommas } from "@/lib/format/comma";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/ko";
import { CommentModal } from "./CommentModal";
import { ShareModal } from "./ShareModal";
import { supabase } from "@/lib/supabase/client";

dayjs.extend(relativeTime);
dayjs.locale("ko");

interface ProjectDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: {
    id: string;
    urls: { full: string; regular: string };
    user: {
      username: string;
      profile_image: { small: string; large: string };
    };
    likes: number;
    description: string | null;
    alt_description: string | null;
    created_at: string;
    width: number;
    height: number;
    userId?: string; // 작성자 ID (팔로우용)
  } | null;
}

export function ProjectDetailModal({
  open,
  onOpenChange,
  project,
}: ProjectDetailModalProps) {
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [following, setFollowing] = useState(false);
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [likesCount, setLikesCount] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState({
    like: false,
    bookmark: false,
    follow: false,
    comment: false,
  });

  // 현재 유저 정보 및 상태 확인
  useEffect(() => {
    if (!project || !open) return;

    const checkUserAndFetchData = async () => {
      // 로그인 상태 확인
      const { data: { user } } = await supabase.auth.getUser();
      setIsLoggedIn(!!user);
      setCurrentUserId(user?.id || null);

      const projectId = parseInt(project.id);
      if (isNaN(projectId)) return;

      // 좋아요 수 조회
      try {
        const likeRes = await fetch(`/api/likes?projectId=${projectId}`);
        const likeData = await likeRes.json();
        setLikesCount(likeData.count || project.likes || 0);
      } catch (error) {
        setLikesCount(project.likes || 0);
      }

      // 댓글 조회
      try {
        const commentRes = await fetch(`/api/comments?projectId=${projectId}`);
        const commentData = await commentRes.json();
        if (commentData.comments) {
          setComments(commentData.comments.map((c: any) => ({
            id: c.comment_id,
            user: c.users?.nickname || '익명',
            text: c.content,
            created_at: c.created_at,
            userId: c.user_id,
          })));
        }
      } catch (error) {
        console.error('댓글 로딩 실패:', error);
      }

      // 로그인한 경우 좋아요/북마크/팔로우 상태 확인
      if (user) {
        try {
          // 좋아요 상태
          const likeStatusRes = await fetch(`/api/likes?userId=${user.id}&projectId=${projectId}`);
          const likeStatusData = await likeStatusRes.json();
          setLiked(likeStatusData.liked || false);

          // 북마크 상태
          const bookmarkRes = await fetch(`/api/wishlist?userId=${user.id}&projectId=${projectId}`);
          const bookmarkData = await bookmarkRes.json();
          setBookmarked(bookmarkData.bookmarked || false);

          // 팔로우 상태 (작성자 ID가 있는 경우)
          if (project.userId && project.userId !== user.id) {
            const followRes = await fetch(`/api/follows?followerId=${user.id}&followingId=${project.userId}`);
            const followData = await followRes.json();
            setFollowing(followData.following || false);
          }
        } catch (error) {
          console.error('상태 확인 실패:', error);
        }
      }
    };

    checkUserAndFetchData();
  }, [project, open]);

  if (!project) return null;

  const handleLike = async () => {
    if (!isLoggedIn || !currentUserId) {
      alert('좋아요를 하려면 로그인이 필요합니다.');
      return;
    }

    const projectId = parseInt(project.id);
    if (isNaN(projectId)) return;

    setLoading(prev => ({ ...prev, like: true }));
    try {
      const res = await fetch('/api/likes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: currentUserId, project_id: projectId }),
      });
      const data = await res.json();
      if (res.ok) {
        setLiked(data.liked);
        setLikesCount(prev => data.liked ? prev + 1 : prev - 1);
      }
    } catch (error) {
      console.error('좋아요 실패:', error);
    } finally {
      setLoading(prev => ({ ...prev, like: false }));
    }
  };

  const handleBookmark = async () => {
    if (!isLoggedIn || !currentUserId) {
      alert('컬렉션에 저장하려면 로그인이 필요합니다.');
      return;
    }

    const projectId = parseInt(project.id);
    if (isNaN(projectId)) return;

    setLoading(prev => ({ ...prev, bookmark: true }));
    try {
      const res = await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: currentUserId, project_id: projectId }),
      });
      const data = await res.json();
      if (res.ok) {
        setBookmarked(data.bookmarked);
      }
    } catch (error) {
      console.error('북마크 실패:', error);
    } finally {
      setLoading(prev => ({ ...prev, bookmark: false }));
    }
  };

  const handleFollow = async () => {
    if (!isLoggedIn || !currentUserId) {
      alert('팔로우하려면 로그인이 필요합니다.');
      return;
    }

    if (!project.userId || project.userId === currentUserId) return;

    setLoading(prev => ({ ...prev, follow: true }));
    try {
      const res = await fetch('/api/follows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ follower_id: currentUserId, following_id: project.userId }),
      });
      const data = await res.json();
      if (res.ok) {
        setFollowing(data.following);
      }
    } catch (error) {
      console.error('팔로우 실패:', error);
    } finally {
      setLoading(prev => ({ ...prev, follow: false }));
    }
  };

  const handleAddComment = async (text: string) => {
    if (!isLoggedIn || !currentUserId) {
      alert('댓글을 작성하려면 로그인이 필요합니다.');
      return;
    }

    const projectId = parseInt(project.id);
    if (isNaN(projectId)) return;

    setLoading(prev => ({ ...prev, comment: true }));
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: currentUserId, project_id: projectId, content: text }),
      });
      const data = await res.json();
      if (res.ok && data.comment) {
        const newComment = {
          id: data.comment.comment_id,
          user: data.comment.users?.nickname || '나',
          text: data.comment.content,
          created_at: data.comment.created_at,
          userId: currentUserId,
        };
        setComments(prev => [newComment, ...prev]);
      }
    } catch (error) {
      console.error('댓글 작성 실패:', error);
    } finally {
      setLoading(prev => ({ ...prev, comment: false }));
    }
  };

  const handleShare = () => {
    setShareModalOpen(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent 
            className="max-w-none w-screen h-screen bg-transparent border-none shadow-none p-0 !animate-none !duration-0 data-[state=open]:!fade-in-0 data-[state=closed]:!fade-out-0"
            showCloseButton={false} 
        >
          {/* 전체 컨테이너 */}
          <div className="w-full h-full overflow-y-auto" onClick={(e) => {
              if (e.target === e.currentTarget) onOpenChange(false);
          }}>
            
            {/* 우측 상단 닫기 버튼 */}
            <button 
                onClick={() => onOpenChange(false)}
                className="fixed top-6 right-6 z-[60] p-2 text-white/70 hover:text-white transition-colors bg-black/20 rounded-full backdrop-blur-md"
            >
                <X size={32} />
            </button>

            {/* 메인 컨텐츠 */}
            <div className="w-full max-w-[1000px] min-h-screen bg-white mx-auto my-0 md:my-10 relative shadow-2xl flex flex-col pt-10 pb-20 px-8 md:px-16" onClick={(e) => e.stopPropagation()}>
                
                {/* 헤더: 작성자 정보 및 제목 */}
                <div className="mb-8 border-b pb-6">
                    <div className="flex items-center justify-between mb-4">
                        <Link href={`/creator/${project.user.username}`} className="flex items-center gap-3 group">
                            <Avatar className="w-12 h-12 border border-gray-100">
                                <AvatarImage src={project.user.profile_image.large} alt={project.user.username} />
                                <AvatarFallback><User /></AvatarFallback>
                            </Avatar>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 group-hover:text-green-600 transition-colors">
                                    {project.description ? (project.description.length > 30 ? project.description.slice(0, 30) + "..." : project.description) : "무제 프로젝트"}
                                </h3>
                                <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                                    <span>{project.user.username}</span>
                                    {project.userId && currentUserId && project.userId !== currentUserId && (
                                      <button
                                        onClick={(e) => {
                                          e.preventDefault();
                                          handleFollow();
                                        }}
                                        disabled={loading.follow}
                                        className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                                          following 
                                            ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' 
                                            : 'bg-green-600 text-white hover:bg-green-700'
                                        }`}
                                      >
                                        {loading.follow ? (
                                          <Loader2 size={12} className="animate-spin" />
                                        ) : following ? (
                                          '팔로잉'
                                        ) : (
                                          '팔로우'
                                        )}
                                      </button>
                                    )}
                                </div>
                            </div>
                        </Link>
                        
                        <div className="flex items-center gap-2">
                            <div className="bg-green-600 text-white text-xs font-bold px-2 py-3 rounded-b-sm -mt-10 mr-4 shadow-md">
                                V
                            </div>
                        </div>
                    </div>
                </div>

                {/* 메인 이미지 */}
                <div className="w-full mb-10 flex justify-center bg-gray-50/50">
                  <OptimizedImage
                    src={project.urls.full}
                    alt={project.alt_description || "Project Image"}
                    className="w-auto max-w-full h-auto object-contain shadow-sm"
                    width={1200}
                    height={800}
                  />
                </div>

                {/* 설명 텍스트 (HTML 렌더링) */}
                <div className="mb-20 max-w-4xl mx-auto w-full content-renderer">
                    {project.description ? (
                      <div 
                        className="prose prose-lg prose-h1:text-3xl max-w-none text-gray-800 leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: project.description }} 
                      />
                    ) : (
                      <p className="text-gray-400 italic text-center">작품 설명이 없습니다.</p>
                    )}
                </div>

                {/* 하단 태그/정보 영역 */}
                <div className="border-t pt-10 text-center text-gray-400 text-sm">
                    <p>© {new Date().getFullYear()} {project.user.username}. All rights reserved.</p>
                </div>

            </div>

            {/* 우측 플로팅 액션바 */}
            <div className="hidden md:flex flex-col gap-6 fixed right-[calc(50%-640px)] top-1/2 -translate-y-1/2 z-50 translate-x-full ml-10">
                {/* 프로필 */}
                <div className="flex flex-col items-center gap-1 group cursor-pointer" onClick={() => window.open(`/creator/${project.user.username}`, '_blank')}>
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-transparent hover:border-white transition-all ring-1 ring-white/20">
                      <OptimizedImage src={project.user.profile_image.large} alt="profile" className="w-full h-full object-cover" width={48} height={48} />
                    </div>
                    <span className="text-[10px] text-white/80 font-medium opacity-0 group-hover:opacity-100 transition-opacity">프로필</span>
                </div>

                {/* 제안하기 */}
                <div className="flex flex-col items-center gap-1 group cursor-pointer">
                    <div className="w-12 h-12 rounded-full bg-gray-800/80 backdrop-blur-sm flex items-center justify-center text-white hover:bg-green-600 transition-colors">
                        <Send size={20} />
                    </div>
                    <span className="text-[10px] text-white/80 font-medium opacity-0 group-hover:opacity-100 transition-opacity">제안하기</span>
                </div>

                {/* 좋아요 */}
                <div className="flex flex-col items-center gap-1 group cursor-pointer" onClick={handleLike}>
                    <div className={`w-12 h-12 rounded-full backdrop-blur-sm flex items-center justify-center transition-colors ${
                      liked ? 'bg-red-500 text-white' : 'bg-gray-800/80 text-white hover:bg-red-500'
                    }`}>
                        {loading.like ? (
                          <Loader2 size={20} className="animate-spin" />
                        ) : (
                          <Heart size={20} fill={liked ? "currentColor" : "none"} />
                        )}
                    </div>
                    <span className="text-[10px] text-white/80 font-medium">{addCommas(likesCount)}</span>
                </div>

                {/* 컬렉션 (북마크) */}
                <div className="flex flex-col items-center gap-1 group cursor-pointer" onClick={handleBookmark}>
                    <div className={`w-12 h-12 rounded-full backdrop-blur-sm flex items-center justify-center transition-colors ${
                      bookmarked ? 'bg-blue-500 text-white' : 'bg-gray-800/80 text-white hover:bg-blue-500'
                    }`}>
                        {loading.bookmark ? (
                          <Loader2 size={20} className="animate-spin" />
                        ) : (
                          <Bookmark size={20} fill={bookmarked ? "currentColor" : "none"} />
                        )}
                    </div>
                    <span className="text-[10px] text-white/80 font-medium opacity-0 group-hover:opacity-100 transition-opacity">컬렉션</span>
                </div>

                {/* 댓글 */}
                <div className="flex flex-col items-center gap-1 group cursor-pointer" onClick={() => setCommentModalOpen(true)}>
                    <div className="w-12 h-12 rounded-full bg-gray-800/80 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white hover:text-black transition-colors">
                        <MessageCircle size={20} />
                    </div>
                    <span className="text-[10px] text-white/80 font-medium">{comments.length}</span>
                </div>

                {/* 공유하기 */}
                <div className="flex flex-col items-center gap-1 group cursor-pointer" onClick={handleShare}>
                    <div className="w-12 h-12 rounded-full bg-gray-800/80 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white hover:text-black transition-colors">
                        <Share2 size={20} />
                    </div>
                    <span className="text-[10px] text-white/80 font-medium opacity-0 group-hover:opacity-100 transition-opacity">공유하기</span>
                </div>
            </div>

          </div>
        </DialogContent>
      </Dialog>

      {/* 댓글 모달 */}
      <CommentModal 
        open={commentModalOpen} 
        onOpenChange={setCommentModalOpen}
        comments={comments}
        onAddComment={handleAddComment}
        isLoggedIn={isLoggedIn}
      />

      {/* 공유 모달 */}
      <ShareModal
        open={shareModalOpen}
        onOpenChange={setShareModalOpen}
        url={typeof window !== 'undefined' ? `${window.location.origin}/project/${project.id}` : ''}
        title={project.description || '바이브폴리오 프로젝트'}
        description={`${project.user.username}님의 작품`}
        imageUrl={project.urls.regular}
      />
    </>
  );
}
