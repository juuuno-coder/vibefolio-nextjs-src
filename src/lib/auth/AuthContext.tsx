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

  // ====== 30분 세션 타임아웃 설정 ======
  const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

  // 세션 타임아웃 체크 (30분 미활동 시 true 반환)
  const checkSessionTimeout = useCallback((): boolean => {
    if (typeof window === 'undefined') return false;
    
    try {
      const lastActivity = localStorage.getItem('lastActivity');
      // 기록이 없으면 타임아웃 아님 (신규 진입으로 간주하거나, 로그인 세션 생성 시 기록됨)
      if (!lastActivity) return false;
      
      const lastTime = parseInt(lastActivity, 10);
      const now = Date.now();
      const elapsed = now - lastTime;
      
      // 30분 초과 시
      if (elapsed > SESSION_TIMEOUT_MS) {
        console.warn("[Auth] Session timeout (30min inactive) -> Force Logout");
        return true; 
      }
    } catch (e) {
      return true; // 에러 시 안전하게 로그아웃
    }
    
    // 활동 시간 갱신 (살아있다면)
    localStorage.setItem('lastActivity', Date.now().toString());
    return false; 
  }, []);

  // 프로필 정보 로드 (ONLY DB)
  // 캐시나 메타데이터 절대 사용 안함. DB 없으면 없는 것.
  const loadUserProfile = useCallback(async (currentUser: User): Promise<UserProfile> => {
    try {
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("role, nickname, profile_image_url")
        .eq("id", currentUser.id)
        .single();

      if (userError || !userData) {
        console.warn("[Auth] User not found in DB or Error:", userError?.message);
        // 빈 프로필 반환 (메타데이터 사용 X)
        return {
          nickname: "알 수 없음",
          profile_image_url: "/globe.svg",
          role: "user",
        };
      }

      // DB 데이터 사용
      const typedData = userData as { role?: string; nickname?: string; profile_image_url?: string };
      
      return {
        nickname: typedData.nickname || "이름 없음",
        profile_image_url: typedData.profile_image_url || "/globe.svg",
        role: typedData.role || "user",
      };

    } catch (error) {
      console.error("[Auth] Load Profile Error:", error);
      return {
        nickname: "오류",
        profile_image_url: "/globe.svg",
        role: "user",
      };
    }
  }, []);

  // 상태 업데이트 및 스토리지 관리
  const updateAuthState = useCallback((
    newSession: Session | null, 
    newUser: User | null, 
    newProfile: UserProfile | null
  ) => {
    setSession(newSession);
    setUser(newUser);
    setUserProfile(newProfile);
    setIsAdmin(newProfile?.role === 'admin');
    setLoading(false); // 즉시 로딩 해제
    
    if (typeof window !== 'undefined') {
      if (newSession && newUser) {
        // 로그인 상태라면 활동 시간 기록
        localStorage.setItem('lastActivity', Date.now().toString());
      } else {
        // 로그아웃 상태라면 흔적 제거
        localStorage.removeItem('lastActivity');
        // 그 외 불필요한 키들도 제거
        localStorage.removeItem('loginTimestamp');
        localStorage.removeItem('userRole'); 
        localStorage.removeItem('isLoggedIn');
      }
    }
  }, []);

  // 로그아웃 함수
  const signOut = useCallback(async () => {
    try {
      updateAuthState(null, null, null);
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

  // 초기화 로직
  useEffect(() => {
    let isActive = true;

    const initializeAuth = async () => {
      // 클라이언트에서만 실행 (SSR 안전)
      if (typeof window === 'undefined') {
        setLoading(false);
        return;
      }

      try {
        console.log("[Auth] Starting initialization...");
        // 1. 세션 가져오기 (DB/Local 확인)
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        console.log("[Auth] Session fetch complete", currentSession ? "Session exists" : "No session");
        
        if (!isActive) return;

        if (error) {
          console.error("[Auth] Session Error:", error.message);
          updateAuthState(null, null, null);
          return;
        }

        if (currentSession) {
          // 2. 타임아웃 체크
          console.log("[Auth] Checking timeout...");
          if (checkSessionTimeout()) {
            console.warn("[Auth] Session timeout trigger");
            await supabase.auth.signOut();
            updateAuthState(null, null, null);
            return;
          }

          // 3. 프로필 로드 (DB Only)
          console.log("[Auth] Loading profile for", currentSession.user.id);
          const profile = await loadUserProfile(currentSession.user);
          console.log("[Auth] Profile loaded", profile.nickname);
          
          if (!isActive) return;
          updateAuthState(currentSession, currentSession.user, profile);
          
        } else {
          // 세션 없음
          console.log("[Auth] Finalizing - No session");
          updateAuthState(null, null, null);
        }

      } catch (error) {
        console.error("[Auth] Init Error:", error);
        if (isActive) updateAuthState(null, null, null);
      }
    };

    initializeAuth();

    // onAuthStateChange 구독
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, newSession: Session | null) => {
        if (!isActive) return;

        // 상태 변경 로깅 최소화
        // console.log(`[Auth] State Change: ${event}`);

        switch (event) {
          case "SIGNED_IN":
          case "TOKEN_REFRESHED":
            if (newSession) {
              const profile = await loadUserProfile(newSession.user);
              if (isActive) updateAuthState(newSession, newSession.user, profile);
            }
            break;

          case "SIGNED_OUT":
            if (isActive) updateAuthState(null, null, null);
            break;

          case "USER_UPDATED":
            if (newSession?.user && isActive) {
              const profile = await loadUserProfile(newSession.user);
              setUser(newSession.user);
              setUserProfile(profile);
              setIsAdmin(profile.role === 'admin');
            }
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
