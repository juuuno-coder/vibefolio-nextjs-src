// src/components/Header.tsx

// 🚨 클라이언트 상호작용(Sheet, Drawer, onClick, useState 등)이 있으므로 필수!
"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faBars, faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
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
import { usePathname } from "next/navigation";
import { AuthButtons } from "./AuthButtons";

// 임시 FOOTER_CONTETNS 정의
const FOOTER_CONTETNS = [
  { icon: "faInstagram", label: "Instagram" },
  { icon: "faFacebook", label: "Facebook" },
];

// Vibe 로고 컴포넌트 (SVG)
const VibeLogo = ({ className = "h-8" }: { className?: string }) => (
  <svg viewBox="0 0 200 50" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* 심볼: Vibe Spark */}
    <path d="M25 5L15 25H25L15 45L35 25H25L35 5H25Z" fill="url(#spark_grad)" />
    {/* 텍스트: VIBEFOLIO (Syne/Outfit 스타일) */}
    <path d="M50 15H56L62 35H57L56 30H50L49 35H44L50 15ZM51 26H55L53 19L51 26Z" fill="currentColor" />
    <path d="M66 15H71V35H66V15Z" fill="currentColor" />
    <path d="M75 15H82C85 15 87 17 87 20C87 22 86 24 84 25C86 26 88 28 88 31C88 34 86 35 83 35H75V15ZM80 23H82C83 23 83 22 83 21C83 20 82 19 80 19H80V23ZM80 31H83C84 31 84 30 84 29C84 28 83 27 80 27H80V31Z" fill="currentColor" />
    <path d="M92 15H99V19H97V23H99V27H97V31H100V35H92V15Z" fill="currentColor" />
    <path d="M104 15H111V19H109V23H111V27H106V35H104V15Z" fill="currentColor" />
    <path d="M115 15H122C125 15 127 17 127 20V30C127 33 125 35 122 35H115V15ZM120 31H122C123 31 123 30 123 29V21C123 20 122 19 120 19H120V31Z" fill="currentColor" />
    <path d="M131 15H136V30H142V35H131V15Z" fill="currentColor" />
    <path d="M146 15H151V35H146V15Z" fill="currentColor" />
    <path d="M155 15H162C165 15 167 17 167 20V30C167 33 165 35 162 35H155V15ZM160 31H162C163 31 163 30 163 29V21C163 20 162 19 160 19H160V31Z" fill="currentColor" />
    
    <defs>
      <linearGradient id="spark_grad" x1="15" y1="5" x2="35" y2="45" gradientUnits="userSpaceOnUse">
        <stop stopColor="#6A5ACD" />
        <stop offset="1" stopColor="#00FFC2" />
      </linearGradient>
    </defs>
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

export function Header({
  onSetCategory = (value: string) => console.log("검색 요청:", value),
}: {
  onSetCategory?: (value: string) => void;
}) {
  const pathname = usePathname();
  // 로고 이미지 경로는 public 폴더 기준으로 변경하거나 Next/Image 사용을 고려해야 합니다.
  const LOGO_PATH = "/logo.svg";
  const ASSETS_PATH = "/logo.svg"; // assets 경로는 public 폴더로 이동하는 것이 좋습니다.

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const target = e.target as HTMLInputElement;
      onSetCategory(target.value.replace(/\s+/g, ""));
    }
  };

  const handleMobileSearchChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    onSetCategory(event.target.value);
  };

  return (
    <>
      {/* 모바일 헤더 */}
      <header className="sticky top-[44px] z-40 w-full flex flex-col items-center justify-between py-4 px-4 border-b simple-header bg-white xl:hidden">
        <div className="w-full h-full flex items-center justify-between">
          <div className="w-full flex items-center gap-4">
            <Sheet>
              <SheetTrigger>
                <FontAwesomeIcon icon={faBars} className="w-5 h-5" />
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
                        {item.dropdown && <FontAwesomeIcon icon={faChevronDown} className="w-3 h-3" />}
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
                      {FOOTER_CONTETNS.map((item, index) => (
                        <div className="flex items-center gap-4" key={index}>
                          <p className="text-sm">{item.label}</p>
                        </div>
                      ))}
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
                <FontAwesomeIcon icon={faMagnifyingGlass} className="w-5 h-5" />
              </DrawerTrigger>
              <DrawerContent className="h-full flex flex-col gap-6 px-6">
                <div className="flex items-center border px-3 rounded-full bg-neutral-50">
                  <FontAwesomeIcon icon={faMagnifyingGlass} className="w-4 h-4 text-neutral-400" />
                  <Input
                    placeholder="크리에이티브 프로젝트 검색"
                    onChange={handleMobileSearchChange}
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
                {item.dropdown && <FontAwesomeIcon icon={faChevronDown} className="w-3 h-3" />}
                {item.newest && (
                  <p className="text-xs text-[#05BCC6] font-medium">NEW</p>
                )}
              </Link>
            );
          })}
        </nav>
      </header>

      {/* 데스크탑 헤더 */}
      <header className="sticky top-[44px] z-40 w-full h-20 hidden xl:flex items-center justify-between px-10 border-b simple-header bg-white/80 blur-bg transition-colors">
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
                  {item.dropdown && <FontAwesomeIcon icon={faChevronDown} className="w-2.5 h-2.5 opacity-50" />}
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
            <FontAwesomeIcon icon={faMagnifyingGlass} className="w-4 h-4 text-neutral-400" />
            <Input
              placeholder="크리에이티브 프로젝트 검색"
              onKeyDown={handleSearchKeyDown}
              className="w-60 placeholder:text-neutral-400 outline-0 border-none focus-visible:ring-0"
            />
          </div>
          <AuthButtons />
        </div>
      </header>
    </>
  );
}
