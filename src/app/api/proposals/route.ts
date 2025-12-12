import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

// 제안 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type'); // 'sent' or 'received'

    let query = (supabase as any)
      .from('Proposal')
      .select(`
        *,
        Project (
          project_id,
          title,
          thumbnail_url
        )
      `)
      .order('created_at', { ascending: false });

    if (type === 'sent') {
      query = query.eq('sender_id', user.id);
    } else if (type === 'received') {
      query = query.eq('receiver_id', user.id);
    } else {
      // 전체 (보낸 것 + 받은 것)
      query = query.or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('제안 조회 실패:', error);
      return NextResponse.json(
        { error: '제안을 불러올 수 없습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ proposals: data });
  } catch (error) {
    console.error('서버 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 제안 등록
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
    const { project_id, receiver_id, title, content, contact } = body;

    const { data, error } = await (supabase as any)
      .from('Proposal')
      .insert({
        project_id,
        sender_id: user.id,
        receiver_id,
        title,
        content,
        contact,
      })
      .select()
      .single();

    if (error) {
      console.error('제안 등록 실패:', error);
      return NextResponse.json(
        { error: '제안 등록에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ proposal: data });
  } catch (error) {
    console.error('서버 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
