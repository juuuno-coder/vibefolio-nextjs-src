"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [debug, setDebug] = useState<string>("시작...");

  const processedRef = useRef(false);

  useEffect(() => {
    if (processedRef.current) return;
    processedRef.current = true;

    let isMounted = true;

    // 타임아웃 20초
    const timeout = setTimeout(() => {
      if (isMounted && status === "loading") {
        setStatus("error");
        setErrorMessage("인증 시간이 초과되었습니다.");
        setTimeout(() => router.push("/login"), 2000);
      }
    }, 20000);

    // URL에 에러가 있는지 먼저 확인
    const urlParams = new URLSearchParams(window.location.search);
    const urlError = urlParams.get("error");
    const urlErrorDesc = urlParams.get("error_description");
    
    if (urlError) {
      setStatus("error");
      setErrorMessage(urlErrorDesc || urlError);
      setTimeout(() => router.push("/login"), 2000);
      return;
    }

    setDebug("onAuthStateChange 리스너 등록 중...");

    // Supabase는 페이지 로드 시 URL에서 code를 자동으로 감지하고 세션을 교환합니다.
    // 우리는 단순히 onAuthStateChange를 통해 그 결과를 기다리면 됩니다.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: string, session: any) => {
        if (!isMounted) return;

        setDebug(`이벤트: ${event}`);
        console.log("Auth Callback - Event:", event, session?.user?.email);

        if (event === "SIGNED_IN" && session) {
          setStatus("success");
          // 약간의 딜레이를 주어 상태 업데이트가 완료되도록 함
          setTimeout(() => {
            if (isMounted) router.replace("/");
          }, 300);
        } else if (event === "TOKEN_REFRESHED" && session) {
          // 토큰 갱신도 로그인 성공으로 처리
          setStatus("success");
          setTimeout(() => {
            if (isMounted) router.replace("/");
          }, 300);
        } else if (event === "SIGNED_OUT") {
          setStatus("error");
          setErrorMessage("로그아웃 상태입니다.");
          setTimeout(() => router.push("/login"), 2000);
        }
      }
    );

    // 초기 세션 확인 (이미 로그인되어 있을 수 있음)
    const checkInitialSession = async () => {
      setDebug("초기 세션 확인 중...");
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("Initial session check error:", error);
        setDebug(`에러: ${error.message}`);
        return;
      }

      if (session) {
        setDebug("기존 세션 발견!");
        console.log("Existing session found:", session.user.email);
        setStatus("success");
        setTimeout(() => {
          if (isMounted) router.replace("/");
        }, 300);
      } else {
        setDebug("세션 없음, 자동 교환 대기중...");
        console.log("No session yet, waiting for auto exchange...");
      }
    };

    // 약간의 딜레이 후 초기 세션 확인 (Supabase 자동 처리 시간 허용)
    setTimeout(checkInitialSession, 500);

    return () => {
      isMounted = false;
      clearTimeout(timeout);
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
