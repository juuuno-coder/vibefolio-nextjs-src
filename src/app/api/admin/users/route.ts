import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

// 사용자 목록 조회
import { supabase } from '@/lib/supabase/client'; // 폴백용 일반 클라이언트 추가

export async function GET(request: NextRequest) {
  try {
    // 환경변수 체크 로그 (서버 로그에서 확인 가능)
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("[Admin API] CRITICAL: SUPABASE_SERVICE_ROLE_KEY is missing!");
    }

    // 1. profiles fetch 
    // supabaseAdmin이 준비 안 됐다면 일반 supabase 클라이언트라도 사용 (RLS가 허용한다는 가정하에)
    const client = supabaseAdmin && !supabaseAdmin.toString().includes('Proxy') ? supabaseAdmin : supabase;
    
    const { data: profiles, error: profileError } = await client
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (profileError) {
      console.error("Profile Fetch Error:", profileError);
      return NextResponse.json({ error: profileError.message, users: [] }, { status: 200 }); // 에러 나더라도 빈 배열 반환
    }

    // 2. Auth list fetch (실패해도 무시)
    let authUsers: any[] = [];
    if (supabaseAdmin && !supabaseAdmin.toString().includes('Proxy')) {
      try {
        const { data, error: authError } = await supabaseAdmin.auth.admin.listUsers();
        if (!authError && data) {
          authUsers = data.users;
        }
      } catch (e) {
        console.warn("Auth sync failed, but continuing with profiles only.");
      }
    }

    // 3. Merge data
    const combinedUsers = (profiles || []).map((profile: any) => {
      const authUser = authUsers.find((u: any) => u.id === profile.id);
      return {
        ...profile,
        email: authUser?.email || profile.email || 'No Email',
        last_sign_in_at: authUser?.last_sign_in_at,
        created_at: profile.created_at || authUser?.created_at,
        role: profile.role || 'user'
      };
    });

    console.log(`[Admin API] Returning ${combinedUsers.length} users`);
    return NextResponse.json({ users: combinedUsers });
  } catch (error: any) {
    console.error("Admin Users GET Final Error:", error);
    return NextResponse.json({ error: error.message, users: [] }, { status: 200 });
  }
}

// 사용자 권한 수정
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, role } = body; // role: 'admin' | 'user'

    if (!userId || !['admin', 'user'].includes(role)) {
      return NextResponse.json({ error: 'Invalid userId or role' }, { status: 400 });
    }

    // 1. Auth User의 app_metadata 업데이트 (이게 핵심! 미들웨어 체크용)
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { app_metadata: { role } }
    );

    if (authError) {
      console.error("Auth Update Error:", authError);
      throw authError;
    }

    // 2. profiles 테이블 업데이트 (클라이언트 UI 표시용)
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ role })
      .eq('id', userId);

    if (profileError) {
      console.error("Profile Update Error:", profileError);
      throw profileError;
    }

    return NextResponse.json({ success: true, role });
  } catch (error: any) {
    console.error("Admin Users PATCH Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
