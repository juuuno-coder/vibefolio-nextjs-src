"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHeart,
  faShareNodes,
  faComment,
  faBookmark,
  faPaperPlane,
  faUser,
  faXmark,
  faChartSimple,
  faSpinner,
  faFolder,
  faEye,
} from "@fortawesome/free-solid-svg-icons";
import { faHeart as faHeartRegular, faComment as faCommentRegular, faBookmark as faBookmarkRegular } from "@fortawesome/free-regular-svg-icons";
import { addCommas } from "@/lib/format/comma";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/ko";
import { ShareModal } from "./ShareModal";
import { ProposalModal } from "./ProposalModal";
import { CollectionModal } from "./CollectionModal";
import { LoginRequiredModal } from "./LoginRequiredModal";
import { supabase } from "@/lib/supabase/client";

dayjs.extend(relativeTime);
dayjs.locale("ko");

// 댓글 아이템 컴포넌트 (재귀)
function CommentItem({ 
  comment, 
  onReply, 
  onDelete,
  currentUserId,
  depth = 0 
}: { 
  comment: any; 
  onReply: (id: string, nickname: string) => void; 
  onDelete: (commentId: string) => void;
  currentUserId: string | null;
  depth: number 
}) {
  const isOwner = currentUserId && comment.user_id === currentUserId;
  
  return (
    <div className={`${depth > 0 ? 'ml-6 mt-2' : ''}`}>
      <div className="flex gap-2">
        <Avatar className="w-6 h-6 flex-shrink-0 bg-white">
          <AvatarImage src={comment.user?.profile_image_url || '/globe.svg'} />
          <AvatarFallback className="bg-white"><FontAwesomeIcon icon={faUser} className="w-3 h-3" /></AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center gap-1 mb-0.5">
            <span className="font-medium text-[10px]">{comment.user?.nickname || 'Unknown'}</span>
            <span className="text-[9px] text-gray-400">{dayjs(comment.created_at).fromNow()}</span>
          </div>
          <p className="text-xs text-gray-700">{comment.content}</p>
          <div className="flex items-center gap-2 mt-1">
            <button
              onClick={() => onReply(comment.comment_id, comment.user?.nickname || 'Unknown')}
              className="text-[9px] text-gray-500 hover:text-[#4ACAD4]"
            >
              답글
            </button>
            {isOwner && (
              <button
                onClick={() => onDelete(comment.comment_id)}
                className="text-[9px] text-gray-400 hover:text-red-500"
              >
                삭제
              </button>
            )}
          </div>
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
              onDelete={onDelete}
              currentUserId={currentUserId}
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
  const [following, setFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
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
    follow: false,
  });
  const [loginModalOpen, setLoginModalOpen] = useState(false);

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

      // 초기 조회수 설정
      const initialViews = project.views || 0;
      setViewsCount(initialViews);

      // 조회수 증가
      try {
        const viewRes = await fetch(`/api/projects/${projectId}/view`, {
          method: 'POST'
        });
        if (viewRes.ok) {
          // 조회수 증가 성공 시 +1 반영
          setViewsCount(initialViews + 1);
        }
      } catch (error) {
        console.error('조회수 증가 실패:', error);
      }

      try {
        const likeRes = await fetch(`/api/likes?projectId=${projectId}`);
        const likeData = await likeRes.json();
        setLikesCount(likeData.count || project.likes || 0);
      } catch (error) {
        setLikesCount(project.likes || 0);
      }

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
          const fetchPromises = [
            fetch(`/api/likes?projectId=${projectId}&userId=${user.id}`),
            fetch(`/api/wishlists?projectId=${projectId}&userId=${user.id}`)
          ];
          
          // 작성자 ID가 있고 본인이 아닌 경우 팔로우 상태도 확인
          if (project.userId && project.userId !== user.id) {
            fetchPromises.push(
              fetch(`/api/follows?followerId=${user.id}&followingId=${project.userId}`)
            );
          }

          const results = await Promise.all(fetchPromises);
          const [likeCheckData, bookmarkCheckData] = await Promise.all([
            results[0].json(),
            results[1].json()
          ]);
          
          setLiked(likeCheckData.liked || false);
          setBookmarked(bookmarkCheckData.bookmarked || false);
          
          // 팔로우 상태 확인
          if (results[2]) {
            const followCheckData = await results[2].json();
            setFollowing(followCheckData.following || false);
          }
          
          // 팔로워 수 가져오기
          if (project.userId) {
            const followCountRes = await fetch(`/api/follows?userId=${project.userId}`);
            const followCountData = await followCountRes.json();
            setFollowersCount(followCountData.followersCount || 0);
          }
        } catch (error) {
          console.error('상태 확인 실패:', error);
        }
      }
    };

    checkUserAndFetchData();
  }, [project, open]);

  const handleLike = async () => {
    if (!project) return;
    
    if (!isLoggedIn) {
      setLoginModalOpen(true);
      return;
    }
    
    setLoading(prev => ({ ...prev, like: true }));
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoginModalOpen(true);
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
        setLoginModalOpen(true);
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

  const handleFollow = async () => {
    if (!isLoggedIn || !project?.userId || currentUserId === project.userId) return;
    
    setLoading(prev => ({ ...prev, follow: true }));
    try {
      const res = await fetch('/api/follows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          follower_id: currentUserId,
          following_id: project.userId,
        }),
      });
      
      const data = await res.json();
      if (res.ok) {
        setFollowing(data.following);
        // 팔로워 수 업데이트
        setFollowersCount(prev => data.following ? prev + 1 : prev - 1);
      }
    } catch (error) {
      console.error('팔로우 실패:', error);
    } finally {
      setLoading(prev => ({ ...prev, follow: false }));
    }
  };

  const handleCommentSubmit = async () => {
    if (!isLoggedIn || !project || !newComment.trim()) return;
    
    setLoading(prev => ({ ...prev, comment: true }));
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoginModalOpen(true);
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

  // 댓글 삭제 핸들러
  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('댓글을 삭제하시겠습니까?')) return;
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoginModalOpen(true);
        return;
      }

      const res = await fetch(`/api/comments?commentId=${commentId}&userId=${currentUserId}`, {
        method: 'DELETE',
      });
      
      if (res.ok) {
        // 댓글 목록에서 삭제된 댓글 제거
        setComments(prev => prev.filter(c => c.comment_id !== commentId));
      } else {
        const data = await res.json();
        alert(data.error || '댓글 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('댓글 삭제 실패:', error);
      alert('댓글 삭제에 실패했습니다.');
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
          className="!max-w-none !w-screen !h-[95vh] md:!h-[95vh] !p-0 !m-0 !gap-0 !top-auto !bottom-0 !left-1/2 !-translate-x-1/2 !translate-y-0 bg-transparent border-none shadow-none overflow-hidden flex items-end justify-center"
          showCloseButton={false}
        >
          {/* 모바일 뷰 - 노트폴리오 스타일 */}
          <div className="md:hidden w-full h-full bg-white flex flex-col rounded-t-xl overflow-hidden">
            {/* X 버튼 */}
            <button
              onClick={() => onOpenChange(false)}
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-lg transition-colors"
            >
              <FontAwesomeIcon icon={faXmark} className="w-4 h-4" />
            </button>

            {/* 이미지 영역 - 스크롤 가능 */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <img
                src={project.urls.full}
                alt={project.alt_description || "Project Image"}
                className="w-auto max-w-full h-auto object-contain"
                style={{ maxWidth: project.width || '100%' }}
              />
              
              {/* 액션 아이콘들 - 이미지 아래 */}
              <div className="px-4 py-3 flex items-center justify-between border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={handleLike}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                      liked ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    <FontAwesomeIcon icon={liked ? faHeart : faHeartRegular} className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => setCollectionModalOpen(true)}
                    className="w-10 h-10 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center"
                  >
                    <FontAwesomeIcon icon={faFolder} className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => setCommentsPanelOpen(true)}
                    className="w-10 h-10 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center"
                  >
                    <FontAwesomeIcon icon={faComment} className="w-5 h-5" />
                  </button>
                </div>
                <button 
                  onClick={() => setShareModalOpen(true)}
                  className="w-10 h-10 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center"
                >
                  <FontAwesomeIcon icon={faShareNodes} className="w-5 h-5" />
                </button>
              </div>

              {/* 프로젝트 정보 */}
              <div className="px-4 py-4">
                <h1 className="text-lg font-bold text-gray-900 mb-2">
                  {project.description || project.alt_description || "제목 없음"}
                </h1>
                <p className="text-sm text-gray-500 mb-3">
                  {dayjs(project.created_at).fromNow()} | 크리에이티브
                </p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <FontAwesomeIcon icon={faEye} className="w-4 h-4" />
                    {project.views || 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <FontAwesomeIcon icon={faHeart} className="w-4 h-4" />
                    {likesCount}
                  </span>
                  <span className="flex items-center gap-1">
                    <FontAwesomeIcon icon={faComment} className="w-4 h-4" />
                    {comments.length}
                  </span>
                </div>
              </div>

              {/* 작성자 정보 */}
              <div className="px-4 py-4 border-t border-gray-100 flex flex-col items-center">
                <Avatar className="w-16 h-16 border-2 border-gray-200 mb-2">
                  <AvatarImage src={project.user.profile_image.large} />
                  <AvatarFallback><FontAwesomeIcon icon={faUser} className="w-6 h-6" /></AvatarFallback>
                </Avatar>
                <p className="font-bold text-base">{project.user.username}</p>
                <p className="text-sm text-gray-500 mb-4">-</p>
              </div>
            </div>

            {/* 하단 고정 버튼들 */}
            <div className="flex gap-3 p-4 border-t border-gray-100 bg-white">
              {isLoggedIn && project.userId && currentUserId !== project.userId && (
                <Button
                  onClick={handleFollow}
                  variant="outline"
                  className="flex-1 h-12 rounded-full border-gray-300"
                >
                  {following ? '팔로잉' : '+ 팔로우'}
                </Button>
              )}
              <Button
                onClick={() => {
                  if (!isLoggedIn) {
                    setLoginModalOpen(true);
                    return;
                  }
                  setProposalModalOpen(true);
                }}
                className="flex-1 h-12 rounded-full bg-[#4ACAD4] hover:bg-[#3db8c0] text-white"
              >
                <FontAwesomeIcon icon={faComment} className="w-4 h-4 mr-2" />
                제안하기
              </Button>
            </div>
          </div>

          {/* 데스크톱 뷰 - 기존 스타일 유지 */}
          <div className="hidden md:flex flex-row-reverse h-full items-end justify-center gap-4">
            {/* 메인 이미지 영역 */}
            <div className="w-[66vw] h-full bg-white flex flex-col relative rounded-t-xl overflow-hidden shadow-2xl">
              {/* X 버튼 */}
              <button
                onClick={() => onOpenChange(false)}
                className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-lg transition-colors"
              >
                <FontAwesomeIcon icon={faXmark} className="w-4 h-4" />
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
                    <AvatarFallback className="bg-white"><FontAwesomeIcon icon={faUser} className="w-4 h-4" /></AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{project.user.username}</p>
                    <p className="text-xs text-gray-500">{dayjs(project.created_at).format('YYYY.MM.DD')}</p>
                  </div>
                </button>
              </div>
              
              {/* 이미지 */}
              <div className="flex-1 flex items-start justify-center p-8 overflow-y-auto">
                <img
                  src={project.urls.full}
                  alt={project.alt_description || "Project Image"}
                  className="max-w-full h-auto object-contain object-top"
                  style={{ maxWidth: Math.min(project.width || 1200, 1200) }}
                />
              </div>
            </div>

            {/* 액션바 - 데스크톱 */}
            <div className="h-full bg-transparent flex flex-col items-center py-8 gap-5">
              {/* 프로필 아바타 */}
              <button
                onClick={() => {
                  window.location.href = `/creator/${project.user.username}`;
                }}
                className="flex flex-col items-center gap-1 group cursor-pointer"
              >
                <Avatar className={`w-12 h-12 border-2 bg-white transition-colors ${following ? 'border-[#4ACAD4]' : 'border-gray-200 hover:border-[#4ACAD4]'}`}>
                  <AvatarImage src={project.user.profile_image.large} />
                  <AvatarFallback className="bg-white"><FontAwesomeIcon icon={faUser} className="w-4 h-4" /></AvatarFallback>
                </Avatar>
              </button>

              {/* 팔로우 버튼 */}
              {isLoggedIn && project.userId && currentUserId !== project.userId && (
                <div className="flex flex-col items-center">
                  <Button
                    onClick={handleFollow}
                    disabled={loading.follow}
                    size="sm"
                    className={`text-xs px-3 py-1 h-7 rounded-full transition-colors ${
                      following 
                        ? 'bg-gray-200 text-gray-700 hover:bg-red-100 hover:text-red-600' 
                        : 'bg-[#4ACAD4] text-white hover:bg-[#3db8c0]'
                    }`}
                  >
                    {loading.follow ? '...' : (following ? '팔로잉' : '팔로우')}
                  </Button>
                  {followersCount > 0 && (
                    <span className="text-[10px] text-gray-500 mt-1">{followersCount}</span>
                  )}
                </div>
              )}

              <button 
                onClick={() => {
                  if (!isLoggedIn) {
                    setLoginModalOpen(true);
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
                <FontAwesomeIcon icon={faPaperPlane} className="w-5 h-5" />
              </button>

              <button 
                onClick={handleLike}
                disabled={!isLoggedIn}
                className={`w-12 h-12 rounded-full flex flex-col items-center justify-center transition-colors ${
                  liked ? 'bg-red-500 text-white' : 'bg-gray-100 hover:bg-red-500 hover:text-white'
                }`}
              >
                {loading.like ? (
                  <FontAwesomeIcon icon={faSpinner} className="w-5 h-5 animate-spin" />
                ) : (
                  <FontAwesomeIcon icon={liked ? faHeart : faHeartRegular} className="w-5 h-5" />
                )}
              </button>

              <button 
                onClick={() => {
                  if (!isLoggedIn) {
                    setLoginModalOpen(true);
                    return;
                  }
                  setCollectionModalOpen(true);
                }}
                disabled={!isLoggedIn}
                className="w-12 h-12 rounded-full bg-gray-100 hover:bg-blue-500 hover:text-white flex items-center justify-center transition-colors"
                title="컨렉션에 저장"
              >
                <FontAwesomeIcon icon={faFolder} className="w-5 h-5" />
              </button>

              <button 
                onClick={() => setShareModalOpen(true)}
                className="w-12 h-12 rounded-full bg-gray-100 hover:bg-[#4ACAD4] hover:text-white flex items-center justify-center transition-colors"
              >
                <FontAwesomeIcon icon={faShareNodes} className="w-5 h-5" />
              </button>

              <button 
                onClick={() => setCommentsPanelOpen(!commentsPanelOpen)}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                  commentsPanelOpen ? 'bg-[#4ACAD4] text-white' : 'bg-gray-100 hover:bg-[#4ACAD4] hover:text-white'
                }`}
              >
                <FontAwesomeIcon icon={faComment} className="w-5 h-5" />
              </button>
            </div>

            {/* 댓글 패널 */}
            {commentsPanelOpen && (
              <div className="w-[30%] h-full bg-white flex flex-col border-l border-gray-200 ml-4 rounded-t-xl overflow-hidden">
                {/* 댓글 헤더 */}
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-bold text-sm">댓글 ({comments.length})</h3>
                  <button 
                    onClick={() => setCommentsPanelOpen(false)}
                    className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <FontAwesomeIcon icon={faXmark} className="w-4 h-4" />
                  </button>
                </div>

                {/* 프로젝트 정보 */}
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Avatar className="w-8 h-8 bg-white">
                      <AvatarImage src={project.user.profile_image.large} />
                      <AvatarFallback className="bg-white"><FontAwesomeIcon icon={faUser} className="w-3 h-3" /></AvatarFallback>
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
                        onDelete={handleDeleteComment}
                        currentUserId={currentUserId}
                        depth={0}
                      />
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <FontAwesomeIcon icon={faComment} className="w-6 h-6 mx-auto text-gray-300 mb-2" />
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
                          <FontAwesomeIcon icon={faXmark} className="w-3 h-3" />
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
                        {loading.comment ? <FontAwesomeIcon icon={faSpinner} className="w-3 h-3 animate-spin" /> : '작성'}
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

      <LoginRequiredModal
        open={loginModalOpen}
        onOpenChange={setLoginModalOpen}
      />
    </>
  );
}
