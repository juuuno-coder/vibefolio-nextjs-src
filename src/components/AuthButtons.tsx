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
import { faUpload, faTableCellsLarge, faUser, faRightFromBracket } from "@fortawesome/free-solid-svg-icons";

export function AuthButtons() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      
      if (session?.user) {
        // Auth user_metadata에서 프로필 정보 가져오기
        setUserProfile({
          nickname: session.user.user_metadata?.nickname || session.user.email?.split('@')[0] || '사용자',
          profile_image_url: session.user.user_metadata?.profile_image_url || '/globe.svg',
        });
      }
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      
      if (session?.user) {
        setUserProfile({
          nickname: session.user.user_metadata?.nickname || session.user.email?.split('@')[0] || '사용자',
          profile_image_url: session.user.user_metadata?.profile_image_url || '/globe.svg',
        });
      } else {
        setUserProfile(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("userProfile");
    localStorage.removeItem("userId");
    router.push("/");
    router.refresh();
  };

  if (user) {
    return (
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
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600">
            <FontAwesomeIcon icon={faRightFromBracket} className="mr-2 h-4 w-4" />
            로그아웃
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
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
