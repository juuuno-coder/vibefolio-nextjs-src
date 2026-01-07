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
    
    if (!error && session) {
      const { user } = session;
      
      // 프로필 생성/확인 로직 (Admin API 사용으로 권한 문제 해결)
      try {
        // 이미 트리거가 있다면 중복될 수 있지만, upsert로 안전하게 처리
        const { error: insertError } = await supabaseAdmin
          .from('profiles')
          .upsert({
            id: user.id,
            email: user.email,
            username: user.user_metadata?.full_name || 
                     user.user_metadata?.name || 
                     user.user_metadata?.nickname || 
                     user.email?.split('@')[0] || 
                     'user',
            avatar_url: user.user_metadata?.avatar_url || 
                       user.user_metadata?.picture || 
                       null,
            role: 'user',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }, { onConflict: 'id' });
          
        if (insertError) {
           console.error('[Auth Callback] Profile upsert failed:', insertError);
        } else {
           console.log('[Auth Callback] Profile upsert success');
        }
      } catch (e) {
        console.error('[Auth Callback] Profile logic error:', e);
      }
      
      // 성공 시 메인으로 이동
      return NextResponse.redirect(`${origin}`)
    }
  }

  // 에러 발생 시 로그인 페이지로 이동하여 에러 표시
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
}
