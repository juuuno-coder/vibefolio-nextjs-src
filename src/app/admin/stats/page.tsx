"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useAdmin } from "@/hooks/useAdmin";

export default function AdminStatsPage() {
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
        <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
          <TrendingUp className="w-8 h-8 text-blue-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">통계 시스템 점검 중</h1>
        <p className="text-gray-500 mb-8 leading-relaxed">
          정확한 데이터 집계를 위해 통계 시스템을 재구성하고 있습니다.<br/>
          (users 테이블 제거에 따른 집계 로직 변경)<br/>
          빠른 시일 내에 다시 제공해 드리겠습니다. 📈
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
