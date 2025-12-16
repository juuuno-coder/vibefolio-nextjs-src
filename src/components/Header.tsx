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
                  <img src={LOGO_PATH} alt="Vibefolio Logo" className="w-24" />
                  <div className="flex flex-col">
                    <p className="text-sm">
                      회원가입 또는 로그인을 통해 AI 창작자의
                    </p>
                    <p className="text-sm">
                      크리에이티브를 발견하고 수집해보세요.
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
            <Link href="/" className="flex items-center">
              <img src={ASSETS_PATH} alt="@LOGO" className="h-10" />
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Button asChild variant={"outline"}>
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
                    placeholder="230,000개 이상의 크리에이티브 검색"
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
      <header className="sticky top-[44px] z-40 w-full h-20 hidden xl:flex items-center justify-between px-8 border-b simple-header bg-white">
        <div className="h-full flex items-center gap-10">
          <Link href="/" className="flex items-center">
            <img src={ASSETS_PATH} alt="@LOGO" className="w-[200px] h-auto" />
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
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center border px-3 rounded-full bg-neutral-50">
            <FontAwesomeIcon icon={faMagnifyingGlass} className="w-4 h-4 text-neutral-400" />
            <Input
              placeholder="230,000개 이상의 크리에이티브 검색"
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
