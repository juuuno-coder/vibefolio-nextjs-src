"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Loader2, 
  Search, 
  User as UserIcon, 
  ShieldCheck,
} from "lucide-react";
import { useAdmin } from "@/hooks/useAdmin";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface User {
  id: string;
  email: string;
  username: string;
  profile_image_url: string | null;
  role: 'admin' | 'user';
  created_at: string;
  last_sign_in_at?: string;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const { isAdmin, isLoading: adminLoading } = useAdmin();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // 관리자 체크
  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      alert("관리자 권한이 필요합니다.");
      router.push("/");
    }
  }, [isAdmin, adminLoading, router]);

  // 사용자 목록 불러오기
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      
      if (data.users) {
        setUsers(data.users);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
      alert("사용자 목록을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  // 권한 변경 핸들러
  const handleRoleChange = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    const actionName = newRole === 'admin' ? '관리자로 승격' : '일반 사용자로 강등';
    
    if (!confirm(`정말 이 사용자를 ${actionName}하시겠습니까?`)) return;

    try {
      setUpdatingId(userId);
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole }),
      });

      if (!res.ok) {
        throw new Error('Failed to update role');
      }

      // UI 즉시 업데이트
      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, role: newRole } : u
      ));
      
      alert(`성공적으로 ${actionName}되었습니다.`);
    } catch (error) {
      console.error("Update failed:", error);
      alert("권한 변경에 실패했습니다.");
    } finally {
      setUpdatingId(null);
    }
  };

  // 필터링
  const filteredUsers = users.filter(user => {
    const search = searchTerm.toLowerCase();
    const username = (user.username || "").toLowerCase();
    const email = (user.email || "").toLowerCase();
    const nickname = (user as any).nickname?.toLowerCase() || "";
    
    return username.includes(search) || email.includes(search) || nickname.includes(search);
  });

  if (adminLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-gray-400" size={32} />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">사용자 관리</h1>
          <p className="text-gray-500 mt-2">총 {users.length}명의 사용자가 등록되어 있습니다.</p>
        </div>
        <Button onClick={fetchUsers} variant="outline" className="gap-2">
          <Loader2 size={16} className={loading ? "animate-spin" : ""} />
          새로고침
        </Button>
      </div>

      {/* 검색 및 필터 */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <Input 
            placeholder="이름 또는 이메일로 검색..." 
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* 사용자 목록 테이블 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-semibold text-gray-700">사용자</th>
                <th className="px-6 py-4 font-semibold text-gray-700">이메일</th>
                <th className="px-6 py-4 font-semibold text-gray-700">가입일</th>
                <th className="px-6 py-4 font-semibold text-gray-700">권한</th>
                <th className="px-6 py-4 font-semibold text-gray-700 text-right">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10 border border-gray-100">
                        <AvatarImage src={user.profile_image_url || (user as any).avatar_url || "/globe.svg"} />
                        <AvatarFallback>{(user.username || (user as any).nickname || "U")[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900">
                          {user.username || (user as any).nickname || "이름 없음"}
                        </span>
                        {(user as any).nickname && user.username && (
                           <span className="text-[10px] text-gray-400">@{user.username}</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600 font-mono text-xs">{user.email || "이메일 없음"}</td>
                  <td className="px-6 py-4 text-gray-500 text-xs">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    {user.role === 'admin' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-violet-100 text-violet-700 text-xs font-bold">
                        <ShieldCheck size={12} />
                        Admin
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">
                        <UserIcon size={12} />
                        User
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button 
                      size="sm" 
                      variant={user.role === 'admin' ? "destructive" : "default"}
                      className="h-8 text-xs font-medium"
                      onClick={() => handleRoleChange(user.id, user.role)}
                      disabled={updatingId === user.id}
                    >
                      {updatingId === user.id ? (
                        <Loader2 className="animate-spin w-3 h-3" />
                      ) : (
                        user.role === 'admin' ? "권한 해제" : "관리자 지정"
                      )}
                    </Button>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    검색 결과가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
