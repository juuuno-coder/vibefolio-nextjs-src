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
    const { data, error } = await supabase
      .from('inquiries')
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

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Contact API Error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' },
      { status: 500 }
    );
  }
}
