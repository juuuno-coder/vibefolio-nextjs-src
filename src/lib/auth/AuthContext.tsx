"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface UserProfile {
  username: string;
  profile_image_url: string;
  role: string;
  points?: number;
  interests?: {
    genres: string[];
    fields: string[];
  };
  expertise?: {
    fields: string[];
  };
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
      interests: metadata.interests || undefined,
      expertise: metadata.expertise || undefined,
    };
  }, []);

  // ====== 상태 업데이트 통합 관리 ======
  const updateState = useCallback(async (s: Session | null, u: User | null) => {
    // 1. 상태 업데이트 (로딩 중에도 유저가 있으면 세팅)
    setSession(s);
    setUser(u);
    
    if (u) {
      // 2. 기초 프로필 생성 (Metadata에서)
      const base = loadProfileFromMetadata(u);
      
      try {
        // 3. DB 상세 프로필 조회
        const { data: db, error } = await supabase
          .from('profiles')
          .select('username, avatar_url, profile_image_url, role, interests, expertise, points')
          .eq('id', u.id)
          .single();

        if (db && !error) {
          // 서비스 내부에서 설정한 이미지가 있는지 우선 확인
          const customImage = (db as any).profile_image_url || (db as any).avatar_url;
          
          const finalProfile = {
            username: (db as any).username || base.username,
            // 우선순위: Vibefolio 커스텀 이미지 > 구글/소셜 이미지 > 기본 로고
            profile_image_url: customImage || base.profile_image_url,
            role: (db as any).role || base.role,
            points: (db as any).points || 0,
            interests: (db as any).interests || base.interests,
            expertise: (db as any).expertise || base.expertise,
          };
          setUserProfile(finalProfile);
        } else {
          setUserProfile(base);
        }
      } catch (e) {
        setUserProfile(base);
      }
    } else {
      setUserProfile(null);
    }
    setLoading(false);
  }, [loadProfileFromMetadata]);

  // ====== 초기화 및 관찰자 설정 ======
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    // 초기 세션 확인
    supabase.auth.getSession().then(({ data: { session } }) => {
      updateState(session, session?.user || null);
    });

    // 상태 변경 리스너
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (['SIGNED_IN', 'TOKEN_REFRESHED', 'INITIAL_SESSION'].includes(event)) {
        updateState(session, session?.user || null);
      } else if (event === "SIGNED_OUT") {
        updateState(null, null);
      }
    });

    return () => subscription.unsubscribe();
  }, [updateState]);

  // [New] Realtime Point Update Listener
  useEffect(() => {
    if (!user) return;

    const profileChannel = supabase
      .channel(`profile:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          const newProfile = payload.new as any;
          if (newProfile) {
            setUserProfile((prev) => {
               if(!prev) return null;
               // Only update if points changed (or other critical fields)
               if(newProfile.points !== prev.points) {
                   return { ...prev, points: newProfile.points };
               }
               return prev;
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(profileChannel);
    };
  }, [user]);

  // ====== 자동 로그아웃 로직 (user 변경 시 실행) ======
  // Note: AutoLogoutProvider가 별도로 존재하므로 여기서는 제거하거나, 
  // AuthContext가 중심이라면 여기서 관리해야 합니다. 
  
  const signOut = useCallback(async () => {
    setUser(null);
    setSession(null);
    setUserProfile(null);
    await supabase.auth.signOut();
    router.push("/login");
  }, [router]);

  const refreshUserProfile = useCallback(async () => {
    if (!user) return;
    const { data: { user: u } } = await supabase.auth.getUser();
    updateState(session, u);
  }, [user, session, updateState]);

  // ====== 권한 체크 & 메모이제이션 ======
  const isAdminUser = React.useMemo(() => {
    const adminEmails = [
      "juuuno@naver.com", 
      "juuuno1116@gmail.com", 
      "designd@designd.co.kr", 
      "designdlab@designdlab.co.kr", 
      "admin@vibefolio.net"
    ];
    const isMatched = !!(user?.email && adminEmails.includes(user.email)) || userProfile?.role === "admin";
    
    // 원칙에 따라 로그가 필요할 때만 출력
    if (user && userProfile) {
      // console.log(`[Auth] Determined: ${isMatched ? 'ADMIN' : 'USER'} (${user.email})`);
    }

    return isMatched;
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
