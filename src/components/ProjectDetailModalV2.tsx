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

// ?ìÍ? ?ÑÏù¥??Ïª¥Ìè¨?åÌä∏ (?¨Í?)
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
              className="text-[9px] text-gray-500 hover:text-[#4ACAD4]"
            >
              ?µÍ?
            </button>
            {isOwner && (
              <button
                onClick={() => onDelete(comment.comment_id)}
                className="text-[9px] text-gray-400 hover:text-red-500"
              >
                ??†ú
              </button>
            )}
          </div>
        </div>
      </div>
      {/* ?Ä?ìÍ? */}
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
    rendering_type?: string;
  } | null;
}

// HTML ?îÌã∞???îÏΩî???®Ïàò (Í∞ïÎ†•??Î≤ÑÏ†Ñ)
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

  // ESC ???∏Îì§??
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (commentsPanelOpen) {
          // ?ìÍ????¥Î†§?àÏúºÎ©??ìÍ?Îß??´Í∏∞
          setCommentsPanelOpen(false);
        } else {
          // ?ìÍ????´Ì??àÏúºÎ©?Î™®Îã¨ ?´Í∏∞
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

      // Ï¥àÍ∏∞ Ï°∞Ìöå???§Ï†ï
      const initialViews = project.views || 0;
      setViewsCount(initialViews);

      // Ï°∞Ìöå??Ï¶ùÍ?
      try {
        const viewRes = await fetch(`/api/projects/${projectId}/view`, {
          method: 'POST'
        });
        if (viewRes.ok) {
          // Ï°∞Ìöå??Ï¶ùÍ? ?±Í≥µ ??+1 Î∞òÏòÅ
          setViewsCount(initialViews + 1);
        }
      } catch (error) {
        console.error('Ï°∞Ìöå??Ï¶ùÍ? ?§Ìå®:', error);
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
        console.error('?ìÍ? Ï°∞Ìöå ?§Ìå®:', error);
      }

      if (user) {
        try {
          const fetchPromises = [
            fetch(`/api/likes?projectId=${projectId}&userId=${user.id}`),
            fetch(`/api/wishlists?projectId=${projectId}&userId=${user.id}`)
          ];
          
          // ?ëÏÑ±??IDÍ∞Ä ?àÍ≥† Î≥∏Ïù∏???ÑÎãå Í≤ΩÏö∞ ?îÎ°ú???ÅÌÉú???ïÏù∏
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
          
          // ?îÎ°ú???ÅÌÉú ?ïÏù∏
          if (results[2]) {
            const followCheckData = await results[2].json();
            setFollowing(followCheckData.following || false);
          }
          
          // ?îÎ°ú????Í∞Ä?∏Ïò§Í∏?
          if (project.userId) {
            const followCountRes = await fetch(`/api/follows?userId=${project.userId}`);
            const followCountData = await followCountRes.json();
            setFollowersCount(followCountData.followersCount || 0);
          }
        } catch (error) {
          console.error('?ÅÌÉú ?ïÏù∏ ?§Ìå®:', error);
        }
      }
    };

    checkUserAndFetchData();
  }, [project, open]);

  const handleLike = async () => {
    if (!project) return;
    
    // isLoggedIn ?ÅÌÉúÎß?ÎØøÏ? ÎßêÍ≥† ?§Ï†ú ?∏ÏÖò ?ïÏù∏
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
      console.error('Ï¢ãÏïÑ???§Ìå®:', error);
    } finally {
      setLoading(prev => ({ ...prev, like: false }));
    }
  };

  const handleCollectionClick = async () => {
    // isLoggedIn ?ÅÌÉúÎß?ÎØøÏ? ÎßêÍ≥† ?§Ï†ú ?∏ÏÖò ?ïÏù∏
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
      console.error('Î∂ÅÎßà???§Ìå®:', error);
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
        // ?îÎ°ú?????ÖÎç∞?¥Ìä∏
        setFollowersCount(prev => data.following ? prev + 1 : prev - 1);
      }
    } catch (error) {
      console.error('?îÎ°ú???§Ìå®:', error);
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
        // ?ìÍ? Î™©Î°ù ?àÎ°úÍ≥†Ïπ®
        const commentRes = await fetch(`/api/comments?projectId=${parseInt(project.id)}`);
        const commentData = await commentRes.json();
        if (commentData.comments) {
          setComments(commentData.comments);
        }
        setNewComment('');
        setReplyingTo(null);
      } else {
        alert(data.error || '?ìÍ? ?ëÏÑ±???§Ìå®?àÏäµ?àÎã§.');
      }
    } catch (error) {
      console.error('?ìÍ? ?ëÏÑ± ?§Ìå®:', error);
      alert('?ìÍ? ?ëÏÑ±???§Ìå®?àÏäµ?àÎã§.');
    } finally {
      setLoading(prev => ({ ...prev, comment: false }));
    }
  };

  // ?ìÍ? ??†ú ?∏Îì§??
  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('?ìÍ?????†ú?òÏãúÍ≤†Ïäµ?àÍπå?')) return;
    
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
        // ?ìÍ? Î™©Î°ù?êÏÑú ??†ú???ìÍ? ?úÍ±∞
        setComments(prev => prev.filter(c => c.comment_id !== commentId));
      } else {
        const data = await res.json();
        alert(data.error || '?ìÍ? ??†ú???§Ìå®?àÏäµ?àÎã§.');
      }
    } catch (error) {
      console.error('?ìÍ? ??†ú ?§Ìå®:', error);
      alert('?ìÍ? ??†ú???§Ìå®?àÏäµ?àÎã§.');
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
          {/* Î™®Î∞î??Î∑?- ?∏Ìä∏?¥Î¶¨???§Ì???*/}
          <div className="md:hidden w-full h-full bg-white flex flex-col rounded-t-xl overflow-hidden">
            {/* X Î≤ÑÌäº */}
            <button
              onClick={() => onOpenChange(false)}
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-lg transition-colors"
            >
              <FontAwesomeIcon icon={faXmark} className="w-4 h-4" />
            </button>

            {/* ?¥Î?ÏßÄ ?êÎäî Î¶¨Ïπò ?çÏä§???ÅÏó≠ - ?§ÌÅ¨Î°?Í∞Ä??*/}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {project.rendering_type === 'rich_text' ? (
                <div 
                  className="prose prose-sm max-w-full p-6 mx-auto"
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
              
              {/* ?°ÏÖò ?ÑÏù¥ÏΩòÎì§ - ?¥Î?ÏßÄ ?ÑÎûò */}
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
                    className="w-12 h-12 rounded-full border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 flex items-center justify-center transition-colors"
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

              {/* ?ÑÎ°ú?ùÌä∏ ?ïÎ≥¥ */}
              <div className="px-4 py-4">
                <h1 className="text-lg font-bold text-gray-900 mb-2">
                  {project.description || project.alt_description || "?úÎ™© ?ÜÏùå"}
                </h1>
                <p className="text-sm text-gray-500 mb-3">
                  {dayjs(project.created_at).fromNow()} | ?¨Î¶¨?êÏù¥?∞Î∏å
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

              {/* ?ëÏÑ±???ïÎ≥¥ */}
              <div className="px-4 py-4 border-t border-gray-100 flex flex-col items-center">
                <Avatar className="w-16 h-16 border-2 border-gray-200 mb-2">
                  <AvatarImage src={project.user.profile_image.large} />
                  <AvatarFallback><FontAwesomeIcon icon={faUser} className="w-6 h-6" /></AvatarFallback>
                </Avatar>
                <p className="font-bold text-base">{project.user.username}</p>
                <p className="text-sm text-gray-500 mb-4">-</p>
              </div>
            </div>

            {/* ?òÎã® Í≥†Ï†ï Î≤ÑÌäº??*/}
            <div className="flex gap-3 p-4 border-t border-gray-100 bg-white">
              {isLoggedIn && project.userId && currentUserId !== project.userId && (
                <Button
                  onClick={handleFollow}
                  variant="outline"
                  className="flex-1 h-12 rounded-full border-gray-300"
                >
                  {following ? '?îÎ°ú?? : '+ ?îÎ°ú??}
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
                ?úÏïà?òÍ∏∞
              </Button>
            </div>
          </div>

          {/* ?∞Ïä§?¨ÌÜ± Î∑?- Í∏∞Ï°¥ ?§Ì????†Ï? */}
          <div className="hidden md:flex h-full items-end justify-center gap-4">
            {/* Î©îÏù∏ ?¥Î?ÏßÄ ?ÅÏó≠ */}
            <div className="w-[66vw] h-full bg-white flex flex-col relative rounded-t-xl overflow-hidden shadow-2xl">
              {/* X Î≤ÑÌäº */}
              <button
                onClick={() => onOpenChange(false)}
                className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-lg transition-colors"
              >
                <FontAwesomeIcon icon={faXmark} className="w-4 h-4" />
              </button>

              {/* ?ÑÎ°ú?ùÌä∏ ?ïÎ≥¥ ?§Îçî */}
              <div className="p-6 bg-white border-b border-gray-100">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {project.description || project.alt_description || "?úÎ™© ?ÜÏùå"}
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
              
              {/* ?¥Î?ÏßÄ ?êÎäî Î¶¨Ïπò ?çÏä§??*/}
              <div className="flex-1 overflow-y-auto flex items-start justify-center p-8 custom-scrollbar">
                {project.rendering_type === 'rich_text' && project.description?.includes('<') ? (
                  <div 
                    className="prose prose-lg max-w-4xl w-full bg-white p-10 rounded-xl"
                    dangerouslySetInnerHTML={{ 
                      __html: (() => {
                        let decoded = unescapeHtml(project.description || '');
                        // ?¥Ï§ë ?∏ÏΩî??Ï≤¥ÌÅ¨: ?îÏΩî???ÑÏóê???úÍ∑∏Í∞Ä ?¥Ïä§ÏºÄ?¥ÌîÑ ???ÅÌÉú?ºÎ©¥ ??Î≤????îÏΩî??
                        if (decoded && decoded.trim().startsWith('&lt;')) {
                          decoded = unescapeHtml(decoded);
                        }
                        return decoded;
                      })()
                    }}
                  />
                ) : (
                  <img
                    src={project.urls.full}
                    alt={project.alt_description || "Project Image"}
                    className="max-w-full h-auto object-contain object-top cursor-zoom-in"
                    style={{ maxWidth: '90%' }}
                    onClick={() => setLightboxOpen(true)}
                  />
                )}
              </div>
            </div>

            {/* ?°ÏÖòÎ∞?- ?∞Ïä§?¨ÌÜ± */}
            <div className="h-full bg-transparent flex flex-col items-center py-8 gap-4">
              {/* ?ÑÎ°ú???ÑÎ∞î?Ä */}
              <button
                onClick={() => {
                  window.location.href = `/creator/${project.user.username}`;
                }}
                className="flex flex-col items-center gap-1 group cursor-pointer mb-2"
              >
                <Avatar className={`w-12 h-12 border-2 bg-white transition-all shadow-md group-hover:scale-105 ${following ? 'border-[#4ACAD4]' : 'border-white group-hover:border-[#4ACAD4]'}`}>
                  <AvatarImage src={project.user.profile_image.large} />
                  <AvatarFallback className="bg-white"><FontAwesomeIcon icon={faUser} className="w-4 h-4" /></AvatarFallback>
                </Avatar>
              </button>

              {/* ?îÎ°ú??Î≤ÑÌäº */}
              {isLoggedIn && project.userId && currentUserId !== project.userId && (
                <div className="flex flex-col items-center mb-2">
                  <Button
                    onClick={handleFollow}
                    disabled={loading.follow}
                    size="sm"
                    className={`text-xs px-3 py-1 h-8 rounded-full transition-all shadow-md ${
                      following 
                        ? 'bg-white text-gray-700 border border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200' 
                        : 'bg-[#4ACAD4] text-white hover:bg-[#3db8c0] hover:scale-105'
                    }`}
                  >
                    {loading.follow ? '...' : (following ? '?îÎ°ú?? : '?îÎ°ú??)}
                  </Button>
                  {followersCount > 0 && (
                    <span className="text-[11px] font-medium text-white mt-1 drop-shadow-md">{followersCount}</span>
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
                    alert('Î≥∏Ïù∏ ?ÑÎ°ú?ùÌä∏?êÎäî ?úÏïà?????ÜÏäµ?àÎã§.');
                    return;
                  }
                  setProposalModalOpen(true);
                }}
                className="w-12 h-12 rounded-full bg-white text-gray-700 border border-gray-100 shadow-lg hover:bg-[#4ACAD4] hover:text-white hover:scale-105 flex items-center justify-center transition-all"
                title="?úÏïà?òÍ∏∞"
              >
                <FontAwesomeIcon icon={faPaperPlane} className="w-5 h-5" />
              </button>

              <button 
                onClick={handleLike}
                disabled={!isLoggedIn}
                className={`w-12 h-12 rounded-full border border-gray-100 shadow-lg flex flex-col items-center justify-center transition-all hover:scale-105 ${
                  liked ? 'bg-red-500 text-white border-red-500' : 'bg-white text-gray-700 hover:bg-red-50 hover:text-red-500'
                }`}
              >
                {loading.like ? (
                  <FontAwesomeIcon icon={faSpinner} className="w-5 h-5 animate-spin" />
                ) : (
                  <FontAwesomeIcon icon={liked ? faHeart : faHeartRegular} className="w-5 h-5" />
                )}
              </button>

              <button 
                onClick={handleCollectionClick}
                className="w-12 h-12 rounded-full bg-white text-gray-700 border border-gray-100 shadow-lg hover:bg-blue-500 hover:text-white hover:scale-105 flex items-center justify-center transition-all"
                title="Ïª¨Î†â?òÏóê ?Ä??
              >
                <FontAwesomeIcon icon={faFolder} className="w-5 h-5" />
              </button>

              <button 
                onClick={() => setShareModalOpen(true)}
                className="w-12 h-12 rounded-full bg-white text-gray-700 border border-gray-100 shadow-lg hover:bg-[#4ACAD4] hover:text-white hover:scale-105 flex items-center justify-center transition-all"
              >
                <FontAwesomeIcon icon={faShareNodes} className="w-5 h-5" />
              </button>

              <button 
                onClick={() => setCommentsPanelOpen(!commentsPanelOpen)}
                className={`w-12 h-12 rounded-full border border-gray-100 shadow-lg flex items-center justify-center transition-all hover:scale-105 ${
                  commentsPanelOpen ? 'bg-[#4ACAD4] text-white border-[#4ACAD4]' : 'bg-white text-gray-700 hover:bg-[#4ACAD4] hover:text-white'
                }`}
              >
                <FontAwesomeIcon icon={faComment} className="w-5 h-5" />
              </button>
            </div>

            {/* ?ìÍ? ?®ÎÑê */}
            {commentsPanelOpen && (
              <div className="w-[30%] h-full bg-white flex flex-col border-l border-gray-200 ml-4 rounded-t-xl overflow-hidden">
                {/* ?ìÍ? ?§Îçî */}
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-bold text-sm">?ìÍ? ({comments.length})</h3>
                  <button 
                    onClick={() => setCommentsPanelOpen(false)}
                    className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <FontAwesomeIcon icon={faXmark} className="w-4 h-4" />
                  </button>
                </div>

                {/* ?ÑÎ°ú?ùÌä∏ ?ïÎ≥¥ */}
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
                    {project.description || "?§Î™Ö???ÜÏäµ?àÎã§."}
                  </p>
                </div>

                {/* ?ìÍ? Î™©Î°ù */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
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
                    <div className="text-center py-8">
                      <FontAwesomeIcon icon={faComment} className="w-6 h-6 mx-auto text-gray-300 mb-2" />
                      <p className="text-xs text-gray-400">Ï≤??ìÍ????®Í≤®Î≥¥ÏÑ∏??</p>
                    </div>
                  )}
                </div>

                {/* ?ìÍ? ?ÖÎ†• */}
                {isLoggedIn ? (
                  <div className="p-3 border-t border-gray-100">
                    {replyingTo && (
                      <div className="flex items-center justify-between mb-2 px-2 py-1 bg-gray-50 rounded text-[10px]">
                        <span className="text-gray-600">@{replyingTo.username}?êÍ≤å ?µÍ?</span>
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
                        placeholder={replyingTo ? `@${replyingTo.username}?êÍ≤å ?µÍ?...` : "?ìÍ????ÖÎ†•?òÏÑ∏??.."}
                        className="flex-1 px-2 py-1.5 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-[#4ACAD4]"
                      />
                      <Button
                        onClick={handleCommentSubmit}
                        disabled={!newComment.trim() || loading.comment}
                        size="sm"
                        className="bg-[#4ACAD4] hover:bg-[#3db8c0] text-xs px-3"
                      >
                        {loading.comment ? <FontAwesomeIcon icon={faSpinner} className="w-3 h-3 animate-spin" /> : '?ëÏÑ±'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 border-t border-gray-100 text-center">
                    <p className="text-xs text-gray-500">Î°úÍ∑∏?????ìÍ????ëÏÑ±?????àÏäµ?àÎã§.</p>
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
        title={project.description || project.alt_description || '?ÑÎ°ú?ùÌä∏'}
        description={project.description || ''}
        imageUrl={project.urls.full}
      />

      <ProposalModal
        open={proposalModalOpen}
        onOpenChange={setProposalModalOpen}
        projectId={project.id}
        receiverId={project.userId || ''}
        projectTitle={project.description || project.alt_description || '?ÑÎ°ú?ùÌä∏'}
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

      {/* ?¥Î?ÏßÄ ?ºÏù¥?∏Î∞ï??*/}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent 
          className="!max-w-none !w-screen !h-screen !p-0 !m-0 !gap-0 bg-black/95 border-none shadow-none flex flex-col items-center justify-center outline-none z-[60]"
          showCloseButton={false}
        >
          {/* ?´Í∏∞ Î≤ÑÌäº */}
          <button 
            onClick={() => setLightboxOpen(false)}
            className="absolute top-6 right-6 z-50 w-12 h-12 rounded-full bg-black/50 hover:bg-black/80 flex items-center justify-center text-white transition-colors"
          >
            <FontAwesomeIcon icon={faXmark} className="w-6 h-6" />
          </button>

          {/* ?¥Î?ÏßÄ ?ÅÏó≠ */}
          <div className="w-full h-full flex items-center justify-center p-4 md:p-10 select-none">
            <img
              src={project.urls.full}
              alt={project.alt_description || "Detail View"}
              className="max-w-full max-h-full object-contain shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          
          {/* ?òÎã® ?ïÎ≥¥ (?†ÌÉù?¨Ìï≠) */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/80 text-sm font-medium bg-black/40 px-4 py-2 rounded-full">
            1 / 1
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
