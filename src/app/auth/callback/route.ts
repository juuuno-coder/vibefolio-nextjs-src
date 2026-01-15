import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const type = searchParams.get('type') // 'recovery', 'signup', 'invite' 등
  const next = searchParams.get('next') // 리다이렉트 URL
  
  // 해시 파라미터에서 토큰 추출 (Supabase가 # 뒤에 토큰을 붙이는 경우)
  // 참고: 서버에서는 hash를 직접 읽을 수 없으므로, 클라이언트 처리 필요
  
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
      
      // 비밀번호 재설정 요청인 경우 -> /reset-password로 리다이렉트
      if (type === 'recovery') {
        console.log('[Auth Callback] Password recovery - redirecting to reset-password');
        return NextResponse.redirect(`${origin}/reset-password`)
      }
      
      // 이메일 확인인 경우 -> 메인으로 이동 (또는 next 파라미터)
      if (type === 'signup' || type === 'email') {
        console.log('[Auth Callback] Email verified - redirecting to main');
        return NextResponse.redirect(next ? `${origin}${next}` : `${origin}`)
      }
      
      // 일반 로그인 - 프로필 생성/확인 로직
      try {
        // 1. 기존 프로필 존재 여부 확인 (신규 가입자에게만 포인트 지급)
        const { data: existingProfile } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .single();

        const profileData: any = {
          id: user.id,
          username: user.user_metadata?.full_name || 
                   user.user_metadata?.name || 
                   user.user_metadata?.nickname || 
                   user.email?.split('@')[0] || 
                   'user',
        };

        if (user.user_metadata?.avatar_url || user.user_metadata?.picture) {
          profileData.avatar_url = user.user_metadata?.avatar_url || user.user_metadata?.picture;
        }
        
        // 2. 신규 유저라면 1000 포인트 지급 및 로그 기록
        if (!existingProfile) {
            console.log('[Auth] New User detected! Awarding 1000 points.');
            profileData.points = 1000;
            
            // 포인트 로그 기록 (비동기 처리)
            await supabaseAdmin.from('point_logs').insert({
                user_id: user.id,
                amount: 1000,
                reason: '회원가입 축하 내공'
            });
        }

        const { error: insertError } = await supabaseAdmin
          .from('profiles')
          .upsert(profileData, { 
            onConflict: 'id',
            ignoreDuplicates: false // 기존 데이터가 있으면 덮어쓰기 (포인트는 기존에 있으면 undefined라 덮어써지지 않음? upsert behavior check needed)
             // Upsert with simple object usually overwrites all keys present in object.
             // If profileData doesn't have 'points' key (existing user), it won't touch 'points' column in DB?
             // Yes, Supabase/Postgres update only updates columns present in the query.
          });
          
        if (insertError) {
           console.error('[Auth Callback] Profile upsert failed:', insertError);
        } else {
           console.log('[Auth Callback] Profile upsert success for user:', user.id);
        }
      } catch (e) {
        console.error('[Auth Callback] Profile logic error:', e);
      }
      
      // 성공 시 메인으로 이동 (또는 next 파라미터)
      return NextResponse.redirect(next ? `${origin}${next}` : `${origin}`)
    }
  }

  // 코드가 없거나 세션이 없는 경우
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed&reason=no_session`)
}

