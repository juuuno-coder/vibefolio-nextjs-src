import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  
  if (code) {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.delete({ name, ...options })
          },
        },
      }
    )
    
    const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('[Auth Callback] Exchange Error:', error);
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`)
    }

    if (session) {
      const { user } = session;
      
      // 프로필 생성/확인 로직 - 최소 필드만 사용하여 안전성 확보
      try {
        // 기본 프로필 데이터 (확실히 존재하는 필드만 사용)
        const profileData: any = {
          id: user.id,
          username: user.user_metadata?.full_name || 
                   user.user_metadata?.name || 
                   user.user_metadata?.nickname || 
                   user.email?.split('@')[0] || 
                   'user',
        };

        // avatar_url이 있으면 추가
        if (user.user_metadata?.avatar_url || user.user_metadata?.picture) {
          profileData.avatar_url = user.user_metadata?.avatar_url || user.user_metadata?.picture;
        }

        // 프로필 upsert (충돌 시 업데이트)
        const { error: insertError } = await supabaseAdmin
          .from('profiles')
          .upsert(profileData, { 
            onConflict: 'id',
            ignoreDuplicates: false  // 기존 데이터 업데이트
          });
          
        if (insertError) {
           console.error('[Auth Callback] Profile upsert failed:', insertError);
           // 에러가 발생해도 로그인은 계속 진행 (프로필은 나중에 수동으로 생성 가능)
        } else {
           console.log('[Auth Callback] Profile upsert success for user:', user.id);
        }
      } catch (e) {
        console.error('[Auth Callback] Profile logic error:', e);
        // 프로필 생성 실패해도 로그인은 계속 진행
      }
      
      // 성공 시 메인으로 이동
      return NextResponse.redirect(`${origin}`)
    }
  }

  // 코드가 없거나 세션이 없는 경우
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed&reason=no_session`)
}
