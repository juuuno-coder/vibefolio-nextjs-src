// src/app/admin/users/page.tsx

"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Users,
  Search,
  RefreshCw,
  Loader2,
  Shield,
  User,
  Mail,
  Calendar,
  MoreVertical,
  ShieldCheck,
  ShieldOff,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useAdmin } from "@/hooks/useAdmin";
import { supabase } from "@/lib/supabase/client";

interface UserData {
  id: string;
  email: string;
  nickname: string | null;
  profile_image_url: string | null;
  role: string;
  created_at: string;
  updated_at: string;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const { isAdmin, isLoading: adminLoading } = useAdmin();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);

  // 사용자 목록 로드
  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("사용자 로드 실패:", error);
        return;
      }

      setUsers(data || []);
    } catch (error) {
      console.error("사용자 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      alert("관리자 권한이 필요합니다.");
      router.push("/");
      return;
    }
    if (isAdmin) {
      loadUsers();
    }
  }, [isAdmin, adminLoading, router, loadUsers]);

  // 역할 변경
  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!confirm(`정말 이 사용자의 권한을 "${newRole}"(으)로 변경하시겠습니까?`)) return;

    setUpdating(userId);
    try {
      const { error } = await (supabase as any)
        .from("users")
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq("id", userId);

      if (error) {
        alert("권한 변경에 실패했습니다: " + error.message);
        return;
      }

      alert("권한이 변경되었습니다.");
      loadUsers();
    } catch (error) {
      console.error("권한 변경 실패:", error);
      alert("권한 변경에 실패했습니다.");
    } finally {
      setUpdating(null);
    }
  };

  // 검색 필터
  const filteredUsers = users.filter((user) => {
    const term = searchTerm.toLowerCase();
    return (
      user.email?.toLowerCase().includes(term) ||
      user.nickname?.toLowerCase().includes(term) ||
      user.role?.toLowerCase().includes(term)
    );
  });

  // 통계
  const totalUsers = users.length;
  const adminCount = users.filter((u) => u.role === "admin").length;
  const userCount = users.filter((u) => u.role === "user").length;

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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">사용자 관리</h1>
          <p className="text-gray-600">회원 정보를 조회하고 관리하세요</p>
        </div>

        {/* 통계 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">전체 회원</p>
                  <p className="text-3xl font-bold text-gray-900">{totalUsers}</p>
                </div>
                <Users className="text-blue-500" size={40} />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">관리자</p>
                  <p className="text-3xl font-bold text-purple-600">{adminCount}</p>
                </div>
                <Shield className="text-purple-500" size={40} />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">일반 회원</p>
                  <p className="text-3xl font-bold text-green-600">{userCount}</p>
                </div>
                <User className="text-green-500" size={40} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 검색 */}
        <div className="mb-6 flex items-center gap-4">
          <div className="flex items-center border rounded-lg px-4 py-2 bg-white flex-1">
            <Search size={20} className="text-gray-400 mr-2" />
            <Input
              placeholder="이메일, 닉네임으로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-none focus-visible:ring-0"
            />
          </div>
          <Button onClick={loadUsers} variant="outline">
            <RefreshCw size={16} className="mr-2" />
            새로고침
          </Button>
        </div>

        {/* 사용자 목록 */}
        <Card>
          <CardHeader>
            <CardTitle>회원 목록 ({filteredUsers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="animate-spin" size={32} />
              </div>
            ) : filteredUsers.length === 0 ? (
              <p className="text-gray-500 text-center py-12">
                {searchTerm ? "검색 결과가 없습니다" : "등록된 회원이 없습니다"}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left text-sm text-gray-600">
                      <th className="pb-3 font-medium">회원정보</th>
                      <th className="pb-3 font-medium">이메일</th>
                      <th className="pb-3 font-medium">권한</th>
                      <th className="pb-3 font-medium">가입일</th>
                      <th className="pb-3 font-medium text-right">관리</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr
                        key={user.id}
                        className="border-b last:border-0 hover:bg-gray-50"
                      >
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                              {user.profile_image_url ? (
                                <img
                                  src={user.profile_image_url}
                                  alt={user.nickname || ""}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                  <User size={20} />
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {user.nickname || "닉네임 없음"}
                              </p>
                              <p className="text-xs text-gray-500">
                                ID: {user.id.slice(0, 8)}...
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4">
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Mail size={14} />
                            {user.email}
                          </div>
                        </td>
                        <td className="py-4">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              user.role === "admin"
                                ? "bg-purple-100 text-purple-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {user.role === "admin" ? "관리자" : "일반회원"}
                          </span>
                        </td>
                        <td className="py-4">
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Calendar size={14} />
                            {new Date(user.created_at).toLocaleDateString("ko-KR")}
                          </div>
                        </td>
                        <td className="py-4 text-right">
                          {updating === user.id ? (
                            <Loader2 className="animate-spin inline" size={16} />
                          ) : (
                            <div className="flex items-center justify-end gap-2">
                              {user.role === "admin" ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRoleChange(user.id, "user")}
                                  className="text-orange-600 hover:text-orange-700"
                                >
                                  <ShieldOff size={14} className="mr-1" />
                                  권한 해제
                                </Button>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRoleChange(user.id, "admin")}
                                  className="text-purple-600 hover:text-purple-700"
                                >
                                  <ShieldCheck size={14} className="mr-1" />
                                  관리자 지정
                                </Button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
