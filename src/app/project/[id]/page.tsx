// src/app/project/[id]/page.tsx

"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/app/supabase-provider";
import { Heart, Eye, Share2, Bookmark, ArrowLeft, ExternalLink } from "lucide-react";
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
  user_id: string; // Add user_id to Project interface
}

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const { session } = useSupabase();
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
      // Fetch project details from Supabase 'projects' table
      const { data: projectData, error: projectError } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single();

      if (projectError || !projectData) {
        throw new Error("Project not found.");
      }
      setProject(projectData);

      // Fetch related projects
      const { data: relatedData } = await supabase
        .from("projects")
        .select("*")
        .eq("category", projectData.category)
        .neq("id", projectId)
        .limit(4);
      setRelatedProjects(relatedData || []);

      // Record the view
      if (user) {
        await recordView(projectId);
      }

      // Fetch likes, bookmarks, views, and comments in parallel
      const [likeCount, viewCount, comments] = await Promise.all([
        getProjectLikeCount(projectId),
        getProjectViewCount(projectId),
        getProjectComments(projectId),
      ]);
      setLikeCount(likeCount);
      setViewCount(viewCount);
      setComments(comments);

      // Check like and bookmark status if user is logged in
      if (user) {
        const [liked, bookmarked] = await Promise.all([
          isProjectLiked(projectId, user.id),
          isProjectBookmarked(projectId, user.id),
        ]);
        setIsLiked(liked);
        setIsBookmarked(bookmarked);
      }
    } catch (error) {
      console.error("Failed to load project data:", error);
      setProject(null); // Ensure project is null on error
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
        await removeLike(projectId, user.id);
        setLikeCount((prev) => prev - 1);
      } else {
        await addLike(projectId, user.id);
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
        await removeBookmark(projectId, user.id);
      } else {
        await addBookmark(projectId, user.id);
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

      {/* 메인 콘텐츠 */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* 프로젝트 이미지 */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-8 shadow-subtle">
          <img
            src={project.urls.full}
            alt={project.alt_description || "프로젝트 이미지"}
            className="w-full h-auto object-contain max-h-[80vh]"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 왼쪽: 프로젝트 정보 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 제목 및 설명 */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-subtle">
              <h1 className="text-3xl md:text-4xl font-bold text-primary mb-4">
                {project.title || "제목 없음"}
              </h1>
              <p className="text-secondary text-lg leading-relaxed">
                {project.description || project.alt_description || "설명이 없습니다."}
              </p>

              {/* 태그 */}
              {project.tags && project.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-6">
                  {project.tags.map((tag, index) => (
                    <span key={index} className="tag">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* 프로젝트 정보 */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-subtle">
              <h2 className="text-xl font-bold text-primary mb-4">프로젝트 정보</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-secondary mb-1">게시일</p>
                  <p className="text-primary font-medium">
                    {dayjs(project.created_at).format("YYYY년 MM월 DD일")}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-secondary mb-1">카테고리</p>
                  <p className="text-primary font-medium">
                    {project.category === "korea" ? "전체" : project.category === "ai" ? "AI" : "영상/모션그래픽"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-secondary mb-1">이미지 크기</p>
                  <p className="text-primary font-medium">
                    {project.width} × {project.height}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-secondary mb-1">조회수</p>
                  <p className="text-primary font-medium">
                    {addCommas(viewCount)}
                  </p>
                </div>
              </div>
            </div>

            {/* 댓글 섹션 */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-subtle">
              <h2 className="text-xl font-bold text-primary mb-4">
                댓글 ({comments.length})
              </h2>

              {/* 댓글 작성 */}
              <div className="mb-6">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="댓글을 입력하세요..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-black resize-none"
                  rows={3}
                />
                <div className="flex justify-end mt-2">
                  <Button onClick={handleAddComment} className="btn-primary" disabled={!user}>
                    댓글 작성
                  </Button>
                </div>
              </div>

              {/* 댓글 목록 */}
              <div className="space-y-4">
                {comments.length > 0 ? (
                  comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="border-b border-gray-200 pb-4 last:border-0"
                    >
                      <div className="flex items-start gap-3">
                        <img
                          src={comment.userAvatar}
                          alt={comment.username}
                          className="w-10 h-10 rounded-full avatar"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-primary">
                                {comment.username}
                              </span>
                              <span className="text-xs text-secondary">
                                {dayjs(comment.createdAt).format("YYYY.MM.DD HH:mm")}
                              </span>
                            </div>
                            {user && user.id === comment.user_id && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteComment(comment.id)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              >
                                삭제
                              </Button>
                            )}
                          </div>
                          <p className="text-secondary">{comment.content}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-secondary text-center py-8">
                    첫 번째 댓글을 작성해보세요!
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 오른쪽: 작성자 정보 및 통계 */}
          <div className="space-y-6">
            {/* 작성자 정보 */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-subtle sticky top-32">
              <div className="flex items-center gap-4 mb-6">
                <img
                  src={project.user.profile_image.large}
                  alt={project.user.username}
                  className="w-16 h-16 rounded-full avatar"
                />
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-primary">
                    {project.user.username}
                  </h3>
                  <p className="text-sm text-secondary">크리에이터</p>
                </div>
              </div>

              <Button className="w-full btn-primary mb-4">
                팔로우
              </Button>

              <Button variant="outline" className="w-full btn-secondary">
                메시지 보내기
              </Button>

              {/* 통계 */}
              <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-secondary">
                    <Heart size={16} />
                    <span className="text-sm">좋아요</span>
                  </div>
                  <span className="font-medium text-primary">
                    {addCommas(likeCount)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-secondary">
                    <Eye size={16} />
                    <span className="text-sm">조회수</span>
                  </div>
                  <span className="font-medium text-primary">
                    {addCommas(viewCount)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-secondary">
                    <Share2 size={16} />
                    <span className="text-sm">공유</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleShare}
                    className="text-primary hover:text-primary"
                  >
                    <ExternalLink size={14} />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 관련 프로젝트 */}
        {relatedProjects.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-primary mb-6">
              관련 프로젝트
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {relatedProjects.map((relatedProject) => (
                <ImageCard key={relatedProject.id} props={relatedProject} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
