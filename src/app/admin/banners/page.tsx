"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  Plus,
  Trash2,
  Edit,
  Image as ImageIcon,
  ArrowLeft,
  Loader2,
  Eye,
  EyeOff,
  GripVertical,
  Zap,
  Star,
  StarOff,
  ArrowUp,
  ArrowDown,
  Upload
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { uploadImage } from "@/lib/supabase/storage";
import { useAdmin } from "@/hooks/useAdmin";
import { logActivity } from "@/lib/utils/logger";
import { toast } from "sonner";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
  description: string | null;
  description_one_line: string | null;
  button_text: string | null;
  image_url: string;
  link_url: string | null;
  bg_color: string;
  text_color: string;
  is_active: boolean;
  display_order: number;
}

interface RecruitItem {
  id: number;
  title: string;
  description: string;
  type: "job" | "contest" | "event";
  link: string;
  thumbnail: string;
  show_as_banner: boolean;
  banner_location?: "discover" | "recruit" | "both" | null;
  banner_priority: number;
  company?: string | null;
  is_active: boolean;
  is_approved: boolean;
  banner_image_url?: string | null;
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
    description: "",
    description_one_line: "",
    button_text: "자세히 보기",
    image_url: "",
    link_url: "",
    bg_color: "#000000",
    text_color: "#ffffff",
    is_active: true,
    display_order: 0,
  });

  const [recruitItems, setRecruitItems] = useState<RecruitItem[]>([]);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [allPromotedItems, setAllPromotedItems] = useState<RecruitItem[]>([]);

  const loadBanners = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("banners")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      if (data) setBanners(data as any);
    } catch (err) {
      console.error("Banner load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadPromotedItems = async () => {
    try {
      const { data, error } = await supabase
        .from('recruit_items')
        .select('*')
        .eq('is_approved', true)
        .eq('is_active', true)
        .order('banner_priority', { ascending: true });

      if (error) throw error;
      setAllPromotedItems((data as any[]) || []);
    } catch (err) {
      console.error("Error loading promoted items:", err);
    }
  };

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      router.push("/");
      return;
    }
    if (isAdmin) {
      loadBanners();
      loadPromotedItems();
    }
  }, [isAdmin, adminLoading, router]);

  const handleOpenModal = (banner?: Banner) => {
    if (banner) {
      setEditingBanner(banner);
      setFormData({
        title: banner.title,
        subtitle: banner.subtitle || "",
        description: banner.description || "",
        description_one_line: banner.description_one_line || "",
        button_text: banner.button_text || "자세히 보기",
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
        description: "",
        description_one_line: "",
        button_text: "자세히 보기",
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
        description: formData.description || null,
        description_one_line: formData.description_one_line || null,
        button_text: formData.button_text || '자세히 보기',
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
        
        await logActivity({
          action: 'UPDATE',
          targetType: 'BANNER',
          targetId: editingBanner.id,
          details: { title: submitData.title },
          userId: (await supabase.auth.getUser()).data.user?.id || '',
          userEmail: (await supabase.auth.getUser()).data.user?.email
        });
      } else {
        const { error, data } = await (supabase.from("banners") as any).insert([submitData]).select();
        if (error) throw error;

        if (data && data[0]) {
           await logActivity({
            action: 'CREATE',
            targetType: 'BANNER',
            targetId: data[0].id,
            details: { title: submitData.title },
            userId: (await supabase.auth.getUser()).data.user?.id || '',
            userEmail: (await supabase.auth.getUser()).data.user?.email
          });
        }
      }
      
      setIsModalOpen(false);
      loadBanners();
      toast.success("배너가 저장되었습니다.");
    } catch (err) {
      console.error("Save error:", err);
      toast.error("저장 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    try {
      const { error } = await (supabase.from("banners") as any).delete().eq("id", id);
      if (error) throw error;
      
      await logActivity({
        action: 'DELETE',
        targetType: 'BANNER',
        targetId: id,
        userId: (await supabase.auth.getUser()).data.user?.id || '',
        userEmail: (await supabase.auth.getUser()).data.user?.email
      });
      loadBanners();
      toast.success("배너가 삭제되었습니다.");
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("삭제 중 오류가 발생했습니다.");
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

  const togglePromotedBanner = async (id: number, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('recruit_items')
        .update({
          show_as_banner: !currentStatus,
          banner_location: !currentStatus ? 'both' : null,
          banner_priority: !currentStatus ? 1 : 999,
        } as any)
        .eq('id', id);

      if (error) throw error;
      toast.success(currentStatus ? '배너에서 해제되었습니다.' : '배너로 등록되었습니다.');
      loadPromotedItems();
    } catch (err) {
      console.error("Toggle error:", err);
      toast.error("변경에 실패했습니다.");
    }
  };

  const updatePromotedPriority = async (id: number, direction: 'up' | 'down') => {
    const item = allPromotedItems.find(i => i.id === id);
    if (!item) return;
    const newPriority = direction === 'up' ? Math.max(0, item.banner_priority - 1) : item.banner_priority + 1;
    
    const { error } = await supabase
      .from('recruit_items')
      .update({ banner_priority: newPriority } as any)
      .eq('id', id);
    if (!error) {
       loadPromotedItems();
    }
  };

  const handleImportClick = async () => {
    setIsImportModalOpen(true);
    try {
      const { data, error } = await supabase
        .from('recruit_items')
        .select('id, title, description, type, link, thumbnail')
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      setRecruitItems((data as any[]) || []);
    } catch (err) {
      console.error("Error loading recruit items:", err);
    }
  };

  const importAsBanner = (item: RecruitItem) => {
    setFormData({
      ...formData,
      title: item.title,
      subtitle: item.type?.toUpperCase() || "EVENT",
      description: item.description,
      image_url: item.thumbnail || "",
      link_url: item.link || "",
    });
    setIsImportModalOpen(false);
    setIsModalOpen(true);
  };

  const handleBannerImageUpload = async (id: number, file: File) => {
    try {
      toast.info("와이드 배너 업로드 중...");
      const url = await uploadImage(file, 'banners');
      const { error } = await supabase
        .from('recruit_items')
        .update({ banner_image_url: url } as any)
        .eq('id', id);
      
      if (error) throw error;
      toast.success("와이드 배너가 적용되었습니다.");
      loadPromotedItems();
    } catch (err) {
      toast.error("업로드 실패: " + (err as Error).message);
    }
  };

  const handleDownload = async (url: string, filename: string) => {
    try {
      // CORS 문제 해결을 위해 API 프록시를 통해 다운로드
      const proxyUrl = `/api/admin/proxy-download?url=${encodeURIComponent(url)}`;
      const response = await fetch(proxyUrl);
      
      if (!response.ok) throw new Error('Proxy fetch failed');
      
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.body.appendChild(document.createElement('a'));
      link.href = blobUrl;
      link.download = filename || 'downloaded-image';
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Download failed:", err);
      // Fallback: 새 탭에서 열기 (직접 다운로드는 안될 수 있음)
      window.open(url, '_blank');
      toast.error("직접 다운로드 실패. 이미지를 새 탭에서 열었습니다.");
    }
  };

  if (adminLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
  if (!isAdmin) return null;

  return (
    <div className="space-y-10 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <ImageIcon className="text-[#16A34A]" size={32} />
            통합 배너 관리
          </h1>
          <p className="text-slate-500 mt-2 font-medium">메인 페이지 상단에 노출될 배너와 홍보 항목을 통합 관리합니다.</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={handleImportClick} variant="outline" className="h-12 px-6 rounded-2xl border-slate-200 font-bold hover:bg-slate-50">
            <Zap size={18} className="mr-2 text-yellow-500 fill-yellow-500" />
            정보 가져오기
          </Button>
          <Button onClick={() => handleOpenModal()} className="h-12 px-6 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl shadow-xl shadow-slate-200 font-bold">
            <Plus size={18} className="mr-2" />
            전용 배너 등록
          </Button>
        </div>
      </div>

      <Tabs defaultValue="dedicated" className="w-full">
        <TabsList className="bg-slate-100 p-1.5 rounded-2xl h-auto mb-8 border border-slate-200/50 shadow-sm">
          <TabsTrigger value="dedicated" className="rounded-xl px-8 py-2.5 font-bold data-[state=active]:bg-white data-[state=active]:text-slate-900 border-none shadow-none">
            전용 배너 ({banners.length})
          </TabsTrigger>
          <TabsTrigger value="promoted" className="rounded-xl px-8 py-2.5 font-bold data-[state=active]:bg-white data-[state=active]:text-slate-900 border-none shadow-none">
            홍보 항목 ({allPromotedItems.filter(i => i.show_as_banner).length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dedicated">
          <div className="grid grid-cols-1 gap-6">
            {loading && banners.length === 0 ? (
              <div className="text-center py-24 bg-white rounded-[32px] border border-dashed border-slate-200">
                <Loader2 className="animate-spin mx-auto text-slate-200 mb-4" size={40} />
                <p className="text-slate-300 font-bold">배너 목록을 불러오는 중...</p>
              </div>
            ) : banners.length > 0 ? (
              banners.map(banner => (
                <Card key={banner.id} className={`group overflow-hidden transition-all duration-300 hover:shadow-xl border-none p-1 rounded-[32px] ${!banner.is_active ? "opacity-50 grayscale" : "bg-white shadow-sm"}`}>
                  <CardHeader className="flex flex-row items-center justify-between p-6 pr-8">
                    <div className="flex items-center gap-6 flex-1">
                      <div 
                        className="w-48 h-28 rounded-2xl bg-slate-100 flex-shrink-0 bg-cover bg-center border border-slate-100 shadow-inner group-hover:scale-105 transition-transform"
                        style={{ backgroundImage: `url(${banner.image_url})` }}
                      />
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-3">
                           <span className="text-[10px] font-black uppercase tracking-widest bg-slate-100 text-slate-400 px-2 py-1 rounded">ORDER {banner.display_order}</span>
                           <Badge className={banner.is_active ? "bg-green-500/10 text-green-600 border-none font-black text-[10px]" : "bg-slate-100 text-slate-400 border-none font-bold text-[10px]"}>
                             {banner.is_active ? "● ACTIVE" : "OFFLINE"}
                           </Badge>
                        </div>
                        <CardTitle className="text-xl font-black text-slate-900">{banner.title}</CardTitle>
                        <p className="text-slate-400 text-sm mt-1.5 font-medium line-clamp-1">{banner.description || banner.subtitle || "상세 설명이 없습니다."}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="w-12 h-12 rounded-2xl hover:bg-blue-50 text-blue-400 hover:text-blue-600"
                          onClick={() => handleDownload(banner.image_url, `banner_${banner.id}.png`)}
                          title="이미지 다운로드 (NanoBanana Pro 업로드용)"
                        >
                          <Download size={20} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="w-12 h-12 rounded-2xl hover:bg-slate-50 text-slate-400 hover:text-slate-900 transition-all"
                          onClick={() => toggleActive(banner)}
                        >
                          {banner.is_active ? <Eye size={20} /> : <EyeOff size={20} />}
                        </Button>
                        <Button variant="ghost" size="icon" className="w-12 h-12 rounded-2xl hover:bg-slate-50 text-slate-400 hover:text-slate-900" onClick={() => handleOpenModal(banner)}>
                          <Edit size={20} />
                        </Button>
                        <Button variant="ghost" size="icon" className="w-12 h-12 rounded-2xl hover:bg-red-50 text-red-300 hover:text-red-500" onClick={() => handleDelete(banner.id)}>
                          <Trash2 size={20} />
                        </Button>
                    </div>
                  </CardHeader>
                </Card>
              ))
            ) : (
              <div className="bg-white border border-dashed border-slate-200 rounded-[40px] py-32 text-center shadow-sm">
                <ImageIcon size={56} className="mx-auto text-slate-100 mb-6" />
                <p className="text-slate-400 font-bold text-lg tracking-tighter italic">등록된 전용 배너가 없습니다.</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="promoted">
          <div className="space-y-8">
            {/* 현재 노출 중 */}
            <div>
              <h3 className="text-sm font-black text-slate-400 mb-4 px-2 uppercase tracking-widest flex items-center gap-2">
                <Star className="fill-slate-400" size={14} />
                현재 노출 중인 항목
              </h3>
              <div className="grid grid-cols-1 gap-4">
                {allPromotedItems.filter(i => i.show_as_banner).map(item => (
                  <Card key={item.id} className="border-none bg-white shadow-sm rounded-[24px] overflow-hidden group">
                     <div className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="relative group/img">
                            <div className="w-16 h-16 rounded-xl bg-slate-100 bg-cover bg-center shadow-inner" style={{ backgroundImage: `url(${item.banner_image_url || item.thumbnail})` }} />
                            {item.banner_image_url && (
                              <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#16A34A] rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                                <Zap size={8} className="text-white fill-white" />
                              </div>
                            )}
                          </div>
                          <div>
                             <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="text-[9px] font-black uppercase text-slate-400">{item.type}</Badge>
                                <span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded">순위: {item.banner_priority}</span>
                                {item.banner_image_url && <Badge className="bg-amber-100 text-amber-600 border-none font-bold text-[9px]">WIDE ACTIVE</Badge>}
                             </div>
                             <p className="font-bold text-slate-900 line-clamp-1">{item.title}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                           <Button 
                             variant="ghost" 
                             size="icon" 
                             className="h-9 w-9 rounded-lg text-emerald-500 hover:bg-emerald-50"
                             onClick={() => {
                               const input = document.createElement('input');
                               input.type = 'file';
                               input.accept = 'image/*';
                               input.onchange = (e: any) => {
                                 const file = e.target.files?.[0];
                                 if (file) handleBannerImageUpload(item.id, file);
                               };
                               input.click();
                             }}
                             title="와이드 배너 업로드 (Landscape)"
                           >
                             <Upload size={16} />
                           </Button>
                           <Button 
                             variant="ghost" 
                             size="icon" 
                             className="h-9 w-9 rounded-lg text-blue-500 hover:bg-blue-50"
                             onClick={() => handleDownload(item.thumbnail, `promoted_${item.id}.png`)}
                             title="이미지 다운로드 (NanoBanana Pro 업로드용)"
                           >
                             <Download size={16} />
                           </Button>
                           <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg" onClick={() => updatePromotedPriority(item.id, 'up')}><ArrowUp size={16} /></Button>
                           <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg" onClick={() => updatePromotedPriority(item.id, 'down')}><ArrowDown size={16} /></Button>
                           <Button variant="destructive" size="sm" className="ml-4 rounded-xl font-bold bg-red-50 text-red-500 hover:bg-red-100 border-none shadow-none" onClick={() => togglePromotedBanner(item.id, true)}>
                             노출 해제
                           </Button>
                        </div>
                    </div>
                  </Card>
                ))}
                {allPromotedItems.filter(i => i.show_as_banner).length === 0 && (
                   <div className="py-12 text-center bg-slate-50/50 rounded-[24px] border border-dashed border-slate-200">
                     <p className="text-slate-300 font-bold text-sm italic">노출 중인 홍보 항목이 없습니다.</p>
                   </div>
                )}
              </div>
            </div>

            {/* 대기 중 */}
            <div>
              <h3 className="text-sm font-black text-slate-400 mb-4 px-2 uppercase tracking-widest">추가 가능한 항목</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {allPromotedItems.filter(i => !i.show_as_banner).map(item => (
                    <Card key={item.id} className="border-none bg-white shadow-sm rounded-[28px] p-5 hover:shadow-xl transition-all group">
                       <div className="w-full h-32 rounded-2xl bg-slate-100 bg-cover bg-center mb-4 shadow-inner" style={{ backgroundImage: `url(${item.thumbnail})` }} />
                       <Badge variant="outline" className="text-[9px] font-black uppercase mb-2">{item.type}</Badge>
                       <h4 className="font-bold text-slate-900 group-hover:text-[#16A34A] transition-colors mb-2 line-clamp-1">{item.title}</h4>
                       <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed mb-5">{item.description}</p>
                       <Button className="w-full h-11 bg-slate-900 text-white rounded-xl font-bold text-sm" onClick={() => togglePromotedBanner(item.id, false)}>
                         배너로 내보내기
                       </Button>
                    </Card>
                 ))}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <EditorModal 
        isOpen={isModalOpen} 
        onOpenChange={setIsModalOpen}
        editingBanner={editingBanner}
        formData={formData}
        setFormData={setFormData}
        handleSubmit={handleSubmit}
        loading={loading}
      />

      <ImportModal 
        isOpen={isImportModalOpen}
        onOpenChange={setIsImportModalOpen}
        recruitItems={recruitItems}
        onImport={importAsBanner}
      />
    </div>
  );
}

// ------------------------------------------------------------------------------------------------
// 아래는 모달 컴포넌트들입니다
// ------------------------------------------------------------------------------------------------

function EditorModal({ 
  isOpen, 
  onOpenChange, 
  editingBanner, 
  formData, 
  setFormData, 
  handleSubmit, 
  loading 
}: any) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-white rounded-3xl p-8 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {editingBanner ? "배너 수정" : "새 배너 등록"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-black text-slate-800 uppercase tracking-wider">이미지 설정 *</label>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                className="h-9 px-4 rounded-xl border-slate-200 text-xs font-bold hover:bg-slate-50"
                onClick={() => document.getElementById('image-upload')?.click()}
                disabled={loading}
              >
                {loading ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Upload className="mr-2 h-3 w-3" />}
                직접 업로드
              </Button>
              <input 
                type="file" 
                id="image-upload" 
                className="hidden" 
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    toast.info("이미지 업로드 중...");
                    const url = await uploadImage(file, 'banners');
                    setFormData({...formData, image_url: url});
                    toast.success("이미지가 업로드되었습니다.");
                  } catch (err) {
                    toast.error("업로드 실패: " + (err as Error).message);
                  }
                }}
              />
            </div>
            <Input 
              required
              placeholder="이미지 URL (https://...)"
              className="h-12 rounded-2xl border-slate-100 bg-slate-50 font-medium placeholder:text-slate-300"
              value={formData.image_url}
              onChange={(e) => setFormData({...formData, image_url: e.target.value})}
            />
            {formData.image_url && (
              <div className="relative w-full aspect-[16/6] rounded-3xl overflow-hidden bg-slate-100 border border-slate-200 group">
                <div 
                  className="w-full h-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105" 
                  style={{ backgroundImage: `url(${formData.image_url})` }} 
                />
                <div className="absolute inset-0 bg-black/5" />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">제목 *</label>
              <Input 
                required
                placeholder="배너 메인 타이틀"
                className="h-12 rounded-xl border-slate-100 bg-slate-50"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">뱃지 텍스트</label>
              <Input 
                placeholder="예: CONTEST, EVENT"
                className="h-12 rounded-xl border-slate-100 bg-slate-50"
                value={formData.subtitle}
                onChange={(e) => setFormData({...formData, subtitle: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">한 줄 설명 (배너 노출용)</label>
            <Input 
              placeholder="배너에 실제 노출될 짧고 강렬한 한 문장"
              className="h-12 rounded-xl border-slate-100 bg-slate-50"
              value={formData.description_one_line}
              onChange={(e) => setFormData({...formData, description_one_line: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">상세 설명 (관리용)</label>
            <Input 
              placeholder="관리자만 확인하는 상세 내용"
              className="h-12 rounded-xl border-slate-100 bg-slate-50"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">링크 URL</label>
              <Input 
                placeholder="/page or https://..."
                className="h-12 rounded-xl border-slate-100 bg-slate-50"
                value={formData.link_url}
                onChange={(e) => setFormData({...formData, link_url: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">버튼 텍스트</label>
              <Input 
                placeholder="자세히 보기"
                className="h-12 rounded-xl border-slate-100 bg-slate-50"
                value={formData.button_text}
                onChange={(e) => setFormData({...formData, button_text: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">배경색</label>
              <Input 
                type="color"
                value={formData.bg_color}
                onChange={(e) => setFormData({...formData, bg_color: e.target.value})}
                className="h-12 w-full p-1 rounded-xl cursor-pointer"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">글자색</label>
              <Input 
                type="color"
                value={formData.text_color}
                onChange={(e) => setFormData({...formData, text_color: e.target.value})}
                className="h-12 w-full p-1 rounded-xl cursor-pointer"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">노출 순서</label>
              <Input 
                type="number"
                value={formData.display_order}
                onChange={(e) => setFormData({...formData, display_order: parseInt(e.target.value) || 0})}
                className="h-12 rounded-xl border-slate-100 bg-slate-50"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 py-2">
            <input 
              type="checkbox" 
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
              className="w-5 h-5 rounded border-slate-300 text-[#16A34A] focus:ring-[#16A34A]"
            />
            <label htmlFor="is_active" className="text-sm font-bold text-slate-600">배너 활성화</label>
          </div>

          {/* Banner Tip Section */}
          <div className="p-5 rounded-2xl bg-blue-50/50 border border-blue-100/50 space-y-3">
             <div className="flex items-center gap-2 text-blue-600">
                <ImageIcon size={16} className="shrink-0" />
                <span className="text-xs font-black uppercase tracking-widest">Banner Optimization Tips</span>
             </div>
             <ul className="space-y-1.5 text-[11px] text-blue-600/80 font-bold leading-relaxed">
                <li className="flex items-start gap-2">
                   <div className="w-1 h-1 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                   <span><strong className="text-blue-700">권장 비율:</strong> 가로가 긴 와이드 비율 (16:6 ~ 16:9) 이미지가 가장 아름답게 노출됩니다.</span>
                </li>
                <li className="flex items-start gap-2">
                   <div className="w-1 h-1 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                   <span><strong className="text-blue-700">최적 해상도:</strong> 1920 x 800 px 이상의 고해상도 이미지를 사용하면 레티나 디스플레이에서도 선명합니다.</span>
                </li>
                <li className="flex items-start gap-2">
                   <div className="w-1 h-1 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                   <span><strong className="text-blue-700">용량 제한:</strong> 빠른 로딩을 위해 <strong className="text-blue-700">1.5MB 미만</strong>의 JPG 또는 WebP 포맷을 권장합니다.</span>
                </li>
             </ul>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="h-14 flex-1 font-bold text-slate-400">
              취소
            </Button>
            <Button type="submit" disabled={loading} className="h-14 flex-1 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold shadow-lg shadow-slate-200">
              {loading ? <Loader2 className="animate-spin" /> : editingBanner ? "수정 완료" : "등록하기"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ImportModal({
  isOpen,
  onOpenChange,
  recruitItems,
  onImport
}: any) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-white rounded-3xl p-8 max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Zap className="text-yellow-500 fill-yellow-500" />
            정보 가져오기
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-6">
          {recruitItems.length > 0 ? (
            recruitItems.map((item: any) => (
              <div key={item.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors border border-slate-100">
                <div className="flex items-center gap-4 flex-1">
                   <div 
                     className="w-16 h-10 rounded-lg bg-slate-200 bg-cover bg-center flex-shrink-0 shadow-inner"
                     style={{ backgroundImage: `url(${item.thumbnail})` }}
                   />
                   <div>
                     <Badge variant="outline" className="text-[9px] font-black uppercase mb-1">{item.type}</Badge>
                     <p className="font-bold text-slate-900 line-clamp-1 text-sm">{item.title}</p>
                   </div>
                </div>
                <Button onClick={() => onImport(item)} size="sm" className="ml-4 bg-white text-slate-900 border-slate-200 hover:bg-slate-50 font-bold rounded-xl h-10 px-4">
                  가져오기
                </Button>
              </div>
            ))
          ) : (
            <p className="text-center py-12 text-slate-400 font-medium italic">불러올 수 있는 항목이 없습니다.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
