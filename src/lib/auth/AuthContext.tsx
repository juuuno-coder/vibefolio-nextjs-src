"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

// 최소한의 프로필 인터페이스 (빌드 에러 방지용)
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
  const router = useRouter();

  // 프로필 로드 (DB에서 직접 가져옴)
  const loadProfile = useCallback(async (currentUser: User) => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("nickname, profile_image_url, role")
        .eq("id", currentUser.id)
        .single();

      if (!error && data) {
        setUserProfile(data as UserProfile);
      } else {
        // 프로필이 없는 경우 기본값
        setUserProfile({
          nickname: currentUser.user_metadata?.nickname || currentUser.email?.split("@")[0] || "User",
          profile_image_url: currentUser.user_metadata?.avatar_url || "/globe.svg",
          role: "user",
        });
      }
    } catch (e) {
      console.error("[Auth] Profile load error:", e);
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      const { data: { session: s } } = await supabase.auth.getSession();
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) await loadProfile(s.user);
      setLoading(false);
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        await loadProfile(s.user);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
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
      if (u) await loadProfile(u);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
