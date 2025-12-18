// src/app/admin/inquiries/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Calendar,
  User,
  Trash2,
  CheckCircle,
  Search,
  RefreshCw,
  Loader2,
  MessageCircle,
  Mail,
  Phone,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { useAdmin } from "@/hooks/useAdmin";

import { supabase } from "@/lib/supabase/client";

interface Inquiry {
  id: number;
  // projectId, projectTitle, creator 등은 현재 폼에 없으므로 optional 처리
  projectId?: string;
  projectTitle?: string;
  creator?: string;
  name?: string;
  email?: string;
  phone?: string;
  message: string;
  created_at: string; // DB 컬럼명
  date?: string; // 호환성 유지용 (UI 렌더링 시 created_at 사용)
  status: "pending" | "answered";
}

export default function AdminInquiriesPage() {
  const router = useRouter();
  const { isAdmin, isLoading: adminLoading } = useAdmin();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "answered">("all");

  // 문의 목록 로드
  const loadInquiries = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('inquiries')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      if (data) {
        // DB 데이터 매핑
        const mappedData = data.map((item: any) => ({
          ...item,
          date: item.created_at, // date 필드를 created_at으로 매핑
          status: (item.status === "answered" ? "answered" : "pending") as "pending" | "answered" 
        }));
        setInquiries(mappedData);
      }
    } catch (error) {
      console.error("문의 로드 실패:", error);
      // 로컬 스토리지 백업 데이터라도 보여줄지 고민되지만, DB 마이그레이션이 목표이므로 에러 표시
      // alert("데이터를 불러오는 중 오류가 발생했습니다.");
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
      loadInquiries();
    }
  }, [isAdmin, adminLoading, router]);

  const handleDelete = async (id: number) => {
    if (confirm("이 문의를 삭제하시겠습니까?")) {
      try {
        const { error } = await supabase.from('inquiries').delete().eq('id', id);
        if (error) throw error;

        const updated = inquiries.filter((inq) => inq.id !== id);
        setInquiries(updated);
      } catch (e) {
        console.error("삭제 실패:", e);
        alert("삭제 중 오류가 발생했습니다.");
      }
    }
  };

  const handleToggleStatus = async (id: number) => {
    const target = inquiries.find(i => i.id === id);
    if (!target) return;

    const newStatus = target.status === "pending" ? "answered" : "pending";

    try {
      const { error } = await supabase
        .from('inquiries')
        .update({ status: newStatus })
        .eq('id', id);
        
      if (error) throw error;

      const updated = inquiries.map((inq) =>
        inq.id === id ? { ...inq, status: newStatus } : inq
      );
      setInquiries(updated);
    } catch (e) {
      console.error("상태 변경 실패:", e);
      alert("상태 변경 중 오류가 발생했습니다.");
    }
  };

  const handleBatchStatusChange = async (status: "answered" | "pending") => {
    const filtered = filteredInquiries.filter((inq) => inq.status !== status);
    if (filtered.length === 0) {
      alert("변경할 문의가 없습니다.");
      return;
    }
    if (!confirm(`${filtered.length}개 문의를 "${status === "answered" ? "답변 완료" : "대기 중"}"으로 변경하시겠습니까?`)) return;

    const ids = filtered.map(inq => inq.id);

    try {
      const { error } = await supabase
        .from('inquiries')
        .update({ status })
        .in('id', ids);
      
      if (error) throw error;

      const updatedIds = new Set(ids);
      const updated = inquiries.map((inq) =>
        updatedIds.has(inq.id) ? { ...inq, status } : inq
      );
      setInquiries(updated);
    } catch (e) {
      console.error("일괄 변경 실패:", e);
      alert("일괄 변경 중 오류가 발생했습니다.");
    }
  };

  // 필터링된 문의 목록
  const filteredInquiries = inquiries.filter((inq) => {
    // 상태 필터
    if (filterStatus !== "all" && inq.status !== filterStatus) return false;
    
    // 검색어 필터
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        inq.projectTitle?.toLowerCase().includes(term) ||
        inq.creator?.toLowerCase().includes(term) ||
        inq.name?.toLowerCase().includes(term) ||
        inq.email?.toLowerCase().includes(term) ||
        inq.message?.toLowerCase().includes(term)
      );
    }
    return true;
  });

  const pendingCount = inquiries.filter((inq) => inq.status === "pending").length;
  const answeredCount = inquiries.filter((inq) => inq.status === "answered").length;

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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">문의 관리</h1>
          <p className="text-gray-600">
            사용자들의 1:1 문의를 확인하고 관리하세요
          </p>
        </div>

        {/* 통계 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">전체 문의</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {inquiries.length}
                  </p>
                </div>
                <MessageCircle className="text-blue-500" size={40} />
              </div>
            </CardContent>
          </Card>
          <Card
            className={`cursor-pointer transition-all ${filterStatus === "pending" ? "ring-2 ring-yellow-400" : ""}`}
            onClick={() => setFilterStatus(filterStatus === "pending" ? "all" : "pending")}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">대기 중</p>
                  <p className="text-3xl font-bold text-yellow-600">
                    {pendingCount}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                  <span className="text-yellow-600 font-bold">!</span>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card
            className={`cursor-pointer transition-all ${filterStatus === "answered" ? "ring-2 ring-green-400" : ""}`}
            onClick={() => setFilterStatus(filterStatus === "answered" ? "all" : "answered")}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">답변 완료</p>
                  <p className="text-3xl font-bold text-green-600">
                    {answeredCount}
                  </p>
                </div>
                <CheckCircle className="text-green-500" size={40} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 검색 및 필터 */}
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <div className="flex items-center border rounded-lg px-4 py-2 bg-white flex-1 min-w-[250px]">
            <Search size={20} className="text-gray-400 mr-2" />
            <Input
              placeholder="제목, 이름, 이메일, 내용으로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-none focus-visible:ring-0"
            />
          </div>
          <Button onClick={loadInquiries} variant="outline">
            <RefreshCw size={16} className="mr-2" />
            새로고침
          </Button>
          {filterStatus !== "all" && (
            <Button variant="ghost" onClick={() => setFilterStatus("all")}>
              필터 초기화
            </Button>
          )}
        </div>

        {/* 일괄 작업 */}
        {filteredInquiries.length > 0 && (
          <div className="mb-4 flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBatchStatusChange("answered")}
              className="text-green-600"
            >
              <CheckCircle size={14} className="mr-1" />
              모두 답변 완료 처리
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBatchStatusChange("pending")}
              className="text-yellow-600"
            >
              모두 대기 중으로 변경
            </Button>
          </div>
        )}

        {/* 문의 목록 */}
        <div className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="py-12 flex justify-center">
                <Loader2 className="animate-spin" size={32} />
              </CardContent>
            </Card>
          ) : filteredInquiries.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                <MessageCircle size={48} className="mx-auto mb-4 text-gray-300" />
                <p className="text-lg">
                  {searchTerm || filterStatus !== "all"
                    ? "검색 결과가 없습니다"
                    : "문의 내역이 없습니다"}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredInquiries
              .sort((a, b) => new Date(b.created_at || b.date || "").getTime() - new Date(a.created_at || a.date || "").getTime())
              .map((inquiry) => (
                <Card key={inquiry.id} className="overflow-hidden">
                  <CardHeader className="bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2 flex items-center gap-2">
                          <FileText size={18} className="text-blue-500" />
                          {inquiry.projectTitle || "일반 문의"}
                        </CardTitle>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                          {inquiry.name && (
                            <div className="flex items-center gap-1">
                              <User size={14} />
                              <span>{inquiry.name}</span>
                            </div>
                          )}
                          {inquiry.creator && (
                            <div className="flex items-center gap-1">
                              <User size={14} />
                              <span>제작자: {inquiry.creator}</span>
                            </div>
                          )}
                          {inquiry.email && (
                            <div className="flex items-center gap-1">
                              <Mail size={14} />
                              <span>{inquiry.email}</span>
                            </div>
                          )}
                          {inquiry.phone && (
                            <div className="flex items-center gap-1">
                              <Phone size={14} />
                              <span>{inquiry.phone}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Calendar size={14} />
                            <span>
                              {new Date(inquiry.date || inquiry.created_at).toLocaleDateString("ko-KR", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              inquiry.status === "answered"
                                ? "bg-green-100 text-green-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {inquiry.status === "answered" ? "답변 완료" : "대기 중"}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleStatus(inquiry.id)}
                        >
                          <CheckCircle size={16} className="mr-1" />
                          {inquiry.status === "pending"
                            ? "답변 완료"
                            : "대기 중으로"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(inquiry.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <Separator />
                  <CardContent className="pt-4">
                    <h4 className="font-semibold text-sm mb-2 text-gray-700">
                      문의 내용
                    </h4>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap bg-white p-4 rounded border">
                      {inquiry.message}
                    </p>
                    {inquiry.email && (
                      <div className="mt-4 flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(`mailto:${inquiry.email}`, "_blank")}
                        >
                          <Mail size={14} className="mr-1" />
                          이메일로 답변하기
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
          )}
        </div>
      </div>
    </div>
  );
}
