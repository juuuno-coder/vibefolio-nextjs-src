// src/app/project/edit/[id]/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Upload, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface FormData {
  title: string;
  description: string;
  category: string;
  imageUrl: string;
}

export default function EditProjectPage(props: any) {
  const { params } = props;
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    category: "korea",
    imageUrl: "",
  });
  const [imagePreview, setImagePreview] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // 프로젝트 데이터 로드
    const loadProject = () => {
      try {
        const savedProjects = localStorage.getItem("projects");
        if (savedProjects) {
          const projects = JSON.parse(savedProjects);
          const project = projects.find((p: any) => p.id === params.id);
          
          if (project) {
            setFormData({
              title: project.title || "",
              description: project.description || project.alt_description || "",
              category: project.category || "korea",
              imageUrl: project.urls.regular || "",
            });
            setImagePreview(project.urls.regular || "");
          } else {
            alert("프로젝트를 찾을 수 없습니다.");
            router.push("/mypage/projects");
          }
        }
      } catch (error) {
        console.error("프로젝트 로딩 실패:", error);
      }
    };

    loadProject();
  }, [params.id, router]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImagePreview(result);
        setFormData({ ...formData, imageUrl: result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // 유효성 검사
      if (!formData.title.trim()) {
        alert("제목을 입력해주세요.");
        setIsSubmitting(false);
        return;
      }

      if (!formData.imageUrl) {
        alert("이미지를 선택해주세요.");
        setIsSubmitting(false);
        return;
      }

      // 프로젝트 업데이트
      const savedProjects = localStorage.getItem("projects");
      if (savedProjects) {
        const projects = JSON.parse(savedProjects);
        const projectIndex = projects.findIndex((p: any) => p.id === params.id);
        
        if (projectIndex !== -1) {
          // 기존 프로젝트 데이터 유지하면서 업데이트
          projects[projectIndex] = {
            ...projects[projectIndex],
            title: formData.title,
            description: formData.description,
            alt_description: formData.description,
            category: formData.category,
            urls: {
              regular: formData.imageUrl,
              full: formData.imageUrl,
            },
          };

          localStorage.setItem("projects", JSON.stringify(projects));
          alert("프로젝트가 수정되었습니다!");
          router.push("/mypage/projects");
        }
      }
    } catch (error) {
      console.error("프로젝트 수정 실패:", error);
      alert("프로젝트 수정에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-gray-50 py-8 md:py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg border border-gray-200 p-6 md:p-10 fade-in shadow-subtle">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="flex items-center gap-2 text-secondary hover:text-primary mb-4"
          >
            <ArrowLeft size={20} />
            뒤로 가기
          </Button>

          <h1 className="text-2xl md:text-3xl font-bold text-primary mb-2">
            프로젝트 편집
          </h1>
          <p className="text-sm md:text-base text-secondary mb-8">
            프로젝트 정보를 수정하세요
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 이미지 업로드 */}
            <div>
              <label className="block text-sm font-medium text-primary mb-2">
                프로젝트 이미지 *
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                {imagePreview ? (
                  <div className="space-y-4">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="max-h-64 mx-auto rounded-lg"
                    />
                    <label className="inline-block cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                      <span className="text-sm text-purple-600 hover:text-purple-700 font-medium">
                        이미지 변경
                      </span>
                    </label>
                  </div>
                ) : (
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <Upload className="mx-auto mb-4 text-gray-400" size={48} />
                    <p className="text-gray-600">
                      클릭하여 이미지 업로드
                    </p>
                  </label>
                )}
              </div>
            </div>

            {/* 제목 */}
            <div>
              <label className="block text-sm font-medium text-primary mb-2">
                프로젝트 제목 *
              </label>
              <Input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="프로젝트 제목을 입력하세요"
                className="w-full"
                required
              />
            </div>

            {/* 설명 */}
            <div>
              <label className="block text-sm font-medium text-primary mb-2">
                프로젝트 설명
              </label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="프로젝트에 대한 설명을 입력하세요"
                className="w-full min-h-32"
                rows={5}
              />
            </div>

            {/* 카테고리 */}
            <div>
              <label className="block text-sm font-medium text-primary mb-2">
                카테고리 *
              </label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
                required
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
                onClick={() => router.back()}
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
                    수정 중...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Save size={20} />
                    수정 완료
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
