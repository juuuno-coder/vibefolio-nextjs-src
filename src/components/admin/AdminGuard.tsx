"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAdmin } from "@/hooks/useAdmin";
import { Loader2 } from "lucide-react";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAdmin, isLoading } = useAdmin();
  const [showContent, setShowContent] = useState(false);
  const [checkCount, setCheckCount] = useState(0);
  const maxChecks = 10; // 최대 10번 체크 (약 5초)
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // 로딩 중이면 대기
    if (isLoading) return;

    if (isAdmin) {
      // Context에서 이미 관리자로 판별됨
      setShowContent(true);
    } else {
      // Context가 관리자가 아니라고 할 때, 마지막으로 이메일 직접 체크 (Failsafe)
      const verifyFallback = async () => {
         const { data: { user } } = await import("@/lib/supabase/client").then(m => m.supabase.auth.getUser());
         const adminEmails = [
           "juuuno@naver.com", 
           "juuuno1116@gmail.com", 
           "designd@designd.co.kr",
           "designdlab@designdlab.co.kr",
           "admin@vibefolio.net"
         ];
         
         if (user?.email && adminEmails.includes(user.email)) {
            setShowContent(true);
         } else {
            // 진짜 관리자가 아님 -> 홈으로
            router.replace("/");
         }
      };
      
      verifyFallback();
    }
  }, [isAdmin, isLoading, router]);

  if (isLoading || !showContent) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 text-green-600 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">관리자 권한 확인 중...</p>
        {checkCount > 3 && (
          <p className="text-xs text-slate-400 mt-2">로그인 상태를 확인하고 있습니다...</p>
        )}
      </div>
    );
  }

  return <>{children}</>;
}

