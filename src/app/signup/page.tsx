"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGoogle } from "@fortawesome/free-brands-svg-icons";

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    passwordConfirm: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.passwordConfirm) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    if (formData.password.length < 6) {
      setError("비밀번호는 최소 6자 이상이어야 합니다.");
      return;
    }

    setLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            onboarding_completed: false,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("회원가입에 실패했습니다.");

      // 회원가입 성공 시 메인 페이지로 이동 (온보딩 모달이 표시됨)
      alert('회원가입이 완료되었습니다! 로그인해주세요.');
      router.push('/login');
      
    } catch (error: any) {
      console.error('회원가입 오류:', error);
      setError(error.message || '회원가입 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
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



  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div>
          <h2 className="mt-2 text-center text-3xl font-bold tracking-tight text-gray-900">
            회원가입
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            이미 계정이 있으신가요?{" "}
            <Link
              href="/login"
              className="font-medium text-[#4ACAD4] hover:text-[#41a3aa]"
            >
              로그인
            </Link>
          </p>
        </div>

        {/* 소셜 로그인 */}
        <div className="space-y-3">


          <Button
            type="button"
            onClick={handleGoogleSignup}
            variant="outline"
            className="w-full h-12 flex items-center justify-center gap-3 border-gray-300 hover:bg-gray-50"
          >
            <FontAwesomeIcon icon={faGoogle} className="w-5 h-5 text-red-500" />
            <span>Google로 계속하기</span>
          </Button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-4 text-gray-500">또는</span>
          </div>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              이메일
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              placeholder="example@email.com"
              className="h-12"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              비밀번호
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              placeholder="최소 6자 이상"
              className="h-12"
            />
          </div>

          <div>
            <label htmlFor="password-confirm" className="block text-sm font-medium text-gray-700 mb-1">
              비밀번호 확인
            </label>
            <Input
              id="password-confirm"
              name="password-confirm"
              type="password"
              required
              value={formData.passwordConfirm}
              onChange={(e) =>
                setFormData({ ...formData, passwordConfirm: e.target.value })
              }
              placeholder="비밀번호 확인"
              className="h-12"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-[#4ACAD4] hover:bg-[#41a3aa] text-white rounded-full text-base font-medium"
          >
            {loading ? "가입 중..." : "가입하기"}
          </Button>
        </form>

        <div className="text-center text-xs text-gray-500">
          <p>
            가입 시{" "}
            <a href="#" className="text-[#4ACAD4] hover:underline">
              이용약관
            </a>{" "}
            및{" "}
            <a href="#" className="text-[#4ACAD4] hover:underline">
              개인정보처리방침
            </a>
            에 동의하게 됩니다.
          </p>
        </div>
      </div>
    </div>
  );
}
