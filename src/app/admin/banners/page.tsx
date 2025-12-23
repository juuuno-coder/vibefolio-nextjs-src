"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Trash2, 
  Edit, 
  Image as ImageIcon, 
  ArrowLeft, 
  Loader2,
  Eye,
  EyeOff,
  GripVertical
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { useAdmin } from "@/hooks/useAdmin";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface Banner {
  id: number;
  title: string;
  subtitle: string | null;
  image_url: string;
  link_url: string | null;
  bg_color: string;
  text_color: string;
  is_active: boolean;
  display_order: number;
}

export default function AdminBannersPage() {
  const { isAdmin, isLoading: adminLoading } = useAdmin();
  const router = useRouter();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    image_url: "",
    link_url: "",
    bg_color: "#000000",
    text_color: "#ffffff",
    is_active: true,
    display_order: 0,
  });

  const loadBanners = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("banners")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      if (data) setBanners(data);
    } catch (err) {
      console.error("Banner load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      router.push("/");
      return;
    }
    if (isAdmin) {
      loadBanners();
    }
  }, [isAdmin, adminLoading, router]);

  const handleOpenModal = (banner?: Banner) => {
    if (banner) {
      setEditingBanner(banner);
      setFormData({
        title: banner.title,
        subtitle: banner.subtitle || "",
        image_url: banner.image_url,
        link_url: banner.link_url || "",
        bg_color: banner.bg_color,
        text_color: banner.text_color,
        is_active: banner.is_active,
        display_order: banner.display_order,
      });
    } else {
      setEditingBanner(null);
      const maxOrder = banners.length > 0 ? Math.max(...banners.map(b => b.display_order)) : 0;
      setFormData({
        title: "",
        subtitle: "",
        image_url: "",
        link_url: "",
        bg_color: "#000000",
        text_color: "#ffffff",
        is_active: true,
        display_order: maxOrder + 1,
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData = {
        title: formData.title,
        subtitle: formData.subtitle || null,
        image_url: formData.image_url,
        link_url: formData.link_url || null,
        bg_color: formData.bg_color,
        text_color: formData.text_color,
        is_active: formData.is_active,
        display_order: formData.display_order,
      };

      if (editingBanner) {
        const { error } = await (supabase
          .from("banners") as any)
          .update(submitData)
          .eq("id", editingBanner.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase.from("banners") as any).insert([submitData]);
        if (error) throw error;
      }
      
      setIsModalOpen(false);
      loadBanners();
    } catch (err) {
      console.error("Save error:", err);
      alert("저장 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    try {
      const { error } = await (supabase.from("banners") as any).delete().eq("id", id);
      if (error) throw error;
      loadBanners();
    } catch (err) {
      console.error("Delete error:", err);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  const toggleActive = async (banner: Banner) => {
    try {
      const { error } = await (supabase
        .from("banners") as any)
        .update({ is_active: !banner.is_active })
        .eq("id", banner.id);
      if (error) throw error;
      loadBanners();
    } catch (err) {
      console.error("Toggle active error:", err);
    }
  };

  if (adminLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <Link href="/admin" className="inline-flex items-center text-slate-500 hover:text-slate-900 mb-4 transition-colors">
              <ArrowLeft size={18} className="mr-2" />
              대시보드로 돌아가기
            </Link>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <ImageIcon className="text-purple-500" />
              메인 배너 관리
            </h1>
            <p className="text-slate-500 mt-2">메인 페이지 상단 슬라이드 배너를 관리합니다.</p>
          </div>
          <Button onClick={() => handleOpenModal()} className="h-12 px-6 bg-slate-900 rounded-xl shadow-lg shadow-slate-200">
            <Plus size={18} className="mr-2" />
            새 배너 등록
          </Button>
        </div>

        {/* List */}
        <div className="grid grid-cols-1 gap-4">
          {loading && banners.length === 0 ? (
            <div className="text-center py-20"><Loader2 className="animate-spin mx-auto text-slate-300" size={32} /></div>
          ) : banners.length > 0 ? (
            banners.map(banner => (
              <Card key={banner.id} className={`overflow-hidden transition-all hover:shadow-md border-slate-100 ${!banner.is_active ? "opacity-60 bg-slate-50" : "bg-white"}`}>
                <CardHeader className="flex flex-row items-center justify-between py-6">
                  <div className="flex items-center gap-4 flex-1">
                    {/* Thumbnail */}
                    <div 
                      className="w-32 h-20 rounded-lg bg-slate-100 flex-shrink-0 bg-cover bg-center border border-slate-200"
                      style={{ backgroundImage: `url(${banner.image_url})` }}
                    />
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary" className="text-xs">순서: {banner.display_order}</Badge>
                        {!banner.is_active && <Badge variant="secondary">비활성</Badge>}
                        {banner.is_active && <Badge className="bg-green-500">활성</Badge>}
                      </div>
                      <CardTitle className="text-lg font-bold text-slate-900">{banner.title}</CardTitle>
                      {banner.subtitle && (
                        <p className="text-slate-500 text-sm mt-1">{banner.subtitle}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className={`hover:bg-slate-100 ${banner.is_active ? "text-green-600" : "text-slate-400"}`}
                      onClick={() => toggleActive(banner)}
                      title={banner.is_active ? "비활성화" : "활성화"}
                    >
                      {banner.is_active ? <Eye size={18} /> : <EyeOff size={18} />}
                    </Button>
                    <Button variant="ghost" size="icon" className="hover:bg-slate-100 text-slate-600" onClick={() => handleOpenModal(banner)}>
                      <Edit size={18} />
                    </Button>
                    <Button variant="ghost" size="icon" className="hover:bg-red-50 text-red-500" onClick={() => handleDelete(banner.id)}>
                      <Trash2 size={18} />
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            ))
          ) : (
            <div className="bg-white border border-dashed border-slate-200 rounded-[32px] py-32 text-center">
              <ImageIcon size={48} className="mx-auto text-slate-200 mb-6" />
              <p className="text-slate-400 text-lg">등록된 배너가 없습니다.</p>
            </div>
          )}
        </div>
      </div>

      {/* Editor Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl bg-white rounded-3xl p-8 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              {editingBanner ? "배너 수정" : "새 배너 등록"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6 mt-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">이미지 URL *</label>
              <div className="flex gap-2">
                <Input 
                  required
                  placeholder="https://..."
                  className="h-12 rounded-xl border-slate-100 bg-slate-50"
                  value={formData.image_url}
                  onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                />
              </div>
              {formData.image_url && (
                <div className="w-full h-32 rounded-xl bg-slate-100 mt-2 bg-cover bg-center border border-slate-200" 
                  style={{ backgroundImage: `url(${formData.image_url})` }} 
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">제목 *</label>
                <Input 
                  required
                  placeholder="배너 타이틀"
                  className="h-12 rounded-xl border-slate-100 bg-slate-50"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">서브 타이틀</label>
                <Input 
                  placeholder="부제목 (선택)"
                  className="h-12 rounded-xl border-slate-100 bg-slate-50"
                  value={formData.subtitle}
                  onChange={(e) => setFormData({...formData, subtitle: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">링크 URL</label>
              <Input 
                placeholder="/page or https://..."
                className="h-12 rounded-xl border-slate-100 bg-slate-50"
                value={formData.link_url}
                onChange={(e) => setFormData({...formData, link_url: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">배경색</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="color" 
                    value={formData.bg_color}
                    onChange={(e) => setFormData({...formData, bg_color: e.target.value})}
                    className="w-10 h-10 rounded cursor-pointer border-none"
                  />
                  <Input 
                    value={formData.bg_color}
                    onChange={(e) => setFormData({...formData, bg_color: e.target.value})}
                    className="h-10 rounded-lg border-slate-100 bg-slate-50"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">글자색</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="color" 
                    value={formData.text_color}
                    onChange={(e) => setFormData({...formData, text_color: e.target.value})}
                    className="w-10 h-10 rounded cursor-pointer border-none"
                  />
                  <Input 
                    value={formData.text_color}
                    onChange={(e) => setFormData({...formData, text_color: e.target.value})}
                    className="h-10 rounded-lg border-slate-100 bg-slate-50"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">순서</label>
                <Input 
                  type="number"
                  min="0"
                  className="h-10 rounded-lg border-slate-100 bg-slate-50"
                  value={formData.display_order}
                  onChange={(e) => setFormData({...formData, display_order: parseInt(e.target.value) || 0})}
                />
              </div>
            </div>

            <div className="flex gap-6 pt-2">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input 
                  type="checkbox"
                  className="w-5 h-5 rounded border-slate-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                />
                <span className="text-sm font-bold text-slate-600 group-hover:text-slate-900 transition-colors">활성화</span>
              </label>
            </div>
            
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="h-14 flex-1 font-bold text-slate-400">
                취소
              </Button>
              <Button type="submit" disabled={loading} className="h-14 flex-1 bg-slate-900 hover:bg-slate-800 rounded-2xl font-bold shadow-lg shadow-slate-200">
                {loading ? <Loader2 className="animate-spin" /> : editingBanner ? "수정 완료" : "등록하기"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
