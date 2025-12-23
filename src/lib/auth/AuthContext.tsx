"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { User, Session, AuthChangeEvent } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  userProfile: {
    nickname: string;
    profile_image_url: string;
    role?: string;
  } | null;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<AuthContextType["userProfile"]>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // 로그아웃 함수
  const signOut = useCallback(async () => {
    try {
      setUser(null);
      setSession(null);
      setUserProfile(null);
      setIsAdmin(false);
      localStorage.removeItem("isLoggedIn");
      
      await supabase.auth.signOut();
      router.push("/");
      router.refresh(); // 강제 새로고침으로 상태 초기화 보장
    } catch (error) {
      console.error("로그아웃 오류:", error);
      router.push("/");
    }
  }, [router]);

  // 세션 새로고침
  const refreshSession = useCallback(async () => {
    try {
      const { data: { session: newSession }, error } = await supabase.auth.refreshSession();
      if (error) {
        console.error("세션 새로고침 실패:", error);
        // 리프레시 토큰 만료 등의 경우 로그아웃 처리
        // 하지만 네트워크 오류일 수 있으므로 신중해야 함
        if (error.message.includes("refresh_token_not_found") || error.message.includes("invalid")) {
           await signOut();
        }
        return;
      }
      if (newSession) {
        setSession(newSession);
        setUser(newSession.user);
        // 세션이 갱신되었으므로 프로필도 다시 로드 시도
        // loadUserProfile(newSession.user); // 무한 루프 방지를 위해 호출 제외
      }
    } catch (error) {
      console.error("세션 새로고침 오류:", error);
    }
  }, [signOut]);

  // 프로필 정보 로드
  const loadUserProfile = useCallback(async (currentUser: User) => {
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

      if (userError) {
        console.warn("[Auth] DB 조회 실패 (기본값 사용):", userError.message);
        // 에러 발생 시, 기존 프로필이 있다면 유지, 없다면 기본값 사용.
        // 여기서는 일단 기본값을 사용하지만, 역할은 'user'로 떨어질 수 있음 주의.
      } else if (userData) {
        const typedData = userData as { role?: string; nickname?: string; profile_image_url?: string };
        newRole = typedData.role || "user";
        if (typedData.nickname) newNickname = typedData.nickname;
        if (typedData.profile_image_url) newImage = typedData.profile_image_url;
      }
      
      const newProfile = {
        nickname: newNickname,
        profile_image_url: newImage,
        role: newRole,
      };

      console.log("[Auth] Profile loaded:", { 
        email: currentUser.email, 
        role: newRole, 
        isAdmin: newRole === 'admin' 
      });

      setUserProfile(newProfile);
      setIsAdmin(newRole === 'admin');

    } catch (error) {
      console.error("[Auth] 프로필 로드 치명적 오류:", error);
      // 치명적 오류 시 안전하게 기본값 처리
       setUserProfile({
        nickname: currentUser.email?.split("@")[0] || "사용자",
        profile_image_url: "/globe.svg",
        role: "user",
      });
      setIsAdmin(false);
    }
  }, []);

  // 외부에서 호출 가능한 프로필 새로고침 함수
  const refreshUserProfile = useCallback(async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        await loadUserProfile(currentUser);
      }
    } catch (e) {
      console.error("프로필 새로고침 실패:", e);
    }
  }, [loadUserProfile]);

  // 초기 세션 확인 및 인증 상태 변경 구독
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        console.log("[Auth] 초기화 체크 시작");
        
        // 1. getSession으로 현재 세션 확인
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("[Auth] 세션 확인 오류:", error);
          if (isMounted) setLoading(false);
          return;
        }

        if (currentSession && isMounted) {
          console.log("[Auth] 세션 존재함 (getSession):", currentSession.user.email);
          setSession(currentSession);
          setUser(currentSession.user);
          // 프로필 로드는 비동기로 진행하되, 로딩 상태는 프로필 로드 완료 후 해제하거나
          // 사용자 경험을 위해 일단 로그인은 된 상태로 두고 백그라운드에서 로드할 수도 있음.
          // 여기서는 안전하게 await 합니다.
          await loadUserProfile(currentSession.user);
          localStorage.setItem("isLoggedIn", "true");
        } else {
          console.log("[Auth] 세션 없음 (getSession)");
          // 세션이 없으면 로딩 해제 (비로그인 상태)
        }

      } catch (error) {
        console.error("[Auth] 초기화 예외 발생:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    // 초기화 실행
    initializeAuth();

    // 2. onAuthStateChange 구독
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, newSession: Session | null) => {
        if (!isMounted) return;

        console.log(`[Auth] 상태 변경 이벤트: ${event}`, newSession?.user?.email);

        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "INITIAL_SESSION") {
          if (newSession) {
            setSession(newSession);
            setUser(newSession.user);
            await loadUserProfile(newSession.user);
            localStorage.setItem("isLoggedIn", "true");
            setLoading(false); // 세션이 들어왔으니 로딩 해제
          }
        } else if (event === "SIGNED_OUT") {
          console.log("[Auth] 로그아웃됨");
          setSession(null);
          setUser(null);
          setUserProfile(null);
          setIsAdmin(false);
          localStorage.removeItem("isLoggedIn");
          setLoading(false);
        } else if (event === "USER_UPDATED" && newSession?.user) {
          setUser(newSession.user);
          await loadUserProfile(newSession.user);
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [loadUserProfile]);

  const value: AuthContextType = {
    user,
    session,
    loading,
    isAuthenticated: !!user && !!session,
    isAdmin, // 별도 state 사용
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
