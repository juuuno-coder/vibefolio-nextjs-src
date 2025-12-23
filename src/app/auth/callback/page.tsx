"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { AuthChangeEvent, Session } from "@supabase/supabase-js";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const processedRef = useRef(false);

  useEffect(() => {
    // 이미 처리했으면 스킵
    if (processedRef.current) return;
    
    let isMounted = true;
    processedRef.current = true; // Mark as processing
    
    // 타임아웃 설정 - 15초로 연장
    const timeout = setTimeout(() => {
      if (isMounted && status === "loading") {
        console.error("Auth callback 타임아웃");
        setStatus("error");
        setErrorMessage("인증 처리 시간이 초과되었습니다. 다시 로그인해주세요.");
        
        // 3초 후 로그인 페이지로 리다이렉트
        setTimeout(() => {
          if (isMounted) {
            router.push("/login?error=auth_timeout");
          }
        }, 3000);
      }
    }, 15000);

    const handleAuth = async () => {
      try {
        console.log("Auth callback handling started..."); // Debug log

        // URL 해시에서 인증 정보 확인 (OAuth 콜백 - Implicit)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");

        if (accessToken && refreshToken) {
          console.log("Access token found in hash");
          // OAuth 토큰으로 세션 설정
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) throw error;

          if (data.session && isMounted) {
            setStatus("success");
            router.push("/");
            return;
          }
        }

        // URL 쿼리에서 code 확인 (PKCE 플로우)
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get("code");
        const errorParam = urlParams.get("error");
        const errorDescription = urlParams.get("error_description");

        if (errorParam) {
          throw new Error(errorDescription || errorParam);
        }

        if (code) {
          console.log("Auth code found, attempting exchange...");
          
          // 1. 먼저 세션이 이미 있는지 확인 (Supabase가 자동 처리했을 수 있음)
          const { data: { session: existingSession }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) throw sessionError;

          if (existingSession) {
            console.log("Session already exists");
            if (isMounted) {
               setStatus("success");
               router.push("/");
            }
            return;
          }

          // 2. 세션이 없으면 명시적으로 코드 교환 시도
          const { data: exchangeData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          
          if (exchangeError) {
             // 만약 코드가 이미 사용되었다면(invalid_grant), 그리고 세션이 존재한다면 성공으로 처리
             // 하지만 여기서 세션 체크는 위에서 했음.
             // 단, Race condition으로 인해 그 사이 세션이 생겼을 수 있음.
             const { data: { session: retrySession } } = await supabase.auth.getSession();
             if (retrySession) {
                console.log("Exchange failed but session found (Race condition solved)");
                if (isMounted) {
                  setStatus("success");
                  router.push("/");
                }
                return;
             }
             throw exchangeError;
          }

          if (exchangeData.session) {
             console.log("Code exchange successful");
             if (isMounted) {
                setStatus("success");
                router.push("/");
             }
             return;
          }
        }

        // 토큰도 코드도 없으면 기존 세션 확인 (마지막 보루)
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;

        if (session && isMounted) {
          setStatus("success");
          router.push("/");
        } else if (isMounted) {
          // 세션도 없고 인증 파라미터도 없는 경우
          console.log("No session or auth params found");
          setStatus("error");
          setErrorMessage("인증 정보를 찾을 수 없습니다.");
          
          setTimeout(() => {
            if (isMounted) router.push("/login");
          }, 2000);
        }
      } catch (error: any) {
        console.error("Auth callback error:", error);
        
        if (isMounted) {
          setStatus("error");
          setErrorMessage(error.message || "인증 처리 중 오류가 발생했습니다.");
          
          setTimeout(() => {
            if (isMounted) router.push("/login?error=auth_callback_failed");
          }, 3000);
        }
      }
    };

    handleAuth();

    // Cleanup
    return () => {
      isMounted = false;
      clearTimeout(timeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="flex flex-col items-center gap-6 p-8 bg-white rounded-2xl shadow-lg max-w-md w-full mx-4">
        {status === "loading" && (
          <>
            <div className="relative">
              <div className="w-16 h-16 border-4 border-gray-200 rounded-full"></div>
              <div className="absolute top-0 left-0 w-16 h-16 border-4 border-[#4ACAD4] rounded-full animate-spin border-t-transparent"></div>
            </div>
            <div className="text-center">
              <p className="text-lg font-medium text-gray-800">인증을 완료하는 중입니다...</p>
              <p className="text-sm text-gray-500 mt-2">잠시만 기다려주세요</p>
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
