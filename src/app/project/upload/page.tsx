"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import TiptapEditor from "@/components/editor/TiptapEditor";
import { EditorSidebar } from "@/components/editor/EditorSidebar"; // Import Sidebar
import '@/components/editor/tiptap.css';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCamera,
  faWandMagicSparkles,
  faPalette,
  faPenRuler,
  faVideo,
  faFilm,
  faHeadphones,
  faCube,
  faFileLines,
  faCode,
  faMobileScreen,
  faGamepad,
  faUpload,
  faCheck,
  faArrowLeft,
} from "@fortawesome/free-solid-svg-icons";
import { supabase } from "@/lib/supabase/client";
import { uploadImage } from "@/lib/supabase/storage";
import { GENRE_TO_CATEGORY_ID } from '@/lib/constants';
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { Editor } from "@tiptap/react"; // Import Editor type

// 장르 카테고리
const genreCategories: { id: string; label: string; icon: IconDefinition }[] = [
  { id: "photo", label: "포토", icon: faCamera },
  { id: "animation", label: "애니메이션", icon: faWandMagicSparkles },
  { id: "graphic", label: "그래픽", icon: faPalette },
  { id: "design", label: "디자인", icon: faPenRuler },
  { id: "video", label: "영상", icon: faVideo },
  { id: "cinema", label: "영화·드라마", icon: faFilm },
  { id: "audio", label: "오디오", icon: faHeadphones },
  { id: "3d", label: "3D", icon: faCube },
  { id: "text", label: "텍스트", icon: faFileLines },
  { id: "code", label: "코드", icon: faCode },
  { id: "webapp", label: "웹/앱", icon: faMobileScreen },
  { id: "game", label: "게임", icon: faGamepad },
];

const fieldCategories = [
  { id: "finance", label: "경제/금융" },
  { id: "healthcare", label: "헬스케어" },
  { id: "beauty", label: "뷰티/패션" },
  { id: "pet", label: "반려" },
  { id: "fnb", label: "F&B" },
  { id: "travel", label: "여행/레저" },
  { id: "education", label: "교육" },
  { id: "it", label: "IT" },
  { id: "lifestyle", label: "라이프스타일" },
  { id: "business", label: "비즈니스" },
  { id: "other", label: "기타" },
];

export default function TiptapUploadPage() {
  const router = useRouter();
  const [step, setStep] = useState<'info' | 'content'>('info');
  const [title, setTitle] = useState("");
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Editor Instance State
  const [editor, setEditor] = useState<Editor | null>(null);
  const sidebarFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert("프로젝트를 등록하려면 먼저 로그인해주세요.");
        router.push("/login");
        return;
      }
      setUserId(user.id);

      // 로컬스토리지에서 임시 저장된 데이터 복구
      const savedDraft = localStorage.getItem('project_draft');
      if (savedDraft) {
        try {
          const draft = JSON.parse(savedDraft);
          if (confirm('임시 저장된 작업이 있습니다. 불러오시겠습니까?')) {
            setTitle(draft.title || '');
            setContent(draft.content || '');
            setSelectedGenres(draft.genres || []);
            setSelectedFields(draft.fields || []);
          }
        } catch (e) {
          console.error('Draft load error:', e);
        }
      }

      // 사용자 관심사 로드
      try {
        const { data: userData } = await supabase
          .from('users')
          .select('interests')
          .eq('id', user.id)
          .single();

        if (userData) {
          const interests = (userData as any).interests;
          if (interests && !savedDraft) {
            if (interests.genres) setSelectedGenres(interests.genres);
            if (interests.fields) setSelectedFields(interests.fields);
          }
        }
      } catch (error) {
        console.error("관심사 로드 실패:", error);
      }
    };
    
    init();
  }, [router]);

  // 자동 저장 (30초마다)
  useEffect(() => {
    if (step === 'content' && title) {
      const interval = setInterval(() => {
        const draft = {
          title,
          content, // Content is updated via onChange from TiptapEditor
          genres: selectedGenres,
          fields: selectedFields,
          savedAt: new Date().toISOString(),
        };
        localStorage.setItem('project_draft', JSON.stringify(draft));
        setLastSaved(new Date());
      }, 30000); // 30초

      return () => clearInterval(interval);
    }
  }, [step, title, content, selectedGenres, selectedFields]);

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('이미지 크기는 10MB를 초과할 수 없습니다.');
        return;
      }
      setCoverImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleGenre = (id: string) => {
    setSelectedGenres(prev => 
      prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
    );
  };

  const toggleField = (id: string) => {
    setSelectedFields(prev => 
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  const handleNext = () => {
    if (!title.trim()) {
      alert('프로젝트 제목을 입력해주세요.');
      return;
    }
    if (!coverImage) {
      alert('커버 이미지를 선택해주세요.');
      return;
    }
    if (selectedGenres.length === 0) {
      alert('최소 1개의 장르를 선택해주세요.');
      return;
    }
    setStep('content');
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    
    // Get latest content from editor if available, otherwise use state content
    const finalContent = editor ? editor.getHTML() : content;

    if (!finalContent || finalContent === '<p></p>') {
      alert('프로젝트 내용을 작성해주세요.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (!userId || !coverImage) throw new Error('필수 정보가 누락되었습니다.');

      // 커버 이미지 업로드
      const coverUrl = await uploadImage(coverImage);

      // 프로젝트 생성
      const category_id = GENRE_TO_CATEGORY_ID[selectedGenres[0]] || 1;

      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          category_id,
          title,
          content_text: finalContent, // Tiptap HTML content
          thumbnail_url: coverUrl,
          rendering_type: 'rich_text', // Tiptap 렌더링 타입
          custom_data: JSON.stringify({
            genres: selectedGenres,
            fields: selectedFields,
          }),
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '서버 에러');

      // 임시 저장 데이터 삭제
      localStorage.removeItem('project_draft');

      alert('프로젝트가 성공적으로 발행되었습니다!');
      router.push('/');
    } catch (error: any) {
      console.error('Submit Error:', error);
      alert(error.message || '알 수 없는 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Sidebar Handlers ---
  const handleAddText = () => {
    editor?.chain().focus().insertContent('<p>새로운 텍스트를 입력하세요...</p>').run();
  };

  const handleSidebarImageClick = () => {
    sidebarFileInputRef.current?.click();
  };

  const handleSidebarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editor) {
      try {
        const url = await uploadImage(file);
        editor.chain().focus().setImage({ src: url }).run();
      } catch (error) {
        console.error('Image upload failed:', error);
        alert('이미지 업로드에 실패했습니다.');
      } finally {
        if (sidebarFileInputRef.current) sidebarFileInputRef.current.value = '';
      }
    }
  };

  const handleAddVideo = () => {
    const url = window.prompt('YouTube URL을 입력하세요:');
    if (url && editor) {
      editor.commands.setYoutubeVideo({ src: url });
    }
  };

  const handleAddGrid = () => {
    // Placeholder for grid
    editor?.chain().focus().insertContent('<p>[Photo Grid Placeholder]</p>').run();
  };

  const handleAddCode = () => {
     editor?.chain().focus().toggleCodeBlock().run();
  };


  if (step === 'info') {
    return (
      <div className="w-full min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50 py-12 px-4">
        {/* Info Step Content (Same as before) */}
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors group"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-medium">돌아가기</span>
            </button>
            <h1 className="text-5xl font-black text-gray-900 mb-3 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              새 프로젝트 만들기
            </h1>
            <p className="text-lg text-gray-600">
              당신의 창작물을 세상과 공유하세요 ✨
            </p>
          </div>

          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-8 md:p-12 space-y-8">
            {/* 커버 이미지 */}
            <div className="space-y-3">
              <label className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                커버 이미지
              </label>
              <p className="text-sm text-gray-500">프로젝트를 대표하는 이미지를 선택하세요</p>
              {coverPreview ? (
                <div className="relative w-full aspect-video rounded-2xl overflow-hidden border-2 border-gray-200 group">
                  <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
                  <button
                    onClick={() => {
                      setCoverImage(null);
                      setCoverPreview(null);
                    }}
                    className="absolute top-4 right-4 p-3 bg-black/60 hover:bg-black/80 rounded-full text-white transition-all opacity-0 group-hover:opacity-100"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full aspect-video border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer hover:border-green-500 hover:bg-green-50/30 transition-all group">
                  <div className="flex flex-col items-center">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <FontAwesomeIcon icon={faCamera} className="w-10 h-10 text-green-600" />
                    </div>
                    <p className="text-lg font-semibold text-gray-700 mb-1">이미지 업로드</p>
                    <p className="text-sm text-gray-500">PNG, JPG, GIF (최대 10MB)</p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleCoverImageChange}
                  />
                </label>
              )}
            </div>

            {/* 제목 */}
            <div className="space-y-3">
              <label className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                프로젝트 제목
              </label>
              <Input
                type="text"
                placeholder="예: AI로 만든 판타지 일러스트 시리즈"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-lg h-14 border-2 border-gray-200 focus:border-green-500 rounded-xl transition-all"
              />
            </div>

            {/* 장르 */}
            <div className="space-y-3">
              <label className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                장르 <span className="text-red-500 ml-1">*</span>
              </label>
              <div className="flex flex-wrap gap-3">
                {genreCategories.map((genre) => {
                  const isSelected = selectedGenres.includes(genre.id);
                  return (
                    <button
                      key={genre.id}
                      type="button"
                      onClick={() => toggleGenre(genre.id)}
                      className={`flex items-center gap-2 px-5 py-3 rounded-full border-2 transition-all font-medium ${
                        isSelected
                          ? "bg-gradient-to-r from-green-500 to-emerald-500 border-green-500 text-white shadow-lg shadow-green-200 scale-105"
                          : "bg-white border-gray-200 text-gray-700 hover:border-green-400 hover:shadow-md hover:scale-105"
                      }`}
                    >
                      <FontAwesomeIcon icon={genre.icon} className="w-4 h-4" />
                      <span>{genre.label}</span>
                      {isSelected && <FontAwesomeIcon icon={faCheck} className="w-3 h-3" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 산업 분야 */}
            <div className="space-y-3">
              <label className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                관련 산업 분야 <span className="text-sm font-normal text-gray-500">(선택)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {fieldCategories.map((field) => {
                  const isSelected = selectedFields.includes(field.id);
                  return (
                    <button
                      key={field.id}
                      type="button"
                      onClick={() => toggleField(field.id)}
                      className={`px-4 py-2 rounded-full border-2 transition-all text-sm font-medium ${
                        isSelected
                          ? "bg-indigo-500 border-indigo-500 text-white shadow-md"
                          : "bg-white border-gray-200 text-gray-700 hover:border-indigo-400"
                      }`}
                    >
                      {field.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 다음 버튼 */}
            <div className="pt-6">
              <Button
                onClick={handleNext}
                className="w-full h-16 text-lg font-bold bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 hover:from-green-600 hover:via-emerald-600 hover:to-teal-600 text-white rounded-xl shadow-xl hover:shadow-2xl transition-all transform hover:scale-[1.02]"
              >
                다음: 콘텐츠 작성하기 →
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Content Step with Behance-style Layout
  return (
    <div className="w-full min-h-screen bg-gray-50/50">
      {/* Fixed Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm backdrop-blur-sm bg-white/95">
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setStep('info')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{title}</h2>
              <p className="text-xs text-gray-500">
                {lastSaved && `저장됨: ${lastSaved.toLocaleTimeString('ko-KR')}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <Button
              variant="ghost"
              className="text-gray-500 hover:text-gray-900"
              onClick={() => {
                const draft = { title, content, genres: selectedGenres, fields: selectedFields, savedAt: new Date().toISOString() };
                localStorage.setItem('project_draft', JSON.stringify(draft));
                alert('임시 저장되었습니다.');
              }}
             >
               저장
             </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700 text-white px-8 h-10 rounded-full font-bold shadow-md transition-all hover:scale-105"
            >
              {isSubmitting ? '발행 중...' : '계속'}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Layout: Editor + Sidebar */}
      <div className="max-w-[1600px] mx-auto flex pt-8 pb-20 justify-center">
        
        {/* Editor Area (Center) */}
        <div className="flex-1 max-w-[900px] min-h-[800px]">
          <TiptapEditor
            content={content}
            onChange={setContent}
            onEditorReady={setEditor}
            placeholder="여기에 내용을 입력하세요..."
          />
        </div>

        {/* Right Sidebar (Fixed) */}
        <div className="hidden lg:block">
           <EditorSidebar 
             onAddText={handleAddText}
             onAddImage={handleSidebarImageClick}
             onAddVideo={handleAddVideo}
             onAddGrid={handleAddGrid}
             onAddCode={handleAddCode}
           />
           {/* Hidden File Input for Sidebar */}
           <input 
             type="file"
             ref={sidebarFileInputRef}
             className="hidden"
             accept="image/*"
             onChange={handleSidebarFileChange}
           />
        </div>

      </div>
    </div>
  );
}
