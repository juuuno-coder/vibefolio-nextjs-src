"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Mail, Clock, CheckCircle, AlertCircle } from "lucide-react";

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [resendCount, setResendCount] = useState(0);

  useEffect(() => {
    // URL에서 이메일 파라미터 가져오기
    const emailParam = searchParams.get("email");
    if (emailParam) {
      setEmail(emailParam);
    }

    // 쿨다운 타이머
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown, searchParams]);

  const handleResendEmail = async () => {
    if (!email) {
      toast.error("이메일을 입력해주세요");
      return;
    }

    if (cooldown > 0) {
      toast.error(`${cooldown}초 후에 다시 시도해주세요`);
      return;
    }

    setLoading(true);

    try {
      // Supabase의 resend 기능 사용
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        }
      });

      if (error) throw error;

      setResendCount(resendCount + 1);
      setCooldown(60); // 60초 쿨다운
      
      toast.success("인증 이메일이 재전송되었습니다!", {
        description: "이메일을 확인해주세요. 스팸함도 확인해보세요.",
        duration: 5000,
      });

    } catch (error: any) {
      console.error("[Verify Email] Resend error:", error);
      
      if (error.message?.includes("Email rate limit exceeded")) {
        toast.error("너무 많은 요청을 보냈습니다", {
          description: "잠시 후 다시 시도해주세요.",
        });
        setCooldown(120); // 2분 쿨다운
      } else {
        toast.error("이메일 전송 실패", {
          description: error.message || "다시 시도해주세요.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-green-50 via-white to-blue-50">
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
        {/* 헤더 */}
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <Mail className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            이메일 인증
          </h2>
          <p className="text-sm text-gray-600">
            가입하신 이메일로 인증 링크를 보내드렸습니다
          </p>
        </div>

        {/* 안내 사항 */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-900">
              <p className="font-semibold mb-1">이메일을 확인해주세요</p>
              <p className="text-blue-700">받은편지함에서 인증 링크를 클릭하면 가입이 완료됩니다.</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-amber-900">
              <p className="font-semibold mb-1">이메일이 안 보이나요?</p>
              <ul className="text-amber-700 space-y-1 list-disc list-inside">
                <li>스팸함을 확인해보세요</li>
                <li>이메일 주소가 정확한지 확인하세요</li>
                <li>몇 분 정도 기다려보세요</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 이메일 입력 */}
        <div className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              이메일 주소
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="h-12 rounded-lg"
              disabled={loading}
            />
          </div>

          {/* 재전송 버튼 */}
          <Button
            onClick={handleResendEmail}
            disabled={loading || cooldown > 0}
            className="w-full h-12 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                전송 중...
              </div>
            ) : cooldown > 0 ? (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {cooldown}초 후 재전송 가능
              </div>
            ) : (
              "인증 이메일 재전송"
            )}
          </Button>

          {resendCount > 0 && (
            <p className="text-xs text-center text-gray-500">
              📧 이메일을 {resendCount}번 재전송했습니다
            </p>
          )}
        </div>

        {/* 구분선 */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-4 text-gray-500">또는</span>
          </div>
        </div>

        {/* 하단 링크 */}
        <div className="space-y-3">
          <Button
            onClick={() => router.push("/login")}
            variant="outline"
            className="w-full h-11 rounded-lg border-gray-300"
          >
            로그인 페이지로 돌아가기
          </Button>

          <div className="text-center text-sm text-gray-600">
            이메일이 계속 안 오나요?{" "}
            <Link href="/signup" className="font-medium text-green-600 hover:text-green-700 hover:underline">
              다시 가입하기
            </Link>
          </div>
        </div>

        {/* 도움말 */}
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <p className="text-xs text-gray-600">
            💡 <strong>팁:</strong> Gmail 사용자는 "프로모션" 탭도 확인해보세요
          </p>
        </div>
      </div>
    </div>
  );
}
