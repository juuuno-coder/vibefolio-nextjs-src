// src/components/Header.tsx
"use client";

import { VibeLogo } from "./Logo";
import { useEffect, useState } from "react";
import { Menu, Search, User as UserIcon, X, LogOut, LayoutDashboard, User } from "lucide-react";
import {
  Button,
  Drawer,
  DrawerContent,
  DrawerTrigger,
  Input,
  Sheet,
  SheetContent,
  SheetTrigger,
  Input as InputUI,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/index";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

// 硫붾돱 ?뺤쓽
const menuItems = [
  { label: "諛쒓껄", path: "/", dropdown: false },
  { label: "?곌껐", path: "/recruit", dropdown: false, newest: true },
];

export function Header({
  onSetCategory = (value: string) => console.log("寃???붿껌:", value),
}: {
  onSetCategory?: (value: string) => void;
}) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<{ username: string; avatar_url: string; role: string } | null>(null);
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

  useEffect(() => {
    let mounted = true;
    
    async function fetchProfile(userId: string) {
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('username, avatar_url, role')
          .eq('id', userId)
          .single();
          
        if (error) {
          console.error("Error fetching profile:", error);
          return null;
        }
        return profile;
      } catch (e) {
        console.error("Exception fetching profile:", e);
        return null;
      }
    }

    async function initializeAuth() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;
      
      if (session?.user) {
        setUser(session.user);
        
        // 1. ?몄뀡 硫뷀??곗씠?곗뿉??湲곕낯 ?뺣낫 媛?몄삤湲?
        let profileData = {
          username: session.user.user_metadata?.user_name || session.user.user_metadata?.nickname || session.user.email?.split("@")[0] || "User",
          avatar_url: session.user.user_metadata?.avatar_url || "",
          role: session.user.app_metadata?.role || "user",
        };

        // 2. DB profiles ?뚯씠釉붿뿉??理쒖떊 ?뺣낫(?뱁엳 role) 媛?몄삤湲?
        const dbProfile = await fetchProfile(session.user.id);
        if (dbProfile) {
          profileData = {
            username: dbProfile.username || profileData.username,
            avatar_url: dbProfile.avatar_url || profileData.avatar_url,
            role: dbProfile.role || profileData.role, // ?ш린??DB role ?곗꽑 ?곸슜
          };
        }

        setUserProfile(profileData);
      }
    }
    
    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      setUser(session?.user ?? null);
      
      if (session?.user) {
        let profileData = {
          username: session.user.user_metadata?.user_name || session.user.user_metadata?.nickname || session.user.email?.split("@")[0] || "User",
          avatar_url: session.user.user_metadata?.avatar_url || "",
          role: session.user.app_metadata?.role || "user",
        };

        const dbProfile = await fetchProfile(session.user.id);
        if (dbProfile) {
          profileData = {
            username: dbProfile.username || profileData.username,
            avatar_url: dbProfile.avatar_url || profileData.avatar_url,
            role: dbProfile.role || profileData.role,
          };
        }
        
        setUserProfile(profileData);
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
      const query = target.value.trim();
      if (query) {
        router.push(`/?q=${encodeURIComponent(query)}`);
        setIsSearchOpen(false);
        target.value = '';
      }
    }
  };

  return (
    // ?ㅻ뜑 而⑦뀒?대꼫
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-white/90 backdrop-blur-md border-b border-gray-100 py-3`}
    >
      <div className="max-w-[1920px] mx-auto px-6 md:px-12 flex items-center justify-between h-12">
        
        {/* 醫뚯륫: 濡쒓퀬 + 硫붾돱 */}
        <div className="flex items-center gap-12">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <VibeLogo className="h-8 w-auto text-black" />
          </Link>
          <nav className="hidden xl:flex items-center gap-8">
            {menuItems.map((item) => (
              <Link 
                key={item.label} 
                href={item.path}
                className="relative flex items-center gap-1 text-[15px] font-medium text-gray-800 hover:text-black transition-colors"
              >
                {item.label}
                {item.dropdown && <span className="text-[10px] text-gray-400">??/span>}
                {item.newest && (
                  <span className="ml-[2px] mb-[2px] text-[10px] font-bold text-[#05BCC6]">N</span>
                )}
              </Link>
            ))}
          </nav>
        </div>

        {/* ?곗륫: 寃??+ 濡쒓렇??媛??*/}
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center">
             <div className={`flex items-center transition-all duration-300 ${isSearchOpen ? "w-64 bg-gray-50 px-4 py-2 rounded-full ring-1 ring-gray-200" : "w-8 justify-end"}`}>
                <Search 
                  size={20} 
                  className={`text-gray-500 cursor-pointer ${isSearchOpen ? "mr-2" : ""}`} 
                  onClick={() => setIsSearchOpen(!isSearchOpen)}
                />
                {isSearchOpen && (
                   <input 
                      autoFocus
                      type="text"
                      className="bg-transparent border-none outline-none text-sm w-full font-pretendard placeholder:text-gray-400"
                      placeholder="寃?됱뼱瑜??낅젰?섏꽭??
                      onKeyDown={handleSearchKeyDown}
                      onBlur={() => !onSetCategory && setIsSearchOpen(false)}
                   />
                )}
             </div>
          </div>

           <div className="hidden md:flex items-center gap-4 font-poppins text-[15px] font-medium">
              {user ? (
                 <DropdownMenu>
                   <DropdownMenuTrigger asChild>
                     <button className="outline-none rounded-full ring-2 ring-transparent ring-offset-2 hover:ring-gray-200 transition-all">
                       <Avatar className="w-9 h-9 cursor-pointer border border-gray-200">
                         <AvatarImage src={userProfile?.avatar_url} />
                          <AvatarFallback className="bg-gray-100 text-black font-bold">
                            {userProfile?.username?.charAt(0) || "U"}
                          </AvatarFallback>
                       </Avatar>
                     </button>
                   </DropdownMenuTrigger>
                   <DropdownMenuContent align="end" className="w-60 mt-2 rounded-xl border border-gray-100 shadow-xl bg-white p-2">
                       <div className="px-3 py-3 border-b border-gray-50 mb-1">
                          <p className="font-bold text-sm text-black">{userProfile?.username}</p>
                          <p className="text-xs text-black/60 truncate">{user.email}</p>
                       </div>
                      <DropdownMenuItem asChild className="rounded-lg cursor-pointer text-black hover:bg-gray-50 focus:bg-gray-50">
                         <Link href="/mypage">
                            <UserIcon className="mr-2 h-4 w-4" /> 留덉씠?섏씠吏
                         </Link>
                      </DropdownMenuItem>
                      {userProfile?.role === 'admin' && (
                        <DropdownMenuItem asChild className="rounded-lg cursor-pointer text-black hover:bg-gray-50 focus:bg-gray-50">
                           <Link href="/admin">
                              <LayoutDashboard className="mr-2 h-4 w-4" /> 愿由ъ옄
                           </Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={handleLogout} className="rounded-lg cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50 focus:bg-red-50 focus:text-red-700">
                         <LogOut className="mr-2 h-4 w-4" /> 濡쒓렇?꾩썐
                      </DropdownMenuItem>
                   </DropdownMenuContent>
                 </DropdownMenu>
              ) : (
                 <div className="flex items-center gap-1">
                    <Link href="/login">
                       <Button variant="ghost" className="text-[15px] font-medium text-black hover:bg-gray-100 rounded-full px-5">
                          濡쒓렇??
                       </Button>
                    </Link>
                    <Link href="/signup">
                       <Button className="rounded-full bg-black hover:bg-gray-800 text-white text-[15px] px-6 font-medium shadow-none">
                          ?뚯썝媛??
                       </Button>
                    </Link>
                 </div>
              )}
           </div>

          <button 
            className="xl:hidden p-2 text-black"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
             {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

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
               {user ? (
                  <>
                     <Link href="/mypage" className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                           <AvatarImage src={userProfile?.avatar_url} />
                           <AvatarFallback>U</AvatarFallback>
                        </Avatar>
                         <span className="font-medium">{userProfile?.username}</span>
                     </Link>
                     {userProfile?.role === 'admin' && (
                       <Link href="/admin" className="text-left text-[#4ACAD4] text-sm font-medium">
                         愿由ъ옄 ?섏씠吏
                       </Link>
                     )}
                     <button onClick={handleLogout} className="text-left text-red-500 text-sm font-medium">濡쒓렇?꾩썐</button>
                  </>
               ) : (
                  <>
                     <Link href="/login" className="w-full py-3 text-center border border-gray-200 rounded-lg font-medium text-gray-700">Login</Link>
                     <Link href="/signup" className="w-full py-3 text-center bg-black text-white rounded-lg font-medium">?뚯썝媛??/Link>
                  </>
               )}
            </div>
         </div>
      )}
    </header>
  );
}
