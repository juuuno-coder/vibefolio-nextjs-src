// app/api/webhooks/resend/route.ts
// Resend Inbound Email Webhook

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('[Resend Webhook] Received:', body);

    // Resend inbound email 데이터 구조
    const {
      from,
      to,
      subject,
      text,
      html,
      headers,
      attachments,
    } = body;

    // 수신 이메일 저장
    const { error } = await (supabaseAdmin as any)
      .from('received_emails')
      .insert({
        from_email: from,
        to_email: to,
        subject: subject || '(제목 없음)',
        text_content: text,
        html_content: html,
        headers: headers,
        attachments: attachments,
        raw_data: body,
      });

    if (error) {
      console.error('[Resend Webhook] Save error:', error);
      // 테이블이 없으면 무시 (나중에 생성)
    }

    // 자동 응답 (옵션)
    // if (from && to?.includes('support@vibefolio.net')) {
    //   await sendEmail({
    //     from: 'Vibefolio <support@vibefolio.net>',
    //     to: from,
    //     subject: `Re: ${subject}`,
    //     html: '<p>문의해주셔서 감사합니다. 빠른 시일 내에 답변드리겠습니다.</p>',
    //   });
    // }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('[Resend Webhook] Error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// GET 요청 허용 (Resend verification)
export async function GET(request: NextRequest) {
  return NextResponse.json({ status: 'ok' });
}
