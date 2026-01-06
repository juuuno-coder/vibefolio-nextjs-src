"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Search, 
  Menu, 
  X, 
  User as UserIcon, 
  LogOut, 
  LayoutDashboard,
  Bell,
  ChevronDown
} from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { Button } from "@/components/ui/button";
import { VibeLogo } from "./Logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function Header({ 
  onSetCategory 
}: { 
  onSetCategory?: (value: string) => void;
}) {
  const { user, userProfile, isAdmin, signOut, isAuthenticated, loading } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    await signOut();
    router.push("/");
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const target = e.target as HTMLInputElement;
      const query = target.value.trim();
      if (query) {
        router.push(`/?q=${encodeURIComponent(query)}`);
        setIsSearchOpen(false);
        target.value = '';
      }
    }
  };

  const menuItems = [
    { label: "발견", path: "/" },
    { label: "연결", path: "/recruit" },
  ];

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${
        scrolled ? "bg-white/80 backdrop-blur-md shadow-sm py-3" : "bg-white py-5"
      }`}
    >
      <div className="max-w-[1920px] mx-auto px-6 md:px-10 flex items-center justify-between">
        {/* Left: Logo & Nav */}
        <div className="flex items-center gap-12">
          <Link href="/" className="flex items-center">
            <VibeLogo className="h-7 w-auto" />
          </Link>
          
          <nav className="hidden xl:flex items-center gap-8">
            {menuItems.map((item) => (
              <Link 
                key={item.label}
                href={item.path}
                className="text-[15px] font-medium text-gray-900 transition-colors hover:text-black/60 font-poppins relative group"
              >
                {item.label}
                {item.label === "연결" && (
                  <span className="absolute -top-1 -right-3 w-1 h-1 bg-green-500 rounded-full" />
                )}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-black transition-all group-hover:w-full" />
              </Link>
            ))}
          </nav>
        </div>

        {/* Right: Search & Auth */}
        <div className="flex items-center gap-5">
           {/* Search Bar */}
           <div className="hidden lg:flex items-center">
              <div className={`flex items-center transition-all duration-300 ${isSearchOpen ? 'w-64 bg-gray-100 px-4 py-2 opacity-100' : 'w-10 opacity-70'} rounded-full`}>
                 <button 
                    className="p-1 outline-none"
                    onClick={() => setIsSearchOpen(!isSearchOpen)}
                 >
                    <Search size={20} className="text-gray-900" />
                 </button>
                 {isSearchOpen && (
                    <input 
                       autoFocus
                       type="text"
                       className="bg-transparent border-none outline-none text-sm w-full font-pretendard placeholder:text-gray-400 ml-2"
                       placeholder="검색어를 입력하세요"
                       onKeyDown={handleSearchKeyDown}
                       onBlur={() => !onSetCategory && setIsSearchOpen(false)}
                    />
                 )}
              </div>
           </div>

            {/* Auth Buttons */}
            <div className="hidden md:flex items-center gap-4 font-poppins text-[15px] font-medium">
               {loading ? (
                  <div className="w-20" /> // 로딩 중일 때 깜빡임 방지용 빈 공간
               ) : isAuthenticated && user ? (
                  // 로그인 상태
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="outline-none rounded-full ring-2 ring-transparent ring-offset-2 hover:ring-gray-200 transition-all">
                        <Avatar className="w-9 h-9 cursor-pointer border border-gray-200">
                          <AvatarImage src={userProfile?.profile_image_url} />
                           <AvatarFallback className="bg-gray-100 text-black font-bold">
                             {userProfile?.username?.charAt(0) || "U"}
                           </AvatarFallback>
                        </Avatar>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-60 mt-2 rounded-xl border border-gray-100 shadow-xl bg-white p-2">
                        <div className="px-3 py-3 border-b border-gray-50 mb-1">
                           <p className="font-bold text-sm text-black truncate">{userProfile?.username}</p>
                           <p className="text-xs text-black/60 truncate">{user.email}</p>
                        </div>
                       <DropdownMenuItem onClick={() => router.push('/mypage')} className="rounded-lg cursor-pointer text-black hover:bg-gray-50 focus:bg-gray-50">
                         <UserIcon className="mr-2 h-4 w-4" /> 마이페이지
                       </DropdownMenuItem>
                       {isAdmin && (
                         <DropdownMenuItem onClick={() => router.push('/admin')} className="rounded-lg cursor-pointer text-indigo-600 bg-indigo-50 hover:bg-indigo-100 focus:bg-indigo-100 font-bold mt-1">
                            <LayoutDashboard className="mr-2 h-4 w-4" /> 관리자 센터
                         </DropdownMenuItem>
                       )}
                       <DropdownMenuItem onClick={handleLogout} className="rounded-lg cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50 focus:bg-red-50 focus:text-red-700">
                          <LogOut className="mr-2 h-4 w-4" /> 로그아웃
                       </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
               ) : (
                  // 비로그인 상태
                  <div className="flex items-center gap-1">
                     <Link href="/login">
                        <Button variant="ghost" className="text-[15px] font-medium text-black hover:bg-gray-100 rounded-full px-5">
                           로그인
                        </Button>
                     </Link>
                     <Link href="/signup">
                        <Button className="rounded-full bg-black hover:bg-gray-800 text-white text-[15px] px-6 font-medium shadow-none">
                           회원가입
                        </Button>
                     </Link>
                  </div>
               )}
            </div>

          {/* Mobile Menu Button */}
          <button 
            className="xl:hidden p-2 text-black"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
             {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
         <div className="xl:hidden absolute top-full left-0 right-0 bg-white border-b border-gray-100 shadow-xl p-6 flex flex-col gap-6 animate-in slide-in-from-top-2">
            <nav className="flex flex-col gap-4">
               {menuItems.map((item) => (
                  <Link 
                    key={item.label}
                    href={item.path}
                    className="text-lg font-medium text-gray-900 font-poppins"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                     {item.label}
                  </Link>
               ))}
            </nav>
            <div className="h-px bg-gray-100 w-full" />
            <div className="flex flex-col gap-4">
               {loading ? (
                  <div className="h-10 w-full bg-gray-50 animate-pulse rounded-lg" />
               ) : isAuthenticated && user ? (
                  <>
                     <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10 border border-gray-100">
                           <AvatarImage src={userProfile?.profile_image_url} />
                           <AvatarFallback>U</AvatarFallback>
                        </Avatar>
                         <div className="flex flex-col">
                            <span className="font-bold text-gray-900">{userProfile?.username}</span>
                            <span className="text-xs text-gray-500">{user.email}</span>
                         </div>
                     </div>
                     <Link href="/mypage" onClick={() => setIsMobileMenuOpen(false)} className="text-gray-700 font-medium py-1">마이페이지</Link>
                     {isAdmin && (
                       <Link href="/admin" onClick={() => setIsMobileMenuOpen(false)} className="text-indigo-600 font-bold bg-indigo-50 px-3 py-2 rounded-lg inline-flex items-center w-fit">
                         <LayoutDashboard className="mr-2 h-4 w-4" /> 관리자 센터
                       </Link>
                     )}
                     <button onClick={handleLogout} className="text-left text-red-500 font-medium py-1">로그아웃</button>
                  </>
               ) : (
                  <>
                     <Link href="/login" className="w-full py-3 text-center border border-gray-200 rounded-lg font-medium text-gray-700" onClick={() => setIsMobileMenuOpen(false)}>로그인</Link>
                     <Link href="/signup" className="w-full py-3 text-center bg-black text-white rounded-lg font-medium" onClick={() => setIsMobileMenuOpen(false)}>회원가입</Link>
                  </>
               )}
            </div>
         </div>
      )}
    </header>
  );
}
