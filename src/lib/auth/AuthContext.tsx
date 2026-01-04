"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

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
      nickname: metadata.full_name || metadata.name || metadata.nickname || currentUser.email?.split("@")[0] || "User",
      profile_image_url: metadata.avatar_url || metadata.picture || "/globe.svg",
      role: currentUser.app_metadata?.role || metadata.role || "user",
    };
  }, []);

  // ====== 상태 업데이트 통합 관리 ======
  const updateState = useCallback(async (s: Session | null, u: User | null) => {
    setSession(s);
    setUser(u);
    if (u) {
      // DB 조회 없이 즉시 메타데이터로 설정
      const profile = loadProfileFromMetadata(u);
      setUserProfile(profile);
    } else {
      setUserProfile(null);
    }
    setLoading(false);
  }, [loadProfileFromMetadata]);

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
  }, [updateState]);

  const signOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    // 로컬 스토리지 삭제 대신 상태 업데이트에 의존
    // AuthStateChange 'SIGNED_OUT' 이벤트가 처리함
    router.push("/");
    router.refresh();
  };

  const value = {
    user,
    session,
    loading,
    isAuthenticated: !!user,
    userProfile,
    isAdmin: userProfile?.role === "admin",
    signOut,
    refreshUserProfile: async () => {
      const { data: { user: u } } = await supabase.auth.getUser();
      if (u) {
        const p = loadProfileFromMetadata(u);
        setUserProfile(p);
      }
    }
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
