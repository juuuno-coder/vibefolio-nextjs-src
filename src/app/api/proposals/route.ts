import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

// 제안 목록 조회
export async function GET(request: NextRequest) {
  try {
    // Authorization 헤더에서 토큰 추출
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

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type'); // 'sent' or 'received'

    let query = supabaseAdmin
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
        { error: '제안을 불러올 수 없습니다.', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ proposals: data });
  } catch (error: any) {
    console.error('서버 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.', details: error.message },
      { status: 500 }
    );
  }
}

// 제안 등록
export async function POST(request: NextRequest) {
  try {
    // Authorization 헤더에서 토큰 추출
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
    const { project_id, receiver_id, title, content, contact } = body;

    // 필수 필드 검증
    if (!project_id || !receiver_id || !title || !content) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다. (project_id, receiver_id, title, content)' },
        { status: 400 }
      );
    }

    // 자기 자신에게 제안 불가
    if (receiver_id === user.id) {
      return NextResponse.json(
        { error: '본인에게는 제안할 수 없습니다.' },
        { status: 400 }
      );
    }

    const { data, error } = await (supabaseAdmin as any)
      .from('Proposal')
      .insert({
        project_id,
        sender_id: user.id,
        receiver_id,
        title,
        content,
        contact: contact || '',
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('제안 등록 실패:', error);
      return NextResponse.json(
        { error: '제안 등록에 실패했습니다.', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ proposal: data, message: '제안이 성공적으로 전송되었습니다.' });
  } catch (error: any) {
    console.error('서버 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.', details: error.message },
      { status: 500 }
    );
  }
}
