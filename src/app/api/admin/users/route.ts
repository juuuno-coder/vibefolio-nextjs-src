import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { supabase } from '@/lib/supabase/client';

// 사용자 목록 조회
export async function GET(request: NextRequest) {
  try {
    console.log("[Admin API] Start fetching users...");
    
    // 1. profiles fetch (DB 데이터 조회)
    // supabaseAdmin이 준비 안 됐다면 일반 클라이언트 폴백 시도
    let { data: profiles, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*');

    if (profileError || !profiles) {
      console.warn("[Admin API] Admin client failed, trying public client fallback");
      const { data: publicProfiles, error: publicError } = await supabase
        .from('profiles')
        .select('*');
      
      if (publicError) {
        return NextResponse.json({ users: [], error: publicError.message });
      }
      profiles = publicProfiles;
    }

    // 2. Auth list fetch (실패해도 무시)
    let authUsers: any[] = [];
    try {
      if (supabaseAdmin && !supabaseAdmin.toString().includes('Proxy')) {
        const { data, error: authError } = await supabaseAdmin.auth.admin.listUsers();
        if (!authError && data) {
          authUsers = data.users;
        }
      }
    } catch (e) {
      console.warn("[Admin API] Auth list sync skipped.");
    }

    // 3. Merge data (어떤 필드명이 들어있든 유연하게 처리)
    const combinedUsers = (profiles || []).map((p: any) => {
      const authUser = authUsers.find((u: any) => u.id === p.id);
      return {
        id: p.id,
        email: p.email || authUser?.email || '이메일 없음',
        username: p.username || p.nickname || p.full_name || '이름 없음',
        profile_image_url: p.avatar_url || p.profile_image_url || '/globe.svg',
        role: p.role || 'user',
        created_at: p.created_at || authUser?.created_at || new Date().toISOString()
      };
    });

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
    const { userId, role } = body;

    if (!userId || !role) {
      return NextResponse.json({ error: 'Missing userId or role' }, { status: 400 });
    }

    // Auth Metadata 업데이트 (미들웨어용)
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { app_metadata: { role } }
    );

    // Profiles 테이블 업데이트 (UI/DB용)
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ role })
      .eq('id', userId);

    if (authError || profileError) {
      return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    }

    return NextResponse.json({ success: true, role });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
