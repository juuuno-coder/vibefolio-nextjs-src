"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGoogle } from "@fortawesome/free-brands-svg-icons";
import { toast } from "sonner";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
     // 네이버 인앱 브라우저 감지 및 처리
     const userAgent = window.navigator.userAgent.toLowerCase();
     const isNaverApp = userAgent.includes('naver'); 
     
     if (isNaverApp) {
         toast.info("네이버 앱에서는 Google 로그인이 제한될 수 있습니다.", {
              description: "원활한 로그인을 위해 크롬이나 사파리 등 기본 브라우저를 이용해주세요.",
              duration: 5000
         });
     }
  }, []);

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== passwordConfirm) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    if (password.length < 6) {
      setError("비밀번호는 최소 6자 이상이어야 합니다.");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

      if (data.session) {
        // 이미 세션이 생성됨 (자동 로그인 설정인 경우)
        toast.success("회원가입이 완료되었습니다!");
        router.push("/");
      } else {
        // 이메일 확인 필요
        toast.success("회원가입 확인 이메일이 발송되었습니다!", {
          description: "이메일을 확인하여 계정을 활성화해주세요.",
          duration: 5000,
        });
        router.push(`/verify-email?email=${encodeURIComponent(email)}`);
      }
    } catch (error: any) {
      console.error("[Signup] Error:", error);
      setError(error.message || "회원가입 중 오류가 발생했습니다.");
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      console.error("[Signup] Google Error:", error);
      setError(error.message);
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div>
          <h2 className="mt-2 text-center text-3xl font-bold tracking-tight text-gray-900">
            반가워요! 👋
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            이미 계정이 있으신가요?{" "}
            <Link href="/login" className="font-medium text-green-600 hover:text-green-500 hover:underline">
              로그인하기
            </Link>
          </p>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm font-medium">
            ⚠️ {error}
          </div>
        )}

        {/* 소셜 회원가입 */}
        <div className="space-y-3">
          <Button
            type="button"
            onClick={handleGoogleSignup}
            disabled={loading}
            variant="outline"
            className="w-full h-12 flex items-center justify-center gap-3 border-gray-300 hover:bg-gray-50 rounded-full transition-all hover:shadow-md"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
            ) : (
              <FontAwesomeIcon icon={faGoogle} className="w-5 h-5 text-red-500" />
            )}
            <span className="text-gray-700 font-medium">Google로 계속하기</span>
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

        <form className="space-y-5" onSubmit={handleEmailSignup}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              이메일
            </label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="h-11 rounded-lg"
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              비밀번호
            </label>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="최소 6자 이상"
              className="h-11 rounded-lg"
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="password-confirm" className="block text-sm font-medium text-gray-700 mb-1">
              비밀번호 확인
            </label>
            <Input
              id="password-confirm"
              type="password"
              required
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              placeholder="비밀번호 다시 입력"
              className="h-11 rounded-lg"
              disabled={loading}
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-full text-base font-bold bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-100 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            {loading ? "가입 중..." : "3초만에 가입하기"}
          </Button>
        </form>

        <div className="text-center text-xs text-gray-400">
          <p>
            가입 시{" "}
            <Link href="/policy/terms" className="underline">이용약관</Link> 및{" "}
            <Link href="/policy/privacy" className="underline">개인정보처리방침</Link>에 동의하게 됩니다.
          </p>
        </div>
      </div>
    </div>
  );
}
