// src/app/api/users/[id]/route.ts
// Supabase Auth만 사용하는 사용자 프로필 API

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

// 사용자 프로필 조회 (Auth user_metadata 사용)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    // Auth에서 사용자 정보 가져오기
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.getUserById(id);
    
    if (authError || !authData.user) {
      console.error('Auth 사용자 조회 실패:', authError);
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const authUser = authData.user;

    // user_metadata에서 프로필 정보 추출
    const user = {
      id: authUser.id,
      email: authUser.email,
      username: authUser.user_metadata?.username || authUser.user_metadata?.nickname || authUser.email?.split('@')[0] || 'User',
      bio: authUser.user_metadata?.bio || '',
      profile_image_url: authUser.user_metadata?.profile_image_url || authUser.user_metadata?.avatar_url || '/globe.svg',
      cover_image_url: authUser.user_metadata?.cover_image_url || null,
      role: authUser.user_metadata?.role || 'user',
      created_at: authUser.created_at,
    };

    return NextResponse.json({ user });
  } catch (error) {
    console.error('서버 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 사용자 프로필 수정 (Auth user_metadata 업데이트)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const { username, bio, profile_image_url, cover_image_url } = body;

    // 현재 user_metadata 가져오기
    const { data: authData, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(id);
    
    if (getUserError || !authData.user) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // user_metadata 업데이트
    const updatedMetadata = {
      ...authData.user.user_metadata,
      ...(username && { username }),
      ...(bio !== undefined && { bio }),
      ...(profile_image_url && { profile_image_url }),
      ...(cover_image_url !== undefined && { cover_image_url }),
    };

    console.log('user_metadata 업데이트:', updatedMetadata);

    // Auth 사용자 업데이트
    const { data: updateData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      id,
      { user_metadata: updatedMetadata }
    );

    if (updateError) {
      console.error('프로필 수정 실패:', updateError);
      return NextResponse.json(
        { error: `프로필 수정에 실패했습니다: ${updateError.message}` },
        { status: 500 }
      );
    }

    const updatedUser = updateData.user;
    const user = {
      id: updatedUser.id,
      email: updatedUser.email,
      username: updatedUser.user_metadata?.username || updatedUser.user_metadata?.nickname,
      bio: updatedUser.user_metadata?.bio,
      profile_image_url: updatedUser.user_metadata?.profile_image_url || updatedUser.user_metadata?.avatar_url,
      cover_image_url: updatedUser.user_metadata?.cover_image_url,
      role: updatedUser.user_metadata?.role || 'user',
      created_at: updatedUser.created_at,
    };

    console.log('프로필 수정 성공:', user);

    return NextResponse.json({
      message: '프로필이 수정되었습니다.',
      user,
    });
  } catch (error: any) {
    console.error('서버 오류:', error);
    return NextResponse.json(
      { error: `서버 오류가 발생했습니다: ${error.message}` },
      { status: 500 }
    );
  }
}
