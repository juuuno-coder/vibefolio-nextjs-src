"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface UserProfile {
  username: string;
  profile_image_url: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
  userProfile: UserProfile | null;
  isAdmin: boolean;
  signOut: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const initializedRef = useRef(false);
  const router = useRouter();

  // ====== Supabase Metadata에서 프로필 로드 ======
  const loadProfileFromMetadata = useCallback((currentUser: User): UserProfile => {
    // Supabase Auth 자체 메타데이터 우선 사용
    const metadata = currentUser.user_metadata || {};
    
    return {
      username: metadata.full_name || metadata.name || metadata.nickname || currentUser.email?.split("@")[0] || "User",
      profile_image_url: metadata.avatar_url || metadata.picture || "/globe.svg",
      role: currentUser.app_metadata?.role || metadata.role || "user",
    };
  }, []);

  // ====== 상태 업데이트 통합 관리 ======
  const updateState = useCallback(async (s: Session | null, u: User | null) => {
    // 1. 세션/유저 상태 업데이트
    setSession(s);
    setUser(u);
    
    if (u) {
      // 2. 프로필 및 어드민 여부 판단 로직
      const baseProfile = loadProfileFromMetadata(u);
      
      // DB 조회 전 기본값 설정
      setUserProfile(baseProfile);

      try {
        const { data: dbProfile, error } = await supabase
          .from('profiles')
          .select('username, avatar_url, role')
          .eq('id', u.id)
          .single();

        if (dbProfile && !error) {
          const finalProfile = {
            username: (dbProfile as any).username || baseProfile.username,
            profile_image_url: (dbProfile as any).avatar_url || (dbProfile as any).profile_image_url || baseProfile.profile_image_url,
            role: (dbProfile as any).role || baseProfile.role,
          };
          setUserProfile(finalProfile);
        }
      } catch (e) {
        console.error("[Auth] DB profile fetch error:", e);
      }
    } else {
      setUserProfile(null);
    }
    setLoading(false); // 로딩 상태는 여기서만 관리
  }, [loadProfileFromMetadata]);

  // ====== 초기화 및 Auth 상태 감지 (한 번만 실행) ======
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const init = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      await updateState(currentSession, currentSession?.user || null);
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (['SIGNED_IN', 'TOKEN_REFRESHED', 'INITIAL_SESSION'].includes(event)) {
        await updateState(currentSession, currentSession?.user || null);
      } else if (event === "SIGNED_OUT") {
        await updateState(null, null);
      }
    });

    return () => subscription.unsubscribe();
  }, [updateState]);

  // ====== 자동 로그아웃 로직 (user 변경 시 실행) ======
  // Note: AutoLogoutProvider가 별도로 존재하므로 여기서는 제거하거나, 
  // AuthContext가 중심이라면 여기서 관리해야 합니다. 
  // 혼선 방지를 위해 AuthContext에서의 자동 로그아웃은 제거하고 AutoLogoutProvider에 위임합니다.
  /* 
  useEffect(() => {
    if (!user) return;
    // ... (AutoLogoutProvider로 대체됨)
  }, [user]); 
  */

  const signOut = useCallback(async () => {
    try {
      if (user) localStorage.removeItem(`profile_${user.id}`);
      setUser(null);
      setSession(null);
      setUserProfile(null);
      await supabase.auth.signOut();
      router.push("/login");
    } catch (e) {
      console.error("SignOut Error:", e);
    }
  }, [user, router]);

  const refreshUserProfile = useCallback(async () => {
    if (!user) return;
    const { data: { user: u } } = await supabase.auth.getUser();
    if (u) await updateState(session, u);
  }, [user, session, updateState]);

  // ====== 성능의 핵심: Context Value Memoization ======
  const isAdminUser = React.useMemo(() => {
    const adminEmails = [
      "juuuno@naver.com", 
      "juuuno1116@gmail.com", 
      "designd@designd.co.kr", 
      "designdlab@designdlab.co.kr", 
      "admin@vibefolio.net"
    ];
    const result = !!(user?.email && adminEmails.includes(user.email)) || userProfile?.role === "admin";
    
    if (user) {
      console.log(`[Auth] Permission check: ${result ? 'ADMIN' : 'USER'} for ${user.email}`);
    }
    
    return result;
  }, [user?.email, userProfile?.role]);

  const authValue = React.useMemo(() => ({
    user,
    session,
    loading,
    isAuthenticated: !!user,
    userProfile,
    isAdmin: isAdminUser,
    signOut,
    refreshUserProfile
  }), [user, session, loading, userProfile, isAdminUser, signOut, refreshUserProfile]);

  return <AuthContext.Provider value={authValue}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
