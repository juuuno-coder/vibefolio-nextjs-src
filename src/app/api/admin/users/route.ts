import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

// 사용자 목록 조회
export async function GET(request: NextRequest) {
  try {
    // 1. profiles fetch (DB 데이터는 대개 타임아웃 확률이 낮음)
    const { data: profiles, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (profileError) {
      console.error("Profile Fetch Error:", profileError);
      throw profileError;
    }

    // 2. Auth list fetch (타임아웃이나 에러가 잦으므로 별도로 처리)
    let authUsers: any[] = [];
    try {
      const { data, error: authError } = await supabaseAdmin.auth.admin.listUsers();
      if (!authError && data) {
        authUsers = data.users;
      } else if (authError) {
        console.warn("Auth list fetch warning:", authError.message);
      }
    } catch (e) {
      console.error("Auth list fetch timeout or crash:", e);
      // 그냥 빈 배열로 넘어가서 최소한 profile 리스트는 보이게 함
    }

    // 3. Merge data (profile + email from auth if available)
    const combinedUsers = profiles.map((profile: any) => {
      const authUser = authUsers.find((u: any) => u.id === profile.id);
      return {
        ...profile,
        email: authUser?.email || profile.email || 'No Email', // profile에도 email이 있을 수 있음
        last_sign_in_at: authUser?.last_sign_in_at,
        created_at: profile.created_at || authUser?.created_at,
        role: profile.role || 'user'
      };
    });

    return NextResponse.json({ users: combinedUsers });
  } catch (error: any) {
    console.error("Admin Users GET Error:", error);
    return NextResponse.json({ error: error.message, users: [] }, { status: 500 });
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
