"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // URL에서 code 파라미터 확인
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('세션 오류:', sessionError);
          router.push('/login?error=auth_failed');
          return;
        }

        if (!session) {
          router.push('/login');
          return;
        }

        const user = session.user;

        // profiles 테이블에 사용자가 있는지 확인
        const { data: existingProfile, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .single();

        // 프로필이 없으면 생성
        if (!existingProfile && !profileError) {
          const { error: insertError } = await (supabase
            .from('profiles') as any)
            .insert({
              id: user.id,
              email: user.email,
              username: user.user_metadata?.full_name || 
                       user.user_metadata?.name || 
                       user.email?.split('@')[0] || 
                       'user',
              avatar_url: user.user_metadata?.avatar_url || 
                         user.user_metadata?.picture || 
                         null,
              role: 'user',
              created_at: new Date().toISOString(),
            });

          if (insertError) {
            console.error('프로필 생성 실패:', insertError);
          } else {
            console.log('✅ 프로필 자동 생성 완료');
          }
        }

        // 메인 페이지로 리다이렉트
        router.push('/');
        
      } catch (error) {
        console.error('콜백 처리 오류:', error);
        router.push('/login?error=callback_failed');
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin text-[#4ACAD4] mx-auto mb-4" />
        <p className="text-gray-600">로그인 처리 중...</p>
      </div>
    </div>
  );
}
