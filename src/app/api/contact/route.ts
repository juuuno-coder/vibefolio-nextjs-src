import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client'; // 기존 파일 경로 참고

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, title, message } = body;

    // 간단한 유효성 검사
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: '필수 항목(이름, 이메일, 내용)을 모두 입력해주세요.' },
        { status: 400 }
      );
    }

    // inquiries 테이블에 저장
    const { data, error } = await (supabase
      .from('inquiries') as any)
      .insert([
        {
          name,
          email,
          phone,
          title,
          message,
          // user_id는 선택사항이며, 로그인 상태라면 클라이언트에서 보낼 수도 있으나
          // 여기서는 비로그인 문의도 허용하는 것으로 가정
          status: 'pending'
        },
      ])
      .select();

    if (error) {
      console.error('Database Error:', error);
      throw error;
    }


    // 로그 기록
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    // Non-blocking logging
    (async () => {
      try {
        await (supabase as any).from('activity_logs').insert({
           action: 'CREATE_INQUIRY',
           target_type: 'INQUIRY',
           target_id: data && data[0]?.id ? String(data[0].id) : null,
           details: { title, name, email },
           ip_address: ip,
           user_agent: userAgent
        });
      } catch (logError) {
        console.warn('Failed to log inquiry activity:', logError);
      }
    })();

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Contact API Error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' },
      { status: 500 }
    );
  }
}
