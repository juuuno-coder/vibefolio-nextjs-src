"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase/client";
import { Loader2, Mail, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;
      setSubmitted(true);
    } catch (err: any) {
      console.error("Password reset error:", err);
      setError(err.message || "오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">비밀번호 찾기</CardTitle>
          <CardDescription>
            가입하신 이메일 주소를 입력하시면<br />
            비밀번호 재설정 링크를 보내드립니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">이메일 주소</label>
                <Input
                  id="email"
                  type="email"
                  placeholder="example@email.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12"
                />
              </div>
              <Button type="submit" className="w-full h-12" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    전송 중...
                  </>
                ) : (
                  "재설정 링크 보내기"
                )}
              </Button>
            </form>
          ) : (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Mail className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">이메일 발송 완료</h3>
              <p className="text-gray-600 mb-8">
                {email} 주소로<br />
                비밀번호 재설정 링크가 포함된 이메일을 보냈습니다.
              </p>
              <Button asChild variant="outline" className="w-full h-12">
                <Link href="/login">로그인 페이지로 이동</Link>
              </Button>
            </div>
          )}

          <div className="mt-6 text-center">
            <Link href="/login" className="text-sm text-gray-500 hover:text-gray-700 inline-flex items-center gap-1">
              <ArrowLeft size={14} />
              로그인으로 돌아가기
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
