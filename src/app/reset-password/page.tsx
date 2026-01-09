"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase/client";
import { Loader2, Lock, CheckCircle2, AlertCircle, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState("");
  const [checkingSession, setCheckingSession] = useState(true);
  const [hasValidSession, setHasValidSession] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // 1. URL 해시에서 토큰 추출 (Supabase 이메일 링크는 #access_token=... 형식)
        const hash = window.location.hash;
        if (hash) {
          // 해시에서 파라미터 추출
          const hashParams = new URLSearchParams(hash.substring(1));
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');
          const type = hashParams.get('type');
          
          console.log('[Reset Password] Hash params:', { type, hasAccessToken: !!accessToken });
          
          if (type === 'recovery' && accessToken) {
            // 토큰으로 세션 설정
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || '',
            });
            
            if (error) {
              console.error('[Reset Password] Session set error:', error);
              setError('비밀번호 재설정 링크가 만료되었거나 유효하지 않습니다.');
              setCheckingSession(false);
              return;
            }
            
            if (data.session) {
              console.log('[Reset Password] Session set successfully');
              setHasValidSession(true);
              // URL에서 해시 제거 (보안)
              window.history.replaceState(null, '', window.location.pathname);
            }
          }
        }
        
        // 2. 기존 세션 확인 (auth/callback에서 리다이렉트된 경우)
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          console.log('[Reset Password] Session found');
          setHasValidSession(true);
        } else if (!hasValidSession) {
          setError('비밀번호 재설정 세션이 만료되었습니다. 다시 시도해주세요.');
        }
      } catch (e) {
        console.error('[Reset Password] Init error:', e);
        setError('세션 확인 중 오류가 발생했습니다.');
      } finally {
        setCheckingSession(false);
      }
    };

    initializeAuth();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }
    if (password.length < 6) {
      setError("비밀번호는 최소 6자 이상이어야 합니다.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;
      setCompleted(true);
      
      // 로그아웃 (새 비밀번호로 다시 로그인하도록)
      await supabase.auth.signOut();
      
      // 3초 후 로그인 페이지로 이동
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (err: any) {
      console.error("Password update error:", err);
      setError(err.message || "비밀번호 업데이트 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin text-green-600 mx-auto mb-4" size={40} />
          <p className="text-gray-600">인증 확인 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold">비밀번호 재설정</CardTitle>
          <CardDescription>
            {hasValidSession 
              ? "새로운 비밀번호를 입력해주세요." 
              : "비밀번호 재설정 링크가 필요합니다."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!completed ? (
            <>
              {!hasValidSession ? (
                // 세션이 없는 경우 - 재설정 링크 요청 안내
                <div className="text-center py-4">
                  <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertCircle className="w-8 h-8 text-yellow-600" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">세션이 만료되었습니다</h3>
                  <p className="text-gray-600 text-sm mb-6">
                    비밀번호 재설정 링크가 만료되었거나<br />
                    유효하지 않습니다.
                  </p>
                  <div className="space-y-3">
                    <Button 
                      onClick={() => router.push('/forgot-password')}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      비밀번호 찾기 다시 요청
                    </Button>
                    <Link href="/login" className="block">
                      <Button variant="outline" className="w-full">
                        로그인 페이지로
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                // 유효한 세션 - 비밀번호 변경 폼
                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {error}
                    </div>
                  )}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="password" className="text-sm font-medium">새 비밀번호</label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="최소 6자 이상"
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="h-12 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="confirmPassword" className="text-sm font-medium">비밀번호 확인</label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="새 비밀번호 다시 입력"
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="h-12 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* 비밀번호 강도 표시 */}
                  {password && (
                    <div className="text-sm">
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`h-1 flex-1 rounded ${password.length >= 6 ? 'bg-green-500' : 'bg-gray-200'}`} />
                        <div className={`h-1 flex-1 rounded ${password.length >= 8 ? 'bg-green-500' : 'bg-gray-200'}`} />
                        <div className={`h-1 flex-1 rounded ${password.length >= 10 && /[A-Z]/.test(password) ? 'bg-green-500' : 'bg-gray-200'}`} />
                      </div>
                      <p className={`text-xs ${password.length >= 6 ? 'text-green-600' : 'text-gray-500'}`}>
                        {password.length < 6 ? '최소 6자 이상 입력하세요' : 
                         password.length < 8 ? '보통 강도' : 
                         password.length >= 10 && /[A-Z]/.test(password) ? '강한 비밀번호' : '좋은 강도'}
                      </p>
                    </div>
                  )}
                  
                  <Button type="submit" className="w-full h-12 bg-green-600 hover:bg-green-700" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        변경 중...
                      </>
                    ) : (
                      "비밀번호 변경하기"
                    )}
                  </Button>
                </form>
              )}
            </>
          ) : (
            // 완료 상태
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">변경 완료!</h3>
              <p className="text-gray-600 mb-8">
                비밀번호가 성공적으로 변경되었습니다.<br />
                잠시 후 로그인 페이지로 이동합니다.
              </p>
              <div className="flex justify-center">
                <Loader2 className="animate-spin text-gray-400" size={24} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-green-600" size={40} />
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
