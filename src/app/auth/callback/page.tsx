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
    
    // 타임아웃 설정 - 30초로 연장
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
    }, 30000);

    // onAuthStateChange로 세션 변경 감지 (가장 확실한 방법)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, session: Session | null) => {
        if (!isMounted) return;
        
        console.log("Auth Callback - Auth state changed:", event);
        
        if (event === "SIGNED_IN" && session) {
          console.log("Auth Callback - SIGNED_IN event received", session.user.email);
          setStatus("success");
          // 세션이 성공적으로 맺어졌으므로 메인으로 이동
          setTimeout(() => {
             if(isMounted) router.replace("/"); 
          }, 500); 
        } else if (event === "PASSWORD_RECOVERY") {
          router.replace("/reset-password");
        }
      }
    );

    const handleAuth = async () => {
      try {
        console.log("Auth callback processing started...");

        // URL 분석
        const searchParams = new URLSearchParams(window.location.search);
        const code = searchParams.get("code");
        const errorParam = searchParams.get("error");
        const errorDesc = searchParams.get("error_description");

        if (errorParam) {
           throw new Error(errorDesc || errorParam);
        }

        // Supabase Client는 브라우저 환경에서 URL의 code를 자동으로 감지하고 교환을 시도합니다.
        // 따라서 수동으로 exchangeCodeForSession을 호출하면 'code already used' 에러가 발생하거나 충돌할 수 있습니다.
        // 우리는 getSession을 주기적으로 확인하여 교환이 완료되었는지만 체크합니다.

        let attempts = 0;
        const maxAttempts = 10; // 5초 동안 확인

        const checkSession = async () => {
           const { data: { session }, error } = await supabase.auth.getSession();
           
           if (error) {
             console.warn("Session check error:", error.message);
             // 에러가 있어도 바로 실패하지 않고 재시도 (일시적일 수 있음)
           }

           if (session) {
             console.log("Session found via getSession");
             if (isMounted) {
               setStatus("success");
               router.replace("/");
             }
             return true; 
           }
           return false;
        };

        // 1. 즉시 확인
        if (await checkSession()) return;

        // 2. 코드가 있다면 폴링으로 확인 (자동 교환 기다림)
        if (code) {
           console.log("Code detected, polling for session...");
           const interval = setInterval(async () => {
              attempts++;
              const found = await checkSession();
              if (found || attempts >= maxAttempts || !isMounted) {
                 clearInterval(interval);
                 if (!found && attempts >= maxAttempts) {
                    console.warn("Session polling timed out, but strictly waiting for onAuthStateChange or global timeout now.");
                 }
              }
           }, 500);
        } else {
           // 코드가 없다면 이미 세션이 있거나(위에서 체크됨), 잘못된 접근
           // 해시 파라미터 체크 (Implicit)
           const hashParams = new URLSearchParams(window.location.hash.substring(1));
           const accessToken = hashParams.get("access_token");
           const refreshToken = hashParams.get("refresh_token");

           if (accessToken && refreshToken) {
              console.log("Implicit tokens found");
              const { data, error } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              });
              if (error) throw error;
              if (data.session) {
                 setStatus("success");
                 router.replace("/");
              }
           } else {
              // 아무것도 없음
              console.log("No code or token found in URL");
              // 혹시 모르니 잠시 대기 후 리다이렉트
              setTimeout(async () => {
                 if (await checkSession()) return;
                 if (isMounted) {
                    setStatus("error");
                    setErrorMessage("인증 정보를 찾을 수 없습니다.");
                    setTimeout(() => router.push("/login"), 2000);
                 }
              }, 2000);
           }
        }
        
      } catch (error: any) {
        console.error("Auth process error:", error);
        if (isMounted) {
          // 치명적 에러만 표시, 나머지는 타임아웃이나 리스너에 맡김
          setErrorMessage(error.message || "로그인 처리 중 오류 발생");
        }
      }
    };

    handleAuth();

    // Cleanup
    return () => {
      isMounted = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
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
