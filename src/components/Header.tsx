// src/components/Header.tsx

"use client";

import React, { useState } from "react";
import { Menu, ChevronRight, Search, X, Home, Users, Instagram, Facebook, Twitter, Shield } from "lucide-react";
import { NotificationBell } from "./NotificationBell";
import {
  Button,
  Drawer,
  DrawerContent,
  DrawerTrigger,
  Input,
  Separator,
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/index"; 
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AuthButtons } from "./AuthButtons";
import { SOCIAL_LINKS } from "@/lib/constants";
import { useAuth } from "@/lib/auth/AuthContext";

import { VibeLogo } from "./Logo";

const menuItems = [
  { label: "발견", path: "/", icon: Home, newest: false },
  { label: "연결", path: "/recruit", icon: Users, newest: true },
];

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isAdmin } = useAuth();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  
  const handleSearch = (term: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (term) params.set("q", term);
    else params.delete("q");
    router.push(`/?${params.toString()}`);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch((e.target as HTMLInputElement).value);
    }
  };

  return (
    <>
      {/* 📱 모바일 헤더 (1024px 미만) */}
      <header className="sticky top-0 z-40 w-full lg:hidden border-b bg-white/80 backdrop-blur-md">
        <div className="flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-3">
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Menu className="w-6 h-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] p-0 flex flex-col bg-white">
                {/* 사이드바 상단 로고 영역 */}
                <div className="p-6 pb-2">
                  <VibeLogo className="h-7 w-auto mb-2" />
                  <p className="text-xs text-gray-400 font-medium">AI 창작자를 위한 영감의 공간</p>
                </div>

                <div className="flex-1 overflow-y-auto py-4">
                  <nav className="px-4 space-y-1">
                    {menuItems.map((item) => {
                      const isActive = pathname === item.path;
                      return (
                        <Link
                          key={item.path}
                          href={item.path}
                          onClick={() => setIsSheetOpen(false)}
                          className={`flex items-center justify-between p-3 rounded-xl transition-all ${
                            isActive ? "bg-green-50 text-green-600" : "text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <item.icon className={`w-5 h-5 ${isActive ? "text-green-500" : "text-gray-400"}`} />
                            <span className="font-semibold text-sm">{item.label}</span>
                            {item.newest && (
                              <span className="px-1.5 py-0.5 text-[10px] bg-cyan-100 text-cyan-600 rounded-md font-bold">NEW</span>
                            )}
                          </div>
                          <ChevronRight className="w-4 h-4 opacity-30" />
                        </Link>
                      );
                    })}
                  </nav>

                  <div className="mt-8 px-4">
                    <p className="px-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Account</p>
                    <div className="p-1 space-y-2">
                      <AuthButtons />
                    </div>
                  </div>

                  {isAdmin && (
                    <div className="mt-4 px-4">
                      <Link href="/admin" onClick={() => setIsSheetOpen(false)} className="flex items-center gap-3 p-3 text-indigo-600 font-semibold text-sm hover:bg-indigo-50 rounded-xl transition-colors">
                        <Shield className="w-5 h-5" />
                        관리자 센터
                      </Link>
                    </div>
                  )}
                </div>

                {/* 사이드바 하단 소셜/정보 */}
                <div className="p-6 border-t bg-gray-50/50">
                  <div className="flex items-center gap-4 mb-4">
                    <a href={SOCIAL_LINKS.INSTAGRAM} className="text-gray-400 hover:text-pink-500"><Instagram className="w-5 h-5" /></a>
                    <a href={SOCIAL_LINKS.FACEBOOK} className="text-gray-400 hover:text-blue-600"><Facebook className="w-5 h-5" /></a>
                    <a href={SOCIAL_LINKS.TWITTER} className="text-gray-400 hover:text-black"><Twitter className="w-5 h-5" /></a>
                  </div>
                  <p className="text-[10px] text-gray-400">© 2025 VIBEFOLIO. All rights reserved.</p>
                </div>
              </SheetContent>
            </Sheet>
            <Link href="/" className="hover:opacity-80 transition-opacity">
              <VibeLogo className="h-7 w-auto" />
            </Link>
          </div>

          <div className="flex items-center gap-1">
            <Drawer>
              <DrawerTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Search className="w-5 h-5" />
                </Button>
              </DrawerTrigger>
              <DrawerContent className="h-[200px] p-6">
                <div className="flex items-center gap-3 bg-gray-100 p-3 rounded-2xl">
                  <Search className="w-5 h-5 text-gray-400" />
                  <Input
                    placeholder="프로젝트 검색..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleSearch((e.target as HTMLInputElement).value);
                      }
                    }}
                    className="border-none bg-transparent focus-visible:ring-0 text-base p-0 h-auto"
                  />
                </div>
              </DrawerContent>
            </Drawer>
          </div>
        </div>
      </header>

      {/* 🖥 데스크탑 헤더 (1024px 이상) */}
      <header className="sticky top-0 z-40 w-full h-16 hidden lg:flex items-center justify-between px-8 border-b bg-white/80 backdrop-blur-md">
        <div className="flex items-center gap-10">
          <Link href="/" className="hover:opacity-80 transition-opacity">
            <VibeLogo className="h-9 w-auto" />
          </Link>
          <nav className="flex items-center gap-6">
            {menuItems.map((item) => {
              const isActive = pathname === item.path;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`relative px-1 py-2 text-[15px] font-bold transition-colors ${
                    isActive ? "text-green-600" : "text-gray-500 hover:text-black"
                  }`}
                >
                  {item.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-green-500 rounded-full" />
                  )}
                  {item.newest && (
                    <span className="absolute -top-1 -right-4 px-1 py-0.5 text-[9px] bg-accent text-white rounded-md font-black">NEW</span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3 ml-auto">
          {/* 검색 영역 */}
          <div className="flex items-center bg-[#F3F4F6] border border-transparent focus-within:border-green-500/20 px-4 py-2 rounded-full w-64 focus-within:bg-white focus-within:shadow-md focus-within:ring-2 focus-within:ring-green-500/10 transition-all duration-300">
            <Search className="w-4 h-4 text-gray-400 group-focus-within:text-green-500 transition-colors" />
            <Input
              placeholder="프로젝트 검색"
              onKeyDown={handleSearchKeyDown}
              className="border-none bg-transparent focus-visible:ring-0 text-sm p-0 h-auto ml-2 placeholder:text-gray-400 w-full text-gray-700 font-medium"
            />
          </div>
          
          <div className="flex items-center gap-2 min-w-fit">
            {isAuthenticated && (
              <>
                <NotificationBell />
                <div className="h-6 w-[1px] bg-gray-200 mx-1" />
              </>
            )}
            <AuthButtons />
          </div>
        </div>
      </header>
    </>
  );
}
