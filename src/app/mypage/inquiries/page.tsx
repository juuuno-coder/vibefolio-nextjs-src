// src/app/mypage/inquiries/page.tsx

"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { MessageCircle, Calendar, User, Trash2 } from "lucide-react";
import { getUserInquiries, deleteInquiry, Inquiry } from "@/lib/inquiries";
import dayjs from "dayjs";

export default function InquiriesPage() {
  const { session } = useAuth();
  const user = session?.user;
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchInquiries = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const userInquiries = await getUserInquiries(user.id);
      setInquiries(userInquiries);
    } catch (error) {
      console.error("Failed to fetch inquiries:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchInquiries();
  }, [fetchInquiries]);

  const handleDelete = async (id: number) => {
    if (!user) {
      alert("로그인이 필요합니다.");
      return;
    }
    if (confirm("문의를 삭제하시겠습니까?")) {
      const { error } = await deleteInquiry(id, user.id);
      if (error) {
        alert("문의 삭제에 실패했습니다.");
      } else {
        // Refresh the list after deletion
        fetchInquiries();
      }
    }
  };

  if (isLoading) {
    return (
      <div className="w-full min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-secondary">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            내 1:1 문의
          </h1>
          <p className="text-gray-600">
            프로젝트 제작자에게 보낸 문의 내역을 확인하세요
          </p>
        </div>

        {inquiries.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              <MessageCircle size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="text-lg">문의 내역이 없습니다.</p>
              <p className="text-sm mt-2">
                프로젝트 상세 페이지에서 제작자에게 문의해보세요!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {inquiries.map((inquiry) => (
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
                          <span>{inquiry.projects?.users?.username || "알 수 없음"}</span>
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
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(inquiry.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={18} />
                    </Button>
                  </div>
                </CardHeader>
                <Separator />
                <CardContent className="pt-4">
                  <h4 className="font-semibold text-sm mb-2">문의 내용</h4>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {inquiry.message}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
