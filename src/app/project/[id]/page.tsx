// src/app/project/[id]/page.tsx

"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { createNotification } from "@/hooks/useNotifications";
import { Heart, Eye, Share2, Bookmark, ArrowLeft, ExternalLink, MessageCircle, MessageSquare, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImageCard } from "@/components/ImageCard";
import { addCommas } from "@/lib/format/comma";
import { 
  isProjectLiked, 
  addLike,
  removeLike,
  getProjectLikeCount 
} from "@/lib/likes";
import {
  isProjectBookmarked,
  addBookmark,
  removeBookmark,
} from "@/lib/bookmarks";
import {
  getProjectComments,
  addComment,
  deleteComment,
  Comment,
} from "@/lib/comments";
import { recordView, getProjectViewCount } from "@/lib/views"; // Import view functions
import dayjs from "dayjs";
import { supabase } from "@/lib/supabase/client";

interface Project {
  id: string;
  title?: string;
  urls: {
    full: string;
    regular: string;
  };
  user: {
    username: string;
    bio?: string;
    profile_image: {
      small: string;
      large: string;
    };
  };
  likes: number;
  views?: number;
  description: string | null;
  alt_description: string | null;
  created_at: string;
  width: number;
  height: number;
  category: string;
  tags?: string[];
  user_id: string;
  rendering_type?: string;
}

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const { session } = useAuth();
  const user = session?.user;
  const router = useRouter();

  const [project, setProject] = useState<Project | null>(null);
  const [relatedProjects, setRelatedProjects] = useState<Project[]>([]);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [viewCount, setViewCount] = useState(0); // Add viewCount state
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const projectId = params.id;

  // Data fetching logic using useCallback
  const fetchProjectData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch project details with profile
      const { data: projectData, error: projectError } = await supabase
        .from("Project")
        .select(`
          *,
          profiles:user_id (
            username,
            profile_image_url
          )
        `)
        .eq("project_id", Number(projectId))
        .single();

      if (projectError || !projectData) {
        throw new Error("Project not found.");
      }

      // Transform data to match Project interface
      const rawData = projectData as any;
      const transformedProject: Project = {
        id: String(rawData.project_id),
        title: rawData.title,
        description: rawData.description || rawData.content_text, // Use content_text as fallback
        alt_description: rawData.description || rawData.content_text,
        created_at: rawData.created_at,
        width: rawData.width || 800,
        height: rawData.height || 600,
        category: String(rawData.category_id),
        tags: rawData.tags || [],
        user_id: rawData.user_id,
        likes: 0, // Will be fetched separately
        views: 0, // Will be fetched separately
        urls: {
          full: rawData.image_url || rawData.thumbnail_url || "/placeholder.jpg",
          regular: rawData.thumbnail_url || "/placeholder.jpg",
        },
        user: {
          username: rawData.profiles?.username || "Unknown",
          profile_image: {
            small: rawData.profiles?.profile_image_url || "/default-avatar.png",
            large: rawData.profiles?.profile_image_url || "/default-avatar.png",
          },
        },
      };

      setProject(transformedProject);

      // Fetch related projects
      const { data: relatedData } = await supabase
        .from("Project")
        .select("*, profiles:user_id(username, profile_image_url)")
        .eq("category_id", rawData.category_id)
        .neq("project_id", Number(projectId))
        .limit(4);

      setRelatedProjects((relatedData || []).map((p: any) => ({
        ...p,
        id: String(p.project_id),
        urls: {
          full: p.image_url || p.thumbnail_url || "/placeholder.jpg",
          regular: p.thumbnail_url || "/placeholder.jpg",
        },
        user: {
          username: p.profiles?.username || "Unknown",
          profile_image: {
            small: p.profiles?.profile_image_url || "/default-avatar.png",
            large: p.profiles?.profile_image_url || "/default-avatar.png",
          },
        }
      })));

      // Record the view
      if (user) {
        await recordView(projectId);
      }

      // Fetch likes, bookmarks, views, and comments
      const [likeCount, viewCount, comments] = await Promise.all([
        getProjectLikeCount(Number(projectId)),
        getProjectViewCount(Number(projectId)),
        getProjectComments(Number(projectId)),
      ]);
      setLikeCount(likeCount);
      setViewCount(viewCount);
      setComments(comments);

      // Check like and bookmark status
      if (user) {
        const [liked, bookmarked] = await Promise.all([
          isProjectLiked(projectId),
          isProjectBookmarked(projectId),
        ]);
        setIsLiked(liked);
        setIsBookmarked(bookmarked);
      }
    } catch (error) {
      console.error("Failed to load project data:", error);
      setProject(null);
    } finally {
      setIsLoading(false);
    }
  }, [projectId, user]);

  useEffect(() => {
    fetchProjectData();
  }, [fetchProjectData]);

  const handleLike = async () => {
    if (!user) {
      alert("로그인이 필요합니다.");
      return;
    }
    try {
      if (isLiked) {
        await removeLike(projectId);
        setLikeCount((prev) => prev - 1);
      } else {
        await addLike(projectId);
        setLikeCount((prev) => prev + 1);
      }
      setIsLiked(!isLiked);
    } catch (error) {
      console.error("Failed to toggle like:", error);
    }
  };

  const handleBookmark = async () => {
    if (!user) {
      alert("로그인이 필요합니다.");
      return;
    }
    try {
      if (isBookmarked) {
        await removeBookmark(projectId);
      } else {
        await addBookmark(projectId);
      }
      setIsBookmarked(!isBookmarked);
    } catch (error) {
      console.error("Failed to toggle bookmark:", error);
    }
  };

  const handleAddComment = async () => {
    if (!user) {
      alert("로그인이 필요합니다.");
      return;
    }
    if (!newComment.trim()) {
      alert("댓글 내용을 입력해주세요.");
      return;
    }

    try {
      // Assuming user metadata contains display name and avatar URL
      const username = user.user_metadata.full_name || "Anonymous";
      const avatarUrl = user.user_metadata.avatar_url || "/default-avatar.png";

      await addComment(projectId, user.id, newComment, username, avatarUrl);
      
      // 알림 생성 (자신의 게시물이 아닐 때만)
      if (project && project.user_id !== user.id) {
        await createNotification({
          userId: project.user_id,
          type: "comment",
          title: "새로운 댓글!",
          message: `${username}님이 댓글을 남겼습니다: "${newComment.substring(0, 20)}..."`,
          link: `/project/${projectId}`,
          senderId: user.id,
        });
      }

      setNewComment("");
      // Refetch comments to display the new one
      const updatedComments = await getProjectComments(projectId);
      setComments(updatedComments);
    } catch (error) {
      console.error("Failed to add comment:", error);
      alert("댓글 추가에 실패했습니다.");
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!user) {
      alert("로그인이 필요합니다.");
      return;
    }
    if (!confirm("댓글을 삭제하시겠습니까?")) {
      return;
    }

    try {
      await deleteComment(commentId, user.id);
      // Refetch comments after deletion
      const updatedComments = await getProjectComments(projectId);
      setComments(updatedComments);
    } catch (error) {
      console.error("Failed to delete comment:", error);
      alert("댓글 삭제에 실패했습니다.");
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: project?.title || "프로젝트",
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("링크가 클립보드에 복사되었습니다!");
    }
  };

  if (isLoading) {
     return (
      <div className="w-full min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-secondary">로딩 중...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="w-full min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-secondary mb-4">프로젝트를 찾을 수 없습니다.</p>
          <Button onClick={() => router.push("/")} className="btn-primary">
            홈으로 돌아가기
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gray-50">
      {/* 상단 네비게이션 */}
      <div className="w-full bg-white border-b border-gray-200 sticky top-14 md:top-16 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="flex items-center gap-2 text-secondary hover:text-primary"
          >
            <ArrowLeft size={20} />
            <span className="hidden md:inline">뒤로 가기</span>
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLike}
              className={isLiked ? "text-red-500" : "text-secondary"}
            >
              <Heart size={20} fill={isLiked ? "currentColor" : "none"} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBookmark}
              className={isBookmarked ? "text-blue-500" : "text-secondary"}
            >
              <Bookmark size={20} fill={isBookmarked ? "currentColor" : "none"} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleShare}
              className="text-secondary"
            >
              <Share2 size={20} />
            </Button>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 (노트폴리오 스타일 리뉴얼) */}
      <div className="w-full bg-white min-h-screen">
        
        {/* 1. 이미지 및 상세 내용 섹션 */}
        <div className="max-w-[1240px] mx-auto px-4 md:px-6 py-8 md:py-12">
           {/* 프로젝트 이미지 (흰색 배경 위) */}
           <div className="bg-gray-50/50 rounded-xl border border-gray-100 overflow-hidden mb-12 shadow-sm flex items-center justify-center min-h-[400px]">
             <img
               src={project.urls.full}
               alt={project.alt_description || "프로젝트 이미지"}
               className="w-full h-auto object-contain max-h-[85vh] mx-auto"
             />
           </div>

           {/* 프로젝트 설명 및 태그 */}
           <div className="max-w-4xl mx-auto px-2 mb-16">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 leading-tight break-keep">
                {project.title || "제목 없음"}
              </h1>
              <div 
                className="text-lg text-gray-700 leading-8 mb-10 break-keep prose prose-lg max-w-none prose-img:rounded-xl prose-video:rounded-xl prose-headings:font-bold prose-a:text-green-600 hover:prose-a:text-green-700"
                dangerouslySetInnerHTML={{ __html: project.description || project.alt_description || "설명이 없습니다." }}
              />

              {/* 태그 리스트 & 라이선스 */}
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between pt-8 border-t border-gray-100 gap-6">
                 <div className="flex flex-wrap gap-2">
                   {project.tags && project.tags.length > 0 ? (
                     project.tags.map((tag, index) => (
                       <span key={index} className="px-3 py-1.5 bg-gray-100/80 text-gray-600 text-sm rounded-full font-medium hover:bg-gray-200 transition-colors cursor-pointer">
                         {tag}
                       </span>
                     ))
                   ) : (
                     <span className="text-gray-400 text-sm">등록된 태그가 없습니다.</span>
                   )}
                 </div>
                 <div className="flex items-center gap-3 text-gray-400">
                    {/* CCL Mockups (Text/CSS) */}
                    <div className="flex gap-1" title="Creative Commons License: CC BY-NC-ND">
                        <div className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-[10px] font-bold cursor-help hover:border-gray-500 hover:text-gray-600 transition-colors">CC</div>
                        <div className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-[10px] font-bold cursor-help hover:border-gray-500 hover:text-gray-600 transition-colors">BY</div>
                        <div className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-[10px] font-bold cursor-help hover:border-gray-500 hover:text-gray-600 transition-colors">NC</div>
                    </div>
                 </div>
              </div>
           </div>
        </div>

        {/* 2. 하단 액션 바 (검은색 배경) - 노트폴리오 스타일 핵심 */}
        <div className="w-full bg-[#18181b] text-white py-20 border-t border-gray-800">
           <div className="max-w-4xl mx-auto px-4 text-center">
               {/* Action Buttons */}
               <div className="flex flex-row items-center justify-center gap-4 mb-10">
                  <Button 
                    onClick={handleLike}
                    className={`h-14 px-8 rounded-full text-lg font-bold transition-all shadow-lg hover:scale-105 gap-2 border-0 ${
                      isLiked ? 'bg-[#ff4e4e] hover:bg-[#e04545] text-white' : 'bg-[#333] hover:bg-[#444] text-white'
                    }`}
                  >
                    <Heart className={isLiked ? "fill-current" : ""} size={22} strokeWidth={isLiked ? 0 : 2.5} />
                    {isLiked ? '좋아요 취소' : '작업 좋아요'}
                  </Button>
                  
                  <Button 
                    onClick={handleBookmark}
                    className={`h-14 px-8 rounded-full text-lg font-bold transition-all shadow-lg hover:scale-105 gap-2 bg-white text-black hover:bg-gray-200 border-0`}
                  >
                    <Bookmark className={isBookmarked ? "fill-current" : ""} size={22} strokeWidth={2.5} />
                    {isBookmarked ? '컬렉션 저장됨' : '컬렉션 저장'}
                  </Button>
               </div>

               {/* Badge & Title */}
               <div className="mb-4">
                  <span className="inline-block px-3 py-1 bg-[#00d084] text-black text-xs font-bold rounded mb-4">
                    VIBEFOLIO PICK 선정
                  </span>
                  <h2 className="text-2xl md:text-3xl font-bold mb-3">{project.title}</h2>
               </div>
               
               {/* Meta Info */}
               <div className="text-gray-400 text-sm mb-8 flex items-center justify-center gap-3">
                  <span>{dayjs(project.created_at).fromNow()}</span>
                  <span className="w-0.5 h-3 bg-gray-600"></span>
                  <span>{project.category || "General"}</span>
                  {project.rendering_type && (
                    <>
                      <span className="w-0.5 h-3 bg-gray-600"></span>
                      <span>{project.rendering_type}</span>
                    </>
                  )}
               </div>

               {/* Stats Icons */}
               <div className="flex items-center justify-center gap-8 text-gray-500">
                  <div className="flex items-center gap-2" title="조회수">
                     <Eye size={20} />
                     <span className="text-lg font-medium text-gray-300">{addCommas(viewCount)}</span>
                  </div>
                  <div className="flex items-center gap-2" title="좋아요">
                     <Heart size={20} />
                     <span className="text-lg font-medium text-gray-300">{addCommas(likeCount)}</span>
                  </div>
                  <div className="flex items-center gap-2" title="댓글">
                     <MessageCircle size={20} />
                     <span className="text-lg font-medium text-gray-300">{comments.length}</span>
                  </div>
               </div>
           </div>
        </div>

        {/* 3. 작성자 프로필 섹션 */}
        <div className="max-w-2xl mx-auto px-4 py-20 text-center border-b border-gray-100">
            <div className="mb-6 relative inline-block group cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-tr from-purple-500 to-pink-500 rounded-full blur opacity-20 group-hover:opacity-40 transition-opacity"></div>
              <img 
                src={project.user.profile_image.large} 
                alt={project.user.username}
                className="relative w-28 h-28 rounded-full border-4 border-white shadow-lg mx-auto object-cover"
              />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">{project.user.username}</h3>
            <p className="text-gray-500 mb-8 max-w-md mx-auto leading-relaxed">
                창작의 즐거움을 나누는 크리에이터입니다.
                {/* Intro data if available */}
            </p>
            
            <div className="flex items-center justify-center gap-3">
                <Button variant="outline" className="h-11 px-8 rounded-full border-gray-300 hover:bg-gray-50 gap-2 text-base">
                  <Plus size={18} /> 팔로우
                </Button>
                <Button className="h-11 px-8 rounded-full bg-[#00d084] hover:bg-[#00b874] text-white border-0 gap-2 font-bold text-base shadow-md">
                  <MessageSquare size={18} /> 제안하기
                </Button>
            </div>
        </div>

        {/* 4. 댓글 섹션 (간소화) */}
        <div className="max-w-3xl mx-auto px-6 py-16 border-b border-gray-100">
            <h3 className="text-xl font-bold mb-8 flex items-center gap-2">
              댓글 <span className="text-green-600">{comments.length}</span>
            </h3>
            
            {/* Input */}
            <div className="flex gap-4 mb-10">
                <div className="flex-1">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="작품에 대한 감상평을 남겨주세요..."
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all resize-none text-gray-800 placeholder:text-gray-400"
                    rows={2}
                  />
                  <div className="flex justify-end mt-2">
                     <Button 
                        onClick={handleAddComment} 
                        disabled={!newComment.trim()} 
                        size="sm" 
                        className="rounded-full bg-black hover:bg-gray-800 text-white transition-colors"
                     >
                        작성하기
                     </Button>
                  </div>
                </div>
            </div>

             {/* List */}
            <div className="space-y-6">
              {comments.length > 0 ? (
                comments.map((comment) => (
                  <div key={comment.id} className="flex gap-4 group">
                      <img src={comment.userAvatar} className="w-10 h-10 rounded-full object-cover border border-gray-100 mt-1" />
                      <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                              <span className="font-bold text-sm text-gray-900">{comment.username}</span>
                              <span className="text-xs text-gray-400">{dayjs(comment.createdAt).format("YYYY.MM.DD")}</span>
                              {user && user.id === comment.user_id && (
                                 <button onClick={() => handleDeleteComment(comment.id)} className="ml-auto text-xs text-gray-300 hover:text-red-500 transition-colors">삭제</button>
                              )}
                          </div>
                          <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{comment.content}</p>
                      </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-gray-400 bg-gray-50 rounded-xl">
                   첫 번째 댓글의 주인공이 되어보세요!
                </div>
              )}
            </div>
        </div>

        {/* 5. 관련 프로젝트 (기존 로직 활용 + 디자인 개선) */}
        {relatedProjects.length > 0 && (
          <div className="max-w-[1400px] mx-auto px-6 py-20 pb-32">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center justify-between">
              <span>관련 프로젝트</span>
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-black hover:bg-gray-100 rounded-full">더 보기</Button>
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProjects.map((relatedProject) => (
                <div key={relatedProject.id} className="transform transition-all duration-300 hover:-translate-y-1">
                  <ImageCard props={relatedProject} />
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
