"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BlockEditor } from "@/components/editor/BlockEditor";
import { ContentBlock } from "@/types/editor";
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
  faEye,
} from "@fortawesome/free-solid-svg-icons";
import { supabase } from "@/lib/supabase/client";
import { uploadImage } from "@/lib/supabase/storage";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";

import { GENRE_CATEGORIES as GENRES_CONST, FIELD_CATEGORIES as FIELDS_CONST, GENRE_TO_CATEGORY_ID } from "@/lib/constants";

// 아이콘 매핑
const GENRE_ICONS: Record<string, IconDefinition> = {
  photo: faCamera,
  animation: faWandMagicSparkles,
  graphic: faPalette,
  design: faPenRuler,
  video: faVideo,
  cinema: faFilm,
  audio: faHeadphones,
  "3d": faCube,
  text: faFileLines,
  code: faCode,
  webapp: faMobileScreen,
  game: faGamepad,
};

// 장르 카테고리 (Constants + Icons)
const genreCategories = GENRES_CONST.map(g => ({
  ...g,
  icon: GENRE_ICONS[g.id] || faCube
}));

// 산업 분야
const fieldCategories = FIELDS_CONST;

export default function AdvancedProjectUploadPage() {
  const router = useRouter();
  const [step, setStep] = useState<'info' | 'content'>('info');
  const [title, setTitle] = useState("");
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert("프로젝트를 등록하려면 먼저 로그인해주세요.");
        router.push("/login");
        return;
      }
      setUserId(user.id);

      // 사용자 관심사 로드
      try {
        const { data: userData } = await supabase
          .from('users')
          .select('interests')
          .eq('id', user.id)
          .single();

        if (userData) {
          const interests = (userData as any).interests;
          if (interests) {
            if (interests.genres && Array.isArray(interests.genres)) {
              setSelectedGenres(interests.genres);
            }
            if (interests.fields && Array.isArray(interests.fields)) {
              setSelectedFields(interests.fields);
            }
          }
        }
      } catch (error) {
        console.error("관심사 로드 실패:", error);
      }
    };
    
    init();
  }, [router]);

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
    setIsSubmitting(true);

    try {
      if (!userId || !coverImage) throw new Error('필수 정보가 누락되었습니다.');

      // 1. 커버 이미지 업로드
      const coverUrl = await uploadImage(coverImage);

      // 2. 블록 데이터 처리 (이미지 블록의 파일 업로드 등)
      // TODO: 각 블록의 이미지/비디오 파일 업로드 처리

      // 3. 프로젝트 생성
      const category_id = GENRE_TO_CATEGORY_ID[selectedGenres[0]] || 1;

      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          category_id,
          title,
          content_text: JSON.stringify(contentBlocks), // 블록 데이터를 JSON으로 저장
          thumbnail_url: coverUrl,
          rendering_type: 'blocks', // 새로운 렌더링 타입
          custom_data: JSON.stringify({
            genres: selectedGenres,
            fields: selectedFields,
          }),
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '서버 에러');

      alert('프로젝트가 성공적으로 등록되었습니다!');
      router.push('/');
    } catch (error: any) {
      console.error('Submit Error:', error);
      alert(error.message || '알 수 없는 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === 'info') {
    return (
      <div className="w-full min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 py-12 px-4">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="w-4 h-4" />
              <span className="text-sm font-medium">돌아가기</span>
            </button>
            <h1 className="text-4xl font-black text-gray-900 mb-2">
              새 프로젝트 만들기
            </h1>
            <p className="text-gray-600">
              당신의 창작물을 세상과 공유하세요
            </p>
          </div>

          <div className="bg-white rounded-3xl shadow-xl border border-gray-200 p-8 md:p-12 space-y-8">
            {/* 커버 이미지 */}
            <div className="space-y-3">
              <label className="text-lg font-bold text-gray-900">커버 이미지</label>
              <p className="text-sm text-gray-500">프로젝트를 대표하는 이미지를 선택하세요</p>
              {coverPreview ? (
                <div className="relative w-full aspect-video rounded-2xl overflow-hidden border-2 border-gray-200">
                  <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
                  <button
                    onClick={() => {
                      setCoverImage(null);
                      setCoverPreview(null);
                    }}
                    className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-all"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full aspect-video border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer hover:border-green-500 hover:bg-green-50/30 transition-all">
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                      <FontAwesomeIcon icon={faCamera} className="w-8 h-8 text-green-600" />
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
              <label className="text-lg font-bold text-gray-900">프로젝트 제목</label>
              <Input
                type="text"
                placeholder="예: AI로 만든 판타지 일러스트 시리즈"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-lg h-14 border-2 border-gray-200 focus:border-green-500 rounded-xl"
              />
            </div>

            {/* 장르 */}
            <div className="space-y-3">
              <label className="text-lg font-bold text-gray-900">
                장르 <span className="text-red-500">*</span>
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
                          ? "bg-green-500 border-green-500 text-white shadow-lg shadow-green-200"
                          : "bg-white border-gray-200 text-gray-700 hover:border-green-400 hover:shadow-md"
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
              <label className="text-lg font-bold text-gray-900">
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
                          ? "bg-indigo-500 border-indigo-500 text-white"
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
                className="w-full h-14 text-lg font-bold bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all"
              >
                다음: 콘텐츠 작성하기 →
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Content Step
  return (
    <div className="w-full min-h-screen bg-white">
      {/* Fixed Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setStep('info')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{title}</h2>
              <p className="text-sm text-gray-500">프로젝트 콘텐츠 작성</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center gap-2"
            >
              <FontAwesomeIcon icon={faEye} className="w-4 h-4" />
              미리보기
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700 text-white px-6"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  발행 중...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faUpload} className="w-4 h-4" />
                  발행하기
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Editor */}
      <BlockEditor
        initialBlocks={contentBlocks}
        onChange={setContentBlocks}
      />
    </div>
  );
}
