"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  RefreshCw,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useAdmin } from "@/hooks/useAdmin";

export default function AdminUsersPage() {
  const router = useRouter();
  const { isAdmin, isLoading: adminLoading } = useAdmin();

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      alert("관리자 권한이 필요합니다.");
      router.push("/");
      return;
    }
  }, [isAdmin, adminLoading, router]);

  if (adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin" size={32} />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-12 flex flex-col items-center justify-center text-center px-4">
      <div className="bg-white p-10 rounded-3xl shadow-xl max-w-lg w-full">
        <div className="bg-yellow-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
          <RefreshCw className="w-8 h-8 text-yellow-600 animate-spin-slow" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">사용자 관리 시스템 업데이트 중</h1>
        <p className="text-gray-500 mb-8 leading-relaxed">
          더 안전한 보안 강화를 위해 회원 데이터베이스 구조를 개선하고 있습니다.<br/>
          (기존 users 테이블 제거 및 Supabase Auth 통합)<br/>
          잠시만 기다려주시면 더 멋진 모습으로 돌아오겠습니다! 🚧
        </p>
        <Link href="/admin">
          <Button size="lg" className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-xl h-12">
            관리자 홈으로 돌아가기
          </Button>
        </Link>
      </div>
    </div>
  );
}
