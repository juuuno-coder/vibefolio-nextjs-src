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
} from "lucide-react";
import Link from "next/link";
import { useAdmin } from "@/hooks/useAdmin";
import { supabase } from "@/lib/supabase/client";

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
  });

  // 아이템 로드 (Supabase 연동)
  const loadItems = async () => {
    setLoading(true);
    try {
      console.log('📡 Fetching recruit items from DB...');
      const { data, error, count } = await supabase
        .from('recruit_items')
        .select('*', { count: 'exact' })
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
        const errorText = await response.text();
        console.error("Crawl API Error:", errorText);
        alert("업데이트 중 오류가 발생했습니다.");
      }
    } catch (e) {
      console.error("Crawl trigger error:", e);
      alert("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 항목 추가/수정 (Supabase 연동)
  const handleSubmit = async () => {
    if (!formData.title || !formData.description || !formData.date) {
      alert("제목, 설명, 날짜는 필수 항목입니다.");
      return;
    }

    try {
      const itemData = {
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
      };

      if (editingItem) {
        const { error } = await supabase
          .from('recruit_items')
          .update(itemData)
          .eq('id', editingItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('recruit_items')
          .insert([itemData]);
        if (error) throw error;
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
                className="border-[#4ACAD4] text-[#4ACAD4] hover:bg-[#4ACAD4]/10"
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
                    className="bg-[#4ACAD4] hover:bg-[#41a3aa]"
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
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        유형
                      </label>
                      <select
                        value={formData.type}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            type: e.target.value as "job" | "contest" | "event",
                          })
                        }
                        className="w-full border rounded-md px-3 py-2"
                      >
                        <option value="job">채용</option>
                        <option value="contest">공모전</option>
                        <option value="event">이벤트</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        제목 *
                      </label>
                      <Input
                        placeholder="제목을 입력하세요"
                        value={formData.title}
                        onChange={(e) =>
                          setFormData({ ...formData, title: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        설명 *
                      </label>
                      <Textarea
                        placeholder="설명을 입력하세요"
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({ ...formData, description: e.target.value })
                        }
                        rows={4}
                      />
                    </div>

                    {/* 채용 전용 필드 */}
                    {formData.type === "job" && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            회사명
                          </label>
                          <Input
                            placeholder="회사명을 입력하세요"
                            value={formData.company}
                            onChange={(e) =>
                              setFormData({ ...formData, company: e.target.value })
                            }
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              고용 형태
                            </label>
                            <select
                              value={formData.employmentType}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  employmentType: e.target.value,
                                })
                              }
                              className="w-full border rounded-md px-3 py-2"
                            >
                              <option value="정규직">정규직</option>
                              <option value="계약직">계약직</option>
                              <option value="프리랜서">프리랜서</option>
                              <option value="인턴">인턴</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              급여
                            </label>
                            <Input
                              placeholder="예: 연봉 3,500~4,500만원"
                              value={formData.salary}
                              onChange={(e) =>
                                setFormData({ ...formData, salary: e.target.value })
                              }
                            />
                          </div>
                        </div>
                      </>
                    )}

                    {/* 공모전 전용 필드 */}
                    {formData.type === "contest" && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          상금/혜택
                        </label>
                        <Input
                          placeholder="예: 대상 500만원"
                          value={formData.prize}
                          onChange={(e) =>
                            setFormData({ ...formData, prize: e.target.value })
                          }
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          마감일/날짜 *
                        </label>
                        <Input
                          type="date"
                          value={formData.date}
                          onChange={(e) =>
                            setFormData({ ...formData, date: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          장소
                        </label>
                        <Input
                          placeholder="장소를 입력하세요"
                          value={formData.location}
                          onChange={(e) =>
                            setFormData({ ...formData, location: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        바로가기 링크
                      </label>
                      <Input
                        placeholder="https://example.com"
                        value={formData.link}
                        onChange={(e) =>
                          setFormData({ ...formData, link: e.target.value })
                        }
                      />
                    </div>

                    <div className="flex gap-2 justify-end pt-4">
                      <Button variant="outline" onClick={handleDialogClose}>
                        취소
                      </Button>
                      <Button
                        onClick={handleSubmit}
                        className="bg-[#4ACAD4] hover:bg-[#41a3aa]"
                      >
                        {editingItem ? "수정" : "추가"}
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
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
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
                        className={`flex items-center justify-between p-4 bg-gray-50 rounded-lg ${
                          isExpired ? "opacity-60" : ""
                        }`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${typeInfo.color}`}
                            >
                              {typeInfo.label}
                            </span>
                            {item.employmentType && (
                              <span className="px-2 py-1 rounded text-xs font-medium bg-gray-200 text-gray-700">
                                {item.employmentType}
                              </span>
                            )}
                            <span
                              className={`px-2 py-1 rounded text-xs font-bold ${
                                isExpired
                                  ? "bg-gray-200 text-gray-500"
                                  : dday === "D-Day"
                                  ? "bg-red-500 text-white"
                                  : "bg-[#4ACAD4]/20 text-[#4ACAD4]"
                              }`}
                            >
                              {dday}
                            </span>
                          </div>
                          <h3 className="font-semibold text-gray-900 mb-1">
                            {item.title}
                          </h3>
                          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                            {item.company && <span>{item.company}</span>}
                            {item.location && (
                              <span className="flex items-center gap-1">
                                <MapPin size={14} />
                                {item.location}
                              </span>
                            )}
                            {item.salary && (
                              <span className="flex items-center gap-1">
                                <DollarSign size={14} />
                                {item.salary}
                              </span>
                            )}
                            {item.prize && (
                              <span className="flex items-center gap-1">
                                <Award size={14} />
                                {item.prize}
                              </span>
                            )}
                            <span>
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
