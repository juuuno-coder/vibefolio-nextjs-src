"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // 1. Supabase Auth 로그인
      console.log('로그인 시도:', formData.email);
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("로그인 정보를 가져올 수 없습니다.");

      console.log("Supabase Auth 로그인 성공:", authData.user.id);

      // 2. public.users 테이블에서 프로필 정보 조회
      // 새 스키마에서는 'id'가 'user.id' (UUID)와 동일하므로 바로 조회 가능
      const { data: userData, error: userError } = await supabase
        .from('users') // 'User' -> 'users'
        .select('*')
        .eq('id', authData.user.id) // email 대신 id(UUID)로 조회 권장
        .single() as { data: any, error: any };

      if (userError) {
        console.error("사용자 프로필 조회 실패:", userError);
        // 프로필이 없는 심각한 상황. (트리거 오류 등)
        throw new Error("사용자 정보를 찾을 수 없습니다. (프로필 누락)");
      }

      // 3. 로컬 스토리지 저장 (호환성 유지)
      localStorage.setItem('userProfile', JSON.stringify({
        user_id: userData.id, // UUID
        email: userData.email,
        nickname: userData.nickname,
        profile_image_url: userData.profile_image_url,
        role: userData.role,
      }));
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('userId', userData.id); // UUID 저장

      alert('로그인 성공!');
      window.location.href = '/';
    } catch (error: any) {
      console.error('로그인 오류:', error);
      setError(error.message || '로그인 중 오류가 발생했습니다.');
      alert(`로그인 오류: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-lg shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            로그인
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            계정이 없으신가요?{" "}
            <Link
              href="/signup"
              className="font-medium text-[#4ACAD4] hover:text-[#41a3aa]"
            >
              회원가입
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label
                htmlFor="email-address"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                이메일 주소
              </label>
              <Input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="example@email.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                비밀번호
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                placeholder="비밀번호"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-[#4ACAD4] focus:ring-[#4ACAD4]"
              />
              <label
                htmlFor="remember-me"
                className="ml-2 block text-sm text-gray-900"
              >
                로그인 상태 유지
              </label>
            </div>

            <div className="text-sm">
              <a
                href="#"
                className="font-medium text-[#4ACAD4] hover:text-[#41a3aa]"
              >
                비밀번호 찾기
              </a>
            </div>
          </div>

          <div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#4ACAD4] hover:bg-[#41a3aa] text-white"
            >
              {loading ? "로그인 중..." : "로그인"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
