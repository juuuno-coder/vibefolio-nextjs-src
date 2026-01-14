"use client";

import React, { useState, useEffect } from "react";
import { FeedbackPoll } from "./FeedbackPoll";
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
  faLock,
  faUnlock,
  faRocket,
} from "@fortawesome/free-solid-svg-icons";

import { VersionHistoryModal } from "./VersionHistoryModal";
import { getProjectVersions, ProjectVersion } from "@/lib/versions";
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
import { createNotification } from "@/hooks/useNotifications";
import { useAuth } from "@/lib/auth/AuthContext";


dayjs.extend(relativeTime);
dayjs.locale("ko");

// 댓글 아이템 컴포넌트 (재귀)
function CommentItem({ 
  comment, 
  onReply, 
  onDelete,
  currentUserId,
  projectOwnerId,
  depth = 0 
}: { 
  comment: any; 
  onReply: (id: string, username: string) => void; 
  onDelete: (commentId: string) => void;
  currentUserId: string | null;
  projectOwnerId: string | undefined;
  depth: number 
}) {
  const isOwner = currentUserId && comment.user_id === currentUserId;
  const isSecret = comment.is_secret;
  const isProposal = comment.content?.includes("[협업 제안]");
  const canView = !isSecret || (currentUserId && (String(comment.user_id) === String(currentUserId) || String(projectOwnerId) === String(currentUserId)));
  
  return (
    <div className={`${depth > 0 ? 'ml-6 mt-2' : ''} ${isProposal ? 'bg-green-50/50 -mx-2 px-2 py-1 rounded-lg border border-green-100/50' : ''}`}>
      <div className="flex gap-2">
        <Avatar className="w-6 h-6 flex-shrink-0 bg-white shadow-sm ring-1 ring-gray-100">
          <AvatarImage src={comment.user?.profile_image_url || '/globe.svg'} />
          <AvatarFallback className="bg-white"><FontAwesomeIcon icon={faUser} className="w-3 h-3 text-gray-400" /></AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center gap-1 mb-0.5">
            <span className="font-bold text-[10px] text-gray-900">{comment.user?.username || 'Unknown'}</span>
            {isSecret && (
               <span className={`${isProposal ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-600'} text-[9px] px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5`}>
                 <FontAwesomeIcon icon={isProposal ? faPaperPlane : faLock} className="w-2 h-2" /> 
                 {isProposal ? "비밀 제안" : "비밀 댓글"}
               </span>
            )}
            <span className="text-[9px] text-gray-400 font-medium">{dayjs(comment.created_at).fromNow()}</span>
          </div>
          <p className={`text-xs leading-relaxed ${isSecret ? 'text-gray-500' : 'text-gray-700'} ${isProposal && canView ? 'text-green-800 font-medium' : ''}`}>
            {canView ? comment.content : (isProposal ? "🔒 작성자와 프로젝트 관리자만 볼 수 있는 비밀 제안입니다." : "🔒 작성자와 프로젝트 관리자만 볼 수 있는 비밀 댓글입니다.")}
          </p>
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
              projectOwnerId={projectOwnerId}
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
    custom_data?: any;
  } | null;
}

// HTML 태그를 제거하고 텍스트만 추출하는 함수 (제목용)
function stripHtml(html: string) {
  if (!html) return "";
  return html.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').trim();
}

// HTML 엔티티 디코딩 함수 (태그 유지 버전)
function unescapeHtml(html: string) {
  if (typeof window === 'undefined' || !html) return html;
  try {
    // 1. textarea를 이용한 엔티티 디코딩 (&lt; -> <)
    const txt = document.createElement("textarea");
    txt.innerHTML = html;
    return txt.value;
  } catch (e) {
    return html;
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
  const [newCommentSecret, setNewCommentSecret] = useState(false);

  const [isHistoryModalOpen, setHistoryModalOpen] = useState(false);
  const [versions, setVersions] = useState<ProjectVersion[]>([]);
  const [replyingTo, setReplyingTo] = useState<{ id: string; username: string } | null>(null);

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [viewsCount, setViewsCount] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [authorBio, setAuthorBio] = useState("");
  const { refreshUserProfile } = useAuth();

  const [loading, setLoading] = useState({
    like: false,
    bookmark: false,
    comment: false,
    follow: false,
  });
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [otherProjects, setOtherProjects] = useState<any[]>([]);

  // [New] 실시간 좋아요 수 동기화
  useEffect(() => {
    if (!open || !project?.id) return;

    const fetchLikesCount = async () => {
      const { count } = await supabase
        .from('Like')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', Number(project.id));
      
      if (count !== null) setLikesCount(count);
    };

    // 초기 로드 시에도 실제 DB 카운트와 동기화
    fetchLikesCount();

    const channel = supabase
      .channel(`project-likes-${project.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'Like',
          filter: `project_id=eq.${project.id}`,
        },
        (payload) => {
          // INSERT나 DELETE 발생 시 카운트 재조회
          if (payload.eventType === 'INSERT' || payload.eventType === 'DELETE') {
             fetchLikesCount();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [open, project?.id]);

  useEffect(() => {
    if (!project || !open) return;

    // 초기값 세팅
    setLikesCount(project.likes || 0);
    setViewsCount(project.views || 0);

    const checkUserAndFetchData = async () => {
      // 1. 세션 및 사용자 정보
      const { data: { session } } = await supabase.auth.getSession();
      const currentId = session?.user?.id || null;
      setIsLoggedIn(!!session);
      setCurrentUserId(currentId);

      // 2. 좋아요 체크
      if (currentId) {
        const { data: likeData } = await supabase
          .from('like')
          .select('id')
          .eq('project_id', parseInt(project.id)) // project.id가 있어야 함
          .eq('user_id', currentId)
          .single();
        setLiked(!!likeData);

        // 3. 팔로우 체크
        if (project.userId && project.userId !== currentId) {
          const { data: followData } = await supabase
            .from('Follow')
            .select('id')
            .eq('follower_id', currentId)
            .eq('following_id', project.userId)
            .single();
          setFollowing(!!followData);
        }
      }

      // 4. 댓글 조회
      const { data: commentsData, error: commentsError } = await supabase
        .from('comment')
        .select(`
          id,
          content,
          created_at,
          user_id,
          user:profiles(username, profile_image_url)
        `)
        .eq('project_id', parseInt(project.id))
        .order('created_at', { ascending: false });

      if (commentsData) {
        // 기존 상태 타입에 맞춰 매핑
        const mappedComments = commentsData.map((c: any) => ({
          comment_id: c.id,
          user_id: c.user_id,
          user_name: c.user?.username || 'Unknown',
          user_image: c.user?.profile_image_url || null,
          content: c.content,
          created_at: c.created_at,
          is_secret: c.is_secret,
        }));
        setComments(mappedComments);
      }

      // 5. 작성자 Bio 조회 (신규 기능)
      if (project.userId) {
        try {
           const { data: profileData } = await supabase
             .from('profiles')
             .select('bio')
             .eq('id', project.userId)
             .single();
           
           if (profileData && profileData.bio) {
             setAuthorBio(profileData.bio);
           } else {
             setAuthorBio("크리에이티브한 작업을 공유합니다.");
           }
        } catch (e) {
           setAuthorBio("크리에이티브한 작업을 공유합니다.");
        }
      }

      // 6. 작성자의 다른 프로젝트 조회
      if (project.userId) {
        try {
          const { data: others } = await supabase
            .from('Project')
            .select('project_id, title, thumbnail_url')
            .eq('user_id', project.userId)
            .neq('project_id', parseInt(project.id))
            .order('created_at', { ascending: false })
            .limit(4);
          
          setOtherProjects(others || []);
        } catch (e) {
          console.error("Other projects fetch error:", e);
        }
      }
    };

    checkUserAndFetchData();
  }, [project, open]);


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

  useEffect(() => {
    if (project?.id) {
      getProjectVersions(project.id).then((data) => {
        // 타입 안전하게 처리
        if (Array.isArray(data)) {
          setVersions(data);
        } else {
          setVersions([]);
        }
      });
    }
  }, [project]);

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

        // [New] 팔로우 알림 (팔로우 했을 때만)
        if (data.following) {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                const nickname = session?.user?.user_metadata?.nickname || '회원';
                
                await createNotification({
                    userId: project.userId!,
                    type: 'follow',
                    title: '새로운 팔로워 🥳',
                    message: `${nickname}님이 회원님을 팔로우합니다.`,
                    link: `/user/${currentUserId}`, // 유저 프로필 페이지 (임시 경로)
                    senderId: currentUserId!
                });
            } catch (e) {
                console.error("알림 전송 실패", e);
            }
        }
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
          isSecret: newCommentSecret,
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
        setNewCommentSecret(false);
        setReplyingTo(null);

        // [New] 댓글 알림 전송 (본인 프로젝트가 아닐 경우)
        if (project.userId && project.userId !== session.user.id) {
             try {
                 const nickname = session.user.user_metadata?.nickname || '회원';
                 await createNotification({
                     userId: project.userId,
                     type: 'comment',
                     title: '새로운 댓글 💬',
                     message: `${nickname}님이 프로젝트에 댓글을 남겼습니다: "${newComment.substring(0, 20)}${newComment.length > 20 ? '...' : ''}"`,
                     link: `/project/${project.id}`,
                     senderId: session.user.id
                 });
             } catch(e) { console.error("알림 전송 실패", e); }
        }
        
        // 포인트 갱신을 위해 프로필 리프레시
        await refreshUserProfile();
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
        // 댓글 목록에서 삭제된 댓글 제거 (재귀적 처리)
        setComments(prev => {
          const removeRecursive = (list: any[]): any[] => {
            return list
              .filter(c => c.comment_id !== commentId) // 현재 레벨에서 삭제
              .map(c => ({
                ...c,
                replies: c.replies ? removeRecursive(c.replies) : [] // 하위 레벨 재귀 처리
              }));
          };
          return removeRecursive(prev);
        });
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
            {/* X 버튼: 시인성 개선 (검정 반투명 배경) */}
            <button
              onClick={() => onOpenChange(false)}
              className="absolute top-4 right-4 z-50 w-9 h-9 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-colors backdrop-blur-sm shadow-sm"
            >
              <FontAwesomeIcon icon={faXmark} className="w-4 h-4" />
            </button>

            {/* 이미지 또는 리치 텍스트 영역 - 스크롤 가능 */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {project.rendering_type === 'rich_text' ? (
                <div 
                  className="prose prose-sm prose-h1:text-xl max-w-full p-6 mx-auto bg-white whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ __html: unescapeHtml(project.description || '') }}
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
                    className="w-10 h-10 rounded-full border border-gray-200 bg-white hover:bg-gray-100 text-gray-600 flex items-center justify-center transition-colors"
                  >
                    <FontAwesomeIcon icon={bookmarked ? faBookmark : faBookmarkRegular} className="w-5 h-5" />
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
                <p className="text-sm text-gray-500 mb-4 text-center">{authorBio}</p>
              </div>

              {/* 작성자의 다른 프로젝트 (모바일) */}
              {otherProjects.length > 0 && (
                <div className="px-4 py-6 bg-gray-50 border-t border-gray-100">
                  <h3 className="text-sm font-bold text-gray-900 mb-4">이 크리에이터의 다른 프로젝트</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {otherProjects.map((p) => (
                      <a key={p.project_id} href={`/project/${p.project_id}`} className="block group">
                        <div className="aspect-square rounded-lg overflow-hidden bg-gray-200 mb-2">
                          <img 
                            src={p.thumbnail_url || '/placeholder.jpg'} 
                            alt={p.title} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        </div>
                        <p className="text-xs font-medium text-gray-900 truncate">{p.title}</p>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* 모바일 댓글 섹션 (리스트 + 입력) */}
              <div className="px-4 py-8 bg-white border-t border-gray-100 mb-20">
                  <h3 className="font-bold text-sm mb-4">댓글 ({comments.length})</h3>
                  
                  {/* 댓글 작성 폼 */}
                  {isLoggedIn ? (
                    <div className="flex gap-2 mb-6">
                      <div className="flex-1 relative">
                        {replyingTo && (
                            <div className="flex items-center justify-between text-xs text-green-600 mb-2 px-1 absolute -top-5 left-0 w-full">
                              <span>@{replyingTo.username}님에게 답글</span>
                              <button onClick={() => setReplyingTo(null)} className="hover:underline">취소</button>
                            </div>
                        )}
                        <textarea 
                          value={newComment} 
                          onChange={(e) => setNewComment(e.target.value)} 
                          placeholder="댓글을 남겨주세요..." 
                          className="w-full px-4 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-green-500 resize-none h-[50px] leading-tight transition-all" 
                        />
                      </div>
                      <Button 
                        onClick={handleCommentSubmit} 
                        disabled={loading.comment || !newComment.trim()}
                        className="bg-green-600 hover:bg-green-700 text-white w-[50px] h-[50px] rounded-xl flex items-center justify-center shadow-sm"
                      >
                        <FontAwesomeIcon icon={faPaperPlane} className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                     <div className="p-4 bg-gray-50 rounded-xl text-center mb-6 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => setLoginModalOpen(true)}>
                        <p className="text-xs text-gray-500">로그인하고 의견을 남겨보세요</p>
                     </div>
                  )}

                  {/* 댓글 리스트 */}
                  <div className="space-y-4">
                    {comments.length > 0 ? (
                        comments.map((comment) => (
                           <CommentItem 
                              key={comment.comment_id} 
                              comment={comment} 
                              onReply={(id, username) => {
                                  setReplyingTo({ id, username });
                                  // Scroll to input?
                              }} 
                              onDelete={handleDeleteComment} 
                              currentUserId={currentUserId} 
                              projectOwnerId={project.userId}
                              depth={0} 
                           />
                        ))
                    ) : (
                        <div className="text-center py-8 text-gray-400 text-xs">
                           <p>아직 댓글이 없습니다.</p>
                        </div>
                    )}
                  </div>
              </div>
            </div>

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

          {/* 데스크톱 뷰 - 기존 구조 유지 + 하단 리뉴얼 섹션 추가 */}
          <div 
             className="hidden md:flex h-full items-end justify-center gap-4 w-full"
             onClick={(e) => {
               // [1671] 배경(빈 공간) 클릭 시 닫기
               if (e.target === e.currentTarget) onOpenChange(false);
             }}
          >
            {/* 메인 이미지 영역 */}
            <div className="w-[66vw] h-full bg-white flex flex-col relative rounded-t-xl overflow-hidden shadow-2xl">
              {/* X 버튼: 시인성 개선 (검정 반투명 배경) */}
              <button
                onClick={() => onOpenChange(false)}
                className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-colors backdrop-blur-sm shadow-md"
              >
                <FontAwesomeIcon icon={faXmark} className="w-5 h-5" />
              </button>

              {/* 프로젝트 정보 헤더 (기존 디자인 유지) */}
              <div className="p-6 bg-white border-b border-gray-100 flex-shrink-0 z-20">
                <h1 className="text-2xl font-bold text-gray-900 mb-2 truncate">
                  {project.title || stripHtml(project.description || project.alt_description || "제목 없음")}
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
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-[10px] text-gray-500">{dayjs(project.created_at).format('YYYY.MM.DD')}</p>
                      <span className="text-[10px] text-gray-300">|</span>
                      <div className="flex items-center gap-3 text-[10px] text-gray-500 font-medium">
                        <span className="flex items-center gap-1">
                          <FontAwesomeIcon icon={faEye} className="w-3 h-3 opacity-60" />
                          {viewsCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <FontAwesomeIcon icon={faHeart} className="w-3 h-3 opacity-60 text-red-400" />
                          {likesCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <FontAwesomeIcon icon={faComment} className="w-3 h-3 opacity-60" />
                          {comments.length}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              </div>
              
              {/* 스크롤 가능한 본문 영역 */}
              <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
                {/* 1. 이미지 / 본문 컨텐츠 */}
                <div className="p-8 flex flex-col items-center min-h-[400px]">
                  {project.rendering_type === 'rich_text' ? (
                    <div 
                      className="prose prose-lg prose-h1:text-3xl max-w-4xl w-full bg-white p-4 whitespace-pre-wrap"
                      dangerouslySetInnerHTML={{ __html: unescapeHtml(project.description || '') }}
                    />
                  ) : (
                    <img
                      src={project.urls.full}
                      alt={project.alt_description || "Project Image"}
                      className="max-w-full h-auto object-contain cursor-zoom-in shadow-sm"
                      onClick={() => setLightboxOpen(true)}
                    />
                  )}
                  {/* RichText가 아닐 경우의 텍스트 설명 */}
                  {project.rendering_type !== 'rich_text' && project.description && (
                     <div className="max-w-3xl w-full mt-12 text-lg text-gray-700 leading-8 whitespace-pre-wrap break-keep">
                        {stripHtml(project.description)}
                     </div>
                  )}
                </div>

                {/* 2. 하단 리뉴얼 섹션 (노트폴리오 스타일) - 본문 끝나고 나타남 */}
                <div className="w-full mt-24 border-t border-gray-100">
                   
                   {/* Feedback Poll Section */}
                   <div className="w-full bg-white py-16 border-b border-gray-100">
                       <div className="max-w-2xl mx-auto px-4">
                          <FeedbackPoll projectId={project.id} />
                       </div>
                   </div>

                   {/* Black Action Bar */}
                   <div className="w-full bg-[#18181b] text-white py-10">
                      <div className="max-w-3xl mx-auto px-4 text-center">
                          <div className="flex items-center justify-center gap-4 mb-8">
                             <Button 
                               onClick={handleLike}
                               className={`h-11 px-6 rounded-full text-base font-bold transition-all shadow-md hover:scale-105 gap-2 border-0 ${
                                 liked ? 'bg-[#ff4e4e] hover:bg-[#e04545] text-white' : 'bg-[#333] hover:bg-[#444] text-white'
                               }`}
                             >
                                <FontAwesomeIcon icon={liked ? faHeart : faHeartRegular} className="w-4 h-4" />
                                {liked ? '좋아요 취소' : '작업 좋아요'}
                             </Button>
                             <Button 
                               onClick={handleCollectionClick} 
                               className={`h-11 px-6 rounded-full text-base font-bold transition-all shadow-md hover:scale-105 gap-2 bg-white text-black hover:bg-gray-200 border-0`}
                             >
                                <FontAwesomeIcon icon={bookmarked ? faBookmark : faBookmarkRegular} className="w-4 h-4" />
                                {bookmarked ? '컬렉션 저장됨' : '컬렉션 저장'}
                             </Button>
                          </div>
                          
                          <div className="inline-block px-3 py-1 bg-green-500 text-white text-xs font-bold rounded mb-3">
                             VIBEFOLIO PICK
                          </div>
                          <h2 className="text-xl font-bold mb-3">{project.title}</h2>
                          
                          <div className="flex items-center justify-center gap-6 text-gray-500 mt-6">
                             <div className="flex items-center gap-2">
                                <FontAwesomeIcon icon={faEye} className="w-4 h-4" />
                                <span className="text-base font-medium text-gray-300">{addCommas(viewsCount)}</span>
                             </div>
                             <div className="flex items-center gap-2">
                                <FontAwesomeIcon icon={faHeart} className="w-4 h-4" />
                                <span className="text-base font-medium text-gray-300">{addCommas(likesCount)}</span>
                             </div>
                          </div>
                      </div>
                   </div>

                   {/* Profile Section - 사이즈 축소 */}
                   <div className="bg-gray-50 py-10 border-b border-gray-100">
                       <div className="max-w-xl mx-auto px-4 text-center">
                           <div className="mb-3 inline-block relative cursor-pointer group" onClick={() => window.location.href=`/creator/${project.user.username}`}>
                              <Avatar className="w-14 h-14 border-2 border-white shadow-sm mx-auto">
                                <AvatarImage src={project.user.profile_image.large} className="object-cover" />
                                <AvatarFallback><FontAwesomeIcon icon={faUser} /></AvatarFallback>
                              </Avatar>
                           </div>
                           <h3 className="text-lg font-bold text-gray-900 mb-1">{project.user.username}</h3>
                           <p className="text-sm text-gray-500 mb-6">{authorBio || "크리에이티브한 작업을 공유합니다."}</p>
                           
                           <div className="flex items-center justify-center gap-2">
                              {isLoggedIn && project.userId && currentUserId !== project.userId && (
                                <Button onClick={handleFollow} variant="outline" className="h-9 px-5 rounded-full border-gray-300 bg-white hover:bg-gray-100 gap-2 text-sm">
                                  {following ? '팔로잉' : '+ 팔로우'}
                                </Button>
                              )}
                              <Button onClick={() => isLoggedIn ? setProposalModalOpen(true) : setLoginModalOpen(true)} className="h-9 px-5 rounded-full bg-[#00d084] hover:bg-[#00b874] text-white border-0 gap-2 font-bold text-sm shadow-sm">
                                <FontAwesomeIcon icon={faPaperPlane} className="w-3 h-3" /> 제안하기
                              </Button>
                           </div>
                       </div>
                   </div>

                   {/* 작성자의 다른 프로젝트 (데스크톱) */}
                   {otherProjects.length > 0 && (
                     <div className="bg-white py-12 border-b border-gray-100">
                       <div className="max-w-4xl mx-auto px-6">
                         <h3 className="text-lg font-bold text-gray-900 mb-6 text-center">이 크리에이터의 다른 프로젝트</h3>
                         <div className="grid grid-cols-4 gap-6">
                           {otherProjects.map((p) => (
                             <a key={p.project_id} href={`/project/${p.project_id}`} className="block group cursor-pointer">
                               <div className="aspect-[4/3] rounded-lg overflow-hidden bg-gray-100 mb-3 shadow-sm group-hover:shadow-md transition-all">
                                 <img 
                                   src={p.thumbnail_url || '/placeholder.jpg'} 
                                   alt={p.title} 
                                   className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                 />
                               </div>
                               <p className="text-sm font-medium text-gray-900 truncate text-center group-hover:text-green-600 transition-colors">{p.title}</p>
                             </a>
                           ))}
                         </div>
                       </div>
                     </div>
                   )}
                   
                   {/* 하단 댓글 영역 삭제됨 (요청사항 반영) */}
                </div>
              </div>
            </div>

            {/* 액션바 - 데스크톱 (기존 우측 사이드바 복원) */}
            <div className="h-full bg-transparent flex flex-col items-center py-8 gap-4">
              <button 
                onClick={() => { window.location.href = `/creator/${project.user.username}`; }} 
                className="flex flex-col items-center gap-1 group cursor-pointer mb-2"
                title="프로필로 이동"
              >
                <Avatar className={`w-12 h-12 border-2 bg-white transition-all shadow-md group-hover:scale-105 ${following ? 'border-green-600' : 'border-white group-hover:border-green-600'}`}>
                  <AvatarImage src={project.user.profile_image.large} />
                  <AvatarFallback className="bg-white"><FontAwesomeIcon icon={faUser} className="w-4 h-4" /></AvatarFallback>
                </Avatar>
              </button>

              {/* [New] New Episode Button for Owner */}
              {String(currentUserId) === String(project.userId) && (
                <div className="relative group flex items-center mb-2">
                   <button 
                    onClick={() => {
                        window.location.href = `/project/upload?mode=version&projectId=${project.id}`;
                    }} 
                    className="w-12 h-12 rounded-full border border-gray-100 shadow-lg flex items-center justify-center transition-all hover:scale-105 bg-white text-gray-700 hover:bg-indigo-600 hover:text-white"
                  >
                    <div className="relative">
                        <FontAwesomeIcon icon={faRocket} className="w-5 h-5" />
                        <span className="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white shadow-sm ring-2 ring-white">
                            N
                        </span>
                    </div>
                  </button>
                  <div className="absolute right-full mr-3 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-md">
                     새 에피소드 발행
                     <div className="absolute top-1/2 -translate-y-1/2 -right-1 border-4 border-transparent border-l-gray-900"></div>
                  </div>
                </div>
              )}

              {isLoggedIn && project.userId && currentUserId !== project.userId && (
                <div className="flex flex-col items-center mb-2">
                  <Button onClick={handleFollow} disabled={loading.follow} size="sm" className={`text-xs px-3 py-1 h-8 rounded-full transition-all shadow-md ${following ? 'bg-white text-gray-700 border border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200' : 'bg-green-600 text-white hover:bg-green-700 hover:scale-105'}`}>
                    {loading.follow ? '...' : (following ? '팔로잉' : '팔로우')}
                  </Button>
                </div>
              )}

              {/* Version History (Rocket) - Visible to everyone */}
              <div className="relative group flex items-center mt-2">
                 <button 
                  onClick={() => setHistoryModalOpen(true)} 
                  className={`w-12 h-12 rounded-full border border-gray-100 shadow-lg flex items-center justify-center transition-all hover:scale-105 bg-white text-gray-700 hover:bg-blue-600 hover:text-white`}
                >
                  <FontAwesomeIcon icon={faRocket} className="w-5 h-5" />
                </button>
                {/* Tooltip */}
                <div className="absolute right-full mr-3 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-md">
                   {versions.length > 0 ? `현재 버전: ${versions[0].version_name}` : "프로젝트 히스토리"}
                   <div className="absolute top-1/2 -translate-y-1/2 -right-1 border-4 border-transparent border-l-gray-900"></div>
                </div>
              </div>

              {/* Proposal (PaperPlane) - Visible to non-owners */}
              {String(currentUserId) !== String(project.userId) && (
                <div className="relative group flex items-center mt-2">
                   <button 
                    onClick={() => { 
                      if (!isLoggedIn) { setLoginModalOpen(true); return; } 
                      setProposalModalOpen(true); 
                    }} 
                    className={`w-12 h-12 rounded-full border border-gray-100 shadow-lg flex items-center justify-center transition-all hover:scale-105 bg-white text-gray-700 hover:bg-green-600 hover:text-white`}
                  >
                    <FontAwesomeIcon icon={faPaperPlane} className="w-5 h-5" />
                  </button>
                  <div className="absolute right-full mr-3 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-md">
                     제안하기
                     <div className="absolute top-1/2 -translate-y-1/2 -right-1 border-4 border-transparent border-l-gray-900"></div>
                  </div>
                </div>
              )}

              <button onClick={handleLike} disabled={!isLoggedIn} className={`w-12 h-12 rounded-full border border-gray-100 shadow-lg flex flex-col items-center justify-center transition-all hover:scale-105 ${liked ? 'bg-red-500 text-white border-red-500' : 'bg-white text-gray-700 hover:bg-red-50 hover:text-red-500'}`}>
                {loading.like ? <FontAwesomeIcon icon={faSpinner} className="w-5 h-5 animate-spin" /> : <FontAwesomeIcon icon={liked ? faHeart : faHeartRegular} className="w-5 h-5" />}
              </button>

              <button onClick={handleCollectionClick} className="w-12 h-12 rounded-full bg-white text-gray-700 border border-gray-100 shadow-lg hover:bg-blue-500 hover:text-white hover:scale-105 flex items-center justify-center transition-all" title="컬렉션에 저장">
                <FontAwesomeIcon icon={faFolder} className="w-5 h-5" />
              </button>

              <button onClick={() => setShareModalOpen(true)} className="w-12 h-12 rounded-full bg-white text-gray-700 border border-gray-100 shadow-lg hover:bg-green-600 hover:text-white hover:scale-105 flex items-center justify-center transition-all">
                <FontAwesomeIcon icon={faShareNodes} className="w-5 h-5" />
              </button>

              <button onClick={() => setCommentsPanelOpen(!commentsPanelOpen)} className={`w-12 h-12 rounded-full border border-gray-100 shadow-lg flex items-center justify-center transition-all hover:scale-105 ${commentsPanelOpen ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-700 hover:bg-green-600 hover:text-white'}`}>
                <FontAwesomeIcon icon={faComment} className="w-5 h-5" />
              </button>


            </div>

            {/* 댓글 패널 (우측 사이드바 기능용) */}
            {commentsPanelOpen && (
              <div className="w-[30%] h-full bg-white flex flex-col border-l border-gray-200 ml-4 rounded-t-xl overflow-hidden shadow-xl">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white z-10">
                  <h3 className="font-bold text-sm">댓글 ({comments.length})</h3>
                  <button onClick={() => setCommentsPanelOpen(false)} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                    <FontAwesomeIcon icon={faXmark} className="w-4 h-4" />
                  </button>
                </div>

                {/* 1줄 설명 (Summary) - 댓글 상단에 위치 */}
                {project.summary && (
                  <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                     <div className="flex items-start gap-2">
                        <FontAwesomeIcon icon={faUser} className="w-3 h-3 mt-1 text-gray-400" />
                        <div>
                           <p className="text-xs font-bold text-gray-700 mb-0.5">작가의 한마디</p>
                           <p className="text-sm text-gray-800 leading-relaxed text-pretty">
                             {project.summary}
                           </p>
                        </div>
                     </div>
                  </div>
                )}

                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white">
                   {comments.length > 0 ? (
                       comments.map((comment) => (
                          <CommentItem key={comment.id + 'panel'} comment={comment} onReply={(id, username) => setReplyingTo({ id, username })} onDelete={handleDeleteComment} currentUserId={currentUserId} projectOwnerId={project.userId} depth={0} />
                       ))
                   ) : (
                       <div className="flex flex-col items-center justify-center h-40 text-gray-400 text-sm">
                          <FontAwesomeIcon icon={faComment} className="w-8 h-8 mb-2 opacity-20" />
                          <p>첫 댓글을 남겨보세요!</p>
                       </div>
                   )}
                </div>
                 
                 {isLoggedIn ? (
                   <div className="p-3 border-t border-gray-100 bg-white">
                      {replyingTo && (
                        <div className="flex items-center justify-between text-xs text-green-600 mb-2 px-1">
                          <span>@{replyingTo.username}님에게 답글 작성 중</span>
                          <button onClick={() => setReplyingTo(null)} className="hover:underline">취소</button>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <textarea 
                          value={newComment} 
                          onChange={(e) => setNewComment(e.target.value)} 
                          onKeyDown={(e) => {
                             if(e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleCommentSubmit();
                             }
                          }}
                          placeholder="댓글 작성..." 
                          className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-green-500 resize-none h-[42px] leading-tight" 
                        />
                        <Button 
                          onClick={handleCommentSubmit} 
                          size="sm"
                          disabled={loading.comment || !newComment.trim()}
                          className="bg-green-600 hover:bg-green-700 text-white h-[42px] px-4 rounded-lg"
                        >
                          <FontAwesomeIcon icon={faPaperPlane} className="w-3 h-3" />
                        </Button>
                      </div>
                      <div className="flex justify-end mt-1">
                        <button
                          onClick={() => setNewCommentSecret(!newCommentSecret)}
                          className={`flex items-center gap-1.5 text-xs font-bold px-2 py-1 rounded transition-colors ${newCommentSecret ? 'text-amber-600 bg-amber-50' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                          <FontAwesomeIcon icon={newCommentSecret ? faLock : faUnlock} className="w-3 h-3" />
                          {newCommentSecret ? "비밀글" : "공개"}
                        </button>
                      </div>
                   </div>
                 ) : (
                    <div className="p-4 border-t border-gray-100 bg-gray-50 text-center">
                       <button onClick={() => setLoginModalOpen(true)} className="text-xs text-green-600 font-bold hover:underline">
                          로그인 후 댓글을 남겨주세요
                       </button>
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
      


      <VersionHistoryModal
        open={isHistoryModalOpen}
        onOpenChange={setHistoryModalOpen}
        versions={versions}
        projectId={project.id}
        isOwner={String(currentUserId) === String(project.userId)}
        onSelectVersion={(v) => {
           // TODO: Scroll to version content
           setHistoryModalOpen(false);
        }}
      />
    </>
  );
}
