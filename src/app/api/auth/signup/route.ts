// src/app/api/auth/signup/route.ts
// 회원가입 API

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, nickname } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: '이메일과 비밀번호를 입력해주세요.' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nickname: nickname || email.split('@')[0],
        },
      },
    });

    if (error) {
      console.error('회원가입 실패:', error);
      return NextResponse.json(
        { error: error.message || '회원가입에 실패했습니다.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: '회원가입 성공. 이메일을 확인해주세요.',
      user: data.user,
    });
  } catch (error) {
    console.error('서버 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
