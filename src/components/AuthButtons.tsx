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
  const [forceShow, setForceShow] = useState(false);

  // 클라이언트 마운트 상태 추적 (하이드레이션 안전)
  useEffect(() => {
    setMounted(true);
  }, []);

  // 로딩이 너무 길어지면 강제로 버튼 표시 (안전장치)
  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        setForceShow(true);
      }, 3000); // 3초 타임아웃
      return () => clearTimeout(timer);
    }
  }, [loading]);

  // 온보딩 상태 확인 - mounted 상태에서만 localStorage 접근
  useEffect(() => {
    if (!mounted || !user) {
      setShowOnboarding(false);
      return;
    }

    // 온보딩 확인 - 로컬 스토리지의 건너뛰기 플래그도 확인
    const metadata = user.user_metadata;
    const skippedOnboarding = localStorage.getItem(`onboarding_skipped_${user.id}`);
    
    if (!metadata?.onboarding_completed && !metadata?.nickname && !skippedOnboarding) {
      setShowOnboarding(true);
    } else {
      setShowOnboarding(false);
    }
  }, [user, mounted]);

  const handleLogout = async () => {
    await signOut();
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    router.refresh();
  };

  // 로딩 중이거나 마운트되지 않았을 때 스켈레톤 표시 (forceShow가 아닐 때만)
  if (!mounted || (loading && !forceShow)) {
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
              <AvatarImage 
                src={userProfile?.profile_image_url} 
                alt={userProfile?.nickname} 
                className="object-cover" 
              />
              <AvatarFallback className="bg-primary text-white">
                <User className="w-4 h-4" />
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{userProfile?.nickname}</p>
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

        {/* 온보딩 모달 */}
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
