// src/components/Header.tsx

// 🚨 클라이언트 상호작용(Sheet, Drawer, onClick, useState 등)이 있으므로 필수!
"use client";

import { Menu, ChevronDown, Search } from "lucide-react";
import { NotificationBell } from "./NotificationBell";
import { ThemeToggle } from "./ThemeToggle";
// shadcn/ui 컴포넌트는 프로젝트 구조에 따라 경로를 조정해야 합니다.
// App Router에서는 일반적으로 @/components/ui/XXX 형태로 사용합니다.
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
import React from "react";

// Vibe 로고 컴포넌트 (SVG: 말풍선 타입 & 볼드 서체, Green Theme)
const VibeLogo = ({ className = "h-8" }: { className?: string }) => (
  <svg viewBox="0 0 250 50" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="vibe_gradient" x1="0" y1="0" x2="50" y2="50" gradientUnits="userSpaceOnUse">
        <stop stopColor="#16A34A" /> 
        <stop offset="1" stopColor="#84CC16" />
      </linearGradient>
    </defs>
    
    {/* 심볼: 모던 말풍선 (크기: 기존 대비 1.15배 확대) */}
    <g transform="translate(0, -3) scale(1.15)">
      <path 
        d="M10 5H40C45.5228 5 50 9.47715 50 15V29C50 34.5228 45.5228 39 40 39H30L20 46V39H10C4.47715 39 0 34.5228 0 29V15C0 9.47715 4.47715 5 10 5Z" 
        fill="url(#vibe_gradient)" 
      />
      {/* 심볼 내부: V Mark */}
      <path d="M16 16L25 30L34 16" stroke="white" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
    </g>
    
    {/* 텍스트: VIBEFOLIO (간격 조정 x=70) */}
    <text x="70" y="35" fontFamily="'Inter', -apple-system, BlinkMacSystemFont, sans-serif" fontWeight="900" fontSize="28" fill="#111827" letterSpacing="-0.5">
      VIBE<tspan fontWeight="400" dx="0">FOLIO</tspan>
    </text>
  </svg>
);

const menu = [
  { label: "발견", newest: false, dropdown: false, path: "/" },
  {
    label: "연결",
    newest: true,
    dropdown: false,
    path: "/recruit",
  },
];

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuth();
  
  const handleSearch = (term: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (term) {
      params.set("q", term);
    } else {
      params.delete("q");
    }
    router.push(`/?${params.toString()}`);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const target = e.target as HTMLInputElement;
      handleSearch(target.value);
    }
  };

  const handleMobileSearchChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
  };

  const handleMobileSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
       const target = e.target as HTMLInputElement;
       handleSearch(target.value);
     }
  };

  return (
    <>
      {/* 모바일 헤더 (1024px 미만) */}
      <header className="sticky top-0 z-40 w-full flex flex-col items-center justify-between py-4 px-4 border-b simple-header bg-white lg:hidden">
        <div className="w-full h-full flex items-center justify-between">
          <div className="w-full flex items-center gap-4">
            <Sheet>
              <SheetTrigger>
                <Menu className="w-5 h-5" />
              </SheetTrigger>
              <SheetContent
                side="left"
                className="flex flex-col px-8 pb-8 gap-8 overflow-y-scroll"
              >
                <div className="flex flex-col gap-6">
                  {menu.map((item, index) => {
                    const isActive = pathname === item.path;
                    return (
                      <Link
                        href={item.path}
                        key={index}
                        className={`h-full flex items-center gap-1 font-medium`}
                      >
                        <p
                          className={`text-[15px] ${isActive && "mt-0.5 border-b-2 border-black"}`}
                        >
                          {item.label}
                        </p>
                        {item.dropdown && <ChevronDown className="w-3 h-3" />}
                        {item.newest && (
                          <p className="text-xs text-[#05BCC6] font-medium">
                            NEW
                          </p>
                        )}
                      </Link>
                    );
                  })}
                </div>
                
                <div className="flex flex-col gap-6 mt-16">
                  {/* 모바일 사이드바 로고 */}
                  <VibeLogo className="w-28 text-foreground" />
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      AI 창작자를 위한 영감의 공간
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 auth-buttons-mobile">
                    <AuthButtons />
                  </div>
                </div>
                <Separator />
                <Separator />
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col gap-6">
                      <div className="flex flex-col gap-4">
                        <a href={SOCIAL_LINKS.INSTAGRAM} target="_blank" rel="noopener noreferrer" className="text-sm">Instagram</a>
                        <a href={SOCIAL_LINKS.FACEBOOK} target="_blank" rel="noopener noreferrer" className="text-sm">Facebook</a>
                        <a href={SOCIAL_LINKS.TWITTER} target="_blank" rel="noopener noreferrer" className="text-sm">Twitter</a>
                      </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
            <Link href="/" className="flex items-center text-foreground hover:opacity-80 transition-opacity">
              <VibeLogo className="h-8 w-auto" />
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Button asChild className="btn-primary rounded-full px-6 text-sm">
              <Link href="/login">
                <span>로그인</span>
              </Link>
            </Button>
            <Drawer>
              <DrawerTrigger>
                <Search className="w-5 h-5" />
              </DrawerTrigger>
              <DrawerContent className="h-full flex flex-col gap-6 px-6">
                  <div className="flex items-center border px-3 rounded-full bg-neutral-50">
                  <Search className="w-4 h-4 text-neutral-400" />
                  <Input
                    placeholder="크리에이티브 프로젝트 검색"
                    onChange={handleMobileSearchChange}
                    onKeyDown={handleMobileSearchKeyDown}
                    className="w-full placeholder:text-neutral-400 outline-0 border-none focus-visible:ring-0"
                  />
                </div>
              </DrawerContent>
            </Drawer>
          </div>
        </div>
        <nav className="w-full h-16 flex items-center gap-6">
          {menu.map((item, index) => {
            const isActive = pathname === item.path;
            return (
              <Link
                href={item.path}
                key={index}
                className={`h-full flex items-center gap-1 font-medium ${isActive && "h-[calc(100%-2px)] border-b-2 border-black"}`}
              >
                <p className={`text-base font-medium ${isActive && "mt-0.5"}`}>
                  {item.label}
                </p>
                {item.dropdown && <ChevronDown className="w-3 h-3" />}
                {item.newest && (
                  <p className="text-xs text-[#05BCC6] font-medium">NEW</p>
                )}
              </Link>
            );
          })}
        </nav>
      </header>

      {/* 데스크탑 헤더 (1024px 이상) */}
      <header className="sticky top-0 z-40 w-full h-16 hidden lg:flex items-center justify-between px-10 border-b simple-header bg-white transition-colors">
        <div className="h-full flex items-center gap-10">
          <Link href="/" className="flex items-center text-foreground hover:text-primary transition-colors">
            <VibeLogo className="h-9 w-auto" />
          </Link>
          <nav className="h-full flex items-center gap-8">
            {menu.map((item, index) => {
              const isActive = pathname === item.path;
              return (
                <Link
                  href={item.path}
                  key={index}
                  className={`h-full flex items-center gap-1 font-medium ${isActive && "h-[calc(100%-2px)] border-b-2 border-black"}`}
                >
                  <p className={`text-[15px] font-medium tracking-wide ${isActive && "mt-0.5 text-primary"}`}>
                    {item.label}
                  </p>
                  {item.dropdown && <ChevronDown className="w-2.5 h-2.5 opacity-50" />}
                  {item.newest && (
                    <span className="text-[10px] bg-accent text-accent-foreground px-1.5 py-0.5 rounded-full font-bold ml-1">NEW</span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center border px-3 rounded-full bg-neutral-50">
            <Search className="w-4 h-4 text-neutral-400" />
            <Input
              placeholder="크리에이티브 프로젝트 검색"
              onKeyDown={handleSearchKeyDown}
              className="w-60 placeholder:text-neutral-400 outline-0 border-none focus-visible:ring-0"
            />
          </div>
          {/* <ThemeToggle /> - 기능 고도화 전까지 다크모드 숨김 */}
          {isAuthenticated && <NotificationBell />}
          <AuthButtons />
        </div>
      </header>
    </>
  );
}
