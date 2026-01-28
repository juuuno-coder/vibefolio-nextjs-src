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
  
  // [Unified Evaluation States]
  const [evalScores, setEvalScores] = useState<Record<string, number>>({});
  const [evalSticker, setEvalSticker] = useState<string | null>(null);
  const [evalProposal, setEvalProposal] = useState("");
  const [evalSubmitting, setEvalSubmitting] = useState(false);
  const [evalSaved, setEvalSaved] = useState(false);

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

  const handleFinalEvaluationSubmit = async () => {
    if (!isLoggedIn || !project) {
        setLoginModalOpen(true);
        return;
    }
    
    setEvalSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No session");

      const projectId = project.id;
      const results = [];

      // 1. Submit Michelin Rating (Scores + Detailed Comment)
      if (allowMichelin && (Object.keys(evalScores).length > 0 || evalProposal.trim())) {
        const ratingRes = await fetch(`/api/projects/${projectId}/rating`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            ...evalScores,
            proposal: evalProposal
          })
        });
        if (ratingRes.ok) results.push('rating_saved');
      }

      // 2. Submit Sticker Poll
      if (allowStickers && evalSticker) {
        const voteRes = await fetch(`/api/projects/${projectId}/vote`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({ voteType: evalSticker })
        });
        if (voteRes.ok) results.push('vote_saved');
      }

      setEvalSaved(true);
      toast.success("평가가 성공적으로 등록되었습니다! 🎉");
      
      // Refresh comments to show the system comment
      const commentRes = await fetch(`/api/comments?projectId=${parseInt(project.id)}`);
      const commentData = await commentRes.json();
      if (commentData.comments) setComments(commentData.comments);
      
      await refreshUserProfile();
    } catch (error) {
      console.error("Evaluation submission failed", error);
      toast.error("평가 등록 중 오류가 발생했습니다.");
    } finally {
      setEvalSubmitting(false);
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

          {/* 데스크톱 뷰 - Classic Layout Restored + Feedback Integrated in Panel */}
          <div 
             className="hidden md:flex h-full items-end justify-center gap-4 w-full"
             onClick={(e) => {
               if (e.target === e.currentTarget) onOpenChange(false);
             }}
          >
            {/* 1. 메인 이미지/콘텐츠 영역 */}
            <div className="w-[66vw] h-full bg-white flex flex-col relative rounded-t-xl overflow-hidden shadow-2xl transition-all duration-500">
              
              {/* 닫기 버튼 */}
              <button
                onClick={() => onOpenChange(false)}
                className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-colors backdrop-blur-sm shadow-md"
              >
                <FontAwesomeIcon icon={faXmark} className="w-5 h-5" />
              </button>

              {/* 헤더 */}
              <div className="p-6 bg-white border-b border-gray-100 flex-shrink-0 z-20">
                <div className="flex flex-col gap-2 mb-3">
                  <div className="flex gap-2">
                    {isAuditMode ? (
                      <span className="px-2.5 py-1 bg-orange-500 text-white text-[9px] font-black rounded-full shadow-lg shadow-orange-100 flex items-center gap-1.5 uppercase tracking-wider">
                         <FontAwesomeIcon icon={faStar} className="w-2.5 h-2.5" /> 평가 진단 중
                      </span>
                    ) : isGrowthMode ? (
                      <span className="px-2.5 py-1 bg-green-500 text-white text-[9px] font-black rounded-full shadow-lg shadow-green-100 flex items-center gap-1.5 uppercase tracking-wider">
                         <FontAwesomeIcon icon={faRocket} className="w-2.5 h-2.5" /> 성장 피드백 중
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 bg-gray-100 text-gray-500 text-[9px] font-black rounded-full flex items-center gap-1.5 uppercase tracking-wider border border-gray-200">
                         <FontAwesomeIcon icon={faFolder} className="w-2.5 h-2.5" /> 일반 전시
                      </span>
                    )}
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900 truncate">
                    {project.title || stripHtml(project.description || project.alt_description || "제목 없음")}
                  </h1>
                </div>

                {isAuthor && !isAuditMode && !isGrowthMode && (
                   <div className="mb-4 p-3 bg-orange-50 rounded-xl border border-orange-100 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-orange-200 text-orange-600 flex items-center justify-center text-xs">🚀</div>
                        <div>
                          <p className="text-[11px] font-bold text-orange-900">이 작품으로 피드백을 받아볼까요?</p>
                          <p className="text-[9px] text-orange-600">성장 섹션에 노출되어 조언을 얻을 수 있습니다.</p>
                        </div>
                      </div>
                      <Button 
                        onClick={() => router.push(`/project/upload?mode=audit&edit=${project?.id}`)}
                        size="sm" 
                        className="bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-full text-[10px] h-7"
                      >
                         전환하기
                      </Button>
                   </div>
                )}
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10 bg-white border border-gray-100">
                      <AvatarImage src={project.user.profile_image.large} />
                      <AvatarFallback className="bg-white"><FontAwesomeIcon icon={faUser} className="w-4 h-4" /></AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{project.user.username}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-[10px] text-gray-500">{dayjs(project.created_at).format('YYYY.MM.DD')}</p>
                        <span className="text-[10px] text-gray-300">|</span>
                        <div className="flex items-center gap-3 text-[10px] text-gray-500 font-medium">
                          <span className="flex items-center gap-1"><FontAwesomeIcon icon={faEye} className="w-3 h-3 opacity-60" /> {viewsCount}</span>
                          <span className="flex items-center gap-1"><FontAwesomeIcon icon={faHeart} className="w-3 h-3 opacity-60 text-red-400" /> {likesCount}</span>
                          <span className="flex items-center gap-1"><FontAwesomeIcon icon={faComment} className="w-3 h-3 opacity-60" /> {comments.length}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {versions.length > 0 && (
                    <Button onClick={() => setHistoryModalOpen(true)} variant="outline" size="sm" className="text-xs gap-2">
                      <FontAwesomeIcon icon={faClock} className="w-3 h-3" /> 히스토리 ({versions.length})
                    </Button>
                  )}
                </div>
              </div>

              {/* 본문 스크롤 영역 */}
              <div className="flex-1 overflow-y-auto custom-scrollbar bg-white p-8 flex flex-col items-center">
                  {project.rendering_type === 'rich_text' ? (
                    <div 
                      className="prose prose-lg prose-h1:text-3xl max-w-4xl w-full bg-white p-4 whitespace-pre-wrap"
                      dangerouslySetInnerHTML={{ __html: unescapeHtml(project?.description || '') }}
                    />
                  ) : (
                    <div 
                       className={`relative inline-block w-full max-w-5xl ${isPinMode ? 'cursor-crosshair' : 'cursor-zoom-in'}`}
                       onClick={(e) => {
                          if (isPinMode) {
                             const rect = e.currentTarget.getBoundingClientRect();
                             const x = ((e.clientX - rect.left) / rect.width) * 100;
                             const y = ((e.clientY - rect.top) / rect.height) * 100;
                             setTempPin({ x, y });
                             setCommentsPanelOpen(true);
                          } else {
                             setLightboxOpen(true);
                          }
                       }}
                    >
                      <OptimizedImage
                        src={project.urls.full}
                        alt={project.alt_description || "Project Image"}
                        className="w-full h-auto object-contain shadow-sm rounded-lg"
                        width={1600}
                        height={1200}
                        priority={true}
                      />
                      {/* Pins Layer */}
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
                      {tempPin && (
                           <div className="absolute w-8 h-8 -ml-4 -mt-8 z-20 animate-bounce" style={{ left: `${tempPin.x}%`, top: `${tempPin.y}%` }}>
                              <FontAwesomeIcon icon={faMapPin} className="w-full h-full text-green-500 drop-shadow-lg" />
                          </div>
                      )}
                    </div>
                  )}

                  {/* 설명 텍스트 (Rich Text 아닐 경우) */}
                  {project.rendering_type !== 'rich_text' && project.description && (
                     <div className="max-w-3xl w-full mt-10 text-lg text-gray-700 leading-8 whitespace-pre-wrap break-keep">
                        {stripHtml(project.description)}
                     </div>
                  )}
                  
                  <div className="h-20" />
              </div>
            </div>

            {/* 2. 액션바 (우측 사이드바) - Restore */}
            <div className="h-full bg-transparent flex flex-col items-center py-8 gap-4">
              <button 
                onClick={() => { window.location.href = `/creator/${project.user.username}`; }} 
                className="flex flex-col items-center gap-1 group cursor-pointer mb-2"
              >
                <Avatar className={`w-12 h-12 border-2 bg-white transition-all shadow-md group-hover:scale-105 ${following ? 'border-green-600' : 'border-white group-hover:border-green-600'}`}>
                  <AvatarImage src={project.user.profile_image.large} />
                  <AvatarFallback className="bg-white"><FontAwesomeIcon icon={faUser} className="w-4 h-4" /></AvatarFallback>
                </Avatar>
              </button>

              {isLoggedIn && project.userId && currentUserId !== project.userId && (
                <div className="flex flex-col items-center mb-2">
                  <Button onClick={handleFollow} disabled={loading.follow} size="sm" className={`text-xs px-3 py-1 h-8 rounded-full transition-all shadow-md ${following ? 'bg-white text-gray-700 border border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200' : 'bg-green-600 text-white hover:bg-green-700 hover:scale-105'}`}>
                    {loading.follow ? '...' : (following ? '팔로잉' : '팔로우')}
                  </Button>
                </div>
              )}

              {/* Proposal to Author */}
              {String(currentUserId) !== String(project.userId) && (
                <div className="relative group flex items-center mt-2">
                   <button 
                    onClick={() => { 
                      if (!isLoggedIn) { setLoginModalOpen(true); return; } 
                      setProposalModalOpen(true); 
                    }} 
                    className="w-12 h-12 rounded-full border border-gray-100 shadow-lg flex items-center justify-center transition-all hover:scale-105 bg-white text-gray-700 hover:bg-green-600 hover:text-white"
                  >
                    <FontAwesomeIcon icon={faPaperPlane} className="w-5 h-5" />
                  </button>
                  <div className="absolute right-full mr-3 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-md">
                     제안하기
                  </div>
                </div>
              )}

              <button onClick={() => toggleLike()} disabled={!isLoggedIn} className={`w-12 h-12 rounded-full border border-gray-100 shadow-lg flex items-center justify-center transition-all hover:scale-105 ${isLiked ? 'bg-red-500 text-white border-red-500' : 'bg-white text-gray-700 hover:bg-red-50'}`}>
                <FontAwesomeIcon icon={isLiked ? faHeart : faHeartRegular} className="w-5 h-5" />
              </button>

              <button onClick={handleCollectionClick} className={`w-12 h-12 rounded-full border border-gray-100 shadow-lg flex items-center justify-center transition-all hover:scale-105 ${bookmarked ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-blue-50'}`}>
                <FontAwesomeIcon icon={bookmarked ? faBookmark : faBookmarkRegular} className="w-5 h-5" />
              </button>

              <button onClick={() => setShareModalOpen(true)} className="w-12 h-12 rounded-full bg-white text-gray-700 border border-gray-100 shadow-lg hover:bg-green-600 hover:text-white hover:scale-105 flex items-center justify-center transition-all">
                <FontAwesomeIcon icon={faShareNodes} className="w-5 h-5" />
              </button>

              <button onClick={() => setCommentsPanelOpen(!commentsPanelOpen)} className={`w-12 h-12 rounded-full border border-gray-100 shadow-lg flex items-center justify-center transition-all hover:scale-105 ${commentsPanelOpen ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-700 hover:bg-green-600 hover:text-white'}`}>
                <FontAwesomeIcon icon={faComment} className="w-5 h-5" />
              </button>
            </div>

            {/* 3. 댓글 패널 (사이드바) - Restore & Integrate Evaluation */}
            {commentsPanelOpen && (
              <div className="w-[28vw] max-w-[450px] h-full bg-white flex flex-col border-l border-gray-200 ml-4 rounded-t-xl overflow-hidden shadow-xl animate-in slide-in-from-right duration-500">
                <div className={`p-4 border-b flex items-center justify-between z-10 ${isFeedbackRequested ? 'bg-green-50/50 border-green-100' : 'bg-white border-gray-100'}`}>
                  <h3 className={`font-bold text-sm ${isFeedbackRequested ? 'text-green-800 flex items-center gap-2' : ''}`}>
                    {isFeedbackRequested ? <><FontAwesomeIcon icon={faRocket} /> 피드백 & 상세리뷰</> : `활동 및 댓글 (${comments.length})`}
                  </h3>
                  <button onClick={() => setCommentsPanelOpen(false)} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                    <FontAwesomeIcon icon={faXmark} className="w-4 h-4" />
                  </button>
                </div>

                {/* 작가의 한마디 */}
                {project.summary && (
                  <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                     <div className="flex items-start gap-2">
                        <FontAwesomeIcon icon={faUser} className="w-3 h-3 mt-1 text-gray-400" />
                        <div>
                           <p className="text-xs font-bold text-gray-700 mb-0.5">작가의 한마디</p>
                           <p className="text-sm text-gray-800 leading-relaxed text-pretty">{project.summary}</p>
                        </div>
                     </div>
                  </div>
                )}

                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-white custom-scrollbar">
                   {/* [KEY CHANGE] Unified Evaluation Flow */}
                   {isFeedbackRequested && (allowMichelin || allowStickers) && !evalSaved && (
                       <div className="mb-6 space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                           <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm">
                               <div className="flex items-center justify-between mb-4">
                                   <div className="flex items-center gap-2">
                                       <FontAwesomeIcon icon={faStar} className="text-amber-400" />
                                       <h4 className="font-bold text-sm text-slate-800 tracking-tight">상세 평가 리포트</h4>
                                   </div>
                                   <span className="text-[10px] font-bold bg-white border border-slate-200 text-slate-400 px-2 py-0.5 rounded-full uppercase tracking-tighter">Evaluation</span>
                               </div>

                               {/* Step 1: Michelin Rating */}
                               {allowMichelin && (
                                   <div className="mb-8">
                                       <MichelinRating 
                                           projectId={project.id} 
                                           hideSubmit={true} 
                                           onChange={(scores) => setEvalScores(scores)} 
                                       />
                                   </div>
                               )}

                               {/* Step 2: Sticker Poll */}
                               {allowStickers && (
                                   <div className="pt-6 border-t border-slate-200 border-dashed">
                                       <h5 className="font-bold text-[11px] text-slate-400 mb-4 flex items-center gap-2 uppercase tracking-widest px-1">
                                         <FontAwesomeIcon icon={faFaceSmile} className="text-blue-500" /> 간편 평판 선택
                                       </h5>
                                       <FeedbackPoll 
                                           projectId={project.id} 
                                           offline={true} 
                                           onVote={(type) => setEvalSticker(type)} 
                                       />
                                   </div>
                               )}

                               {/* Step 3: Detailed Feedback (Proposal/Comment) */}
                               <div className="mt-8 pt-6 border-t border-slate-200 border-dashed">
                                   <h5 className="font-bold text-[11px] text-slate-400 mb-3 flex items-center gap-2 uppercase tracking-widest px-1">
                                      <FontAwesomeIcon icon={faCommentRegular} /> 상세 피드백 & 제안
                                   </h5>
                                   <textarea 
                                       value={evalProposal}
                                       onChange={(e) => setEvalProposal(e.target.value)}
                                       placeholder="작가의 성장을 돕는 구체적인 조언이나 응원의 메시지를 남겨주세요."
                                       className="w-full min-h-[100px] p-4 text-[13px] bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900/5 transition-all resize-none leading-relaxed"
                                   />
                               </div>

                               {/* Unified Submit Button */}
                               <div className="mt-8">
                                   <Button 
                                       onClick={handleFinalEvaluationSubmit}
                                       disabled={evalSubmitting || (!Object.keys(evalScores).length && !evalSticker && !evalProposal.trim())}
                                       className="w-full h-14 bg-slate-900 hover:bg-black text-white rounded-2xl font-black text-base shadow-lg hover:translate-y-[-2px] transition-all"
                                   >
                                       {evalSubmitting ? (
                                           <span className="flex items-center gap-2"><FontAwesomeIcon icon={faSpinner} className="animate-spin" /> 제출 중...</span>
                                       ) : "평가 등록하기"}
                                   </Button>
                                   <p className="text-center text-[10px] text-slate-400 mt-3 font-medium">정성스러운 평가는 크리에이터에게 큰 힘이 됩니다. ❤️</p>
                               </div>
                           </div>
                           <div className="h-0.5 bg-slate-100 rounded-full w-full my-6" />
                       </div>
                   )}

                   {evalSaved && (
                       <div className="mb-6 p-6 bg-green-50 border border-green-100 rounded-2xl text-center animate-in zoom-in duration-300">
                           <div className="w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg shadow-green-200">
                               <FontAwesomeIcon icon={faCheck} className="w-6 h-6" />
                           </div>
                           <h4 className="font-black text-green-900 mb-1">평가가 성공적으로 전달되었습니다!</h4>
                           <p className="text-xs text-green-700 font-medium">소중한 피드백 감사합니다. 분석 리포트에 반영되었습니다.</p>
                       </div>
                   )}

                   {/* 댓글 리스트 */}
                   <div className="space-y-4">
                       <div className="flex items-center gap-2 mb-2 text-[10px] font-black text-gray-300 px-1 uppercase tracking-widest">
                           Latest Discussions
                       </div>
                       {comments.length > 0 ? (
                           comments.map((comment) => (
                              <CommentItem key={comment.id + 'panel'} comment={comment} onReply={(id, username) => setReplyingTo({ id, username })} onDelete={handleDeleteComment} currentUserId={currentUserId} projectOwnerId={project.userId} depth={0} />
                           ))
                       ) : (
                           <div className="text-center py-6 text-gray-400 text-xs">
                              <p>작성된 댓글이 없습니다.<br/>첫 번째 의견을 남겨주세요!</p>
                           </div>
                       )}
                   </div>
                </div>

                {/* 댓글 입력창 */}
                {isLoggedIn ? (
                  <div className="p-3 border-t border-gray-100 bg-white">
                     {replyingTo && (
                       <div className="flex items-center justify-between text-xs text-green-600 mb-2 px-1">
                         <span>@{replyingTo.username}님에게 답글 작성</span>
                         <button onClick={() => setReplyingTo(null)} className="hover:underline">취소</button>
                       </div>
                     )}
                     <div className="flex gap-2">
                       <textarea 
                         value={newComment} 
                         onChange={(e) => setNewComment(e.target.value)} 
                         onKeyDown={(e) => {
                            if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleCommentSubmit(); }
                         }}
                         placeholder={isPinMode ? "핀 위치에 댓글 남기기..." : "댓글을 입력하세요..."}
                         className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-green-500 resize-none h-[42px] leading-tight" 
                       />
                       <Button onClick={handleCommentSubmit} size="sm" disabled={loading.comment || !newComment.trim()} className="bg-green-600 hover:bg-green-700 text-white h-[42px] px-4 rounded-lg">
                         <FontAwesomeIcon icon={faPaperPlane} className="w-3 h-3" />
                       </Button>
                     </div>
                     <div className="flex items-center justify-between mt-2 px-1">
                        <div className="flex gap-2">
                            {(project as any).allow_stickers && (
                                <button onClick={() => setIsPinMode(!isPinMode)} className={`text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1 ${isPinMode ? 'text-green-600 bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`}>
                                    <FontAwesomeIcon icon={faMapPin} /> 핀 모드
                                </button>
                            )}
                        </div>
                        {(project as any).allow_secret_comments && (
                          <button onClick={() => setNewCommentSecret(!newCommentSecret)} className={`flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded transition-colors ${newCommentSecret ? 'text-amber-600 bg-amber-50' : 'text-gray-400 hover:text-gray-600'}`}>
                            <FontAwesomeIcon icon={newCommentSecret ? faLock : faUnlock} /> {newCommentSecret ? "비밀글" : "공개"}
                          </button>
                        )}
                     </div>
                  </div>
                ) : (
                   <div className="p-4 border-t border-gray-100 bg-gray-50 text-center cursor-pointer" onClick={() => setLoginModalOpen(true)}> 
                      <p className="text-xs text-green-600 font-bold hover:underline">로그인 후 활동에 참여해보세요 👋</p>
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
