// src/hooks/useAdmin.ts
// 관리자 권한 확인 훅

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

interface AdminState {
  isAdmin: boolean;
  isLoading: boolean;
  userId: string | null;
  userRole: string | null;
}

export function useAdmin(): AdminState {
  const [state, setState] = useState<AdminState>({
    isAdmin: false,
    isLoading: true,
    userId: null,
    userRole: null,
  });

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setState({
            isAdmin: false,
            isLoading: false,
            userId: null,
            userRole: null,
          });
          return;
        }

        // users 테이블에서 role 확인
        const { data: userData, error } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single() as { data: { role: string } | null, error: any };

        if (error || !userData) {
          console.error('사용자 정보 조회 실패:', error);
          setState({
            isAdmin: false,
            isLoading: false,
            userId: user.id,
            userRole: 'user',
          });
          return;
        }

        setState({
          isAdmin: userData.role === 'admin',
          isLoading: false,
          userId: user.id,
          userRole: userData.role || 'user',
        });
      } catch (error) {
        console.error('관리자 권한 확인 실패:', error);
        setState({
          isAdmin: false,
          isLoading: false,
          userId: null,
          userRole: null,
        });
      }
    };

    checkAdmin();

    // 인증 상태 변경 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkAdmin();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return state;
}

export default useAdmin;
