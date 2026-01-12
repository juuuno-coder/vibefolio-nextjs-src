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
  ChevronDown,
  Zap,
  Plus,
  Upload
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
import { NotificationBell } from "./NotificationBell";

export function Header({ 
  onSetCategory 
}: { 
  onSetCategory?: (value: string) => void;
}) {
  const { user, userProfile, isAdmin, signOut, isAuthenticated, loading } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [trends, setTrends] = useState<{ query: string; count: number }[]>([]);
  const router = useRouter();

  // 검색 트렌드 불러오기
  useEffect(() => {
    if (isSearchOpen) {
      fetch("/api/search/trends")
        .then((res) => res.json())
        .then((data) => {
          if (data.trends) setTrends(data.trends);
        })
        .catch((err) => console.error("Trends fetch error:", err));
    }
  }, [isSearchOpen]);

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
        // 검색 로그 기록 (비동기로 실행)
        fetch("/api/search/log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query }),
        }).catch(err => console.error("Log error:", err));

        router.push(`/?q=${encodeURIComponent(query)}`);
        setIsSearchOpen(false);
        target.value = '';
      }
    }
  };

  const handleTrendClick = (query: string) => {
    // 트렌드 클릭 시에도 로그 기록
    fetch("/api/search/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    }).catch(err => console.error("Log error:", err));

    router.push(`/?q=${encodeURIComponent(query)}`);
    setIsSearchOpen(false);
  };

  const menuItems = [
    { label: "발견하기", path: "/" },
    { label: "연결하기", path: "/recruit" },
  ];

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${
        scrolled ? "bg-white/90 backdrop-blur-md h-[56px] border-b border-gray-50" : "bg-white h-[68px]"
      }`}
    >
      <div className="max-w-[1920px] mx-auto px-6 md:px-10 flex items-center justify-between h-full w-full">
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
                {item.label === "연결하기" && (
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
           <div className="hidden lg:flex items-center relative">
              <div className={`flex items-center transition-all duration-300 ${isSearchOpen ? 'w-80 bg-gray-100 px-4 py-2.5 opacity-100 shadow-inner' : 'w-10 opacity-70'} rounded-full`}>
                 <button 
                    className="p-1 outline-none hover:scale-110 transition-transform"
                    onClick={() => setIsSearchOpen(!isSearchOpen)}
                 >
                    <Search size={20} className={isSearchOpen ? "text-green-600" : "text-gray-900"} />
                  </button>
                  {isSearchOpen && (
                     <input 
                        autoFocus
                        type="text"
                        className="bg-transparent border-none outline-none text-sm w-full font-pretendard placeholder:text-gray-400 ml-2"
                        placeholder="어떤 영감을 찾으시나요?"
                        onKeyDown={handleSearchKeyDown}
                     />
                  )}
               </div>

               {/* Trending Keywords Dropdown */}
               {isSearchOpen && (
                  <div className="absolute top-full mt-3 right-0 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 p-5 animate-in fade-in slide-in-from-top-2 duration-200 z-[101]">
                     <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                           <Zap size={12} className="text-green-500 fill-green-500" />
                           실시간 인기 검색어
                        </h3>
                        <button onClick={() => setIsSearchOpen(false)} className="text-gray-300 hover:text-gray-500 transition-colors">
                           <X size={14} />
                        </button>
                     </div>
                     <div className="flex flex-wrap gap-2">
                        {trends.length > 0 ? (
                           trends.map((trend, idx) => (
                              <button
                                 key={idx}
                                 onClick={() => handleTrendClick(trend.query)}
                                 className="px-3 py-1.5 bg-gray-50 hover:bg-green-50 hover:text-green-700 text-[13px] font-medium text-gray-700 rounded-full transition-all border border-transparent hover:border-green-100"
                              >
                                 <span className="text-green-500 mr-1 opacity-50 font-bold">{idx + 1}</span>
                                 {trend.query}
                              </button>
                           ))
                        ) : (
                           <p className="text-sm text-gray-400 py-2">인기 검색어를 불러오는 중...</p>
                        )}
                     </div>
                     <div className="mt-5 pt-4 border-t border-gray-50">
                        <p className="text-[11px] text-gray-400 text-center">지금 유저들이 가장 많이 찾는 영감입니다.</p>
                     </div>
                  </div>
               )}
            </div>

            {/* Auth Buttons */}
            <div className="hidden md:flex items-center gap-4 font-poppins text-[15px] font-medium">
               {loading ? (
                  <div className="w-20" /> // 로딩 중일 때 깜빡임 방지용 빈 공간
               ) : isAuthenticated && user ? (
                  // 로그인 상태
                  <div className="flex items-center gap-2 md:gap-4">
                    {/* 프로젝트 등록 버튼 */}
                    <Button 
                      onClick={() => router.push('/project/upload')}
                      className="hidden lg:flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white rounded-full px-4 h-9 text-sm font-medium shadow-sm"
                    >
                      <Plus className="w-4 h-4" />
                      프로젝트 등록
                    </Button>
                    <NotificationBell />
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
                       <DropdownMenuItem onClick={() => router.push('/project/upload')} className="rounded-lg cursor-pointer text-green-600 hover:bg-green-50 focus:bg-green-50 font-medium">
                         <Upload className="mr-2 h-4 w-4" /> 프로젝트 등록
                       </DropdownMenuItem>
                       <DropdownMenuItem onClick={() => router.push('/mypage')} className="rounded-lg cursor-pointer text-black hover:bg-gray-100 focus:bg-gray-100">
                         <UserIcon className="mr-2 h-4 w-4" /> 마이페이지
                       </DropdownMenuItem>
                       {isAdmin && (
                         <DropdownMenuItem onClick={() => router.push('/admin')} className="rounded-lg cursor-pointer text-indigo-600 bg-indigo-50 hover:bg-indigo-200 focus:bg-indigo-200 font-bold mt-1">
                            <LayoutDashboard className="mr-2 h-4 w-4" /> 관리자 센터
                         </DropdownMenuItem>
                       )}
                       <DropdownMenuItem onClick={handleLogout} className="rounded-lg cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50 focus:bg-red-50 focus:text-red-700">
                          <LogOut className="mr-2 h-4 w-4" /> 로그아웃
                       </DropdownMenuItem>
                     </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
               ) : (
                  // 비로그인 상태
                  <div className="flex items-center gap-1">
                     <Link href="/login">
                        <Button variant="ghost" className="text-[15px] font-medium text-black hover:bg-gray-100 hover:text-black rounded-full px-5">
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
                     <Link href="/project/upload" onClick={() => setIsMobileMenuOpen(false)} className="text-green-600 font-bold bg-green-50 px-3 py-2 rounded-lg inline-flex items-center w-fit">
                       <Plus className="mr-2 h-4 w-4" /> 프로젝트 등록
                     </Link>
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
