"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FontAwesomeIcon } from "./FaIcon";
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
  faCheck,
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
  onReply: (id: string, username: string) => void; 
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
            <span className="font-medium text-[10px]">{comment.user?.username || 'Unknown'}</span>
            <span className="text-[9px] text-gray-400">{dayjs(comment.created_at).fromNow()}</span>
          </div>
          <p className="text-xs text-gray-700">{comment.content}</p>
          <div className="flex items-center gap-2 mt-1">
            <button
              onClick={() => onReply(comment.comment_id, comment.user?.username || 'Unknown')}
              className="text-[9px] text-gray-500 hover:text-green-600"
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
    title?: string | null;
    description: string | null;
    summary?: string | null;
    alt_description: string | null;
    created_at: string;
    width: number;
    height: number;
    userId?: string;
    rendering_type?: string;
  } | null;
}

// HTML 태그를 제거하고 텍스트만 추출하는 함수 (제목용)
function stripHtml(html: string) {
  if (!html) return "";
  return html.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').trim();
}

// HTML 엔티티 디코딩 함수 (강력한 버전)
function unescapeHtml(html: string) {
  if (typeof window === 'undefined' || !html) return html;
  try {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return doc.documentElement.textContent || "";
  } catch (e) {
    // Fallback for simple cases
    return html
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, "&");
  }
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
  const [replyingTo, setReplyingTo] = useState<{ id: string; username: string } | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
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
    
    // isLoggedIn 상태만 믿지 말고 실제 세션 확인
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      setLoginModalOpen(true);
      return;
    }
    
    setLoading(prev => ({ ...prev, like: true }));
    try {
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

  const handleCollectionClick = async () => {
    // isLoggedIn 상태만 믿지 말고 실제 세션 확인
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      setLoginModalOpen(true);
      return;
    }
    
    setCollectionModalOpen(true);
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
          className="!max-w-none !w-screen !h-[90vh] md:!h-[90vh] !p-0 !m-0 !gap-0 !top-auto !bottom-0 !left-1/2 !-translate-x-1/2 !translate-y-0 bg-transparent border-none shadow-none overflow-hidden flex items-end justify-center"
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

            {/* 이미지 또는 리치 텍스트 영역 - 스크롤 가능 */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {project.rendering_type === 'rich_text' ? (
                <div 
                  className="prose prose-sm max-w-full p-6 mx-auto bg-white"
                  dangerouslySetInnerHTML={{ 
                    __html: (() => {
                      let content = project.description || '';
                      const decode = (str: string) => {
                        if (typeof window === 'undefined') return str;
                        const txt = document.createElement("textarea");
                        txt.innerHTML = str;
                        return txt.value;
                      };
                      let decoded = decode(content);
                      if (decoded.includes('&lt;') || decoded.includes('&gt;')) {
                        decoded = decode(decoded);
                      }
                      return decoded;
                    })()
                  }}
                />
              ) : (
                <img
                  src={project.urls.full}
                  alt={project.alt_description || "Project Image"}
                  className="w-auto max-w-full h-auto object-contain cursor-zoom-in mx-auto"
                  style={{ maxWidth: '90%' }}
                  onClick={() => setLightboxOpen(true)}
                />
              )}
              
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
                    onClick={handleCollectionClick}
                    className="w-12 h-12 rounded-full border border-gray-200 bg-white hover:bg-gray-100 text-gray-600 flex items-center justify-center transition-colors"
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
                <h1 className="text-lg font-bold text-gray-900 mb-2 truncate">
                  {project.title || stripHtml(project.description || project.alt_description || "제목 없음")}
                </h1>
                <p className="text-sm text-gray-500 mb-3">
                  {dayjs(project.created_at).fromNow()} | 크리에이티브
                </p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <FontAwesomeIcon icon={faEye} className="w-4 h-4" />
                    {viewsCount}
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
                className="flex-1 h-12 rounded-full bg-green-600 hover:bg-green-700 text-white"
              >
                <FontAwesomeIcon icon={faComment} className="w-4 h-4 mr-2" />
                제안하기
              </Button>
            </div>
          </div>

          {/* 데스크톱 뷰 - 노트폴리오 스타일 (리뉴얼) */}
          <div className="hidden md:flex items-center justify-center w-full h-full p-4 md:p-8 pointer-events-none">
            {/* Modal Container */}
            <div className="w-full max-w-[1200px] h-[95vh] bg-white rounded-xl shadow-2xl flex flex-col relative overflow-hidden pointer-events-auto">
              
              {/* 닫기 버튼 */}
              <button
                onClick={() => onOpenChange(false)}
                className="absolute top-6 right-6 z-50 w-10 h-10 rounded-full bg-white/80 hover:bg-white flex items-center justify-center shadow-lg transition-all hover:rotate-90 text-gray-800"
              >
                <FontAwesomeIcon icon={faXmark} className="w-5 h-5" />
              </button>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                
                {/* 1. Image & Content Header */}
                <div className="max-w-[1000px] mx-auto px-8 py-12">
                   {/* Image Container */}
                   <div className="bg-gray-50 rounded-lg border border-gray-100 overflow-hidden mb-12 flex items-center justify-center min-h-[400px]">
                      {project.rendering_type === 'rich_text' ? (
                        <div 
                           className="prose prose-lg max-w-none w-full p-8 bg-white"
                           dangerouslySetInnerHTML={{ __html: unescapeHtml(project.description || '') }} 
                        />
                      ) : (
                        <img
                          src={project.urls.full}
                          alt={project.alt_description || "Project Image"}
                          className="w-full h-auto object-contain max-h-[80vh] cursor-zoom-in"
                          onClick={() => setLightboxOpen(true)}
                        />
                      )}
                   </div>

                   {/* Title & Description */}
                   <div className="max-w-3xl mx-auto text-center mb-0">
                      <h1 className="text-3xl font-bold text-gray-900 mb-6 leading-tight">
                        {project.title || stripHtml(project.description || "제목 없음")}
                      </h1>
                      {/* Rich text가 아닐 때만 description 보여주기 (중복 방지) */}
                      {project.rendering_type !== 'rich_text' && (
                        <p className="text-lg text-gray-600 leading-8 whitespace-pre-wrap mb-8 text-left break-keep">
                          {stripHtml(project.description || "")}
                        </p>
                      )}
                      
                      {/* Tags (데이터가 있다면 여기에 표시) */}
                      <div className="flex flex-wrap justify-center gap-2 mt-8">
                         {/* TODO: Add Tags */}
                      </div>
                   </div>
                </div>

                {/* 2. Black Action Bar */}
                <div className="w-full bg-[#18181b] text-white py-16">
                   <div className="max-w-4xl mx-auto px-4 text-center">
                       <div className="flex items-center justify-center gap-4 mb-10">
                          <Button 
                            onClick={handleLike}
                            className={`h-14 px-8 rounded-full text-lg font-bold transition-all shadow-lg hover:scale-105 gap-2 border-0 ${
                              liked ? 'bg-[#ff4e4e] hover:bg-[#e04545] text-white' : 'bg-[#333] hover:bg-[#444] text-white'
                            }`}
                          >
                             <FontAwesomeIcon icon={liked ? faHeart : faHeartRegular} className="w-5 h-5" />
                             {liked ? '좋아요 취소' : '작업 좋아요'}
                          </Button>
                          <Button 
                            onClick={handleBookmark} 
                            className={`h-14 px-8 rounded-full text-lg font-bold transition-all shadow-lg hover:scale-105 gap-2 bg-white text-black hover:bg-gray-200 border-0`}
                          >
                             <FontAwesomeIcon icon={bookmarked ? faBookmark : faBookmarkRegular} className="w-5 h-5" />
                             {bookmarked ? '컬렉션 저장됨' : '컬렉션 저장'}
                          </Button>
                       </div>
                       
                       <div className="inline-block px-3 py-1 bg-[#00d084] text-black text-xs font-bold rounded mb-4">
                          VIBEFOLIO PICK
                       </div>
                       <h2 className="text-2xl font-bold mb-3">{project.title}</h2>
                       <div className="text-gray-400 text-sm mb-8 flex items-center justify-center gap-3">
                          <span>{dayjs(project.created_at).fromNow()}</span>
                          <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                          <span>{project.user.username}</span>
                       </div>

                       {/* Stats */}
                       <div className="flex items-center justify-center gap-8 text-gray-500">
                          <div className="flex items-center gap-2">
                             <FontAwesomeIcon icon={faEye} className="w-5 h-5" />
                             <span className="text-lg font-medium text-gray-300">{addCommas(viewsCount)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                             <FontAwesomeIcon icon={faHeart} className="w-5 h-5" />
                             <span className="text-lg font-medium text-gray-300">{addCommas(likesCount)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                             <FontAwesomeIcon icon={faComment} className="w-5 h-5" />
                             <span className="text-lg font-medium text-gray-300">{comments.length}</span>
                          </div>
                       </div>
                   </div>
                </div>

                {/* 3. Profile Section */}
                <div className="bg-gray-50 py-16 border-b border-gray-200">
                    <div className="max-w-2xl mx-auto px-4 text-center">
                        <div className="mb-4 inline-block relative cursor-pointer group" onClick={() => window.location.href=`/creator/${project.user.username}`}>
                           <Avatar className="w-24 h-24 border-4 border-white shadow-md mx-auto">
                             <AvatarImage src={project.user.profile_image.large} />
                             <AvatarFallback><FontAwesomeIcon icon={faUser} /></AvatarFallback>
                           </Avatar>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">{project.user.username}</h3>
                        <p className="text-gray-500 mb-8">크리에이티브한 작업을 공유합니다.</p>
                        
                        <div className="flex items-center justify-center gap-3">
                           {isLoggedIn && project.userId && currentUserId !== project.userId && (
                             <Button 
                               onClick={handleFollow}
                               variant="outline" 
                               className="h-11 px-8 rounded-full border-gray-300 bg-white hover:bg-gray-100 gap-2 text-base"
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
                             className="h-11 px-8 rounded-full bg-[#00d084] hover:bg-[#00b874] text-white border-0 gap-2 font-bold text-base shadow-sm"
                           >
                             <FontAwesomeIcon icon={faPaperPlane} className="w-4 h-4" /> 제안하기
                           </Button>
                        </div>
                    </div>
                </div>

                {/* 4. Comments Section */}
                <div className="max-w-3xl mx-auto px-8 py-16">
                    <h3 className="text-xl font-bold mb-8">
                      댓글 <span className="text-green-600">{comments.length}</span>
                    </h3>

                    {/* Comment Input */}
                    <div className="mb-10">
                        <textarea
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder={isLoggedIn ? "작품에 대한 감상평을 남겨주세요..." : "로그인 후 댓글을 작성할 수 있습니다."}
                          disabled={!isLoggedIn}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all resize-none min-h-[80px]"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleCommentSubmit();
                            }
                          }}
                        />
                        <div className="flex justify-end mt-2">
                           <Button 
                             onClick={handleCommentSubmit}
                             disabled={!isLoggedIn || !newComment.trim() || loading.comment}
                             className="rounded-full bg-black hover:bg-gray-800 text-white"
                           >
                              {loading.comment ? <FontAwesomeIcon icon={faSpinner} className="animate-spin" /> : '댓글 작성'}
                           </Button>
                        </div>
                    </div>

                    {/* Comment List */}
                    <div className="space-y-6">
                       {comments.length > 0 ? (
                         comments.map((comment) => (
                            <CommentItem 
                              key={comment.comment_id || comment.id}
                              comment={comment}
                              onReply={(id, username) => setReplyingTo({ id, username })}
                              onDelete={handleDeleteComment}
                              currentUserId={currentUserId}
                              depth={0}
                            />
                         ))
                       ) : (
                         <div className="text-center py-10 bg-gray-50 rounded-lg text-gray-400 text-sm">
                           첫 번째 댓글의 주인공이 되어보세요!
                         </div>
                       )}
                    </div>
                </div>

              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ShareModal
        open={shareModalOpen}
        onOpenChange={setShareModalOpen}
        url={typeof window !== 'undefined' ? `${window.location.origin}/project/${project.id}` : ''}
        title={project.title || stripHtml(project.description || project.alt_description || "프로젝트 공유")}
        description={stripHtml(project.description || "")}
        imageUrl={project.urls.full}
      />

      <ProposalModal
        open={proposalModalOpen}
        onOpenChange={setProposalModalOpen}
        projectId={project.id}
        receiverId={project.userId || ''}
        projectTitle={project.title || stripHtml(project.description || project.alt_description || "프로젝트")}
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

      {/* 이미지 라이트박스 */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent 
          className="!max-w-none !w-screen !h-screen !p-0 !m-0 !gap-0 bg-black/95 border-none shadow-none flex flex-col items-center justify-center outline-none z-[60]"
          showCloseButton={false}
        >
          {/* 닫기 버튼 */}
          <button 
            onClick={() => setLightboxOpen(false)}
            className="absolute top-6 right-6 z-50 w-12 h-12 rounded-full bg-black/50 hover:bg-black/80 flex items-center justify-center text-white transition-colors"
          >
            <FontAwesomeIcon icon={faXmark} className="w-6 h-6" />
          </button>

          {/* 이미지 영역 */}
          <div className="w-full h-full flex items-center justify-center p-4 md:p-10 select-none">
            <img
              src={project.urls.full}
              alt={project.alt_description || "Detail View"}
              className="max-w-full max-h-full object-contain shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          
          {/* 하단 정보 (선택사항) */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/80 text-sm font-medium bg-black/40 px-4 py-2 rounded-full">
            1 / 1
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
