"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";
import { User as UserIcon, Upload, LogOut, Shield } from 'lucide-react';
import { useAuth } from "@/lib/auth/AuthContext";

export function AuthButtons() {
  const router = useRouter();
  const { user, userProfile, signOut, isAuthenticated, isAdmin } = useAuth();
  const [mounted, setMounted] = useState(false);

  // 하이드레이션 불일치 방지
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // 서버 사이드 렌더링 시점에는 레이아웃 깨짐 방지를 위해 버튼 영역 확보
    return (
      <div className="flex items-center gap-2 opacity-0">
        <Button variant="ghost" size="sm" className="rounded-full">로그인</Button>
        <Button size="sm" className="rounded-full">회원가입</Button>
      </div>
    );
  }

  // 1. 로그인 성공 상태 확인 (로딩 여부 상관없이 데이터가 있으면 즉시 표시)
  if (isAuthenticated && user) {
    const displayName = userProfile?.username || user.email?.split('@')[0] || "User";
    const displayImage = userProfile?.profile_image_url || "/globe.svg";

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Avatar className="w-9 h-9 cursor-pointer border-2 border-white shadow-sm hover:ring-2 hover:ring-green-500/20 transition-all">
            <AvatarImage src={displayImage} alt={displayName} className="object-cover" />
            <AvatarFallback className="bg-gray-100">
              <UserIcon className="w-4 h-4 text-gray-400" />
            </AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 mt-2 rounded-xl border-gray-100 shadow-lg p-2">
          <div className="px-3 py-2">
            <p className="text-sm font-bold text-gray-900 truncate">{displayName}</p>
            <p className="text-[11px] text-gray-500 truncate">{user.email}</p>
          </div>
          <DropdownMenuSeparator className="bg-gray-50" />
          <DropdownMenuItem onClick={() => router.push('/project/upload')} className="cursor-pointer rounded-lg">
            <Upload className="mr-2 h-4 w-4 text-gray-400" />
            <span>프로젝트 등록</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push('/mypage')} className="cursor-pointer rounded-lg">
            <UserIcon className="mr-2 h-4 w-4 text-gray-400" />
            <span>마이페이지</span>
          </DropdownMenuItem>
          {isAdmin && (
            <>
              <DropdownMenuSeparator className="bg-gray-50" />
              <DropdownMenuItem onClick={() => router.push('/admin')} className="cursor-pointer text-indigo-600 bg-indigo-50 rounded-lg">
                <Shield className="mr-2 h-4 w-4" />
                <span>관리자 센터</span>
              </DropdownMenuItem>
            </>
          )}
          <DropdownMenuSeparator className="bg-gray-50" />
          <DropdownMenuItem onClick={signOut} className="cursor-pointer text-red-600 hover:bg-red-50 rounded-lg">
            <LogOut className="mr-2 h-4 w-4" />
            <span>로그아웃</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // 2. 그 외 모든 경우 (로딩 중이든 에러든 비로그인이든) -> 무조건 버튼 표시
  return (
    <div className="flex items-center gap-2">
      <Button asChild variant="ghost" className="text-gray-600 hover:bg-gray-100 rounded-full px-4 text-sm font-semibold">
        <Link href="/login">로그인</Link>
      </Button>
      <Button asChild className="bg-green-600 hover:bg-green-700 text-white rounded-full px-5 text-sm font-bold shadow-sm border-none">
        <Link href="/signup">회원가입</Link>
      </Button>
    </div>
  );
}
