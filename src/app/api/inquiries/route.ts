import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

// 문의 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    // 관리자 확인
    const { data: admin } = await (supabase as any)
      .from('Admin')
      .select('*')
      .eq('user_id', user.id)
      .single();

    let query = (supabase as any)
      .from('Inquiry')
      .select('*')
      .order('created_at', { ascending: false });

    // 일반 사용자는 본인 문의만 조회
    if (!admin) {
      query = query.eq('user_id', user.id);
    }

    const { data, error } = await query;

    if (error) {
      console.error('문의 조회 실패:', error);
      return NextResponse.json(
        { error: '문의를 불러올 수 없습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ inquiries: data });
  } catch (error) {
    console.error('서버 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 문의 등록
export async function POST(request: NextRequest) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, content } = body;

    const { data, error } = await (supabase as any)
      .from('Inquiry')
      .insert({
        user_id: user.id,
        title,
        content,
      })
      .select()
      .single();

    if (error) {
      console.error('문의 등록 실패:', error);
      return NextResponse.json(
        { error: '문의 등록에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ inquiry: data });
  } catch (error) {
    console.error('서버 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
