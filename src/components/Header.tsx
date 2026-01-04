// src/components/Header.tsx
"use client";

import { VibeLogo } from "./Logo";

import { useEffect, useState } from "react";
import { ChevronDown, Menu, Search, User as UserIcon } from "lucide-react";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuPortal,
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/index";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

const menu = [
  { label: "발견", newest: false, dropdown: false, underline: true, path: "/" },
  {
    label: "연결",
    newest: true,
    dropdown: false,
    underline: false,
    path: "/recruit",
  },
];

interface UserProfile {
  username: string;
  avatar_url: string;
  role: string;
}

export function Header({
  onSetCategory = (value: string) => console.log("검색 요청:", value),
}: {
  onSetCategory?: (value: string) => void;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    async function initializeAuth() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted) return;

        if (session?.user) {
          const meta = session.user.user_metadata || {};
          setUser(session.user);
          setUserProfile({
            username: meta.user_name || session.user.email?.split("@")[0] || "User",
            avatar_url: meta.avatar_url || "",
            role: session.user.app_metadata?.role || "user",
          });
        }
      } catch (error) {
        console.error("Auth initialization failed:", error);
      }
    }

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      
      setUser(session?.user ?? null);
      if (session?.user) {
        const meta = session.user.user_metadata || {};
        setUserProfile({
          username: meta.user_name || session.user.email?.split("@")[0] || "User",
          avatar_url: meta.avatar_url || "",
          role: session.user.app_metadata?.role || "user",
        });
      } else {
        setUserProfile(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    router.push("/");
  };

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
                <Menu />
              </SheetTrigger>
              <SheetContent
                side="left"
                className="flex flex-col px-8 pb-8 gap-8 overflow-y-scroll"
              >
                <div className="flex flex-col gap-6">
                  {menu.map((item, index) => (
                    <Link
                      href={item.path}
                      key={index}
                      className={`h-full flex items-center gap-1 font-medium`}
                    >
                      <p
                        className={`text-[15px] ${item.underline && "mt-0.5"}`}
                      >
                        {item.label}
                      </p>
                      {item.dropdown && <ChevronDown size={16} />}
                      {item.newest && (
                        <p className="text-xs text-[#05BCC6] font-medium">
                          NEW
                        </p>
                      )}
                    </Link>
                  ))}
                </div>
                <div className="flex flex-col gap-6 mt-16">
                  <VibeLogo className="h-10" />
                  <div className="flex flex-col">
                    <p className="text-sm">
                      회원가입 또는 로그인을 통해 AI 창작자의
                    </p>
                    <p className="text-sm">
                      크리에이티브를 발견하고 수집해보세요.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button
                      asChild
                      className="bg-[#4ACAD4] hover:bg-[#41a3aa]"
                    >
                      <Link href="/signup">
                        <span>회원가입</span>
                      </Link>
                    </Button>
                    <Button asChild variant={"outline"}>
                      <Link href="/login">
                        <span>로그인</span>
                      </Link>
                    </Button>
                  </div>
                </div>
                <Separator />
                <Separator />
              </SheetContent>
            </Sheet>
            <Link href="/" className="flex items-center">
              <VibeLogo />
            </Link>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
               <DropdownMenu>
               <DropdownMenuTrigger asChild>
                 <Button variant="ghost" className="relative h-10 w-10 rounded-full" aria-label="Open user menu">
                   <Avatar className="h-10 w-10">
                     <AvatarImage src={userProfile?.avatar_url || ''} alt={userProfile?.username} />
                     <AvatarFallback>
                       <UserIcon />
                     </AvatarFallback>
                   </Avatar>
                 </Button>
               </DropdownMenuTrigger>
               <DropdownMenuContent className="w-56" align="end" forceMount>
                 <DropdownMenuLabel className="font-normal">
                   <div className="flex flex-col space-y-1">
                     <p className="text-sm font-medium leading-none">{userProfile?.username}</p>
                     <p className="text-xs leading-none text-muted-foreground">
                       {user.email}
                     </p>
                   </div>
                 </DropdownMenuLabel>
                 <DropdownMenuSeparator />
                 <DropdownMenuItem asChild>
                   <Link href="/mypage">마이페이지</Link>
                 </DropdownMenuItem>
                 {userProfile?.role === 'admin' && (
                   <DropdownMenuItem asChild>
                     <Link href="/admin">어드민 메뉴</Link>
                   </DropdownMenuItem>
                 )}
                 <DropdownMenuSeparator />
                 <DropdownMenuItem onClick={handleLogout}>
                   로그아웃
                 </DropdownMenuItem>
               </DropdownMenuContent>
             </DropdownMenu>
            ) : (
              <Button asChild variant={"outline"}>
                <Link href="/login">
                  <span>로그인</span>
                </Link>
              </Button>
            )}
            <Drawer>
              <DrawerTrigger>
                <Search size={20} />
              </DrawerTrigger>
              <DrawerContent className="h-full flex flex-col gap-6 px-6">
                <div className="flex items-center border px-3 rounded-full bg-neutral-50">
                  <Search size={18} className="text-neutral-400" />
                  <Input
                    placeholder="230,000개 이상의 크리에이티브 검색"
                    onChange={handleMobileSearchChange}
                    className="w-full placeholder:text-neutral-400 outline-0 border-none focus-visible:ring-0 !bg-transparent !shadow-none"
                  />
                </div>
              </DrawerContent>
            </Drawer>
          </div>
        </div>
        <nav className="w-full h-16 flex items-center gap-6">
          {menu.map((item, index) => (
            <Link
              href={item.path}
              key={index}
              className={`h-full flex items-center gap-1 font-medium ${item.underline && "h-[calc(100%-2px)] border-b-2 border-black"
                }`}
            >
              <p className={`text-base font-medium ${item.underline && "mt-0.5"}`}>
                {item.label}
              </p>
              {item.dropdown && <ChevronDown size={16} />}
              {item.newest && (
                <p className="text-xs text-[#05BCC6] font-medium">NEW</p>
              )}
            </Link>
          ))}
        </nav>
      </header>

      {/* 데스크탑 헤더 */}
      <header className="sticky top-[44px] z-40 w-full h-20 hidden xl:flex items-center justify-between px-8 border-b simple-header bg-white">
        <div className="h-full flex items-center gap-10">
          <Link href="/" className="flex items-center">
            <VibeLogo />
          </Link>
          <nav className="h-full flex items-center gap-8">
            {menu.map((item, index) => (
              <Link
                href={item.path}
                key={index}
                className={`h-full flex items-center gap-1 font-medium ${
                  item.underline && "h-[calc(100%-2px)] border-b-2 border-black"
                }`}
              >
                <p className={`text-base font-medium ${item.underline && "mt-0.5"}`}>
                  {item.label}
                </p>
                {item.dropdown && <ChevronDown size={16} />}
                {item.newest && (
                  <p className="text-xs text-[#05BCC6] font-medium">NEW</p>
                )}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center border px-3 rounded-full bg-neutral-50">
            <Search size={18} className="text-neutral-400" />
            <Input
              placeholder="크리에이티브 검색"
              onKeyDown={handleSearchKeyDown}
              className="w-60 placeholder:text-neutral-400 outline-0 border-none focus-visible:ring-0 !bg-transparent !shadow-none"
            />
          </div>
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0 overflow-hidden ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={userProfile?.avatar_url || ''} alt={userProfile?.username} />
                    <AvatarFallback className="bg-neutral-100 italic font-bold">
                      {userProfile?.username?.[0]?.toUpperCase() || <UserIcon className="h-5 w-5" />}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                className="w-56 z-[9999] bg-white text-slate-900 border border-slate-200 shadow-2xl p-1 rounded-xl" 
                align="end" 
                sideOffset={8}
              >
                <DropdownMenuLabel className="font-semibold px-2 py-1.5 text-slate-500 text-xs">
                  나의 계정
                </DropdownMenuLabel>
                <div className="px-2 py-2 mb-1 border-b border-slate-100">
                  <p className="text-sm font-bold truncate">{userProfile?.username}</p>
                  <p className="text-xs text-slate-400 truncate">{user.email}</p>
                </div>
                <DropdownMenuItem asChild>
                  <Link href="/mypage" className="flex w-full items-center px-2 py-2 text-sm rounded-md hover:bg-slate-100 cursor-pointer transition-colors font-medium">
                    마이페이지
                  </Link>
                </DropdownMenuItem>
                {userProfile?.role === 'admin' && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin" className="flex w-full items-center px-2 py-2 text-sm rounded-md hover:bg-slate-100 cursor-pointer transition-colors font-medium">
                      어드민 메뉴
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator className="my-1 bg-slate-100" />
                <DropdownMenuItem 
                  onClick={handleLogout} 
                  className="flex w-full items-center px-2 py-2 text-sm rounded-md text-red-600 hover:bg-red-50 focus:bg-red-50 cursor-pointer transition-colors font-bold"
                >
                  로그아웃
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Button asChild variant="link">
                <Link href="/login">
                  <span>로그인</span>
                </Link>
              </Button>
              <Button asChild>
                <Link href="/signup">
                  <span>회원가입</span>
                </Link>
              </Button>
            </div>
          )}
        </div>
      </header>
    </>
  );
}
