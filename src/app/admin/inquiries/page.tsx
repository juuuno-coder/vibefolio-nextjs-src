// src/app/admin/inquiries/page.tsx

"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Calendar, User, CheckCircle, Trash2 } from "lucide-react"; // Import Trash2
import Link from "next/link";
import { getAllInquiries, updateInquiryStatus, deleteInquiry, Inquiry } from "@/lib/inquiries"; // Import deleteInquiry
import dayjs from "dayjs";

export default function AdminInquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchInquiries = useCallback(async () => {
    setIsLoading(true);
    try {
      const allInquiries = await getAllInquiries();
      setInquiries(allInquiries);
    } catch (error) {
      console.error("Failed to fetch inquiries:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInquiries();
  }, [fetchInquiries]);

  const handleStatusChange = async (id: number, currentStatus: "pending" | "answered") => {
    const newStatus = currentStatus === "pending" ? "answered" : "pending";
    const updatedInquiry = await updateInquiryStatus(id, newStatus);
    if (updatedInquiry) {
      setInquiries((prevInquiries) =>
        prevInquiries.map((inq) => (inq.id === id ? { ...inq, status: newStatus } : inq))
      );
    } else {
      alert("상태 변경에 실패했습니다.");
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("이 문의를 정말로 삭제하시겠습니까?")) {
      // Admin delete does not need a user ID check here, relies on RLS
      const { error } = await deleteInquiry(id, ""); // Pass empty string for userId
      if (error) {
        alert("문의 삭제에 실패했습니다.");
      } else {
        fetchInquiries(); // Refresh list
      }
    }
  };

  const pendingCount = inquiries.filter((inq) => inq.status === "pending").length;
  const answeredCount = inquiries.filter((inq) => inq.status === "answered").length;

  if (isLoading) {
    return (
      <div className="w-full min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-secondary">로딩 중...</p>
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
            문의 관리
          </h1>
          <p className="text-gray-600">
            사용자들의 1:1 문의를 확인하고 관리하세요
          </p>
        </div>

        {/* 통계 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-gray-600 mb-1">전체 문의</p>
              <p className="text-3xl font-bold text-gray-900">{inquiries.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-gray-600 mb-1">대기 중</p>
              <p className="text-3xl font-bold text-yellow-600">{pendingCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-gray-600 mb-1">답변 완료</p>
              <p className="text-3xl font-bold text-green-600">{answeredCount}</p>
            </CardContent>
          </Card>
        </div>

        {/* 문의 목록 */}
        <div className="space-y-4">
          {inquiries.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                <p className="text-lg">문의 내역이 없습니다.</p>
              </CardContent>
            </Card>
          ) : (
            inquiries.map((inquiry) => (
              <Card key={inquiry.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">
                        {inquiry.projects?.title || "삭제된 프로젝트"}
                      </CardTitle>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <User size={14} />
                          <span>
                            제작자: {inquiry.projects?.users?.username || "알 수 없음"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar size={14} />
                          <span>
                            {dayjs(inquiry.created_at).format("YYYY.MM.DD HH:mm")}
                          </span>
                        </div>
                        <span
                          className={`px-2 py-1 rounded text-xs ${
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
                        onClick={() => handleStatusChange(inquiry.id, inquiry.status)}
                      >
                        <CheckCircle size={16} className="mr-1" />
                        {inquiry.status === "pending" ? "답변 완료로 변경" : "대기 중으로 변경"}
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
                  <h4 className="font-semibold text-sm mb-2">문의 내용</h4>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded">
                    {inquiry.message}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
