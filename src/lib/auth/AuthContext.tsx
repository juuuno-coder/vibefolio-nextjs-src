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
    setSession(s);
    setUser(u);
    if (u) {
      // 1. 기본 메타데이터로 즉시 설정 (UX 반응성)
      const profile = loadProfileFromMetadata(u);
      setUserProfile(profile);

      // 2. 캐시 확인 (localStorage)
      const cacheKey = `profile_${u.id}`;
      const cached = localStorage.getItem(cacheKey);
      
      if (cached) {
        try {
          const cachedProfile = JSON.parse(cached);
          // 캐시가 1시간 이내면 사용
          if (Date.now() - cachedProfile.timestamp < 60 * 60 * 1000) {
            setUserProfile(cachedProfile.data);
            setLoading(false);
            return; // DB 조회 스킵
          }
        } catch (e) {
          // 캐시 파싱 실패 시 무시
        }
      }

      // 3. DB profiles 테이블에서 최신 데이터 가져오기 (캐시 없을 때만)
      try {
        const { data: dbProfile, error } = await supabase
          .from('profiles')
          .select('username, avatar_url, role')
          .eq('id', u.id)
          .single();

        if (dbProfile && !error) {
          const finalProfile = {
            username: (dbProfile as any).username || profile.username,
            profile_image_url: (dbProfile as any).avatar_url || profile.profile_image_url,
            role: (dbProfile as any).role || profile.role,
          };
          setUserProfile(finalProfile);
          
          // 캐시 저장
          localStorage.setItem(cacheKey, JSON.stringify({
            data: finalProfile,
            timestamp: Date.now()
          }));
        }
      } catch (e) {
        console.error("[Auth] DB profile fetch error:", e);
      }
    } else {
      setUserProfile(null);
    }
    setLoading(false);
  }, [loadProfileFromMetadata]);

  // ====== 초기화 및 Auth 상태 감지 (한 번만 실행) ======
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const init = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (currentSession?.user) {
          await updateState(currentSession, currentSession.user);
        } else {
          await updateState(null, null);
        }
      } catch (e) {
        console.error("[Auth] Init error:", e);
        await updateState(null, null);
      }
    };

    init();

    // 상태 변경 감시
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "INITIAL_SESSION") {
        if (currentSession?.user) {
          await updateState(currentSession, currentSession.user);
        }
      } else if (event === "SIGNED_OUT") {
        await updateState(null, null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [updateState]); // user 제거

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

  const signOut = async () => {
    // setLoading(true); // 로그아웃 시 로딩 상태 전환은 UX를 해칠 수 있음 (선택 사항)
    await supabase.auth.signOut();
    router.push("/login"); // 로그아웃 후 로그인 페이지로
  };

  const refreshUserProfile = useCallback(async () => {
    if (!user) return;
    const { data: { user: u } } = await supabase.auth.getUser();
    if (u) {
      const profile = loadProfileFromMetadata(u);
      
      const { data: dbProfile } = await supabase
        .from('profiles')
        .select('username, avatar_url, role')
        .eq('id', u.id)
        .single();

      if (dbProfile) {
        setUserProfile({
          username: (dbProfile as any).username || profile.username,
          profile_image_url: (dbProfile as any).avatar_url || profile.profile_image_url,
          role: (dbProfile as any).role || profile.role,
        });
      } else {
        setUserProfile(profile);
      }
    }
  }, [user, loadProfileFromMetadata]);

  // 임시: 특정 이메일들을 admin으로 처리 (나중에 DB에서 role 설정 후 제거)
  const adminEmails = ["jason.log@naver.com", "juuuno@naver.com"];
  const isAdminUser = !!(userProfile?.role === "admin" || (user?.email && adminEmails.includes(user.email)));

  const value = {
    user,
    session,
    loading,
    isAuthenticated: !!user,
    userProfile,
    isAdmin: isAdminUser,
    signOut,
    refreshUserProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
