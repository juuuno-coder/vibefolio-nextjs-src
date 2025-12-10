"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Heart, Share2, Bookmark, ArrowLeft, Send, MessageSquare, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImageCard } from "@/components/ImageCard";
import { addCommas } from "@/lib/format/comma";
import { supabase } from "@/lib/supabase/client";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/ko";

dayjs.extend(relativeTime);
dayjs.locale("ko");

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Project {
  project_id: number;
  title: string;
  content_text: string | null;
  thumbnail_url: string;
  views: number;
  likes: number;
  created_at: string;
  category_id: number;
  Category?: {
    name: string;
  };
  users: { // API 응답 구조 주의 (User -> users)
    id: string;
    nickname: string;
    profile_image_url: string;
  };
  tags?: string[];
}

interface CommentData {
  comment_id: number;
  content: string;
  created_at: string;
  user_id: string;
  users: {
    nickname: string;
    profile_image_url: string;
  };
}

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [projectId, setProjectId] = useState<string>('');
  const [project, setProject] = useState<Project | null>(null);
  const [relatedProjects, setRelatedProjects] = useState<any[]>([]);
  
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isBookmarked, setIsBookmarked] = useState(false);
  
  const [comments, setComments] = useState<CommentData[]>([]);
  const [newComment, setNewComment] = useState("");
  const [showComments, setShowComments] = useState(false); // 댓글 창 표시 여부 (모바일/사이드바 연동)
  const commentSectionRef = useRef<HTMLDivElement>(null); // 댓글 섹션 스크롤 이동용

  // params.id 언랩핑 (Next.js 15+ 대응)
  useEffect(() => {
    const unwrapParams = async () => {
      const resolvedParams = await params;
      setProjectId(resolvedParams.id);
    };
    unwrapParams();
  }, [params]);

  // 프로젝트 데이터 로드 
  useEffect(() => {
    if (!projectId) return;

    const loadProject = async () => {
      try {
        // 1. 프로젝트 상세 정보
        const { data: projectData, error: projectError } = await supabase
          .from('Project')
          .select(`
            *,
            Category (name),
            users (id, nickname, profile_image_url)
          `)
          .eq('project_id', parseInt(projectId))
          .single();

        if (projectError) throw projectError;
        setProject(projectData);

        // 2. 조회수 증가 (로컬 스토리지로 중복 방지 체크 가능하나 간단히 생략)
        await fetch(`/api/projects/${projectId}`, { method: 'PUT', body: JSON.stringify({}) });

        // 3. 좋아요, 북마크 상태 확인
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: likeData } = await supabase
            .from('Like')
            .select('*')
            .eq('user_id', user.id)
            .eq('project_id', parseInt(projectId))
            .maybeSingle();
          setIsLiked(!!likeData);

          const { data: bookmarkData } = await supabase
            .from('Wishlist')
            .select('*')
            .eq('user_id', user.id)
            .eq('project_id', parseInt(projectId))
            .maybeSingle();
          setIsBookmarked(!!bookmarkData);
        }

        // 4. 좋아요 수 조회
        const { count } = await supabase
          .from('Like')
          .select('*', { count: 'exact', head: true })
          .eq('project_id', parseInt(projectId));
        setLikeCount(count || 0);

        // 5. 댓글 목록 조회
        const res = await fetch(`/api/comments?projectId=${projectId}`);
        const commentData = await res.json();
        if (res.ok) {
          setComments(commentData.comments || []);
        }

      } catch (error) {
        console.error('데이터 로딩 실패:', error);
      }
    };

    loadProject();
  }, [projectId]);

  // 좋아요 토글
  const handleLike = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert('로그인이 필요합니다.');
      router.push('/login');
      return;
    }

    try {
      if (isLiked) {
        await supabase
          .from('Like')
          .delete()
          .eq('user_id', user.id)
          .eq('project_id', parseInt(projectId));
        setLikeCount(prev => prev - 1);
      } else {
        await supabase
          .from('Like')
          .insert({ user_id: user.id, project_id: parseInt(projectId) });
        setLikeCount(prev => prev + 1);
      }
      setIsLiked(!isLiked);
    } catch (e) {
      console.error('좋아요 실패', e);
    }
  };

  // 북마크 토글
  const handleBookmark = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }
    
    // ... 로직 (동일하게 구현하거나 API 호출)
    // 간단히 API 호출 예시 (이미 만들어둔 API가 있다면 활용)
    const res = await fetch('/api/wishlist', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ user_id: user.id, project_id: parseInt(projectId) })
    });
    const data = await res.json();
    if (res.ok) setIsBookmarked(data.bookmarked);
  };

  // 댓글 작성
  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }

    const res = await fetch('/api/comments', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        user_id: user.id,
        project_id: parseInt(projectId),
        content: newComment
      })
    });

    if (res.ok) {
      const { comment } = await res.json();
      // 새 댓글 추가 (리스트 맨 앞에)
      setComments(prev => [comment, ...prev]);
      setNewComment('');
    } else {
      alert('댓글 작성 실패');
    }
  };

  // 댓글 삭제
  const handleDeleteComment = async (commentId: number) => {
    if(!confirm('삭제하시겠습니까?')) return;
    
    const { data: { user } } = await supabase.auth.getUser();
    if(!user) return;

    const res = await fetch(`/api/comments?commentId=${commentId}&userId=${user.id}`, {
      method: 'DELETE'
    });

    if(res.ok) {
        setComments(prev => prev.filter(c => c.comment_id !== commentId));
    } else {
        const data = await res.json();
        alert(data.error || '삭제 실패');
    }
  };

  // 공유하기
  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('링크가 복사되었습니다!');
  };

  // 스크롤 이동
  const scrollToComments = () => {
    commentSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (!project) return <div className="min-h-screen bg-[#111] flex items-center justify-center text-white">Loading...</div>;

  return (
    <div className="min-h-screen bg-[#111] text-white">
      {/* 상단 헤더 (간소화) */}
      <div className="fixed top-0 left-0 w-full z-50 px-6 py-4 flex items-center justify-between no-header-bg pointer-events-none">
        <Button 
            variant="ghost" 
            onClick={() => router.back()} 
            className="text-white hover:bg-white/10 pointer-events-auto rounded-full w-10 h-10 p-0"
        >
            <ArrowLeft size={24} />
        </Button>
      </div>

      <div className="flex relative">
        {/* 메인 콘텐츠 영역 */}
        <main className="flex-1 min-h-screen flex flex-col items-center py-20 px-4 md:px-0">
            {/* 프로젝트 이미지 (중앙 정렬, 큰 사이즈) */}
            <div className="w-full max-w-5xl mb-12">
                <img 
                    src={project.thumbnail_url} 
                    alt={project.title} 
                    className="w-full h-auto shadow-2xl rounded-sm"
                />
            </div>

            {/* 프로젝트 설명 및 정보 */}
            <div className="w-full max-w-3xl text-left space-y-8 pb-20">
                <h1 className="text-4xl font-bold">{project.title}</h1>
                
                <div className="flex items-center gap-4 text-gray-400 text-sm">
                    <span>{dayjs(project.created_at).format('YYYY. MM. DD')}</span>
                    <span>•</span>
                    <span>{project.Category?.name || '기타'}</span>
                    <span>•</span>
                    <span>조회 {addCommas(project.views)}</span>
                    <span>•</span>
                    <span>좋아요 {addCommas(likeCount)}</span>
                </div>

                <p className="text-gray-300 text-lg leading-relaxed whitespace-pre-line">
                    {project.content_text || '내용이 없습니다.'}
                </p>

                {/* 태그 */}
                {/* <div className="flex flex-wrap gap-2 text-primary">
                   #Tags... 
                </div> */}
            </div>

            {/* 댓글 섹션 (하단) */}
            <div ref={commentSectionRef} className="w-full max-w-3xl border-t border-gray-800 pt-12 pb-32">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                    댓글 <span className="text-gray-500">{comments.length}</span>
                </h3>

                {/* 입력창 */}
                <div className="flex gap-4 mb-8">
                    <div className="flex-1">
                        <textarea
                            value={newComment}
                            onChange={e => setNewComment(e.target.value)}
                            placeholder="프로젝트에 대한 의견을 남겨주세요."
                            className="w-full bg-[#222] text-white rounded-lg p-4 min-h-[100px] focus:outline-none focus:ring-1 focus:ring-primary resize-none placeholder-gray-500"
                        />
                        <div className="flex justify-end mt-2">
                            <Button onClick={handleAddComment} className="bg-primary hover:bg-primary/90 text-white">
                                댓글 작성
                            </Button>
                        </div>
                    </div>
                </div>

                {/* 댓글 목록 */}
                <div className="space-y-6">
                    {comments.map(comment => (
                        <div key={comment.comment_id} className="flex gap-4 group">
                            <Avatar className="w-10 h-10 border border-gray-700">
                                <AvatarImage src={comment.users.profile_image_url || '/globe.svg'} />
                                <AvatarFallback>{comment.users.nickname?.[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium text-gray-200">{comment.users.nickname}</span>
                                    <span className="text-xs text-gray-500">{dayjs(comment.created_at).fromNow()}</span>
                                    {/* 삭제 버튼 (본인일 때만 - 로직 추가 필요하지만 일단 UI 구현) */}
                                    <button 
                                        onClick={() => handleDeleteComment(comment.comment_id)}
                                        className="text-xs text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity ml-2"
                                    >
                                        삭제
                                    </button>
                                </div>
                                <p className="text-gray-400 text-sm leading-relaxed">{comment.content}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </main>

        {/* 우측 플로팅 사이드바 (Action Bar) - Fixed */}
        <div className="fixed right-0 top-0 h-full hidden lg:flex flex-col justify-center pr-8 z-40 pointer-events-none">
            <div className="flex flex-col gap-4 pointer-events-auto bg-[#191919]/80 backdrop-blur-md p-3 rounded-full border border-white/10 shadow-2xl">
                {/* 1. 프로필 (작성자) */}
                <div className="group relative">
                    <button className="w-10 h-10 rounded-full overflow-hidden border-2 border-transparent hover:border-primary transition-all">
                        <img src={project.users.profile_image_url || '/globe.svg'} alt="Author" className="w-full h-full object-cover" />
                    </button>
                    {/* Tooltip */}
                    <div className="absolute right-full top-1/2 -translate-y-1/2 mr-3 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity">
                        {project.users.nickname}
                    </div>
                </div>

                {/* 2. 제안하기 (1:1 문의 등) */}
                <div className="group relative">
                    <button className="w-10 h-10 rounded-full bg-[#333] hover:bg-[#444] text-white flex items-center justify-center transition-all">
                        <Send size={18} />
                    </button>
                    <div className="absolute right-full top-1/2 -translate-y-1/2 mr-3 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity">
                        제안하기
                    </div>
                </div>

                {/* 3. 댓글 (스크롤 이동) */}
                <div className="group relative">
                    <button onClick={scrollToComments} className="w-10 h-10 rounded-full bg-[#333] hover:bg-[#444] text-white flex items-center justify-center transition-all">
                        <MessageSquare size={18} />
                    </button>
                    <div className="absolute right-full top-1/2 -translate-y-1/2 mr-3 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity">
                        댓글 {comments.length}
                    </div>
                </div>

                {/* 4. 공유하기 */}
                <div className="group relative">
                    <button onClick={handleShare} className="w-10 h-10 rounded-full bg-[#333] hover:bg-[#444] text-white flex items-center justify-center transition-all">
                        <Share2 size={18} />
                    </button>
                    <div className="absolute right-full top-1/2 -translate-y-1/2 mr-3 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity">
                        공유하기
                    </div>
                </div>

                {/* 5. 좋아요 */}
                <div className="group relative">
                    <button 
                        onClick={handleLike} 
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isLiked ? 'bg-red-500 text-white' : 'bg-[#333] hover:bg-[#444] text-white'}`}
                    >
                        <Heart size={18} fill={isLiked ? "currentColor" : "none"} />
                    </button>
                    <div className="absolute right-full top-1/2 -translate-y-1/2 mr-3 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity">
                        좋아요 {addCommas(likeCount)}
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
