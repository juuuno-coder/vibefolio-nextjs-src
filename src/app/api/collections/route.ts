// src/app/api/collections/route.ts
// 컬렉션 폴더 관리 API

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

// 컬렉션 목록 조회
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: '인증에 실패했습니다.' },
        { status: 401 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('Collection')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('컬렉션 조회 실패:', error);
      return NextResponse.json(
        { error: '컬렉션 조회에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ collections: data });
  } catch (error) {
    console.error('서버 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 컬렉션 생성
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: '인증에 실패했습니다.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, description, is_public } = body;

    if (!name) {
      return NextResponse.json(
        { error: '컬렉션 이름이 필요합니다.' },
        { status: 400 }
      );
    }

    const { data, error } = await (supabaseAdmin as any)
      .from('Collection')
      .insert([{
        user_id: user.id,
        name,
        description: description || '',
        is_public: is_public || false
      }] as any)
      .select()
      .single();

    if (error) {
      console.error('컬렉션 생성 실패:', error);
      return NextResponse.json(
        { error: '컬렉션 생성에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ collection: data });
  } catch (error) {
    console.error('서버 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
