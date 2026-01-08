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
  CheckCircle,
  XCircle,
  Star,
  Upload
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { useAdmin } from "@/hooks/useAdmin";
import { uploadImage } from "@/lib/supabase/storage";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface Notice {
  id: number;
  title: string;
  content: string;
  is_important: boolean;
  is_visible: boolean;
  is_popup?: boolean;
  image_url?: string;
  link_url?: string;
  link_text?: string;
  created_at: string;
}

export default function AdminNoticesPage() {
  const { isAdmin, isLoading: adminLoading } = useAdmin();
  const router = useRouter();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    is_important: false,
    is_visible: true,
    is_popup: false,
    image_url: "",
    link_url: "",
    link_text: "자세히 보기",
  });

  const loadNotices = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("notices")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (data) setNotices(data);
    } catch (err) {
      console.error("Notice load error:", err);
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
      loadNotices();
    }
  }, [isAdmin, adminLoading, router]);

  const handleOpenModal = (notice?: Notice) => {
    if (notice) {
      setEditingNotice(notice);
      setFormData({
        title: notice.title,
        content: notice.content,
        is_important: notice.is_important,
        is_visible: notice.is_visible,
        is_popup: notice.is_popup || false,
        image_url: notice.image_url || "",
        link_url: notice.link_url || "",
        link_text: notice.link_text || "자세히 보기",
      });
    } else {
      setEditingNotice(null);
      setFormData({
        title: "",
        content: "",
        is_important: false,
        is_visible: true,
        is_popup: false,
        image_url: "",
        link_url: "",
        link_text: "자세히 보기",
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingNotice) {
        const { error } = await (supabase
          .from("notices") as any)
          .update(formData)
          .eq("id", editingNotice.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase.from("notices") as any).insert([formData]);
        if (error) throw error;
      }
      
      setIsModalOpen(false);
      loadNotices();
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
      const { error } = await (supabase.from("notices") as any).delete().eq("id", id);
      if (error) throw error;
      loadNotices();
    } catch (err) {
      console.error("Delete error:", err);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  const filteredNotices = notices.filter(n => 
    n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    n.content.toLowerCase().includes(searchTerm.toLowerCase())
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
              배시보드로 돌아가기
            </Link>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <Megaphone className="text-blue-500" />
              공지사항 관리
            </h1>
            <p className="text-slate-500 mt-2">Vibefolio의 새로운 소식을 등록하고 편집합니다.</p>
          </div>
          <Button onClick={() => handleOpenModal()} className="h-12 px-6 bg-slate-900 rounded-xl shadow-lg shadow-slate-200">
            <Plus size={18} className="mr-2" />
            새 공지 등록
          </Button>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <Input 
              placeholder="제목 또는 내용으로 검색..." 
              className="pl-11 h-12 bg-slate-50 border-none focus-visible:ring-1 focus-visible:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" className="h-12 px-6" onClick={loadNotices}>
            새로고침
          </Button>
        </div>

        {/* List */}
        <div className="grid grid-cols-1 gap-4">
          {loading && notices.length === 0 ? (
            <div className="text-center py-20"><Loader2 className="animate-spin mx-auto text-slate-300" size={32} /></div>
          ) : filteredNotices.length > 0 ? (
            filteredNotices.map(notice => (
              <Card key={notice.id} className={`overflow-hidden transition-all hover:shadow-md border-slate-100 ${!notice.is_visible ? "opacity-60 bg-slate-50" : "bg-white"}`}>
                <CardHeader className="flex flex-row items-center justify-between py-6">
                  <div className="flex items-center gap-4">
                    {notice.is_important ? (
                      <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
                        <Star size={20} fill="currentColor" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                        <Megaphone size={20} />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="text-xl font-bold text-slate-900">{notice.title}</CardTitle>
                        {!notice.is_visible && <Badge variant="secondary">숨김</Badge>}
                        {notice.is_important && <Badge variant="destructive">중요</Badge>}
                        {notice.is_popup && <Badge className="bg-purple-500 hover:bg-purple-600">팝업 ON</Badge>}
                      </div>
                      <p className="text-sm text-slate-400">{new Date(notice.created_at).toLocaleDateString()} · 관리자</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="hover:bg-slate-100 text-slate-600" onClick={() => handleOpenModal(notice)}>
                      <Edit size={18} />
                    </Button>
                    <Button variant="ghost" size="icon" className="hover:bg-red-50 text-red-500" onClick={() => handleDelete(notice.id)}>
                      <Trash2 size={18} />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pb-8">
                  <div className="bg-slate-50 rounded-2xl p-6 text-slate-600 whitespace-pre-wrap line-clamp-3">
                    {notice.content}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="bg-white border border-dashed border-slate-200 rounded-[32px] py-32 text-center">
              <Megaphone size={48} className="mx-auto text-slate-200 mb-6" />
              <p className="text-slate-400 text-lg">등록된 공지사항이 없습니다.</p>
            </div>
          )}
        </div>
      </div>

      {/* Editor Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl bg-white rounded-3xl p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              {editingNotice ? "공지사항 수정" : "새 공지사항 등록"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6 mt-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">제목</label>
              <Input 
                required
                placeholder="공지 제목을 입력하세요"
                className="h-14 rounded-xl border-slate-100 bg-slate-50 text-lg font-medium"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">상세 내용</label>
              <Textarea 
                required
                placeholder="공지 내용을 입력하세요"
                className="min-h-[250px] rounded-xl border-slate-100 bg-slate-50 text-base p-6"
                value={formData.content}
                onChange={(e) => setFormData({...formData, content: e.target.value})}
              />
            </div>
            
            <div className="p-4 bg-slate-50 rounded-xl space-y-4 border border-slate-100">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input 
                  type="checkbox"
                  className="w-5 h-5 rounded border-slate-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                  checked={formData.is_popup}
                  onChange={(e) => setFormData({...formData, is_popup: e.target.checked})}
                />
                <span className="text-sm font-bold text-slate-900 group-hover:text-purple-600 transition-colors flex items-center gap-2">
                  <Megaphone size={16} /> 메인 페이지 팝업으로 띄우기
                </span>
              </label>

              {formData.is_popup && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 animate-in fade-in slide-in-from-top-2">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-500">팝업 이미지 (선택)</label>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        className="h-7 text-[10px] gap-1 px-2 rounded-lg"
                        onClick={() => document.getElementById('notice-popup-image')?.click()}
                      >
                        <Upload size={10} /> 파일선택
                      </Button>
                      <input 
                        type="file" 
                        id="notice-popup-image" 
                        className="hidden" 
                        accept="image/*" 
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          try {
                            toast.info("이미지 업로드 중...");
                            const url = await uploadImage(file, 'notices');
                            setFormData({...formData, image_url: url});
                            toast.success("업로드 완료");
                          } catch (err) {
                            console.error("Upload error:", err);
                            toast.error("업로드 실패");
                          }
                        }}
                      />
                    </div>
                    <Input 
                      placeholder="이미지 URL"
                      className="h-10 text-sm bg-white"
                      value={formData.image_url}
                      onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500">링크 URL (선택)</label>
                    <Input 
                      placeholder="/recruit or https://..."
                      className="h-10 text-sm bg-white"
                      value={formData.link_url}
                      onChange={(e) => setFormData({...formData, link_url: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500">버튼 텍스트</label>
                    <Input 
                      placeholder="자세히 보기"
                      className="h-10 text-sm bg-white"
                      value={formData.link_text}
                      onChange={(e) => setFormData({...formData, link_text: e.target.value})}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-6 pt-2">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input 
                  type="checkbox"
                  className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  checked={formData.is_important}
                  onChange={(e) => setFormData({...formData, is_important: e.target.checked})}
                />
                <span className="text-sm font-bold text-slate-600 group-hover:text-slate-900 transition-colors">중요 공지로 고정</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input 
                  type="checkbox"
                  className="w-5 h-5 rounded border-slate-300 text-green-600 focus:ring-green-500 cursor-pointer"
                  checked={formData.is_visible}
                  onChange={(e) => setFormData({...formData, is_visible: e.target.checked})}
                />
                <span className="text-sm font-bold text-slate-600 group-hover:text-slate-900 transition-colors">사용자에게 공개</span>
              </label>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="h-14 flex-1 font-bold text-slate-400">
                취소
              </Button>
              <Button type="submit" disabled={loading} className="h-14 flex-1 bg-slate-900 hover:bg-slate-800 rounded-2xl font-bold shadow-lg shadow-slate-200">
                {loading ? <Loader2 className="animate-spin" /> : editingNotice ? "수정 완료" : "등록하기"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
