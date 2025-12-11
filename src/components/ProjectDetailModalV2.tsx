"use client";

import React, { useState, useEffect } from "react";
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
  BarChart3,
  Loader2,
} from "lucide-react";
import { addCommas } from "@/lib/format/comma";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/ko";
import { ShareModal } from "./ShareModal";
import { supabase } from "@/lib/supabase/client";

dayjs.extend(relativeTime);
dayjs.locale("ko");

interface ProjectDetailModalV2Props {
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
    views?: number;
    description: string | null;
    alt_description: string | null;
    created_at: string;
    width: number;
    height: number;
    userId?: string;
  } | null;
}

export function ProjectDetailModalV2({
  open,
  onOpenChange,
  project,
}: ProjectDetailModalV2Props) {
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [commentsPanelOpen, setCommentsPanelOpen] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [likesCount, setLikesCount] = useState(0);
  const [viewsCount, setViewsCount] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState({
    like: false,
    bookmark: false,
    comment: false,
  });

  // ESC 키 핸들러
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (commentsPanelOpen) {
          // 댓글이 열려있으면 댓글만 닫기
          setCommentsPanelOpen(false);
        } else {
          // 댓글이 닫혀있으면 모달 닫기
          onOpenChange(false);
        }
      }
    };

    if (open) {
      window.addEventListener('keydown', handleEsc);
    }

    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [open, commentsPanelOpen, onOpenChange]);

  useEffect(() => {
    if (!project || !open) return;

    const checkUserAndFetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsLoggedIn(!!user);
      setCurrentUserId(user?.id || null);

      const projectId = parseInt(project.id);
      if (isNaN(projectId)) return;

      try {
        const likeRes = await fetch(`/api/likes?projectId=${projectId}`);
        const likeData = await likeRes.json();
        setLikesCount(likeData.count || project.likes || 0);
      } catch (error) {
        setLikesCount(project.likes || 0);
      }

      setViewsCount(project.views || 0);

      try {
        const commentRes = await fetch(`/api/comments?projectId=${projectId}`);
        const commentData = await commentRes.json();
        if (commentData.comments) {
          setComments(commentData.comments);
        }
      } catch (error) {
        console.error('댓글 조회 실패:', error);
      }

      if (user) {
        try {
          const [likeCheck, bookmarkCheck] = await Promise.all([
            fetch(`/api/likes?projectId=${projectId}&userId=${user.id}`),
            fetch(`/api/wishlists?projectId=${projectId}&userId=${user.id}`)
          ]);
          const likeCheckData = await likeCheck.json();
          const bookmarkCheckData = await bookmarkCheck.json();
          setLiked(likeCheckData.liked || false);
          setBookmarked(bookmarkCheckData.bookmarked || false);
        } catch (error) {
          console.error('상태 확인 실패:', error);
        }
      }
    };

    checkUserAndFetchData();
  }, [project, open]);

  const handleLike = async () => {
    if (!isLoggedIn || !project) return;
    
    setLoading(prev => ({ ...prev, like: true }));
    try {
      const res = await fetch('/api/likes', {
        method: liked ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: parseInt(project.id) }),
      });
      
      if (res.ok) {
        setLiked(!liked);
        setLikesCount(prev => liked ? prev - 1 : prev + 1);
      }
    } catch (error) {
      console.error('좋아요 실패:', error);
    } finally {
      setLoading(prev => ({ ...prev, like: false }));
    }
  };

  const handleBookmark = async () => {
    if (!isLoggedIn || !project) return;
    
    setLoading(prev => ({ ...prev, bookmark: true }));
    try {
      const res = await fetch('/api/wishlists', {
        method: bookmarked ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: parseInt(project.id) }),
      });
      
      if (res.ok) {
        setBookmarked(!bookmarked);
      }
    } catch (error) {
      console.error('북마크 실패:', error);
    } finally {
      setLoading(prev => ({ ...prev, bookmark: false }));
    }
  };

  const handleCommentSubmit = async () => {
    if (!isLoggedIn || !project || !newComment.trim()) return;
    
    setLoading(prev => ({ ...prev, comment: true }));
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: parseInt(project.id),
          content: newComment,
        }),
      });
      
      const data = await res.json();
      if (res.ok && data.comment) {
        const comment = {
          id: data.comment.comment_id,
          user: data.comment.users?.nickname || '나',
          text: data.comment.content,
          created_at: data.comment.created_at,
          userId: currentUserId,
        };
        setComments(prev => [comment, ...prev]);
        setNewComment('');
      }
    } catch (error) {
      console.error('댓글 작성 실패:', error);
    } finally {
      setLoading(prev => ({ ...prev, comment: false }));
    }
  };

  if (!project) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={(newOpen) => {
        if (!newOpen) {
          setCommentsPanelOpen(false);
        }
        onOpenChange(newOpen);
      }}>
        <DialogContent 
          className="!max-w-none !w-[88vw] !h-[88vh] !p-0 !gap-0 bg-white border-none shadow-2xl overflow-hidden"
          showCloseButton={false}
          onEscapeKeyDown={(e) => {
            e.preventDefault();
            if (commentsPanelOpen) {
              setCommentsPanelOpen(false);
            } else {
              onOpenChange(false);
            }
          }}
        >
          <button 
            onClick={() => onOpenChange(false)}
            className="absolute top-4 right-4 z-50 p-2 text-gray-600 hover:text-gray-900 transition-colors bg-white/80 rounded-full backdrop-blur-sm"
          >
            <X size={24} />
          </button>

          <div className="flex h-full">
            {/* 메인 이미지 영역 - 66% */}
            <div className="w-[66%] bg-gray-50 flex items-center justify-center p-8">
              <img
                src={project.urls.full}
                alt={project.alt_description || "Project Image"}
                className="max-w-full max-h-full object-contain"
              />
            </div>

            {/* 액션바 - 48px */}
            <div className="w-[48px] bg-transparent flex flex-col items-center py-8 gap-6">
              <div className="flex flex-col items-center gap-1 group cursor-pointer">
                <Avatar className="w-10 h-10 border-2 border-gray-200">
                  <AvatarImage src={project.user.profile_image.large} />
                  <AvatarFallback><User size={16} /></AvatarFallback>
                </Avatar>
              </div>

              <button className="w-10 h-10 rounded-full bg-gray-100 hover:bg-[#4ACAD4] hover:text-white flex items-center justify-center transition-colors">
                <Send size={18} />
              </button>

              <button 
                onClick={handleLike}
                disabled={!isLoggedIn}
                className={`w-10 h-10 rounded-full flex flex-col items-center justify-center transition-colors ${
                  liked ? 'bg-red-500 text-white' : 'bg-gray-100 hover:bg-red-500 hover:text-white'
                }`}
              >
                {loading.like ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Heart size={18} fill={liked ? "currentColor" : "none"} />
                )}
              </button>

              <button 
                onClick={handleBookmark}
                disabled={!isLoggedIn}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                  bookmarked ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-blue-500 hover:text-white'
                }`}
              >
                {loading.bookmark ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Bookmark size={18} fill={bookmarked ? "currentColor" : "none"} />
                )}
              </button>

              <button 
                onClick={() => setShareModalOpen(true)}
                className="w-10 h-10 rounded-full bg-gray-100 hover:bg-[#4ACAD4] hover:text-white flex items-center justify-center transition-colors"
              >
                <Share2 size={18} />
              </button>

              <button 
                onClick={() => setCommentsPanelOpen(!commentsPanelOpen)}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                  commentsPanelOpen ? 'bg-[#4ACAD4] text-white' : 'bg-gray-100 hover:bg-[#4ACAD4] hover:text-white'
                }`}
              >
                <MessageCircle size={18} />
              </button>
            </div>

            {/* 댓글 패널 - 18% (고정, 슬라이드 없음) */}
            {commentsPanelOpen && (
              <div className="w-[18%] bg-white flex flex-col border-l border-gray-200">
                {/* 댓글 헤더 */}
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-bold text-sm">댓글 ({comments.length})</h3>
                  <button 
                    onClick={() => setCommentsPanelOpen(false)}
                    className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* 프로젝트 정보 */}
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={project.user.profile_image.large} />
                      <AvatarFallback><User size={14} /></AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-bold text-xs">{project.user.username}</p>
                      <p className="text-[10px] text-gray-500">{dayjs(project.created_at).fromNow()}</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-700 leading-relaxed line-clamp-3">
                    {project.description || "설명이 없습니다."}
                  </p>
                </div>

                {/* 댓글 목록 */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {comments.length > 0 ? (
                    comments.map((comment) => (
                      <div key={comment.id} className="flex gap-2">
                        <Avatar className="w-6 h-6 flex-shrink-0">
                          <AvatarFallback><User size={12} /></AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-1 mb-0.5">
                            <span className="font-medium text-[10px]">{comment.user}</span>
                            <span className="text-[9px] text-gray-400">{dayjs(comment.created_at).fromNow()}</span>
                          </div>
                          <p className="text-xs text-gray-700">{comment.text}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <MessageCircle size={24} className="mx-auto text-gray-300 mb-2" />
                      <p className="text-xs text-gray-400">첫 댓글을 남겨보세요!</p>
                    </div>
                  )}
                </div>

                {/* 댓글 입력 */}
                {isLoggedIn ? (
                  <div className="p-3 border-t border-gray-100">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleCommentSubmit()}
                        placeholder="댓글을 입력하세요..."
                        className="flex-1 px-2 py-1.5 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-[#4ACAD4]"
                      />
                      <Button
                        onClick={handleCommentSubmit}
                        disabled={!newComment.trim() || loading.comment}
                        size="sm"
                        className="bg-[#4ACAD4] hover:bg-[#3db8c0] text-xs px-3"
                      >
                        {loading.comment ? <Loader2 size={12} className="animate-spin" /> : '작성'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 border-t border-gray-100 text-center">
                    <p className="text-xs text-gray-500">로그인 후 댓글을 작성할 수 있습니다.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <ShareModal
        open={shareModalOpen}
        onOpenChange={setShareModalOpen}
        url={typeof window !== 'undefined' ? window.location.href : ''}
        title={project.description || project.alt_description || '프로젝트'}
        description={project.description || ''}
        imageUrl={project.urls.full}
      />
    </>
  );
}
