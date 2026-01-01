"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [debug, setDebug] = useState<string>("시작...");

  useEffect(() => {
    let isMounted = true;
    console.log("[Callback] Mounting callback page...");

    // 타임아웃 20초 (충분히 대기)
    const timeout = setTimeout(() => {
      if (isMounted && status === "loading") {
        console.warn("[Callback] Authentication timeout reached");
        setStatus("error");
        setErrorMessage("인증 시간이 초과되었습니다. 다시 시도해주세요.");
        setTimeout(() => router.push("/login"), 3000);
      }
    }, 20000);

    // URL 에러 확인
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("error")) {
      setStatus("error");
      setErrorMessage(urlParams.get("error_description") || urlParams.get("error") || "인증 오류");
      setTimeout(() => router.push("/login"), 3000);
      return;
    }

    // 세션 처리 로직
    const handleSession = (session: any, source: string) => {
      if (!isMounted || !session) return;
      
      console.log(`[Callback] Session confirmed via ${source}:`, session.user.email);
      setStatus("success");
      localStorage.setItem("isLoggedIn", "true");
      // 로그인 시점 기록 (30분 타임아웃 방지용)
      localStorage.setItem("loginTimestamp", Date.now().toString());
      
      // 즉시 이동 시도
      console.log("[Callback] Redirecting to home...");
      router.replace("/");
    };

    // 1. 초기 세션 즉시 확인
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        handleSession(session, "getSession");
      } else {
        setDebug("세션 대기 중...");
      }
    });

    // 2. 상태 변경 이벤트 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log(`[Callback] Auth event: ${event}`);
      setDebug(`이벤트: ${event}`);
      if (session) {
        handleSession(session, `onAuthStateChange(${event})`);
      }
    });

    // 3. 마지막 수단: 7초 후에도 로딩 중이면 강제 이동 (세션이 이미 설정되었을 확률 높음)
    const forcedRedirect = setTimeout(() => {
      if (isMounted && status === "loading") {
        console.log("[Callback] 7 seconds passed, trying forced redirection");
        // 세션이 정말 없는지 한 번 더 확인
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (isMounted) {
            if (session) {
              handleSession(session, "forcedRedirectWithSession");
            } else {
              console.log("[Callback] Forced redirect - sending to home anyway");
              router.replace("/");
            }
          }
        });
      }
    }, 7000);

    return () => {
      isMounted = false;
      clearTimeout(timeout);
      clearTimeout(forcedRedirect);
      subscription.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="flex flex-col items-center gap-6 p-8 bg-white rounded-2xl shadow-lg max-w-md w-full mx-4">
        {status === "loading" && (
          <>
            <div className="relative">
              <div className="w-16 h-16 border-4 border-gray-200 rounded-full"></div>
              <div className="absolute top-0 left-0 w-16 h-16 border-4 border-green-500 rounded-full animate-spin border-t-transparent"></div>
            </div>
            <div className="text-center">
              <p className="text-lg font-medium text-gray-800">인증을 완료하는 중입니다...</p>
              <p className="text-sm text-gray-500 mt-2">잠시만 기다려주세요</p>
              <p className="text-xs text-gray-400 mt-4">{debug}</p>
            </div>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-lg font-medium text-gray-800">로그인 성공!</p>
              <p className="text-sm text-gray-500 mt-2">메인 페이지로 이동합니다...</p>
            </div>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-lg font-medium text-gray-800">인증 오류</p>
              <p className="text-sm text-red-500 mt-2">{errorMessage}</p>
              <p className="text-sm text-gray-500 mt-2">로그인 페이지로 이동합니다...</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
