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

  const [deniedEmail, setDeniedEmail] = useState<string | null>(null);

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
            // 관리자가 아님 -> 거부 화면 표시 (디버깅용 이메일 노출)
            setDeniedEmail(user?.email || "알 수 없음");
            // router.replace("/"); // 기존 리다이렉트 제거
         }
      };
      
      verifyFallback();
    }
  }, [isAdmin, isLoading, router]);

  if (deniedEmail) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <h1 className="text-2xl font-bold text-red-600">접근 거부됨</h1>
        <p className="text-slate-600">현재 계정은 관리자 권한이 없습니다.</p>
        <div className="bg-white p-4 rounded border">
            <p className="font-mono text-sm">Email: {deniedEmail}</p>
        </div>
        <button 
           onClick={() => router.push('/')}
           className="px-4 py-2 bg-slate-900 text-white rounded hover:bg-slate-700"
        >
            홈으로 돌아가기
        </button>
      </div>
    );
  }

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

