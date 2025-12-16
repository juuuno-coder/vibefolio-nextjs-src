"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGoogle } from "@fortawesome/free-brands-svg-icons";

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // 로그인 상태 감지 및 리다이렉트
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.replace('/');
      }
    };
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        router.replace('/');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);



  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      console.error('Google 로그인 오류:', error);
      setError(error.message || 'Google 로그인에 실패했습니다.');
    }
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // ... (기존 로그인 로직)
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
        console.warn("사용자 프로필 조회 실패 (로컬 데이터로 대체):", userError);
        // 프로필이 없어도 로그인은 진행
      }

      const userId = userData?.id || authData.user.id;
      const userEmail = userData?.email || authData.user.email;
      const userNickname = userData?.nickname || authData.user.user_metadata?.nickname || userEmail?.split('@')[0];
      const userProfileImage = userData?.profile_image_url || authData.user.user_metadata?.profile_image_url;
      const userRole = userData?.role || 'user';

      // 3. 로컬 스토리지 저장 (호환성 유지)
      localStorage.setItem('userProfile', JSON.stringify({
        user_id: userId,
        email: userEmail,
        nickname: userNickname,
        profile_image_url: userProfileImage,
        role: userRole,
      }));
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('userId', userId);

      // alert('로그인 성공!'); // 성공 메시지 제거
      window.location.href = '/';
    } catch (error: any) {
      console.error('로그인 오류:', error);
      let errorMessage = '로그인 중 오류가 발생했습니다.';
      
      // 에러 메시지 한글화
      if (error.message.includes('Invalid login credentials')) {
        errorMessage = '아이디 또는 비밀번호가 일치하지 않습니다.';
      } else if (error.message.includes('Email not confirmed')) {
        errorMessage = '이메일 인증이 완료되지 않았습니다. 이메일을 확인해주세요';
      }
      
      setError(errorMessage);
      // alert는 띄우지 않음
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

        {/* 소셜 로그인 */}
        <div className="mt-8 space-y-3">


          <Button
            type="button"
            onClick={handleGoogleLogin}
            variant="outline"
            className="w-full h-12 flex items-center justify-center gap-3 border-gray-300 hover:bg-gray-50"
          >
            <FontAwesomeIcon icon={faGoogle} className="w-5 h-5 text-red-500" />
            <span>Google로 로그인</span>
          </Button>
        </div>

        <div className="relative mt-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-4 text-gray-500">또는 이메일로 로그인</span>
          </div>
        </div>

        <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
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
