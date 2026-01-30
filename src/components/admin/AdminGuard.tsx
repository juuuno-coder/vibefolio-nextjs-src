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
    if (isLoading) {
      // 직접 URL 접속 시 인증 상태 로드 대기
      if (checkCount < maxChecks) {
        timerRef.current = setTimeout(() => {
          setCheckCount(prev => prev + 1);
        }, 500);
      }
      return;
    }

    // 로딩 완료 후 권한 확인
    if (isAdmin) {
      setShowContent(true);
    } else {
      // Manage backup auth check (double safety)
      // Sometimes isAdmin from context might be delayed or false due to RLS/profile sync issues.
      // We do a direct hard check for the master admin email here just in case.
      const checkHardcodedAdmin = async () => {
         const { data: { user } } = await import("@/lib/supabase/client").then(m => m.supabase.auth.getUser());
         const adminEmails = [
           "juuuno@naver.com", 
           "juuuno1116@gmail.com", 
           "admin@vibefolio.net"
         ];
         if (user?.email && adminEmails.includes(user.email)) {
            setShowContent(true);
            return true;
         }
         return false;
      };

      if (checkCount >= 2) {
         // Last resort check before kick
         checkHardcodedAdmin().then(isRealAdmin => {
             if (!isRealAdmin) router.replace("/");
         });
      } else {
         // 한 번 더 체크
         timerRef.current = setTimeout(() => {
           setCheckCount(prev => prev + 1);
         }, 500);
      }
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isAdmin, isLoading, router, checkCount]);

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

