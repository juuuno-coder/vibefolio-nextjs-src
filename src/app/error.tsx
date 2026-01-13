"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCcw, Home } from "lucide-react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 에러 로깅 서비스로 전송 가능
    console.error("Global Error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white text-center px-4">
      <div className="space-y-6 max-w-lg">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-10 h-10 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        <h2 className="text-3xl font-bold text-slate-900">
          오류가 발생했습니다
        </h2>
        <p className="text-slate-500 text-lg">
          죄송합니다. 예상치 못한 오류가 발생하여<br className="hidden md:block" />
          페이지를 불러올 수 없습니다.
        </p>

        <div className="bg-slate-50 p-4 rounded-xl text-left overflow-auto max-h-32 text-sm text-slate-500 font-mono mb-4 border border-slate-100">
          {error.message || "Unknown error occurred"}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button 
            onClick={() => {
              if (error.message.toLowerCase().includes("loading chunk") || error.message.toLowerCase().includes("failed")) {
                window.location.reload();
              } else {
                reset();
              }
            }}
            className="h-12 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white shadow-lg"
          >
            <RefreshCcw size={18} className="mr-2" />
            다시 시도하기
          </Button>
          <Link href="/">
            <Button variant="outline" className="h-12 px-6 rounded-xl border-slate-200">
              <Home size={18} className="mr-2" />
              메인으로 이동
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
