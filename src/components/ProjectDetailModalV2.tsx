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
  Folder,
} from "lucide-react";
import { addCommas } from "@/lib/format/comma";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/ko";
import { ShareModal } from "./ShareModal";
import { ProposalModal } from "./ProposalModal";
import { CollectionModal } from "./CollectionModal";
import { supabase } from "@/lib/supabase/client";

dayjs.extend(relativeTime);
dayjs.locale("ko");

// 댓글 아이템 컴포넌트 (재귀)
function CommentItem({ comment, onReply, depth = 0 }: { comment: any; onReply: (id: string, nickname: string) => void; depth: number }) {
  return (
    <div className={`${depth > 0 ? 'ml-6 mt-2' : ''}`}>
      <div className="flex gap-2">
        <Avatar className="w-6 h-6 flex-shrink-0 bg-white">
          <AvatarImage src={comment.user?.profile_image_url || '/globe.svg'} />
          <AvatarFallback className="bg-white"><User size={12} /></AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center gap-1 mb-0.5">
            <span className="font-medium text-[10px]">{comment.user?.nickname || 'Unknown'}</span>
            <span className="text-[9px] text-gray-400">{dayjs(comment.created_at).fromNow()}</span>
          </div>
          <p className="text-xs text-gray-700">{comment.content}</p>
          <button
            onClick={() => onReply(comment.comment_id, comment.user?.nickname || 'Unknown')}
            className="text-[9px] text-gray-500 hover:text-[#4ACAD4] mt-1"
          >
            답글
          </button>
        </div>
      </div>
      {/* 대댓글 */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-2 space-y-2">
          {comment.replies.map((reply: any) => (
            <CommentItem
              key={reply.comment_id}
              comment={reply}
              onReply={onReply}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

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
  const [proposalModalOpen, setProposalModalOpen] = useState(false);
  const [collectionModalOpen, setCollectionModalOpen] = useState(false);
  const [commentsPanelOpen, setCommentsPanelOpen] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<{ id: string; nickname: string } | null>(null);
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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('로그인이 필요합니다.');
        return;
      }

      const res = await fetch('/api/likes', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('로그인이 필요합니다.');
        return;
      }

      const res = await fetch('/api/wishlists', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('로그인이 필요합니다.');
        return;
      }

      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          projectId: parseInt(project.id),
          content: newComment,
          parentCommentId: replyingTo?.id || null,
        }),
      });
      
      const data = await res.json();
      if (res.ok && data.comment) {
        // 댓글 목록 새로고침
        const commentRes = await fetch(`/api/comments?projectId=${parseInt(project.id)}`);
        const commentData = await commentRes.json();
        if (commentData.comments) {
          setComments(commentData.comments);
        }
        setNewComment('');
        setReplyingTo(null);
      } else {
        alert(data.error || '댓글 작성에 실패했습니다.');
      }
    } catch (error) {
      console.error('댓글 작성 실패:', error);
      alert('댓글 작성에 실패했습니다.');
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
          className="!max-w-none !w-screen !h-[90vh] !p-0 !gap-0 bg-transparent border-none shadow-none overflow-hidden flex items-end justify-center"
          showCloseButton={false}
        >

          <div className="flex h-full items-center justify-center gap-4">
            {/* 메인 이미지 영역 - 고정 너비 */}
            <div className="w-[900px] h-full bg-gray-50 flex flex-col relative">
              {/* X 버튼 - 이미지 영역 내부 우측 상단 */}
              <button
                onClick={() => onOpenChange(false)}
                className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-lg transition-colors"
              >
                <X size={18} />
              </button>

              {/* 프로젝트 정보 헤더 */}
              <div className="p-6 bg-white border-b border-gray-100">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {project.description || project.alt_description || "제목 없음"}
                </h1>
                <button
                  onClick={() => {
                    window.location.href = `/creator/${project.user.username}`;
                  }}
                  className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer"
                >
                  <Avatar className="w-10 h-10 bg-white">
                    <AvatarImage src={project.user.profile_image.large} />
                    <AvatarFallback className="bg-white"><User size={16} /></AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{project.user.username}</p>
                    <p className="text-xs text-gray-500">{dayjs(project.created_at).format('YYYY.MM.DD')}</p>
                  </div>
                </button>
              </div>
              
              {/* 이미지 - 스크롤 가능 */}
              <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
                <img
                  src={project.urls.full}
                  alt={project.alt_description || "Project Image"}
                  className="max-w-full h-auto object-contain"
                />
              </div>
            </div>

            {/* 액션바 - 크기 증가 */}
            <div className="h-full bg-transparent flex flex-col items-center py-8 gap-5">
              <button
                onClick={() => {
                  window.location.href = `/creator/${project.user.username}`;
                }}
                className="flex flex-col items-center gap-1 group cursor-pointer"
              >
                <Avatar className="w-12 h-12 border-2 border-gray-200 bg-white hover:border-[#4ACAD4] transition-colors">
                  <AvatarImage src={project.user.profile_image.large} />
                  <AvatarFallback className="bg-white"><User size={18} /></AvatarFallback>
                </Avatar>
              </button>

              <button 
                onClick={() => {
                  if (!isLoggedIn) {
                    alert('로그인이 필요합니다.');
                    return;
                  }
                  if (currentUserId === project.userId) {
                    alert('본인 프로젝트에는 제안할 수 없습니다.');
                    return;
                  }
                  setProposalModalOpen(true);
                }}
                className="w-12 h-12 rounded-full bg-gray-100 hover:bg-[#4ACAD4] hover:text-white flex items-center justify-center transition-colors"
                title="제안하기"
              >
                <Send size={20} />
              </button>

              <button 
                onClick={handleLike}
                disabled={!isLoggedIn}
                className={`w-12 h-12 rounded-full flex flex-col items-center justify-center transition-colors ${
                  liked ? 'bg-red-500 text-white' : 'bg-gray-100 hover:bg-red-500 hover:text-white'
                }`}
              >
                {loading.like ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <Heart size={20} fill={liked ? "currentColor" : "none"} />
                )}
              </button>

              <button 
                onClick={() => {
                  if (!isLoggedIn) {
                    alert('로그인이 필요합니다.');
                    return;
                  }
                  setCollectionModalOpen(true);
                }}
                disabled={!isLoggedIn}
                className="w-12 h-12 rounded-full bg-gray-100 hover:bg-blue-500 hover:text-white flex items-center justify-center transition-colors"
                title="컬렉션에 저장"
              >
                <Folder size={20} />
              </button>

              <button 
                onClick={() => setShareModalOpen(true)}
                className="w-12 h-12 rounded-full bg-gray-100 hover:bg-[#4ACAD4] hover:text-white flex items-center justify-center transition-colors"
              >
                <Share2 size={20} />
              </button>

              <button 
                onClick={() => setCommentsPanelOpen(!commentsPanelOpen)}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                  commentsPanelOpen ? 'bg-[#4ACAD4] text-white' : 'bg-gray-100 hover:bg-[#4ACAD4] hover:text-white'
                }`}
              >
                <MessageCircle size={20} />
              </button>
            </div>

            {/* 댓글 패널 - 30% */}
            {commentsPanelOpen && (
              <div className="w-[30%] h-full bg-white flex flex-col border-l border-gray-200 ml-4">
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
                    <Avatar className="w-8 h-8 bg-white">
                      <AvatarImage src={project.user.profile_image.large} />
                      <AvatarFallback className="bg-white"><User size={14} /></AvatarFallback>
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
                      <CommentItem 
                        key={comment.comment_id || comment.id}
                        comment={comment}
                        onReply={(id, nickname) => setReplyingTo({ id, nickname })}
                        depth={0}
                      />
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
                    {replyingTo && (
                      <div className="flex items-center justify-between mb-2 px-2 py-1 bg-gray-50 rounded text-[10px]">
                        <span className="text-gray-600">@{replyingTo.nickname}에게 답글</span>
                        <button onClick={() => setReplyingTo(null)} className="text-gray-400 hover:text-gray-600">
                          <X size={12} />
                        </button>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleCommentSubmit()}
                        placeholder={replyingTo ? `@${replyingTo.nickname}에게 답글...` : "댓글을 입력하세요..."}
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

      <ProposalModal
        open={proposalModalOpen}
        onOpenChange={setProposalModalOpen}
        projectId={project.id}
        receiverId={project.userId || ''}
        projectTitle={project.description || project.alt_description || '프로젝트'}
      />

      <CollectionModal
        open={collectionModalOpen}
        onOpenChange={setCollectionModalOpen}
        projectId={project.id}
      />
    </>
  );
}
