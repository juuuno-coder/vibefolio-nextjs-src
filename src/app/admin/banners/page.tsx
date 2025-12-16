"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, X, Edit, Trash2, ArrowLeft, Loader2, ImagePlus } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { uploadImage } from "@/lib/supabase/storage";
import { useAdmin } from "@/hooks/useAdmin";
import Link from "next/link";

export default function AdminBannersPage() {
  const router = useRouter();
  const { isAdmin, isLoading: adminLoading } = useAdmin();
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageType, setPageType] = useState<"discover" | "connect">("discover");
  const [formData, setFormData] = useState({
    title: "",
    link_url: "",
    display_order: 0,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 관리자 확인
  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      alert("관리자 권한이 필요합니다.");
      router.push("/");
    }
  }, [isAdmin, adminLoading, router]);

  // 배너 목록 로드
  const loadBanners = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('Banner')
        .select('*')
        .eq('page_type', pageType)
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      setBanners(data || []);
    } catch (error) {
      console.error("배너 로드 실패:", error);
      // 테이블이 없을 경우를 대비해 빈 배열 설정
      setBanners([]);
    } finally {
      setLoading(false);
    }
  }, [pageType]);

  useEffect(() => {
    if (isAdmin) {
      loadBanners();
    }
  }, [isAdmin, pageType, loadBanners]);

  // 이미지 드래그앤드롭
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      setImageFile(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // 배너 저장
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!imageFile && !previewImage) {
      alert("이미지를 선택해주세요.");
      return;
    }

    try {
      let imageUrl = previewImage;

      // 새 이미지가 선택된 경우 업로드
      if (imageFile) {
        // storage 버킷 'banners' 확인 필요 (없으면 생성해야 함)
        const filename = `${Date.now()}_${imageFile.name}`;
        const { data, error } = await supabase.storage
          .from('banners') // 버킷 이름 확인
          .upload(filename, imageFile);

        if (error) throw error;
        
        // Public URL 가져오기
        const { data: { publicUrl } } = supabase.storage
          .from('banners')
          .getPublicUrl(filename);
          
        imageUrl = publicUrl;
      }

      if (!imageUrl) {
        throw new Error("이미지 처리에 실패했습니다.");
      }

      const payload = {
        title: formData.title,
        link_url: formData.link_url,
        display_order: formData.display_order || 0,
        page_type: pageType,
        image_url: imageUrl,
      };

      let error;
      if (editingId) {
        const { error: updateError } = await (supabase
          .from('Banner') as any)
          .update(payload)
          .eq('banner_id', editingId);
        error = updateError;
      } else {
        const { error: insertError } = await (supabase
          .from('Banner') as any)
          .insert([payload]);
        error = insertError;
      }

      if (error) throw error;

      alert(editingId ? "배너가 수정되었습니다." : "배너가 추가되었습니다.");
      setFormData({ title: "", link_url: "", display_order: 0 });
      setImageFile(null);
      setPreviewImage(null);
      setEditingId(null);
      loadBanners();
    } catch (error: any) {
      console.error("배너 저장 실패:", error);
      alert(`배너 저장 실패: ${error.message}`);
    }
  };

  // 배너 삭제
  const handleDelete = async (id: number) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    try {
      const { error } = await supabase.from('Banner').delete().eq('banner_id', id);
      
      if (error) throw error;

      alert("배너가 삭제되었습니다.");
      loadBanners();
    } catch (error) {
      console.error("배너 삭제 실패:", error);
    }
  };

  if (adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-6">
        {/* 헤더 */}
        <div className="mb-8">
          <Link href="/admin" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft size={20} className="mr-2" />
            관리자 대시보드로 돌아가기
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            배너 관리
          </h1>
          <p className="text-gray-600">
            메인 페이지에 표시될 배너를 관리하세요.
          </p>
        </div>

        {/* 배너 추가 폼 */}
        <div className="bg-white rounded-lg p-6 mb-8 shadow">
          <h2 className="text-xl font-bold mb-4">{editingId ? "배너 수정" : "배너 추가"}</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 드래그앤드롭 영역 */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-10 text-center hover:border-[#4ACAD4] hover:bg-gray-50 transition-all cursor-pointer group"
            >
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setImageFile(file);
                    setPreviewImage(URL.createObjectURL(file));
                  }
                }}
                className="hidden"
              />

              {previewImage ? (
                <div className="relative inline-block">
                  <img src={previewImage} alt="Preview" className="max-h-64 rounded-lg shadow-sm" />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation(); // 부모(dropzone) 클릭 방지
                      setImageFile(null);
                      setPreviewImage(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-md transition-colors"
                  >
                    <X size={14} />
                  </button>
                  <p className="mt-2 text-sm text-gray-500">클릭하여 이미지 변경</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto group-hover:bg-[#E0F7FA] transition-colors">
                    <Upload className="text-gray-400 group-hover:text-[#4ACAD4]" size={32} />
                  </div>
                  <div>
                    <p className="text-gray-900 font-medium">이미지를 드래그하거나 클릭하여 업로드</p>
                    <p className="text-sm text-gray-500 mt-1">PNG, JPG, GIF up to 5MB</p>
                  </div>
                  <Button type="button" variant="secondary" className="mt-4 pointer-events-none">
                    파일 선택
                  </Button>
                </div>
              )}
            </div>

            <Input
              placeholder="배너 제목"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />

            <Input
              placeholder="링크 URL (선택사항)"
              value={formData.link_url}
              onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
            />

            <Input
              type="number"
              placeholder="표시 순서"
              value={formData.display_order}
              onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
            />

            <div className="flex gap-2">
              <Button type="submit" className="flex-1">
                {editingId ? "수정" : "추가"}
              </Button>
              {editingId && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditingId(null);
                    setFormData({ title: "", link_url: "", display_order: 0 });
                    setImageFile(null);
                    setPreviewImage(null);
                  }}
                >
                  취소
                </Button>
              )}
            </div>
          </form>
        </div>

        {/* 배너 목록 */}
        <div className="bg-white rounded-lg p-6 shadow">
          <h2 className="text-xl font-bold mb-4">배너 목록</h2>
          
          {loading ? (
            <p>로딩 중...</p>
          ) : banners.length === 0 ? (
            <p className="text-gray-500">배너가 없습니다.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {banners.map((banner) => (
                <div key={banner.banner_id} className="border rounded-lg p-4">
                  <img
                    src={banner.image_url}
                    alt={banner.title}
                    className="w-full h-48 object-cover rounded mb-2"
                  />
                  <h3 className="font-bold">{banner.title}</h3>
                  <p className="text-sm text-gray-500">순서: {banner.display_order}</p>
                  <div className="flex gap-2 mt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingId(banner.banner_id);
                        setFormData({
                          title: banner.title,
                          link_url: banner.link_url || "",
                          display_order: banner.display_order,
                        });
                        setPreviewImage(banner.image_url);
                      }}
                    >
                      <Edit size={16} />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(banner.banner_id)}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
