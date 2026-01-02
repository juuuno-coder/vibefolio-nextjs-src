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
import { User, Upload, LogOut, Shield } from 'lucide-react';
import { OnboardingModal } from "./OnboardingModal";
import { useAuth } from "@/lib/auth/AuthContext";

export function AuthButtons() {
  const router = useRouter();
  const { user, userProfile, loading, signOut, isAuthenticated, isAdmin } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [longLoading, setLongLoading] = useState(false);

  // 클라이언트 마운트 상태 추적
  useEffect(() => {
    setMounted(true);
  }, []);

  // 무한 로딩 방지 안전장치 (3초)
  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        if (loading) {
          console.warn("[AuthButtons] Loading took too long, forcing UI display");
          setLongLoading(true);
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  // 온보딩 상태 확인
  useEffect(() => {
    if (!mounted || !user) {
      setShowOnboarding(false);
      return;
    }

    // 온보딩 스킵 플래그 확인
    const skippedOnboarding = localStorage.getItem(`onboarding_skipped_${user.id}`);
    
    // DB 닉네임이 없으면 온보딩 대상 (metadata 체크 최소화, DB 기준)
    if (!userProfile?.nickname && !skippedOnboarding) {
      // setShowOnboarding(true); // 잠시 비활성화 (필요 시 주석 해제)
    }
  }, [user, userProfile, mounted]);

  const handleLogout = async () => {
    await signOut();
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    router.refresh();
  };

  // 로딩 중이거나 마운트되지 않았을 때 스켈레톤 표시 (3초 이후에는 강제 표시)
  if (!mounted || (loading && !longLoading)) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse border border-gray-300" />
      </div>
    );
  }

  // 로그인된 상태
  if (isAuthenticated && user) {
    return (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Avatar className="w-10 h-10 cursor-pointer border-2 border-gray-200 hover:border-primary transition-colors">
              {/* DB 프로필 이미지 우선, 없으면 기본 아이콘 */}
              <AvatarImage 
                src={userProfile?.profile_image_url || "/globe.svg"} 
                alt={userProfile?.nickname || "User"} 
                className="object-cover" 
              />
              <AvatarFallback className="bg-primary text-white">
                <User className="w-4 h-4" />
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">
                {/* DB 닉네임 우선, 없으면 이메일 앞부분 */}
                {userProfile?.nickname || user.email?.split('@')[0]}
              </p>
              <p className="text-xs text-gray-500">{user.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/project/upload')} className="cursor-pointer">
              <Upload className="mr-2 h-4 w-4" />
              프로젝트 등록하기
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/mypage')} className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              마이페이지
            </DropdownMenuItem>
            {isAdmin && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/admin')} className="cursor-pointer text-indigo-600">
                  <Shield className="mr-2 h-4 w-4" />
                  관리자 페이지
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              로그아웃
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <OnboardingModal
          open={showOnboarding}
          onOpenChange={setShowOnboarding}
          userId={user.id}
          userEmail={user.email || ''}
          onComplete={handleOnboardingComplete}
        />
      </>
    );
  }

  // 로그인되지 않은 상태
  return (
    <>
      <Button asChild variant="ghost" className="text-black hover:bg-gray-100 rounded-full px-5">
        <Link href="/login">
          <span>로그인</span>
        </Link>
      </Button>
      <Button asChild className="btn-primary rounded-full px-6">
        <Link href="/signup">
          <span>회원가입</span>
        </Link>
      </Button>
    </>
  );
}
