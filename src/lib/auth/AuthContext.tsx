"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { User, Session, AuthChangeEvent } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

// 30분 세션 타임아웃 (밀리초)
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

interface UserProfile {
  nickname: string;
  profile_image_url: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  userProfile: UserProfile | null;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// SSR 안전: mounted 상태 확인용
function useIsMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  return mounted;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const isMounted = useIsMounted();
  
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // ====== 30분 세션 타임아웃 체크 ======
  const checkSessionTimeout = useCallback((): boolean => {
    if (typeof window === 'undefined') return false;
    
    try {
      const loginTimestamp = localStorage.getItem('loginTimestamp');
      if (!loginTimestamp) return false;
      
      const loginTime = parseInt(loginTimestamp, 10);
      const now = Date.now();
      const elapsed = now - loginTime;
      
      if (elapsed > SESSION_TIMEOUT_MS) {
        console.log("[Auth] 30분 세션 타임아웃 - 자동 로그아웃");
        return true; // 타임아웃됨
      }
    } catch (e) {
      console.warn("[Auth] 세션 타임아웃 체크 중 오류:", e);
      return true; // 오류 시 안전하게 로그아웃 처리
    }
    
    return false; // 아직 유효
  }, []);

  // ====== localStorage에서 캐시된 역할 정보 가져오기 (관리자 메뉴 안정화) ======
  const getCachedRole = useCallback((): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      const cached = localStorage.getItem('userRole');
      return cached;
    } catch {
      return null;
    }
  }, []);

  // ====== 역할 정보 캐시 저장 ======
  const setCachedRole = useCallback((role: string) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('userRole', role);
    } catch (e) {
      console.warn("[Auth] 역할 캐시 저장 실패:", e);
    }
  }, []);

  // 프로필 정보 로드
  const loadUserProfile = useCallback(async (currentUser: User): Promise<UserProfile> => {
    try {
      console.log("[Auth] Loading profile for:", currentUser.email);
      
      // DB에서 역할 조회
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("role, nickname, profile_image_url")
        .eq("id", currentUser.id)
        .single();

      const metadata = currentUser.user_metadata;
      
      // 기본값 설정
      let newRole = "user";
      let newNickname = metadata?.nickname || currentUser.email?.split("@")[0] || "사용자";
      let newImage = metadata?.profile_image_url || metadata?.avatar_url || "/globe.svg";

      if (!userError && userData) {
        const typedData = userData as { role?: string; nickname?: string; profile_image_url?: string };
        newRole = typedData.role || "user";
        if (typedData.nickname) newNickname = typedData.nickname;
        if (typedData.profile_image_url) newImage = typedData.profile_image_url;
      } else if (userError) {
        console.warn("[Auth] DB 조회 실패 (기본값 사용):", userError.message);
        // 캐시된 역할 사용
        const cachedRole = getCachedRole();
        if (cachedRole) {
          newRole = cachedRole;
          console.log("[Auth] 캐시된 역할 사용:", cachedRole);
        }
      }
      
      // 역할 캐시 저장 (관리자 메뉴 안정화)
      setCachedRole(newRole);
      
      const newProfile: UserProfile = {
        nickname: newNickname,
        profile_image_url: newImage,
        role: newRole,
      };

      console.log("[Auth] Profile loaded:", { 
        email: currentUser.email, 
        role: newRole, 
        isAdmin: newRole === 'admin' 
      });

      return newProfile;

    } catch (error) {
      console.error("[Auth] 프로필 로드 치명적 오류:", error);
      // 캐시된 역할 확인
      const cachedRole = getCachedRole();
      return {
        nickname: currentUser.email?.split("@")[0] || "사용자",
        profile_image_url: "/globe.svg",
        role: cachedRole || "user",
      };
    }
  }, [getCachedRole, setCachedRole]);

  // 상태 업데이트 함수 (동기화 보장)
  const updateAuthState = useCallback((
    newSession: Session | null, 
    newUser: User | null, 
    newProfile: UserProfile | null
  ) => {
    setSession(newSession);
    setUser(newUser);
    setUserProfile(newProfile);
    setIsAdmin(newProfile?.role === 'admin');
    setLoading(false);
    
    // 로그인 시 타임스탬프 저장
    if (typeof window !== 'undefined') {
      if (newSession && newUser) {
        // 기존 타임스탬프가 없을 때만 저장 (새로 로그인한 경우)
        if (!localStorage.getItem('loginTimestamp')) {
          localStorage.setItem('loginTimestamp', Date.now().toString());
        }
      } else {
        // 로그아웃 시 타임스탬프 제거
        localStorage.removeItem('loginTimestamp');
        localStorage.removeItem('userRole');
      }
    }
  }, []);

  // 로그아웃 함수
  const signOut = useCallback(async () => {
    try {
      // 즉시 상태 초기화
      updateAuthState(null, null, null);
      
      // localStorage 정리 (클라이언트에서만)
      if (typeof window !== 'undefined') {
        localStorage.removeItem("isLoggedIn");
        localStorage.removeItem("loginTimestamp");
        localStorage.removeItem("userRole");
      }
      
      await supabase.auth.signOut();
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("로그아웃 오류:", error);
      router.push("/");
    }
  }, [router, updateAuthState]);

  // 세션 새로고침
  const refreshSession = useCallback(async () => {
    try {
      const { data: { session: newSession }, error } = await supabase.auth.refreshSession();
      if (error) {
        console.error("세션 새로고침 실패:", error);
        if (error.message.includes("refresh_token_not_found") || error.message.includes("invalid")) {
          await signOut();
        }
        return;
      }
      if (newSession) {
        const profile = await loadUserProfile(newSession.user);
        updateAuthState(newSession, newSession.user, profile);
      }
    } catch (error) {
      console.error("세션 새로고침 오류:", error);
    }
  }, [signOut, loadUserProfile, updateAuthState]);

  // 외부에서 호출 가능한 프로필 새로고침 함수
  const refreshUserProfile = useCallback(async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        const profile = await loadUserProfile(currentUser);
        setUserProfile(profile);
        setIsAdmin(profile.role === 'admin');
      }
    } catch (e) {
      console.error("프로필 새로고침 실패:", e);
    }
  }, [loadUserProfile]);

  // 초기화 및 인증 상태 변경 구독
  useEffect(() => {
    let isActive = true;

    const initializeAuth = async () => {
      // 클라이언트에서만 실행 (SSR 안전)
      if (typeof window === 'undefined') {
        setLoading(false);
        return;
      }

      try {
        // 페이지 경로 확인 (trailing slash 고려)
        const path = window.location.pathname.replace(/\/$/, '');
        const isCallbackPage = path === '/auth/callback';

        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (!isActive) return;

        if (error) {
          console.error("[Auth] 세션 에러 (무시):", error.message);
          // 에러가 나도 바로 로그아웃 시키지 말고, 재시도하거나 사용자에게 맡김
          // updateAuthState(null, null, null); // 이 경우에도 상태를 초기화하지 않고 기존 상태 유지 시도
          // return;
        }

        if (currentSession) {
          // 타임아웃 체크 로직 제거됨 - 항상 로그인 유지 시도
          // console.log("[Auth] 세션 복구:", currentSession.user.email);
          
          // 캐시된 역할로 먼저 isAdmin 설정 (관리자 메뉴 빠른 표시)
          const cachedRole = getCachedRole();
          if (cachedRole === 'admin') {
            setIsAdmin(true);
          }
          
          const profile = await loadUserProfile(currentSession.user);
          
          if (!isActive) return;
          
          updateAuthState(currentSession, currentSession.user, profile);
          
          // localStorage 업데이트
          localStorage.setItem("isLoggedIn", "true");
          // 로그인 타임스탬프가 없으면 설정 (이미 로그인 된 경우 유지)
          if (!localStorage.getItem('loginTimestamp')) {
            localStorage.setItem('loginTimestamp', Date.now().toString());
          }
        } else {
          console.log("[Auth] 세션 없음");
          updateAuthState(null, null, null);
        }

      } catch (error) {
        console.error("[Auth] 초기화 예외:", error);
        if (isActive) {
          updateAuthState(null, null, null);
        }
      }
    };

    // 초기화 실행
    initializeAuth();

    // onAuthStateChange 구독
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, newSession: Session | null) => {
        if (!isActive) return;

        console.log(`[Auth] 상태 변경: ${event}`, newSession?.user?.email);

        switch (event) {
          case "SIGNED_IN":
            if (newSession) {
              // 새로 로그인 시 타임스탬프 갱신
              if (typeof window !== 'undefined') {
                localStorage.setItem('loginTimestamp', Date.now().toString());
              }
              const profile = await loadUserProfile(newSession.user);
              if (isActive) {
                updateAuthState(newSession, newSession.user, profile);
                if (typeof window !== 'undefined') {
                  localStorage.setItem("isLoggedIn", "true");
                }
              }
            }
            break;

          case "TOKEN_REFRESHED":
            if (newSession) {
              const profile = await loadUserProfile(newSession.user);
              if (isActive) {
                updateAuthState(newSession, newSession.user, profile);
              }
            }
            break;

          case "SIGNED_OUT":
            console.log("[Auth] 로그아웃됨");
            if (isActive) {
              updateAuthState(null, null, null);
              if (typeof window !== 'undefined') {
                localStorage.removeItem("isLoggedIn");
                localStorage.removeItem("loginTimestamp");
                localStorage.removeItem("userRole");
              }
            }
            break;

          case "USER_UPDATED":
            if (newSession?.user && isActive) {
              const profile = await loadUserProfile(newSession.user);
              setUser(newSession.user);
              setUserProfile(profile);
              setIsAdmin(profile.role === 'admin');
            }
            break;
            
          case "INITIAL_SESSION":
            // 이미 initializeAuth에서 처리됨
            break;
        }
      }
    );

    return () => {
      isActive = false;
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value: AuthContextType = {
    user,
    session,
    loading: !isMounted || loading, // 마운트되지 않았으면 로딩 상태 유지
    isAuthenticated: !!user && !!session,
    isAdmin,
    userProfile,
    signOut,
    refreshSession,
    refreshUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// userInterests 타입 (MyPage 등에서 사용)
interface UserInterests {
  genres?: string[];
  fields?: string[];
}

export type { UserInterests };
