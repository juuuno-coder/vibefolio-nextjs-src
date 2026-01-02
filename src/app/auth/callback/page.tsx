"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const processingRef = useRef(false);

  useEffect(() => {
    if (processingRef.current) return;
    processingRef.current = true;

    let isMounted = true;
    console.log("[Callback] Processing authentication...");

    // 15초 후 강제 종료 (안전장치)
    const timeout = setTimeout(() => {
      if (isMounted && status === "loading") {
        console.warn("[Callback] Authentication forced timeout");
        // 세션이 이미 잡혔을 수도 있으니 한번 더 확인
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session) {
            handleSuccess(session, "Final-Check");
          } else {
            setStatus("error");
            setErrorMessage("인증 시간이 초과되었습니다. 다시 로그인해주세요.");
            setTimeout(() => router.push("/login"), 3000);
          }
        });
      }
    }, 15000);

    const handleSuccess = (session: any, source: string) => {
      if (!isMounted || !session) return;
      console.log(`[Callback] Success via ${source}`);
      
      clearTimeout(timeout);
      setStatus("success");
      
      // 즉시 로컬 플래그 설정 (AuthContext의 빠른 판단을 도움)
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("lastActivity", Date.now().toString());
      
      // 메인으로 리다이렉트
      router.replace("/");
    };

    // URL 파라미터 추출
    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");
    const error = url.searchParams.get("error");

    if (error) {
      console.error("[Callback] URL Error:", error);
      setStatus("error");
      setErrorMessage(url.searchParams.get("error_description") || "인증 오류가 발생했습니다.");
      setTimeout(() => router.push("/login"), 3000);
      return;
    }

    // PKCE Exchange
    if (code) {
      supabase.auth.exchangeCodeForSession(code)
        .then(({ data, error }) => {
          if (error) {
            console.error("[Callback] Exchange error:", error.message);
            // 에러가 나더라도 세션이 이미 있을 수 있으므로 getSession 시도
          } else if (data.session) {
            handleSuccess(data.session, "exchangeCode");
          }
        });
    }

    // Auth State Change 감지 (가장 확실함)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("[Callback] Auth Event:", event);
      if (session && (event === "SIGNED_IN" || event === "INITIAL_SESSION")) {
        handleSuccess(session, `onAuthStateChange-${event}`);
      }
    });

    return () => {
      isMounted = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="flex flex-col items-center gap-6 p-8 bg-white rounded-2xl shadow-lg max-w-md w-full mx-4">
        {status === "loading" && (
          <>
            <div className="w-16 h-16 border-4 border-gray-200 border-t-green-500 rounded-full animate-spin"></div>
            <div className="text-center">
              <p className="text-lg font-medium text-gray-800">인증을 완료하는 중입니다...</p>
              <p className="text-sm text-gray-500 mt-2">잠시만 기다려주세요</p>
            </div>
          </>
        )}

        {status === "success" && (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-lg font-medium text-gray-800">로그인 성공!</p>
            <p className="text-sm text-gray-500 mt-2">이동 중...</p>
          </div>
        )}

        {status === "error" && (
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="text-lg font-medium text-gray-800">인증 패스워드 오류</p>
            <p className="text-sm text-red-500 mt-2">{errorMessage}</p>
          </div>
        )}
      </div>
    </div>
  );
}
