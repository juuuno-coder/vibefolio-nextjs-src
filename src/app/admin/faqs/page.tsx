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
  HelpCircle, 
  ArrowLeft, 
  Loader2, 
  GripVertical,
  Eye,
  EyeOff
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FAQ {
  id: number;
  category: string;
  question: string;
  answer: string;
  order_index: number;
  is_visible: boolean;
  created_at: string;
}

const CATEGORIES = ["서비스 이용", "계정 관리", "프로젝트", "운영 정책", "문의"];

export default function AdminFAQsPage() {
  const { isAdmin, isLoading: adminLoading } = useAdmin();
  const router = useRouter();
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("전체");
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [formData, setFormData] = useState({
    category: "서비스 이용",
    question: "",
    answer: "",
    order_index: 0,
    is_visible: true,
  });

  const loadFaqs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("faqs")
        .select("*")
        .order("order_index", { ascending: true });

      if (error) throw error;
      if (data) setFaqs(data);
    } catch (err) {
      console.error("FAQ load error:", err);
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
      loadFaqs();
    }
  }, [isAdmin, adminLoading, router]);

  const handleOpenModal = (faq?: FAQ) => {
    if (faq) {
      setEditingFaq(faq);
      setFormData({
        category: faq.category,
        question: faq.question,
        answer: faq.answer,
        order_index: faq.order_index,
        is_visible: faq.is_visible,
      });
    } else {
      setEditingFaq(null);
      const maxOrder = faqs.length > 0 ? Math.max(...faqs.map(f => f.order_index)) : 0;
      setFormData({
        category: "서비스 이용",
        question: "",
        answer: "",
        order_index: maxOrder + 1,
        is_visible: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingFaq) {
        const { error } = await (supabase
          .from("faqs") as any)
          .update(formData)
          .eq("id", editingFaq.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase.from("faqs") as any).insert([formData]);
        if (error) throw error;
      }
      
      setIsModalOpen(false);
      loadFaqs();
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
      const { error } = await (supabase.from("faqs") as any).delete().eq("id", id);
      if (error) throw error;
      loadFaqs();
    } catch (err) {
      console.error("Delete error:", err);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  const toggleVisibility = async (faq: FAQ) => {
    try {
      const { error } = await (supabase
        .from("faqs") as any)
        .update({ is_visible: !faq.is_visible })
        .eq("id", faq.id);
      if (error) throw error;
      loadFaqs();
    } catch (err) {
      console.error("Toggle visibility error:", err);
    }
  };

  const filteredFaqs = faqs.filter(f => {
    const matchSearch = f.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       f.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = filterCategory === "전체" || f.category === filterCategory;
    return matchSearch && matchCategory;
  });

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
              <HelpCircle className="text-green-500" />
              FAQ 관리
            </h1>
            <p className="text-slate-500 mt-2">자주 묻는 질문을 등록하고 편집합니다.</p>
          </div>
          <Button onClick={() => handleOpenModal()} className="h-12 px-6 bg-slate-900 rounded-xl shadow-lg shadow-slate-200">
            <Plus size={18} className="mr-2" />
            새 FAQ 등록
          </Button>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <Input 
              placeholder="질문 또는 답변으로 검색..." 
              className="pl-11 h-12 bg-slate-50 border-none focus-visible:ring-1 focus-visible:ring-green-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-full md:w-48 h-12 bg-slate-50 border-none">
              <SelectValue placeholder="카테고리 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="전체">전체 카테고리</SelectItem>
              {CATEGORIES.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" className="h-12 px-6" onClick={loadFaqs}>
            새로고침
          </Button>
        </div>

        {/* List */}
        <div className="grid grid-cols-1 gap-4">
          {loading && faqs.length === 0 ? (
            <div className="text-center py-20"><Loader2 className="animate-spin mx-auto text-slate-300" size={32} /></div>
          ) : filteredFaqs.length > 0 ? (
            filteredFaqs.map(faq => (
              <Card key={faq.id} className={`overflow-hidden transition-all hover:shadow-md border-slate-100 ${!faq.is_visible ? "opacity-60 bg-slate-50" : "bg-white"}`}>
                <CardHeader className="flex flex-row items-start justify-between py-6">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0 font-bold">
                      Q
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">{faq.category}</Badge>
                        <Badge variant="secondary" className="text-xs">순서: {faq.order_index}</Badge>
                        {!faq.is_visible && <Badge variant="secondary">숨김</Badge>}
                      </div>
                      <CardTitle className="text-xl font-bold text-slate-900 mb-3">{faq.question}</CardTitle>
                      <div className="bg-slate-50 rounded-xl p-4 text-slate-600 text-sm line-clamp-2">
                        {faq.answer}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className={`hover:bg-slate-100 ${faq.is_visible ? "text-green-600" : "text-slate-400"}`}
                      onClick={() => toggleVisibility(faq)}
                      title={faq.is_visible ? "숨기기" : "표시하기"}
                    >
                      {faq.is_visible ? <Eye size={18} /> : <EyeOff size={18} />}
                    </Button>
                    <Button variant="ghost" size="icon" className="hover:bg-slate-100 text-slate-600" onClick={() => handleOpenModal(faq)}>
                      <Edit size={18} />
                    </Button>
                    <Button variant="ghost" size="icon" className="hover:bg-red-50 text-red-500" onClick={() => handleDelete(faq.id)}>
                      <Trash2 size={18} />
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            ))
          ) : (
            <div className="bg-white border border-dashed border-slate-200 rounded-[32px] py-32 text-center">
              <HelpCircle size={48} className="mx-auto text-slate-200 mb-6" />
              <p className="text-slate-400 text-lg">등록된 FAQ가 없습니다.</p>
            </div>
          )}
        </div>
      </div>

      {/* Editor Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl bg-white rounded-3xl p-8 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              {editingFaq ? "FAQ 수정" : "새 FAQ 등록"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">카테고리</label>
                <Select value={formData.category} onValueChange={(val: string) => setFormData({...formData, category: val})}>
                  <SelectTrigger className="h-12 rounded-xl border-slate-100 bg-slate-50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">표시 순서</label>
                <Input 
                  type="number"
                  min="0"
                  className="h-12 rounded-xl border-slate-100 bg-slate-50"
                  value={formData.order_index}
                  onChange={(e) => setFormData({...formData, order_index: parseInt(e.target.value) || 0})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">질문</label>
              <Input 
                required
                placeholder="자주 묻는 질문을 입력하세요"
                className="h-14 rounded-xl border-slate-100 bg-slate-50 text-lg font-medium"
                value={formData.question}
                onChange={(e) => setFormData({...formData, question: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">답변</label>
              <Textarea 
                required
                placeholder="답변 내용을 입력하세요"
                className="min-h-[200px] rounded-xl border-slate-100 bg-slate-50 text-base p-6"
                value={formData.answer}
                onChange={(e) => setFormData({...formData, answer: e.target.value})}
              />
            </div>
            <div className="flex gap-6 pt-2">
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
                {loading ? <Loader2 className="animate-spin" /> : editingFaq ? "수정 완료" : "등록하기"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
