// src/app/project/upload/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { uploadImage } from "@/lib/supabase/storage";

// ...

export default function ProjectUploadPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "korea",
    imageUrl: "",
  });
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // 세션 체크
  useEffect(() => {
    const checkSession = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert("프로젝트를 등록하려면 먼저 로그인해주세요.");
        router.push("/login");
        return;
      }
      setUserId(user.id);
    };
    
    checkSession();
  }, [router]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 파일 크기 제한 (10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('이미지 크기는 10MB를 초과할 수 없습니다.');
        return;
      }

      // 파일 타입 확인
      if (!file.type.startsWith('image/')) {
        alert('이미지 파일만 업로드 가능합니다.');
        return;
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPreviewImage(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!userId) {
        alert('로그인 정보를 찾을 수 없습니다. 다시 로그인해주세요.');
        router.push('/login');
        return;
      }

      if (!imageFile) {
        alert('이미지를 선택해주세요.');
        return;
      }

      // 이미지를 Supabase Storage에 업로드
      const imageUrl = await uploadImage(imageFile);

      // 카테고리 이름을 category_id로 변환
      const categoryMap: { [key: string]: number } = {
        'korea': 1, // 전체
        'ai': 2,    // AI
        'video': 3, // 영상/모션그래픽
      };

      const category_id = categoryMap[formData.category] || 1;

      // API를 통해 프로젝트 생성
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          category_id: category_id,
          title: formData.title,
          content_text: formData.description,
          thumbnail_url: imageUrl, // Supabase Storage URL 사용
          rendering_type: 'image',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '프로젝트 등록에 실패했습니다.');
      }

      alert('프로젝트가 성공적으로 등록되었습니다!');
      router.push('/');
    } catch (error: any) {
      console.error('프로젝트 등록 실패:', error);
      alert(error.message || '프로젝트 등록에 실패했습니다.');
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
                  <div className="relative w-full aspect-square rounded-lg overflow-hidden glass-card">
                    <img
                      src={previewImage}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewImage(null);
                        setFormData({ ...formData, imageUrl: "" });
                      }}
                      className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-all"
                    >
                      <X size={20} />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full aspect-square border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-purple-500 transition-all glass-card">
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
                className="glass-card border-white/20"
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
                className="glass-card border-white/20 resize-none"
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
                className="w-full px-3 py-2 glass-card border border-white/20 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="korea">전체</option>
                <option value="ai">AI</option>
                <option value="video">영상/모션그래픽</option>
              </select>
            </div>

            {/* 버튼 */}
            <div className="flex flex-col md:flex-row gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/")}
                className="flex-1 btn-secondary"
                disabled={isSubmitting}
              >
                취소
              </Button>
              <Button
                type="submit"
                className="flex-1 btn-primary"
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
