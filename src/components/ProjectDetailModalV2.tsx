"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { OptimizedImage } from "./OptimizedImage";
import { FeedbackPoll } from "./FeedbackPoll";
import { MichelinRating } from "./MichelinRating";
import { useLikes } from "@/hooks/useLikes";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { getSafeCustomData } from "@/lib/utils/data";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FontAwesomeIcon } from "./FaIcon";
import { faHeart, faShareNodes, faComment, faBookmark, faPaperPlane, faUser, faXmark, faChartSimple, faSpinner, faFolder, faEye, faCheck, faLock, faUnlock, faRocket, faStar, faFaceSmile, faMapPin, faClock } from "@fortawesome/free-solid-svg-icons";
import { toast } from "sonner";

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
  const isAuthor = String(comment.user_id) === String(projectOwnerId);
  const isSecret = comment.is_secret;
  const isProposal = comment.content?.includes("[협업 제안]");
  const canView = !isSecret || (currentUserId && (String(comment.user_id) === String(currentUserId) || String(projectOwnerId) === String(currentUserId)));
  
  return (
    <div className={`relative ${depth > 0 ? 'ml-5 mt-3 pl-3' : 'mt-5 first:mt-1'}`}>
      {/* Reply Connector Line */}
      {depth > 0 && (
        <div className="absolute left-0 top-0 bottom-0 w-px bg-gray-100 rounded-full h-full"></div>
      )}

      <div className={`flex gap-3 group/item ${isProposal && canView ? 'bg-emerald-50/40 -mx-3 px-3 py-2 rounded-2xl border border-emerald-100/50' : ''}`}>
        <Avatar className={`flex-shrink-0 bg-white shadow-sm ring-2 ${isAuthor ? 'ring-blue-100' : 'ring-gray-50'} ${depth > 0 ? 'w-5 h-5' : 'w-7 h-7'}`}>
          <AvatarImage src={comment.user?.profile_image_url || '/globe.svg'} />
          <AvatarFallback className="bg-white"><FontAwesomeIcon icon={faUser} className="w-3 h-3 text-gray-400" /></AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div className="flex items-center gap-1.5 overflow-hidden">
               <span className={`font-black tracking-tight truncate ${depth > 0 ? 'text-[10px]' : 'text-xs'} ${isAuthor ? 'text-blue-600' : 'text-gray-900'}`}>
                 {comment.user?.username || 'Unknown'}
               </span>
               {isAuthor && (
                 <span className="px-1.5 py-0.5 bg-blue-600 text-white text-[7px] font-black rounded uppercase tracking-tighter shadow-sm flex-shrink-0">AUTHOR</span>
               )}
               {isSecret && (
                  <span className={`${isProposal ? 'bg-emerald-600 text-white' : 'bg-amber-100 text-amber-600 border border-amber-200'} text-[8px] px-1.5 py-0.5 rounded-full font-black flex items-center gap-1 shadow-xs flex-shrink-0`}>
                    <FontAwesomeIcon icon={isProposal ? faPaperPlane : faLock} className="w-1.5 h-1.5" /> 
                    {isProposal ? "PRIVATE INQUIRY" : "SECRET"}
                  </span>
               )}
            </div>
            <span className="text-[9px] text-gray-300 font-bold tabular-nums ml-auto whitespace-nowrap">{dayjs(comment.created_at).fromNow()}</span>
          </div>

          <div className="relative">
            <p className={`whitespace-pre-wrap leading-relaxed break-words font-medium ${depth > 0 ? 'text-[11px]' : 'text-[12px]'} ${isSecret && !canView ? 'text-gray-400 italic' : (isAuthor ? 'text-gray-800' : 'text-gray-600')} ${isProposal && canView ? 'text-emerald-900' : ''}`}>
              {canView ? comment.content : (isProposal ? "작성자와 프로젝트 관리자만 볼 수 있는 비밀 제안입니다." : "작성자와 프로젝트 관리자만 볼 수 있는 비밀 댓글입니다.")}
            </p>
          </div>

          <div className="flex items-center gap-3 mt-1.5 opacity-0 group-hover/item:opacity-100 transition-opacity">
            <button
              onClick={() => onReply(comment.comment_id, comment.user?.username || 'Unknown')}
              className="text-[9px] font-black text-gray-400 hover:text-blue-600 transition-colors tracking-widest uppercase"
            >
              Reply
            </button>
            {isOwner && (
              <button
                onClick={() => onDelete(comment.comment_id)}
                className="text-[9px] font-black text-gray-300 hover:text-red-500 transition-colors tracking-widest uppercase"
              >
                Delete
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 대댓글 */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="relative">
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
    allow_michelin_rating?: boolean;
    allow_stickers?: boolean;
    allow_secret_comments?: boolean;
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
  const router = useRouter();

  // [Refactor] useLikes 훅 사용 - 상세 모달에서는 실시간 구독 활성화
  const { isLiked, likesCount, toggleLike, isLoading: isLikeLoading } = useLikes(project?.id, project?.likes || 0, true);

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
  // const [likesCount, setLikesCount] = useState(0); // useLikes로 대체됨
  const [viewsCount, setViewsCount] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [authorBio, setAuthorBio] = useState("");
  const { refreshUserProfile } = useAuth();

  const [loading, setLoading] = useState({
    // like: false, // useLikes isLoading으로 대체됨
    bookmark: false,
    comment: false,
    follow: false,
  });
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [otherProjects, setOtherProjects] = useState<any[]>([]);
  // [New] Dynamic Title for Related Projects Section
  const [otherProjectsTitle, setOtherProjectsTitle] = useState("이 크리에이터의 다른 프로젝트");

  // [New] Pin Mode State
  const [isPinMode, setIsPinMode] = useState(false);
  const [tempPin, setTempPin] = useState<{x: number, y: number} | null>(null);
  const [activePinId, setActivePinId] = useState<string | null>(null);

  // [Growth Mode] Feedback Settings Derived State
  const cData = getSafeCustomData(project);
  const isGrowthRequested = cData?.is_growth_requested === true || (project as any)?.is_growth_requested === true;
  // [Fix] Handle both legacy and new flags for showing feedback UI
  const isFeedbackRequested = cData?.is_feedback_requested === true || isGrowthRequested === true;
  const isAuditMode = isGrowthRequested && cData?.audit_config;
  const isGrowthMode = isGrowthRequested && !cData?.audit_config;
  const allowMichelin = project?.allow_michelin_rating ?? true;
  const allowStickers = project?.allow_stickers ?? true;

  const isAuthor = currentUserId === project?.userId;



  useEffect(() => {
    if (!project || !open) return;

    // 초기값 세팅

    setViewsCount(project.views || 0);

    const checkUserAndFetchData = async () => {
      // 1. 세션 및 사용자 정보
      const { data: { session } } = await supabase.auth.getSession();
      const currentId = session?.user?.id || null;
      setIsLoggedIn(!!session);
      setCurrentUserId(currentId);

      // 2. 좋아요 체크
      // 2. 팔로우 체크 (좋아요 체크 제거됨)
      if (currentId) {
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
        .from('Comment')
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
          // [New] Location Data mapping
          location_x: c.location_x, 
          location_y: c.location_y
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

      // 6. 관련 프로젝트 조회 (시리즈 에피소드 우선)
      if (project.userId) {
        try {
           let foundEpisodes = false;

           // A. 컬렉션(시리즈) 확인
           const { data: collectionItem } = await supabase
             .from('CollectionItem')
             .select('collection_id, Collection(title)')
             .eq('project_id', parseInt(project.id))
             .maybeSingle();
           
           if (collectionItem && collectionItem.Collection) {
               const colTitle = (collectionItem.Collection as any).title;
               
               // 컬렉션 내 다른 프로젝트 ID 조회
               const { data: items } = await supabase
                   .from('CollectionItem')
                   .select('project_id')
                   .eq('collection_id', collectionItem.collection_id)
                   .neq('project_id', parseInt(project.id));
                
               if (items && items.length > 0) {
                   const pIds = items.map((i: any) => i.project_id);
                   
                   // 프로젝트 정보 조회 (삭제된 것 제외)
                   const { data: episodes } = await supabase
                       .from('Project')
                       .select('project_id, title, thumbnail_url')
                       .in('project_id', pIds)
                       .is('deleted_at', null)
                       .order('created_at', { ascending: false })
                       .limit(4);
                    
                   if (episodes && episodes.length > 0) {
                       setOtherProjects(episodes);
                       setOtherProjectsTitle(`'${colTitle}' 시리즈의 에피소드`);
                       foundEpisodes = true;
                   }
               }
           }

           // B. 시리즈가 없으면 작가의 다른 프로젝트 (삭제된 것 제외)
           if (!foundEpisodes) {
              const { data: others } = await supabase
                .from('Project')
                .select('project_id, title, thumbnail_url')
                .eq('user_id', project.userId)
                .neq('project_id', parseInt(project.id))
                .is('deleted_at', null) // [Fix] Filter deleted
                .order('created_at', { ascending: false })
                .limit(4);
              
              setOtherProjects(others || []);
              setOtherProjectsTitle("이 크리에이터의 다른 프로젝트");
           }
        } catch (e) {
          console.error("Related projects fetch error:", e);
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
            fetch(`/api/wishlists?projectId=${projectId}&userId=${user.id}`)
          ];
          
          // 작성자 ID가 있고 본인이 아닌 경우 팔로우 상태도 확인
          if (project.userId && project.userId !== user.id) {
            fetchPromises.push(
              fetch(`/api/follows?followerId=${user.id}&followingId=${project.userId}`)
            );
          }

          const results = await Promise.all(fetchPromises);
          const [bookmarkCheckData] = await Promise.all([
            results[0].json()
          ]);
          
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
          // [New] Send Location Data
          locationX: tempPin?.x,
          locationY: tempPin?.y
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
        setTempPin(null);
        setIsPinMode(false);

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
          <DialogTitle className="sr-only">{project.title || "Project Detail"}</DialogTitle>
          <DialogDescription className="sr-only">Project Details</DialogDescription>
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
                    <div 
                      className={`relative inline-block w-full ${isPinMode ? 'cursor-crosshair' : 'cursor-zoom-in'}`}
                      onClick={(e) => {
                         if (isPinMode) {
                            // Calculate % coordinates
                            const rect = e.currentTarget.getBoundingClientRect();
                            const x = ((e.clientX - rect.left) / rect.width) * 100;
                            const y = ((e.clientY - rect.top) / rect.height) * 100;
                            setTempPin({ x, y });
                            setCommentsPanelOpen(true); // Open panel to type comment
                            
                            // Focus input if possible
                            setTimeout(() => {
                                const input = document.querySelector('textarea[placeholder="댓글 작성..."]') as HTMLTextAreaElement;
                                if(input) input.focus();
                            }, 100);
                         } else {
                            setLightboxOpen(true);
                         }
                      }}
                    >
                        <OptimizedImage
                          src={project.urls.full}
                          alt={project.alt_description || "Project Image"}
                          className="w-full h-auto object-contain shadow-sm"
                          width={1200}
                          height={1600}
                          priority={true}
                        />
                        
                        {/* Render Existing Pins */}
                        {comments.map((comment) => {
                            if (comment.location_x != null && comment.location_y != null) {
                                return (
                                    <div
                                        key={`pin-${comment.comment_id}`}
                                        className="absolute w-8 h-8 -ml-4 -mt-8 z-10 group"
                                        style={{ left: `${comment.location_x}%`, top: `${comment.location_y}%` }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setActivePinId(comment.comment_id);
                                            setCommentsPanelOpen(true);
                                        }}
                                    >
                                        <div className={`w-full h-full flex items-center justify-center drop-shadow-md transition-transform hover:scale-110 cursor-pointer ${activePinId === comment.comment_id ? 'text-green-600 scale-125' : 'text-red-500'}`}>
                                            <FontAwesomeIcon icon={faMapPin} className="w-full h-full filter drop-shadow-sm" />
                                        </div>
                                        {/* Tooltip on Hover */}
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-white p-2 rounded-lg shadow-xl text-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                                            <div className="font-bold mb-1 truncate">{comment.user_name}</div>
                                            <div className="text-gray-600 line-clamp-2">{comment.content}</div>
                                            <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 border-4 border-transparent border-t-white"></div>
                                        </div>
                                    </div>
                                );
                            }
                            return null;
                        })}

                        {/* Render Temp Pin */}
                        {tempPin && (
                             <div
                                className="absolute w-8 h-8 -ml-4 -mt-8 z-20 animate-bounce"
                                style={{ left: `${tempPin.x}%`, top: `${tempPin.y}%` }}
                            >
                                <FontAwesomeIcon icon={faMapPin} className="w-full h-full text-green-500 drop-shadow-lg" />
                                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-green-600 text-white text-[10px] font-bold px-2 py-0.5 rounded whitespace-nowrap">
                                    작성 중...
                                </div>
                            </div>
                        )}
                    </div>
                  )}
              
              {/* 액션 아이콘들 - 이미지 아래 */}
              <div className="px-4 py-3 flex items-center justify-between border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => toggleLike()}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                      isLiked ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    <FontAwesomeIcon icon={isLiked ? faHeart : faHeartRegular} className="w-5 h-5" />
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
                  {versions.length > 0 && (
                    <button 
                      onClick={() => setHistoryModalOpen(true)}
                      className="w-10 h-10 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center relative"
                    >
                      <FontAwesomeIcon icon={faClock} className="w-5 h-5" />
                      <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[8px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                        {versions.length}
                      </span>
                    </button>
                  )}
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

              {/* Mobile Feedback Integration Section */}
              {isFeedbackRequested && ((project as any).allow_michelin_rating || (project as any).allow_stickers) && (
                <div className="w-full px-4 py-8 bg-gray-50 border-t border-gray-100 space-y-8">
                  <div className="text-center">
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-white rounded-full border border-gray-200 text-gray-600 shadow-sm text-xs font-bold">
                       <FontAwesomeIcon icon={faComment} className="w-3 h-3 text-gray-400" />
                       Review & Feedback
                    </span>
                  </div>
                  {(project as any).allow_michelin_rating && <div className="scale-90 origin-top"><MichelinRating projectId={project.id} /></div>}
                  {(project as any).allow_stickers && <div className="scale-90 origin-top"><FeedbackPoll projectId={project.id} /></div>}
                </div>
              )}

              {/* 작성자의 다른 프로젝트 (모바일) */}
              {otherProjects.length > 0 && (
                <div className="px-4 py-6 bg-gray-50 border-t border-gray-100">
                  <h3 className="text-sm font-bold text-gray-900 mb-4">{otherProjectsTitle}</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {otherProjects.map((p) => (
                      <a key={p.project_id} href={`/project/${p.project_id}`} className="block group">
                        <div className="aspect-square rounded-lg overflow-hidden bg-gray-200 mb-2">
                          <OptimizedImage
                            src={p.thumbnail_url || '/placeholder.jpg'} 
                            alt={p.title} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            width={300}
                            height={300}
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

          {/* 데스크톱 뷰 - New Split Layout (Feedback Sidebar) */}
          <div 
             className="hidden md:flex items-center justify-center w-full h-full p-8"
             onClick={(e) => {
               if (e.target === e.currentTarget) onOpenChange(false);
             }}
          >
             {/* Main Modal Container */}
             <div className="bg-white w-[95vw] max-w-[1600px] h-[90vh] rounded-[2rem] shadow-2xl overflow-hidden flex relative ring-1 ring-slate-900/5 animate-in zoom-in-95 duration-300">
                
                {/* Close Button */}
                <button
                  onClick={() => onOpenChange(false)}
                  className="absolute top-6 right-6 z-50 w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors shadow-sm"
                >
                  <FontAwesomeIcon icon={faXmark} className="w-5 h-5" />
                </button>

                {/* LEFT PANEL: Content (Scrollable) */}
                <div className="flex-1 h-full bg-slate-50 flex flex-col min-w-0">
                   <div className="flex-1 overflow-y-auto custom-scrollbar p-10 flex flex-col items-center">
                      {/* Project Meta Header */}
                      <div className="w-full max-w-5xl mb-8">
                          <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-tight mb-3">
                            {project.title || stripHtml(project.description || project.alt_description || "제목 없음")}
                          </h1>
                          <div className="flex items-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-wide">
                              <span className="flex items-center gap-1.5 px-2.5 py-1 bg-white rounded-full border border-slate-200 shadow-sm text-slate-600">
                                <FontAwesomeIcon icon={faUser} /> {project.user.username}
                              </span>
                              <span className="flex items-center gap-1">
                                <FontAwesomeIcon icon={faClock} /> {dayjs(project.created_at).fromNow()}
                              </span>
                              <span className="flex items-center gap-1">
                                <FontAwesomeIcon icon={faEye} /> {addCommas(viewsCount)}
                              </span>
                          </div>
                      </div>

                      {/* Content Render */}
                      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-sm p-2 min-h-[500px]">
                        {project.rendering_type === 'rich_text' ? (
                            <div 
                              className="prose prose-lg prose-h1:text-3xl max-w-none w-full bg-white p-8 whitespace-pre-wrap"
                              dangerouslySetInnerHTML={{ __html: unescapeHtml(project?.description || '') }}
                            />
                        ) : (
                            <div 
                              className={`relative w-full h-full flex flex-col gap-4 ${isPinMode ? 'cursor-crosshair' : 'cursor-zoom-in'}`}
                              onClick={(e) => {
                                  if (isPinMode) {
                                      const rect = e.currentTarget.getBoundingClientRect();
                                      const x = ((e.clientX - rect.left) / rect.width) * 100;
                                      const y = ((e.clientY - rect.top) / rect.height) * 100;
                                      setTempPin({ x, y });
                                      // Sidebar의 comments panel이 열리도록 트리거
                                      setCommentsPanelOpen(true);
                                  } else {
                                      setLightboxOpen(true);
                                  }
                              }}
                            >
                                <OptimizedImage
                                    src={project.urls.full}
                                    alt={project.alt_description || "Project Image"}
                                    className="w-full h-auto object-contain rounded-xl"
                                    width={1600}
                                    height={1200}
                                    priority={true}
                                />
                                
                                {/* Existing Pins */}
                                {comments.map((comment) => {
                                    if (comment.location_x != null && comment.location_y != null) {
                                        return (
                                            <div
                                                key={`pin-${comment.comment_id}`}
                                                className="absolute w-8 h-8 -ml-4 -mt-8 z-10 group"
                                                style={{ left: `${comment.location_x}%`, top: `${comment.location_y}%` }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setActivePinId(comment.comment_id);
                                                    setCommentsPanelOpen(true);
                                                }}
                                            >
                                                <div className={`w-full h-full flex items-center justify-center drop-shadow-md transition-transform hover:scale-110 cursor-pointer ${activePinId === comment.comment_id ? 'text-green-600 scale-125' : 'text-red-500'}`}>
                                                    <FontAwesomeIcon icon={faMapPin} className="w-full h-full filter drop-shadow-sm" />
                                                </div>
                                            </div>
                                        );
                                    }
                                    return null;
                                })}
                                
                                {/* Temp Pin */}
                                {tempPin && (
                                    <div
                                        className="absolute w-8 h-8 -ml-4 -mt-8 z-20 animate-bounce"
                                        style={{ left: `${tempPin.x}%`, top: `${tempPin.y}%` }}
                                    >
                                        <FontAwesomeIcon icon={faMapPin} className="w-full h-full text-green-500 drop-shadow-lg" />
                                    </div>
                                )}
                            </div>
                        )}
                      </div>
                      
                      {/* Description Text (if not rich text) */}
                      {project.rendering_type !== 'rich_text' && project.description && (
                         <div className="mt-8 max-w-4xl w-full whitespace-pre-wrap leading-relaxed text-slate-600 p-6 bg-white rounded-2xl border border-slate-100 italic">
                            {stripHtml(project.description)}
                         </div>
                      )}

                      {/* Bottom Space */}
                      <div className="h-20" />
                   </div>
                </div>

                {/* RIGHT PANEL: Sidebar (Interaction) */}
                <div className="w-[450px] h-full bg-white border-l border-slate-100 flex flex-col shrink-0 relative z-20 shadow-xl">
                   
                   {/* 1. Sidebar Header: Author Profile */}
                   <div className="p-6 border-b border-slate-100 flex items-center gap-4 bg-white z-10">
                      <Avatar className="w-12 h-12 border border-slate-200 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => window.location.href=`/creator/${project.user.username}`}>
                        <AvatarImage src={project.user.profile_image.large} />
                        <AvatarFallback><FontAwesomeIcon icon={faUser} /></AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                             <h3 className="font-bold text-slate-900 truncate hover:underline cursor-pointer" onClick={() => window.location.href=`/creator/${project.user.username}`}>
                                {project.user.username}
                             </h3>
                             {isAuthor && <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-bold">ME</span>}
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-1">{authorBio}</p>
                      </div>
                      <div className="ml-auto">
                        {!isAuthor && (
                           <Button 
                             size="sm" 
                             variant={following ? "outline" : "default"} 
                             onClick={handleFollow} 
                             className={`h-8 text-xs rounded-full font-bold px-4 ${following ? 'border-slate-200 text-slate-500' : 'bg-slate-900 text-white'}`}
                           >
                              {following ? "Following" : "Follow"}
                           </Button>
                        )}
                      </div>
                   </div>

                   {/* 2. Sidebar Scrollable Content */}
                   <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8 bg-white">
                      
                      {/* [SECTION] Evaluation UI */}
                      {isFeedbackRequested && ((project as any).allow_michelin_rating || (project as any).allow_stickers) && (
                         <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                               <h4 className="font-black text-lg text-slate-900 flex items-center gap-2 tracking-tight">
                                  <FontAwesomeIcon icon={faStar} className="text-amber-400" />
                                  평가 및 피드백
                               </h4>
                               <span className="text-[10px] font-bold bg-green-50 text-green-600 px-2 py-0.5 rounded-full uppercase tracking-wide border border-green-100">Active</span>
                            </div>
                            
                            {/* Michelin Rating Component */}
                            {(project as any).allow_michelin_rating && (
                                <div className="bg-slate-50 rounded-2xl p-1 border border-slate-100">
                                   <MichelinRating projectId={project.id} />
                                </div>
                            )}

                            {/* Sticker Poll Component */}
                            {(project as any).allow_stickers && (
                                <div className="pt-4 border-t border-slate-100 border-dashed">
                                   <h5 className="font-bold text-sm text-slate-900 mb-3 flex items-center gap-2">
                                     <FontAwesomeIcon icon={faFaceSmile} className="text-blue-500" /> 스티커 반응
                                   </h5>
                                   <FeedbackPoll projectId={project.id} />
                                </div>
                            )}
                         </div>
                      )}

                      {/* [SECTION] Comments & Activity */}
                      <div className="space-y-4 pt-4">
                         <div className="flex items-center justify-between">
                            <h4 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                               <FontAwesomeIcon icon={faComment} className="text-slate-400" />
                               댓글 및 활동 ({comments.length})
                            </h4>
                         </div>
                         
                         <div className="space-y-6">
                            {comments.length > 0 ? (
                                comments.map((comment, idx) => (
                                    <CommentItem 
                                        key={comment.comment_id + '_sb_' + idx} 
                                        comment={comment} 
                                        onReply={(id, username) => setReplyingTo({ id, username })} 
                                        onDelete={handleDeleteComment} 
                                        currentUserId={currentUserId} 
                                        projectOwnerId={project.userId} 
                                        depth={0} 
                                    />
                                ))
                            ) : (
                                <div className="py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                    <p className="text-xs text-slate-400">아직 작성된 댓글이 없습니다.<br/>첫 번째 의견을 남겨보세요!</p>
                                </div>
                            )}
                         </div>
                      </div>
                   </div>

                   {/* 3. Sidebar Bottom (Input & Actions) */}
                   <div className="p-4 border-t border-slate-100 bg-white z-20 shadow-[0_-5px_20px_rgba(0,0,0,0.02)]">
                      {isLoggedIn ? (
                        <div className="space-y-3">
                           {replyingTo && (
                                <div className="flex items-center justify-between text-xs text-green-600 px-1 bg-green-50 py-1 rounded-lg">
                                  <span>@{replyingTo.username}에게 답글 작성</span>
                                  <button onClick={() => setReplyingTo(null)} className="hover:underline font-bold">취소</button>
                                </div>
                           )}
                           <div className="flex gap-2 relative">
                               <textarea 
                                 value={newComment} 
                                 onChange={(e) => setNewComment(e.target.value)} 
                                 placeholder={isPinMode ? "핀 위치에 댓글 남기기..." : "댓글을 입력하세요..."}
                                 className="flex-1 px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-900 focus:bg-white resize-none h-[48px] leading-tight transition-all"
                                 onKeyDown={(e) => {
                                    if(e.key === 'Enter' && !e.shiftKey) {
                                       e.preventDefault();
                                       handleCommentSubmit();
                                    }
                                 }}
                               />
                               <Button 
                                 onClick={handleCommentSubmit} 
                                 disabled={loading.comment || !newComment.trim()}
                                 className="h-[48px] w-[48px] rounded-xl bg-slate-900 hover:bg-black text-white shrink-0 flex items-center justify-center"
                               >
                                 <FontAwesomeIcon icon={faPaperPlane} className="w-4 h-4" />
                               </Button>
                           </div>
                           <div className="flex items-center justify-between">
                               <div className="flex gap-2">
                                  <button 
                                     onClick={() => setNewCommentSecret(!newCommentSecret)}
                                     className={`p-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${newCommentSecret ? 'bg-amber-100 text-amber-600' : 'text-slate-400 hover:bg-slate-100'}`}
                                     title="비밀 댓글"
                                  >
                                     <FontAwesomeIcon icon={newCommentSecret ? faLock : faUnlock} />
                                  </button>
                                  {(project as any).allow_stickers && (
                                     <button 
                                      onClick={() => setIsPinMode(!isPinMode)}
                                      className={`p-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${isPinMode ? 'bg-green-100 text-green-600' : 'text-slate-400 hover:bg-slate-100'}`}
                                      title="이미지에 핀 찍기"
                                     >
                                         <FontAwesomeIcon icon={faMapPin} /> 핀 모드
                                     </button>
                                  )}
                               </div>
                               <div className="flex gap-2">
                                   <Button 
                                     variant="ghost" 
                                     size="icon" 
                                     onClick={toggleLike}
                                     className={`rounded-full w-9 h-9 ${isLiked ? 'text-red-500 bg-red-50' : 'text-slate-400 hover:bg-slate-100'}`}
                                   >
                                      <FontAwesomeIcon icon={isLiked ? faHeart : faHeartRegular} />
                                   </Button>
                                   <Button 
                                     variant="ghost" 
                                     size="icon" 
                                     onClick={handleCollectionClick}
                                     className={`rounded-full w-9 h-9 ${bookmarked ? 'text-blue-500 bg-blue-50' : 'text-slate-400 hover:bg-slate-100'}`}
                                   >
                                      <FontAwesomeIcon icon={bookmarked ? faBookmark : faBookmarkRegular} />
                                   </Button>
                                   <Button 
                                     variant="ghost" 
                                     size="icon"
                                     onClick={() => setShareModalOpen(true)}
                                     className="rounded-full w-9 h-9 text-slate-400 hover:bg-slate-100"
                                   >
                                      <FontAwesomeIcon icon={faShareNodes} />
                                   </Button>
                               </div>
                           </div>
                        </div>
                      ) : (
                         <div 
                           className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-4 text-center cursor-pointer hover:bg-slate-100 transition-colors"
                           onClick={() => setLoginModalOpen(true)}
                         >
                            <p className="text-xs font-bold text-slate-500">로그인하고 의견을 남겨보세요 👋</p>
                         </div>
                      )}
                   </div>
                </div>

             </div>
          </div>
        </DialogContent>
      </Dialog>

      <ShareModal
        open={shareModalOpen}
        onOpenChange={setShareModalOpen}
        url={typeof window !== 'undefined' ? `${window.location.origin}/project/${project?.id}` : ''}
        title={project?.title || stripHtml(project?.description || project?.alt_description || "프로젝트 공유")}
        description={stripHtml(project?.description || "")}
        imageUrl={project?.urls?.full}
      />

      <ProposalModal
        open={proposalModalOpen}
        onOpenChange={setProposalModalOpen}
        projectId={project?.id || ''}
        receiverId={project?.userId || ''}
        projectTitle={project?.title || stripHtml(project?.description || project?.alt_description || "프로젝트")}
      />

      <CollectionModal
        open={collectionModalOpen}
        onOpenChange={setCollectionModalOpen}
        projectId={project?.id || ''}
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
          <DialogTitle className="sr-only">Image Lightbox</DialogTitle>
          <DialogDescription className="sr-only">Full screen view</DialogDescription>
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
              src={project?.urls?.full}
              alt={project?.alt_description || "Detail View"}
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
        projectId={project?.id || ''}
        isOwner={String(currentUserId) === String(project?.userId)}
        onSelectVersion={(v) => {
           setHistoryModalOpen(false);
        }}
      />
    </>
  );
}
