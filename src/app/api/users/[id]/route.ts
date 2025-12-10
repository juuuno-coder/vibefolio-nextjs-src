// src/app/api/users/[id]/route.ts
// 사용자 프로필 조회 및 수정 API

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import bcrypt from 'bcryptjs';

// 사용자 프로필 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;

    const { data: user, error } = await supabaseAdmin
      .from('User')
      .select('user_id, email, nickname, bio, profile_image_url, role, created_at')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (error || !user) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('서버 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 사용자 프로필 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;
    const body = await request.json();
    const { nickname, bio, profile_image_url, current_password, new_password } = body;

    // 현재 사용자 정보 조회
    const { data: currentUser } = await supabaseAdmin
      .from('User')
      .select('password')
      .eq('user_id', userId)
      .single();

    if (!currentUser) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 비밀번호 변경 시 현재 비밀번호 확인
    if (new_password) {
      if (!current_password) {
        return NextResponse.json(
          { error: '현재 비밀번호를 입력해주세요.' },
          { status: 400 }
        );
      }

      const isPasswordValid = await bcrypt.compare(current_password, currentUser.password);
      if (!isPasswordValid) {
        return NextResponse.json(
          { error: '현재 비밀번호가 일치하지 않습니다.' },
          { status: 400 }
        );
      }
    }

    // 업데이트할 데이터 준비
    const updateData: any = {};
    if (nickname) updateData.nickname = nickname;
    if (bio !== undefined) updateData.bio = bio;
    if (profile_image_url) updateData.profile_image_url = profile_image_url;
    if (new_password) {
      const hashedPassword = await bcrypt.hash(new_password, 10);
      updateData.password = hashedPassword;
    }

    // 프로필 업데이트
    const { data, error } = await supabaseAdmin
      .from('User')
      .update(updateData)
      .eq('user_id', userId)
      .select('user_id, email, nickname, bio, profile_image_url, role, created_at')
      .single();

    if (error) {
      console.error('프로필 수정 실패:', error);
      return NextResponse.json(
        { error: '프로필 수정에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: '프로필이 수정되었습니다.',
      user: data,
    });
  } catch (error) {
    console.error('서버 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
