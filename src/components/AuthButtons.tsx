"use client";

import React, { useEffect, useState } from "react";
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
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUpload, faTableCellsLarge, faUser, faRightFromBracket, faShieldHalved } from "@fortawesome/free-solid-svg-icons";
import { OnboardingModal } from "./OnboardingModal";

export function AuthButtons() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      
      if (session?.user) {
        const metadata = session.user.user_metadata;
        
        // 온보딩 완료 여부 확인
        if (!metadata?.onboarding_completed && !metadata?.nickname) {
          setShowOnboarding(true);
        }
        
        // Auth user_metadata에서 프로필 정보 가져오기
        setUserProfile({
          nickname: metadata?.nickname || session.user.email?.split('@')[0] || '사용자',
          profile_image_url: metadata?.profile_image_url || '/globe.svg',
        });

        // 관리자 여부 확인
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', session.user.id)
          .single();
        
        setIsAdmin((userData as any)?.role === 'admin');
      }
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      
      if (session?.user) {
        const metadata = session.user.user_metadata;
        
        // 온보딩 완료 여부 확인
        if (!metadata?.onboarding_completed && !metadata?.nickname) {
          setShowOnboarding(true);
        }
        
        setUserProfile({
          nickname: metadata?.nickname || session.user.email?.split('@')[0] || '사용자',
          profile_image_url: metadata?.profile_image_url || '/globe.svg',
        });

        // 관리자 여부 확인
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', session.user.id)
          .single();
        
        setIsAdmin((userData as any)?.role === 'admin');
      } else {
        setUserProfile(null);
        setIsAdmin(false);
        setShowOnboarding(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    try {
      // 1. UI 상태 즉시 초기화 (사용자에게 즉각적인 피드백)
      setUser(null);
      setUserProfile(null);
      setIsAdmin(false);

      // 2. 로컬 스토리지 정리
      localStorage.removeItem("isLoggedIn");
      localStorage.removeItem("userProfile");
      localStorage.removeItem("userId");

      // 3. Supabase 로그아웃 요청
      await supabase.auth.signOut();

      // 4. 메인 페이지로 이동 및 새로고침
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("로그아웃 중 오류 발생:", error);
      // 오류가 발생해도 강제로 클라이언트 상태는 초기화된 상태 유지
      router.push("/");
    }
  };

  const handleOnboardingComplete = () => {
    // 온보딩 완료 후 프로필 정보 새로고침
    const refreshProfile = async () => {
      const { data: { user: refreshedUser } } = await supabase.auth.getUser();
      if (refreshedUser) {
        setUserProfile({
          nickname: refreshedUser.user_metadata?.nickname || refreshedUser.email?.split('@')[0] || '사용자',
          profile_image_url: refreshedUser.user_metadata?.profile_image_url || '/globe.svg',
        });
      }
    };
    refreshProfile();
    router.refresh();
  };

  if (user) {
    return (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Avatar className="w-10 h-10 cursor-pointer border-2 border-gray-200 hover:border-[#4ACAD4] transition-colors">
              <AvatarImage src={userProfile?.profile_image_url} alt={userProfile?.nickname} className="object-cover" />
              <AvatarFallback className="bg-[#4ACAD4] text-white">
                <FontAwesomeIcon icon={faUser} className="w-4 h-4" />
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
              <FontAwesomeIcon icon={faUpload} className="mr-2 h-4 w-4" />
              프로젝트 등록하기
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/mypage/projects')} className="cursor-pointer">
              <FontAwesomeIcon icon={faTableCellsLarge} className="mr-2 h-4 w-4" />
              나의 프로젝트
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/mypage')} className="cursor-pointer">
              <FontAwesomeIcon icon={faUser} className="mr-2 h-4 w-4" />
              마이페이지
            </DropdownMenuItem>
            {isAdmin && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/admin')} className="cursor-pointer text-indigo-600">
                  <FontAwesomeIcon icon={faShieldHalved} className="mr-2 h-4 w-4" />
                  관리자 페이지
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600">
              <FontAwesomeIcon icon={faRightFromBracket} className="mr-2 h-4 w-4" />
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

  return (
    <>
      <Button asChild variant="ghost" className="text-black hover:bg-gray-100">
        <Link href="/login">
          <span>로그인</span>
        </Link>
      </Button>
      <Button asChild className="bg-[#4ACAD4] hover:bg-[#41a3aa] text-white">
        <Link href="/signup">
          <span>회원가입</span>
        </Link>
      </Button>
    </>
  );
}
