// src/app/admin/recruit/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Briefcase,
  Award,
  Calendar,
  Plus,
  Trash2,
  Edit,
  ExternalLink,
  Loader2,
  RefreshCw,
  Search,
  MapPin,
  DollarSign,
  Upload,
  Sparkles,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { useAdmin } from "@/hooks/useAdmin";
import { supabase } from "@/lib/supabase/client";
import { uploadImage, uploadFile } from "@/lib/supabase/storage";
import { toast } from "sonner";

interface Item {
  id: number;
  title: string;
  description: string;
  type: "job" | "contest" | "event";
  date: string;
  location?: string;
  prize?: string;
  salary?: string;
  company?: string;
  employmentType?: string;
  link?: string;
  thumbnail?: string;
  is_approved?: boolean;
  is_active?: boolean;
  show_as_banner?: boolean;
  banner_priority?: number;
  // 추가 상세 정보 필드
  application_target?: string;
  sponsor?: string;
  total_prize?: string;
  first_prize?: string;
  start_date?: string;
  category_tags?: string;
  banner_image_url?: string;
  attachments?: { name: string; url: string; size: number; type: string }[];
}

export default function AdminRecruitPage() {
  const router = useRouter();
  const { isAdmin, isLoading: adminLoading } = useAdmin();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "job" | "contest" | "event">("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "job" as "job" | "contest" | "event",
    date: "",
    location: "",
    prize: "",
    salary: "",
    company: "",
    employmentType: "정규직",
    link: "",
    thumbnail: "",
    showAsBanner: false,
    bannerPriority: 999,
    // 추가 필드
    application_target: "",
    sponsor: "",
    total_prize: "",
    first_prize: "",
    start_date: "",
    category_tags: "",
    banner_image_url: "",
    attachments: [] as { name: string; url: string; size: number; type: string }[],
  });

  // 아이템 로드 (Supabase 연동)
  const loadItems = async () => {
    setLoading(true);
    try {
      console.log('📡 Fetching recruit items from DB...');
      const { data, error, count } = await supabase
        .from('recruit_items')
        .select('*', { count: 'exact' })
        .order('is_approved', { ascending: true }) // false first
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Supabase Fetch Error:', error);
        throw error;
      }
      
      console.log(`✅ Loaded ${data?.length || 0} items (Total count: ${count})`);
      
      const formattedItems: Item[] = (data || []).map((item: any) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        type: item.type as "job" | "contest" | "event",
        date: item.date,
        location: item.location || "",
        prize: item.prize || "",
        salary: item.salary || "",
        company: item.company || "",
        employmentType: item.employment_type || "정규직",
        link: item.link || "",
        thumbnail: item.thumbnail || "",
        is_approved: item.is_approved,
        is_active: item.is_active,
        show_as_banner: item.show_as_banner,
        banner_priority: item.banner_priority,
        // 추가 필드 매핑
        application_target: item.application_target || "",
        sponsor: item.sponsor || "",
        total_prize: item.total_prize || "",
        first_prize: item.first_prize || "",
        start_date: item.start_date || "",
        category_tags: item.category_tags || "",
        banner_image_url: item.banner_image_url || "",
        attachments: item.attachments || [],
      }));
      
      setItems(formattedItems);
    } catch (error) {
      console.error("항목 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      alert("관리자 권한이 필요합니다.");
      router.push("/");
      return;
    }
    if (isAdmin) {
      loadItems();
    }
  }, [isAdmin, adminLoading, router]);

  // 수동 크롤링 트리거
  const handleManualCrawl = async () => {
    if (!confirm("연결된 사이트(위비티, 원티드 등)에서 최신 정보를 가져오시겠습니까? 몇 초 정도 소요될 수 있습니다.")) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/admin/recruit/crawl', { 
        method: 'POST' 
      });
      
      if (response.ok) {
        const result = await response.json();
        alert(`업데이트 완료!\n- 발견: ${result.found}개\n- 새로 추가: ${result.added}개\n- 중복 제외: ${result.skipped}개`);
        loadItems();
      } else {
        alert("크롤러 실행 중 오류가 발생했습니다.");
      }
    } catch (error) {
      console.error('Crawl Error:', error);
      alert("크롤링 중 서버 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 항목 승인 처리
  const handleApprove = async (id: number) => {
    try {
      const { error } = await supabase
        .from('recruit_items')
        .update({ is_approved: true, is_active: true } as any)
        .eq('id', id);

      if (error) throw error;
      toast.success("승인 및 게시 완료!");
      loadItems();
    } catch (error) {
      console.error('Approve Error:', error);
      toast.error("승인 처리 중 오류가 발생했습니다.");
    }
  };
  // 항목 추가/수정 (Supabase 연동)
  const handleSubmit = async () => {
    if (!formData.title || !formData.description || !formData.date) {
      alert("제목, 설명, 날짜는 필수 항목입니다.");
      return;
    }

    try {
      const itemData: any = {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        date: formData.date,
        location: formData.location || null,
        prize: formData.prize || null,
        salary: formData.salary || null,
        company: formData.company || null,
        employment_type: formData.employmentType || null,
        link: formData.link || null,
        thumbnail: formData.thumbnail || null,
        is_approved: true,
        is_active: true,
        show_as_banner: (formData as any).showAsBanner || false,
        banner_priority: (formData as any).bannerPriority || 999,
        // 추가 필드 저장
        application_target: formData.application_target || null,
        sponsor: formData.sponsor || null,
        total_prize: formData.total_prize || null,
        first_prize: formData.first_prize || null,
        start_date: formData.start_date || null,
        category_tags: formData.category_tags || null,
        banner_image_url: formData.banner_image_url || null,
        attachments: formData.attachments || [],
        // 원본 소스 링크 보존
        source_link: (editingItem as any)?.source_link || null
      };

      if (editingItem) {
        const { error } = await supabase
          .from('recruit_items')
          .update(itemData)
          .eq('id', editingItem.id);
        
        if (error) {
          console.error("Update Error:", error);
          alert(`수정 중 오류가 발생했습니다: ${error.message}`);
          return;
        }
      } else {
        const { error } = await supabase
          .from('recruit_items')
          .insert([itemData]);
        
        if (error) {
          console.error("Insert Error:", error);
          alert(`추가 중 오류가 발생했습니다: ${error.message}`);
          return;
        }
      }

      await loadItems();
      handleDialogClose();
    } catch (error) {
      console.error("저장 실패:", error);
      alert("저장 중 오류가 발생했습니다.");
    }
  };

  // 항목 삭제 (Supabase 연동)
  const handleDelete = async (id: number) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    try {
      const { error } = await supabase
        .from('recruit_items')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      await loadItems();
    } catch (error) {
      console.error("삭제 실패:", error);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  // 다이얼로그 닫기
  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingItem(null);
    setFormData({
      title: "",
      description: "",
      type: "job",
      date: "",
      location: "",
      prize: "",
      salary: "",
      company: "",
      employmentType: "정규직",
      link: "",
      thumbnail: "",
      showAsBanner: false,
      bannerPriority: 999,
      application_target: "",
      sponsor: "",
      total_prize: "",
      first_prize: "",
      start_date: "",
      category_tags: "",
      banner_image_url: "",
      attachments: []
    });
  };

  // 항목 수정 시작
  const handleEdit = (item: Item) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      description: item.description,
      type: item.type,
      date: item.date,
      location: item.location || "",
      prize: item.prize || "",
      salary: item.salary || "",
      company: item.company || "",
      employmentType: item.employmentType || "정규직",
      link: item.link || "",
      thumbnail: item.thumbnail || "",
      showAsBanner: item.show_as_banner || false,
      bannerPriority: item.banner_priority || 999,
      application_target: item.application_target || "",
      sponsor: item.sponsor || "",
      total_prize: item.total_prize || "",
      first_prize: item.first_prize || "",
      start_date: item.start_date || "",
      category_tags: item.category_tags || "",
      banner_image_url: item.banner_image_url || "",
      attachments: item.attachments || []
    });
    setIsDialogOpen(true);
  };

  // D-day 계산
  const getDday = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(dateStr);
    targetDate.setHours(0, 0, 0, 0);
    const diff = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return "마감";
    if (diff === 0) return "D-Day";
    return `D-${diff}`;
  };

  // 필터링
  const filteredItems = items.filter((item) => {
    if (filterType !== "all" && item.type !== filterType) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        item.title?.toLowerCase().includes(term) ||
        item.company?.toLowerCase().includes(term) ||
        item.description?.toLowerCase().includes(term)
      );
    }
    return true;
  });

  // 타입별 카운트
  const jobs = items.filter((e) => e.type === "job");
  const contests = items.filter((e) => e.type === "contest");
  const events = items.filter((e) => e.type === "event");

  if (adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin" size={32} />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-6">
        {/* 헤더 */}
        <div className="mb-8">
          <Link
            href="/admin"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft size={20} className="mr-2" />
            관리자 대시보드로 돌아가기
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                채용/공모전 관리
              </h1>
              <p className="text-gray-600">채용, 공모전, 이벤트 정보를 관리하세요</p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={handleManualCrawl}
                className="border-[#16A34A] text-[#16A34A] hover:bg-[#16A34A]/10"
              >
                <RefreshCw size={16} className="mr-2" />
                정보 업데이트 (크롤링)
              </Button>
              <Link href="/recruit" target="_blank">
                <Button variant="outline">
                  <ExternalLink size={16} className="mr-2" />
                  사이트에서 보기
                </Button>
              </Link>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    className="bg-[#16A34A] hover:bg-[#41a3aa]"
                    onClick={handleDialogClose}
                  >
                    <Plus size={18} className="mr-2" />
                    새 항목 추가
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingItem ? "항목 수정" : "새 항목 추가"}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-6">
                    {/* Section 1: Basic Information */}
                    <div className="space-y-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-2 mb-2 text-slate-800">
                        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm">
                           <Calendar size={18} className="text-[#16A34A]" />
                        </div>
                        <h3 className="font-bold text-sm">기본 정보</h3>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-1">
                          <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-1.5">유형</label>
                          <select
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                            className="w-full border rounded-xl px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-[#16A34A]/20 outline-none transition-all"
                          >
                            <option value="job">채용</option>
                            <option value="contest">공모전</option>
                            <option value="event">이벤트</option>
                          </select>
                        </div>
                        <div className="col-span-1">
                          <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-1.5">마감일 *</label>
                          <Input
                            type="date"
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            className="rounded-xl h-10 bg-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-1.5">제목 *</label>
                        <Input
                          placeholder="제목을 입력하세요"
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          className="rounded-xl h-11 bg-white font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-1.5">설명 *</label>
                        <Textarea
                          placeholder="항목에 대한 간단한 설명을 입력하세요"
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          rows={3}
                          className="rounded-xl bg-white resize-none"
                        />
                      </div>
                    </div>

                    {/* Section 2: Type Specific Details */}
                    {formData.type === "job" && (
                      <div className="space-y-4 p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                        <div className="flex items-center gap-2 mb-2 text-blue-800">
                          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm">
                             <Briefcase size={18} className="text-blue-500" />
                          </div>
                          <h3 className="font-bold text-sm">채용 상세 정보</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[11px] font-black text-blue-400 uppercase tracking-wider mb-1.5">회사명</label>
                            <Input placeholder="회사명" value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} className="bg-white rounded-xl" />
                          </div>
                          <div>
                            <label className="block text-[11px] font-black text-blue-400 uppercase tracking-wider mb-1.5">고용 형태</label>
                            <select
                              value={formData.employmentType}
                              onChange={e => setFormData({...formData, employmentType: e.target.value})}
                              className="w-full border rounded-xl px-3 py-2 text-sm bg-white outline-none"
                            >
                              <option value="정규직">정규직</option>
                              <option value="계약직">계약직</option>
                              <option value="프리랜서">프리랜서</option>
                              <option value="인턴">인턴</option>
                            </select>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[11px] font-black text-blue-400 uppercase tracking-wider mb-1.5">근무 지역</label>
                            <Input placeholder="서울, 경기 등" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="bg-white rounded-xl" />
                          </div>
                          <div>
                            <label className="block text-[11px] font-black text-blue-400 uppercase tracking-wider mb-1.5">급여</label>
                            <Input placeholder="연봉 4,000만원 등" value={formData.salary} onChange={e => setFormData({...formData, salary: e.target.value})} className="bg-white rounded-xl" />
                          </div>
                        </div>
                      </div>
                    )}

                    {formData.type === "contest" && (
                      <div className="space-y-4 p-4 bg-purple-50/50 rounded-2xl border border-purple-100">
                        <div className="flex items-center gap-2 mb-2 text-purple-800">
                          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm">
                             <Award size={18} className="text-purple-500" />
                          </div>
                          <h3 className="font-bold text-sm">공모전 상세 정보</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                             <label className="block text-[11px] font-black text-purple-400 uppercase tracking-wider mb-1.5">상금/혜택 요약</label>
                             <Input value={formData.prize} onChange={e => setFormData({...formData, prize: e.target.value})} placeholder="대상 500만원 등" className="bg-white rounded-xl" />
                          </div>
                          <div>
                            <label className="block text-[11px] font-black text-purple-400 uppercase tracking-wider mb-1.5">응모 대상</label>
                            <Input value={formData.application_target} onChange={e => setFormData({...formData, application_target: e.target.value})} placeholder="대학생, 일반인" className="bg-white rounded-xl" />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[11px] font-black text-purple-400 uppercase tracking-wider mb-1.5">총 상금 규모</label>
                            <Input value={formData.total_prize} onChange={e => setFormData({...formData, total_prize: e.target.value})} placeholder="2,000만원" className="bg-white rounded-xl" />
                          </div>
                          <div>
                            <label className="block text-[11px] font-black text-purple-400 uppercase tracking-wider mb-1.5">1등 상금</label>
                            <Input value={formData.first_prize} onChange={e => setFormData({...formData, first_prize: e.target.value})} placeholder="500만원" className="bg-white rounded-xl" />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[11px] font-black text-purple-400 uppercase tracking-wider mb-1.5">분야 태그</label>
                            <Input value={formData.category_tags} onChange={e => setFormData({...formData, category_tags: e.target.value})} placeholder="영상, 디자인" className="bg-white rounded-xl" />
                          </div>
                          <div>
                            <label className="block text-[11px] font-black text-purple-400 uppercase tracking-wider mb-1.5">주최/후원사</label>
                            <Input value={formData.sponsor} onChange={e => setFormData({...formData, sponsor: e.target.value})} placeholder="문화체육관광부" className="bg-white rounded-xl" />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Section 3: Visuals and External Link */}
                    <div className="space-y-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-2 mb-2 text-slate-800">
                        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm">
                           <ExternalLink size={18} className="text-[#16A34A]" />
                        </div>
                        <h3 className="font-bold text-sm">연결 및 파일 관리</h3>
                      </div>

                      <div>
                        <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-1.5">공식 홈페이지 링크</label>
                        <Input
                          placeholder="https://주최측-공식-홈페이지-주소.com"
                          value={formData.link}
                          onChange={e => setFormData({ ...formData, link: e.target.value })}
                          className="rounded-xl h-11 bg-white border-[#16A34A]/30 focus:border-[#16A34A]"
                        />
                      </div>

                      <div className="grid grid-cols-1 gap-4 pt-2">
                        <div className="p-3 bg-white rounded-xl border border-slate-100">
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-[11px] font-black text-slate-400 uppercase">포스터 (썸네일)</label>
                            <Button type="button" variant="outline" size="sm" className="h-7 text-[10px] gap-1 px-2 rounded-lg" onClick={() => document.getElementById('admin-recruit-thumb')?.click()}>
                              <Upload size={10} /> 파일선택
                            </Button>
                            <input type="file" id="admin-recruit-thumb" className="hidden" accept="image/*" onChange={async (e) => {
                              const file = e.target.files?.[0]; if (!file) return;
                              try { 
                                toast.info("포스터 업로드 중..."); 
                                const url = await uploadImage(file, 'recruits');
                                setFormData({...formData, thumbnail: url}); 
                                toast.success("포스터 적용 완료");
                              } catch (err) { 
                                console.error("Poster upload failed:", err);
                                toast.error("포스터 업로드 실패: " + (err as Error).message); 
                              }
                            }} />
                          </div>
                          <Input placeholder="이미지 URL" value={formData.thumbnail} onChange={e => setFormData({...formData, thumbnail: e.target.value})} className="h-8 text-xs border-none bg-slate-50 p-2" />
                        </div>

                        <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-100/50">
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-[11px] font-black text-amber-600 uppercase flex items-center gap-1">
                              <Sparkles size={10} /> 히어로 배너 (와이드)
                            </label>
                            <Button type="button" variant="secondary" size="sm" className="h-7 text-[10px] gap-1 px-2 rounded-lg bg-white border-amber-100" onClick={() => document.getElementById('admin-recruit-banner')?.click()}>
                              <Upload size={10} /> 파일선택
                            </Button>
                            <input type="file" id="admin-recruit-banner" className="hidden" accept="image/*" onChange={async (e) => {
                              const file = e.target.files?.[0]; if (!file) return;
                              try { 
                                toast.info("배너 업로드 중..."); 
                                const url = await uploadImage(file, 'banners');
                                setFormData({...formData, banner_image_url: url}); 
                                toast.success("배너 적용 완료");
                              } catch (err) { 
                                console.error("Banner upload failed:", err);
                                toast.error("배너 업로드 실패: " + (err as Error).message); 
                              }
                            }} />
                          </div>
                          <Input placeholder="16:6 비율 와이드 이미지 URL" value={formData.banner_image_url} onChange={e => setFormData({...formData, banner_image_url: e.target.value})} className="h-8 text-xs border-none bg-white/50 p-2" />
                        </div>
                      </div>

                      {/* 파일 첨부 영역 */}
                      <div className="space-y-3 pt-4 border-t border-slate-100 mt-4">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
                           <FileText size={14} /> 공고문 파일 첨부 (최대 10개, 개당 20MB)
                        </label>
                        <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                            {formData.attachments && formData.attachments.length > 0 && (
                                <div className="flex flex-col gap-2">
                                    {formData.attachments.map((file, idx) => (
                                        <div key={idx} className="flex items-center justify-between bg-white px-3 py-2 rounded-lg text-xs font-medium text-slate-700 border border-slate-100 shadow-sm">
                                            <div className="flex items-center gap-2 overflow-hidden">
                                                <FileText size={14} className="text-[#16A34A] shrink-0" />
                                                <span className="truncate max-w-[200px]">{file.name}</span>
                                                <span className="text-slate-400 shrink-0">({(file.size / 1024 / 1024).toFixed(2)}MB)</span>
                                            </div>
                                            <button 
                                                type="button"
                                                onClick={() => {
                                                    const newFiles = [...(formData.attachments || [])];
                                                    newFiles.splice(idx, 1);
                                                    setFormData({...formData, attachments: newFiles});
                                                }}
                                                className="text-slate-400 hover:text-red-500 p-1"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            
                            <div className="flex items-center gap-2">
                                <input
                                    type="file"
                                    id="admin-file-upload"
                                    multiple
                                    className="hidden"
                                    onChange={async (e) => {
                                        const files = Array.from(e.target.files || []);
                                        if (files.length === 0) return;
                                        
                                        const currentCount = formData.attachments?.length || 0;
                                        if (currentCount + files.length > 10) {
                                            toast.error("파일은 최대 10개까지만 업로드 가능합니다.");
                                            return;
                                        }

                                        for (const file of files) {
                                            if (file.size > 20 * 1024 * 1024) {
                                                toast.error(`${file.name} 파일이 20MB를 초과합니다.`);
                                                continue;
                                            }
                                            try {
                                                toast.info(`${file.name} 업로드 중...`);
                                                const uploaded = await uploadFile(file, 'recruit_files'); 
                                                
                                                setFormData(prev => ({
                                                    ...prev, 
                                                    attachments: [...(prev.attachments || []), uploaded]
                                                }));
                                                toast.success(`${file.name} 업로드 완료`);
                                            } catch (err) {
                                                console.error(err);
                                                toast.error(`업로드 실패: ${((err as any).message)}`);
                                            }
                                        }
                                        e.target.value = ''; 
                                    }}
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => document.getElementById('admin-file-upload')?.click()}
                                    className="h-9 text-xs border-dashed border-slate-300 text-slate-500 hover:text-[#16A34A] hover:border-[#16A34A] w-full"
                                    disabled={(formData.attachments?.length || 0) >= 10}
                                >
                                    <Plus size={14} className="mr-2" /> 파일 추가하기
                                </Button>
                            </div>
                        </div>
                      </div>
                    </div>

                    {/* Section 4: Promotion Settings */}
                    <div className="p-4 bg-cyan-50/30 rounded-2xl border border-cyan-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm">
                             <Sparkles size={18} className="text-[#4ACAD4]" />
                          </div>
                          <div>
                            <h3 className="font-bold text-sm text-cyan-900">메인 배너 노출 설정</h3>
                            <p className="text-[10px] text-cyan-600">이 게시물을 메인 최상단 배너 리스트에 포함합니다.</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                           {(formData as any).showAsBanner && (
                             <div className="flex items-center gap-2">
                               <span className="text-[10px] font-bold text-cyan-700">우선순위</span>
                               <input 
                                 type="number" 
                                 value={(formData as any).bannerPriority} 
                                 onChange={e => setFormData({...formData, bannerPriority: parseInt(e.target.value)} as any)}
                                 className="w-16 h-8 rounded-lg border border-cyan-200 bg-white text-center text-xs font-bold outline-none"
                               />
                             </div>
                           )}
                           <input 
                            type="checkbox"
                            checked={(formData as any).showAsBanner}
                            onChange={(e) => setFormData({...formData, showAsBanner: e.target.checked} as any)}
                            className="w-6 h-6 accent-[#4ACAD4] cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 justify-end pt-4 border-t border-slate-100 mt-2">
                      <Button variant="outline" onClick={handleDialogClose} className="rounded-xl px-6">
                        취소
                      </Button>
                      <Button
                        onClick={handleSubmit}
                        className="bg-[#4ACAD4] hover:bg-[#41a3aa] text-slate-900 font-bold rounded-xl px-8 shadow-lg shadow-[#4ACAD4]/20 transition-all hover:scale-105 active:scale-95"
                      >
                        {editingItem ? "정보 수정하기" : "항목 추가하기"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* 통계 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card
            className={`cursor-pointer transition-all ${filterType === "all" ? "ring-2 ring-[#4ACAD4]" : ""}`}
            onClick={() => setFilterType("all")}
          >
            <CardContent className="p-6">
              <p className="text-sm text-gray-600 mb-1">전체</p>
              <p className="text-3xl font-bold text-gray-900">{items.length}</p>
            </CardContent>
          </Card>
          <Card
            className={`cursor-pointer transition-all ${filterType === "job" ? "ring-2 ring-blue-400" : ""}`}
            onClick={() => setFilterType("job")}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">채용</p>
                  <p className="text-3xl font-bold text-blue-600">{jobs.length}</p>
                </div>
                <Briefcase className="text-blue-500" size={32} />
              </div>
            </CardContent>
          </Card>
          <Card
            className={`cursor-pointer transition-all ${filterType === "contest" ? "ring-2 ring-purple-400" : ""}`}
            onClick={() => setFilterType("contest")}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">공모전</p>
                  <p className="text-3xl font-bold text-purple-600">{contests.length}</p>
                </div>
                <Award className="text-purple-500" size={32} />
              </div>
            </CardContent>
          </Card>
          <Card
            className={`cursor-pointer transition-all ${filterType === "event" ? "ring-2 ring-green-400" : ""}`}
            onClick={() => setFilterType("event")}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">이벤트</p>
                  <p className="text-3xl font-bold text-green-600">{events.length}</p>
                </div>
                <Calendar className="text-green-500" size={32} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 검색 */}
        <div className="mb-6 flex items-center gap-4">
          <div className="flex items-center border rounded-lg px-4 py-2 bg-white flex-1">
            <Search size={20} className="text-gray-400 mr-2" />
            <Input
              placeholder="제목, 회사명, 내용으로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-none focus-visible:ring-0"
            />
          </div>
          <Button onClick={loadItems} variant="outline">
            <RefreshCw size={16} className="mr-2" />
            새로고침
          </Button>
          {filterType !== "all" && (
            <Button variant="ghost" onClick={() => setFilterType("all")}>
              필터 초기화
            </Button>
          )}
        </div>

        {/* 항목 목록 */}
        <Card>
          <CardHeader>
            <CardTitle>항목 목록 ({filteredItems.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="animate-spin" size={32} />
              </div>
            ) : filteredItems.length === 0 ? (
              <p className="text-gray-500 text-center py-12">
                {searchTerm || filterType !== "all"
                  ? "검색 결과가 없습니다"
                  : "등록된 항목이 없습니다"}
              </p>
            ) : (
              <div className="space-y-4">
                {filteredItems
                  .map((item) => {
                    const dday = getDday(item.date);
                    const isExpired = dday === "마감";
                    const typeInfo =
                      item.type === "job"
                        ? { label: "채용", color: "bg-blue-100 text-blue-700" }
                        : item.type === "contest"
                        ? { label: "공모전", color: "bg-purple-100 text-purple-700" }
                        : { label: "이벤트", color: "bg-green-100 text-green-700" };

                    return (
                      <div
                        key={item.id}
                        className={`flex items-start gap-4 p-5 bg-white border border-gray-100 rounded-[24px] shadow-sm hover:shadow-md transition-all ${
                          isExpired ? "opacity-60" : ""
                        }`}
                      >
                        {/* 썸네일 미리보기 (왼쪽) */}
                        <div 
                          className="w-24 h-32 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-gray-50 flex items-center justify-center cursor-pointer group/thumb relative"
                          onClick={() => handleEdit(item)}
                        >
                          {item.thumbnail ? (
                            <img 
                              src={item.thumbnail} 
                              alt="" 
                              className="w-full h-full object-cover transition-transform group-hover/thumb:scale-110"
                            />
                          ) : (
                            <div className="flex flex-col items-center gap-1 text-gray-300">
                               <Plus size={20} />
                               <span className="text-[10px] font-bold">IMAGE</span>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/5 opacity-0 group-hover/thumb:opacity-100 transition-opacity" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tight ${typeInfo.color}`}
                            >
                              {typeInfo.label}
                            </span>
                            {item.employmentType && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-500">
                                {item.employmentType}
                              </span>
                            )}
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                                isExpired
                                  ? "bg-gray-100 text-gray-400"
                                  : dday === "D-Day"
                                  ? "bg-red-500 text-white"
                                  : "bg-[#4ACAD4]/10 text-[#4ACAD4]"
                              }`}
                            >
                              {dday}
                            </span>
                          </div>
                          <h3 
                            className="font-bold text-gray-900 text-lg mb-1 flex items-center gap-2 cursor-pointer hover:text-[#4ACAD4] transition-colors leading-tight"
                            onClick={() => handleEdit(item)}
                          >
                            {item.title}
                            {!item.is_approved && (
                              <span className="px-1.5 py-0.5 rounded-md bg-yellow-100 text-yellow-700 text-[10px] font-black uppercase">PENDING</span>
                            )}
                          </h3>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400 font-medium">
                            {item.company && <span className="text-gray-600 font-bold">{item.company}</span>}
                            {item.location && (
                              <span className="flex items-center gap-1">
                                <MapPin size={12} className="text-gray-300" />
                                {item.location}
                              </span>
                            )}
                            {item.salary && (
                              <span className="flex items-center gap-1">
                                <DollarSign size={12} className="text-gray-300" />
                                {item.salary}
                              </span>
                            )}
                            {item.prize && (
                              <span className="flex items-center gap-1 text-[#4ACAD4]">
                                <Award size={12} />
                                {item.prize}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                                <Calendar size={12} className="text-gray-300" />
                                마감: {new Date(item.date).toLocaleDateString("ko-KR")}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {item.link && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(item.link, "_blank")}
                            >
                              <ExternalLink size={14} className="mr-1" />
                              링크
                            </Button>
                          )}
                          {!item.is_approved && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleApprove(item.id)}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              승인
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}>
                            <Edit size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(item.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
