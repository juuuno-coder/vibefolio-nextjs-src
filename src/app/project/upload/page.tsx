"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { uploadImage } from "@/lib/supabase/storage";

export default function ProjectUploadPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "", // 초기값은 로딩 후 설정
    imageUrl: "",
  });
  const [categories, setCategories] = useState<any[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // 초기화 (세션 및 카테고리)
  useEffect(() => {
    const init = async () => {
      // 1. 유저 확인
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert("프로젝트를 등록하려면 먼저 로그인해주세요.");
        router.push("/login");
        return;
      }
      setUserId(user.id);

      // 2. 카테고리 목록 가져오기
      const { data: catData, error } = await supabase
        .from('Category')
        .select('*')
        .order('category_id', { ascending: true }) as { data: { category_id: number, name: string }[] | null, error: any };

      if (error || !catData) {
        console.error('카테고리 로딩 실패:', error);
        // 실패 시 비상용 하드코딩 (혹시 모를 상황 대비)
        setCategories([
            { category_id: 1, name: '전체' },
            { category_id: 2, name: 'AI' },
            { category_id: 3, name: '영상/모션그래픽' },
        ]);
      } else if (catData.length > 0) {
        setCategories(catData);
        // 첫 번째 카테고리를 기본 선택
        setFormData(prev => ({ ...prev, category: catData[0].category_id.toString() }));
      }
    };
    
    init();
  }, [router]);

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
      const category_id = parseInt(formData.category);
      if (isNaN(category_id)) throw new Error('카테고리를 선택해주세요.');

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
            당신의 창작물을 세상과 공유하세요
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
                      <X size={20} />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full aspect-square md:aspect-video border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#4ACAD4] hover:bg-gray-50 transition-all">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <ImageIcon className="w-12 h-12 mb-4 text-gray-400" />
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
                placeholder="프로젝트에 대해 설명해주세요"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                required
                rows={5}
                className="border-gray-200 resize-none focus:border-[#4ACAD4]"
              />
            </div>

            {/* 카테고리 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">카테고리</label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                required
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4ACAD4] focus:border-transparent text-sm"
              >
                <option value="" disabled>카테고리를 선택하세요</option>
                {categories.map((cat) => (
                    <option key={cat.category_id} value={cat.category_id}>
                        {cat.name}
                    </option>
                ))}
              </select>
            </div>

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
                    <Upload size={20} />
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
