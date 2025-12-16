"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
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
  faXmark,
  faImage,
  faCheck,
} from "@fortawesome/free-solid-svg-icons";
import { supabase } from "@/lib/supabase/client";
import { uploadImage } from "@/lib/supabase/storage";

// 장르 카테고리 (메인) - Font Awesome
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

// 산업 분야 카테고리
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

export default function ProjectUploadPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    imageUrl: "",
  });
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // 초기화 (세션 확인)
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert("프로젝트를 등록하려면 먼저 로그인해주세요.");
        router.push("/login");
        return;
      }
      setUserId(user.id);
    };
    
    init();
  }, [router]);

  // 장르 토글
  const toggleGenre = (id: string) => {
    setSelectedGenres(prev => 
      prev.includes(id) 
        ? prev.filter(g => g !== id)
        : [...prev, id]
    );
  };

  // 분야 토글
  const toggleField = (id: string) => {
    setSelectedFields(prev => 
      prev.includes(id) 
        ? prev.filter(f => f !== id)
        : [...prev, id]
    );
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('이미지 크기는 10MB를 초과할 수 없습니다.');
        return;
      }
      if (!file.type.startsWith('image/')) {
        alert('이미지 파일만 업로드 가능합니다.');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    // 유효성 검사
    if (selectedGenres.length === 0) {
      alert('최소 1개의 장르를 선택해주세요.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (!userId) throw new Error('로그인 정보가 없습니다.');
      if (!imageFile) throw new Error('이미지를 선택해주세요.');
      if (!formData.title.trim()) throw new Error('제목을 입력해주세요.');

      // 1. 이미지 업로드
      console.log("이미지 업로드 시작...");
      const imageUrl = await uploadImage(imageFile);
      console.log("이미지 업로드 완료:", imageUrl);

      // 2. 프로젝트 생성 API 호출
      // 임시로 첫 번째 장르를 category_id로 매핑 (추후 태그 시스템으로 변경)
      const genreToCategory: { [key: string]: number } = {
        photo: 1,
        animation: 2,
        graphic: 3,
        design: 4,
        video: 5,
        cinema: 6,
        audio: 7,
        "3d": 8,
        text: 9,
        code: 10,
        webapp: 11,
        game: 12,
      };
      const category_id = genreToCategory[selectedGenres[0]] || 1;

      console.log("API 호출 시작...");
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          category_id: category_id,
          title: formData.title,
          content_text: formData.description,
          thumbnail_url: imageUrl,
          rendering_type: 'image',
          // 추후 태그 저장용 (custom_data에 임시 저장)
          custom_data: JSON.stringify({
            genres: selectedGenres,
            fields: selectedFields,
          }),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("API Error Response:", data);
        throw new Error(data.error || `서버 에러: ${response.status}`);
      }

      alert('프로젝트가 성공적으로 등록되었습니다!');
      router.push('/');
    } catch (error: any) {
      console.error('Submit Error:', error);
      alert(error.message || '알 수 없는 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-gray-50 py-8 md:py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg border border-gray-200 p-6 md:p-10 fade-in shadow-subtle">
          <h1 className="text-2xl md:text-3xl font-bold text-primary mb-2">
            프로젝트 등록
          </h1>
          <p className="text-sm md:text-base text-secondary mb-8">
            당신의 AI 창작물을 세상과 공유하세요
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 이미지 업로드 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">프로젝트 이미지</label>
              <div className="relative">
                {previewImage ? (
                  <div className="relative w-full aspect-square md:aspect-video rounded-lg overflow-hidden border border-gray-100 bg-gray-50">
                    <img
                      src={previewImage}
                      alt="Preview"
                      className="w-full h-full object-contain"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewImage(null);
                        setImageFile(null);
                      }}
                      className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-all"
                    >
                      <FontAwesomeIcon icon={faXmark} className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full aspect-square md:aspect-video border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#4ACAD4] hover:bg-gray-50 transition-all">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <FontAwesomeIcon icon={faImage} className="w-12 h-12 mb-4 text-gray-400" />
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">클릭하여 업로드</span>{" "}
                        또는 드래그 앤 드롭
                      </p>
                      <p className="text-xs text-gray-500">
                        PNG, JPG, GIF (최대 10MB)
                      </p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageChange}
                      required
                    />
                  </label>
                )}
              </div>
            </div>

            {/* 제목 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">프로젝트 제목</label>
              <Input
                type="text"
                placeholder="프로젝트 제목을 입력하세요"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
                className="border-gray-200 focus:border-[#4ACAD4]"
              />
            </div>

            {/* 설명 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">프로젝트 설명</label>
              <Textarea
                placeholder="프로젝트에 대해 설명해주세요. #태그를 추가할 수도 있어요!"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                required
                rows={5}
                className="border-gray-200 resize-none focus:border-[#4ACAD4]"
              />
            </div>

            {/* 장르 선택 (필수) */}
            <div className="space-y-3">
              <label className="text-sm font-medium">
                장르 <span className="text-red-500">*</span>
                <span className="text-xs text-gray-500 ml-2">복수 선택 가능</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {genreCategories.map((genre) => {
                  const isSelected = selectedGenres.includes(genre.id);
                  return (
                    <button
                      key={genre.id}
                      type="button"
                      onClick={() => toggleGenre(genre.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all ${
                        isSelected
                          ? "bg-[#4ACAD4] border-[#4ACAD4] text-white"
                          : "bg-white border-gray-200 text-gray-700 hover:border-[#4ACAD4] hover:text-[#4ACAD4]"
                      }`}
                    >
                      <FontAwesomeIcon icon={genre.icon} className="w-4 h-4" />
                      <span className="text-sm font-medium">{genre.label}</span>
                      {isSelected && <FontAwesomeIcon icon={faCheck} className="w-3 h-3" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 산업 분야 선택 (선택) */}
            <div className="space-y-3">
              <label className="text-sm font-medium">
                산업 분야
                <span className="text-xs text-gray-500 ml-2">선택사항, 복수 선택 가능</span>
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
                          : "bg-white border-gray-200 text-gray-700 hover:border-indigo-400 hover:text-indigo-500"
                      }`}
                    >
                      {field.label}
                      {isSelected && <FontAwesomeIcon icon={faCheck} className="w-3 h-3 ml-1" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 선택된 태그 요약 */}
            {(selectedGenres.length > 0 || selectedFields.length > 0) && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">선택된 태그:</p>
                <div className="flex flex-wrap gap-2">
                  {selectedGenres.map(id => {
                    const genre = genreCategories.find(g => g.id === id);
                    return genre ? (
                      <span key={id} className="px-3 py-1 bg-[#4ACAD4]/20 text-[#4ACAD4] rounded-full text-sm font-medium">
                        #{genre.label}
                      </span>
                    ) : null;
                  })}
                  {selectedFields.map(id => {
                    const field = fieldCategories.find(f => f.id === id);
                    return field ? (
                      <span key={id} className="px-3 py-1 bg-indigo-100 text-indigo-600 rounded-full text-sm font-medium">
                        #{field.label}
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
            )}

            {/* 버튼 */}
            <div className="flex flex-col md:flex-row gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/")}
                className="flex-1 h-12"
                disabled={isSubmitting}
              >
                취소
              </Button>
              <Button
                type="submit"
                className="flex-1 h-12 bg-[#4ACAD4] hover:bg-[#3dbdc6] text-white"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    등록 중...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <FontAwesomeIcon icon={faUpload} className="w-5 h-5" />
                    프로젝트 등록
                  </span>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
