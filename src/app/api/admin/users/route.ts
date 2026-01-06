import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

// 사용자 목록 조회
export async function GET(request: NextRequest) {
  try {
    // 1. users list fetch from Supabase Auth (to get emails)
    const { data: { users }, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (authError) throw authError;

    // 2. profiles fetch
    const { data: profiles, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (profileError) throw profileError;

    // 3. Merge data (profile + email from auth)
    const combinedUsers = profiles.map(profile => {
      const authUser = users.find(u => u.id === profile.id);
      return {
        ...profile,
        email: authUser?.email || '',
        last_sign_in_at: authUser?.last_sign_in_at,
        created_at: authUser?.created_at || profile.created_at,
        role: profile.role || 'user' // Ensure role exists
      };
    });

    return NextResponse.json({ users: combinedUsers });
  } catch (error: any) {
    console.error("Admin Users GET Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
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
