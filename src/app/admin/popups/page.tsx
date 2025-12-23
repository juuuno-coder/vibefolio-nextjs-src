"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit, 
  Megaphone, 
  ArrowLeft, 
  Loader2,
  Eye,
  EyeOff,
  Calendar,
  Link as LinkIcon,
  Image as ImageIcon
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

interface Popup {
  id: number;
  title: string;
  content: string | null;
  image_url: string | null;
  link_url: string | null;
  link_text: string;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  display_order: number;
  created_at: string;
}

export default function AdminPopupsPage() {
  const { isAdmin, isLoading: adminLoading } = useAdmin();
  const router = useRouter();
  const [popups, setPopups] = useState<Popup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPopup, setEditingPopup] = useState<Popup | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    image_url: "",
    link_url: "",
    link_text: "자세히 보기",
    is_active: true,
    start_date: "",
    end_date: "",
    display_order: 0,
  });

  const loadPopups = async () => {
    setLoading(true);
    try {
      // 관리자는 모든 팝업 조회 (RLS 정책에서 허용)
      const { data, error } = await supabase
        .from("popups")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      if (data) setPopups(data);
    } catch (err) {
      console.error("Popup load error:", err);
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
      loadPopups();
    }
  }, [isAdmin, adminLoading, router]);

  const handleOpenModal = (popup?: Popup) => {
    if (popup) {
      setEditingPopup(popup);
      setFormData({
        title: popup.title,
        content: popup.content || "",
        image_url: popup.image_url || "",
        link_url: popup.link_url || "",
        link_text: popup.link_text,
        is_active: popup.is_active,
        start_date: popup.start_date ? popup.start_date.split('T')[0] : "",
        end_date: popup.end_date ? popup.end_date.split('T')[0] : "",
        display_order: popup.display_order,
      });
    } else {
      setEditingPopup(null);
      const maxOrder = popups.length > 0 ? Math.max(...popups.map(p => p.display_order)) : 0;
      setFormData({
        title: "",
        content: "",
        image_url: "",
        link_url: "",
        link_text: "자세히 보기",
        is_active: true,
        start_date: "",
        end_date: "",
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
        ...formData,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        content: formData.content || null,
        image_url: formData.image_url || null,
        link_url: formData.link_url || null,
      };

      if (editingPopup) {
        const { error } = await (supabase
          .from("popups") as any)
          .update(submitData)
          .eq("id", editingPopup.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase.from("popups") as any).insert([submitData]);
        if (error) throw error;
      }
      
      setIsModalOpen(false);
      loadPopups();
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
      const { error } = await (supabase.from("popups") as any).delete().eq("id", id);
      if (error) throw error;
      loadPopups();
    } catch (err) {
      console.error("Delete error:", err);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  const toggleActive = async (popup: Popup) => {
    try {
      const { error } = await (supabase
        .from("popups") as any)
        .update({ is_active: !popup.is_active })
        .eq("id", popup.id);
      if (error) throw error;
      loadPopups();
    } catch (err) {
      console.error("Toggle active error:", err);
    }
  };

  const filteredPopups = popups.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.content && p.content.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
              <Megaphone className="text-purple-500" />
              팝업 광고 관리
            </h1>
            <p className="text-slate-500 mt-2">메인 페이지에 표시될 팝업을 관리합니다.</p>
          </div>
          <Button onClick={() => handleOpenModal()} className="h-12 px-6 bg-slate-900 rounded-xl shadow-lg shadow-slate-200">
            <Plus size={18} className="mr-2" />
            새 팝업 등록
          </Button>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <Input 
              placeholder="제목 또는 내용으로 검색..." 
              className="pl-11 h-12 bg-slate-50 border-none focus-visible:ring-1 focus-visible:ring-purple-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" className="h-12 px-6" onClick={loadPopups}>
            새로고침
          </Button>
        </div>

        {/* List */}
        <div className="grid grid-cols-1 gap-4">
          {loading && popups.length === 0 ? (
            <div className="text-center py-20"><Loader2 className="animate-spin mx-auto text-slate-300" size={32} /></div>
          ) : filteredPopups.length > 0 ? (
            filteredPopups.map(popup => {
              const isExpired = popup.end_date && new Date(popup.end_date) < new Date();
              const isScheduled = popup.start_date && new Date(popup.start_date) > new Date();
              
              return (
                <Card key={popup.id} className={`overflow-hidden transition-all hover:shadow-md border-slate-100 ${!popup.is_active || isExpired ? "opacity-60 bg-slate-50" : "bg-white"}`}>
                  <CardHeader className="flex flex-row items-start justify-between py-6">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center flex-shrink-0">
                        <Megaphone size={20} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <Badge variant="secondary" className="text-xs">순서: {popup.display_order}</Badge>
                          {!popup.is_active && <Badge variant="secondary">비활성</Badge>}
                          {isExpired && <Badge variant="destructive">만료됨</Badge>}
                          {isScheduled && <Badge className="bg-blue-500">예약됨</Badge>}
                          {popup.is_active && !isExpired && !isScheduled && <Badge className="bg-green-500">활성</Badge>}
                        </div>
                        <CardTitle className="text-xl font-bold text-slate-900 mb-2">{popup.title}</CardTitle>
                        {popup.content && (
                          <p className="text-slate-600 text-sm mb-3 line-clamp-2">{popup.content}</p>
                        )}
                        <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                          {popup.start_date && (
                            <span className="flex items-center gap-1">
                              <Calendar size={14} />
                              시작: {new Date(popup.start_date).toLocaleDateString()}
                            </span>
                          )}
                          {popup.end_date && (
                            <span className="flex items-center gap-1">
                              <Calendar size={14} />
                              종료: {new Date(popup.end_date).toLocaleDateString()}
                            </span>
                          )}
                          {popup.link_url && (
                            <span className="flex items-center gap-1">
                              <LinkIcon size={14} />
                              링크: {popup.link_url}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className={`hover:bg-slate-100 ${popup.is_active ? "text-green-600" : "text-slate-400"}`}
                        onClick={() => toggleActive(popup)}
                        title={popup.is_active ? "비활성화" : "활성화"}
                      >
                        {popup.is_active ? <Eye size={18} /> : <EyeOff size={18} />}
                      </Button>
                      <Button variant="ghost" size="icon" className="hover:bg-slate-100 text-slate-600" onClick={() => handleOpenModal(popup)}>
                        <Edit size={18} />
                      </Button>
                      <Button variant="ghost" size="icon" className="hover:bg-red-50 text-red-500" onClick={() => handleDelete(popup.id)}>
                        <Trash2 size={18} />
                      </Button>
                    </div>
                  </CardHeader>
                </Card>
              );
            })
          ) : (
            <div className="bg-white border border-dashed border-slate-200 rounded-[32px] py-32 text-center">
              <Megaphone size={48} className="mx-auto text-slate-200 mb-6" />
              <p className="text-slate-400 text-lg">등록된 팝업이 없습니다.</p>
            </div>
          )}
        </div>
      </div>

      {/* Editor Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl bg-white rounded-3xl p-8 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              {editingPopup ? "팝업 수정" : "새 팝업 등록"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6 mt-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">제목 *</label>
              <Input 
                required
                placeholder="팝업 제목을 입력하세요"
                className="h-14 rounded-xl border-slate-100 bg-slate-50 text-lg font-medium"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">내용</label>
              <Textarea 
                placeholder="팝업 내용을 입력하세요 (선택사항)"
                className="min-h-[120px] rounded-xl border-slate-100 bg-slate-50 text-base p-6"
                value={formData.content}
                onChange={(e) => setFormData({...formData, content: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">이미지 URL</label>
                <Input 
                  placeholder="https://..."
                  className="h-12 rounded-xl border-slate-100 bg-slate-50"
                  value={formData.image_url}
                  onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                />
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
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">링크 버튼 텍스트</label>
                <Input 
                  placeholder="자세히 보기"
                  className="h-12 rounded-xl border-slate-100 bg-slate-50"
                  value={formData.link_text}
                  onChange={(e) => setFormData({...formData, link_text: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">표시 순서</label>
                <Input 
                  type="number"
                  min="0"
                  className="h-12 rounded-xl border-slate-100 bg-slate-50"
                  value={formData.display_order}
                  onChange={(e) => setFormData({...formData, display_order: parseInt(e.target.value) || 0})}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">시작일 (선택)</label>
                <Input 
                  type="date"
                  className="h-12 rounded-xl border-slate-100 bg-slate-50"
                  value={formData.start_date}
                  onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">종료일 (선택)</label>
                <Input 
                  type="date"
                  className="h-12 rounded-xl border-slate-100 bg-slate-50"
                  value={formData.end_date}
                  onChange={(e) => setFormData({...formData, end_date: e.target.value})}
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
                {loading ? <Loader2 className="animate-spin" /> : editingPopup ? "수정 완료" : "등록하기"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
