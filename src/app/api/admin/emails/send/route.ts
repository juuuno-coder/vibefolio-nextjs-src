// app/api/admin/emails/send/route.ts
// Admin Email Send API

import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email/resend';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { from, to, subject, message } = body;

    if (!to || !subject || !message) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다' },
        { status: 400 }
      );
    }

    // HTML 템플릿 생성
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #16a34a 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Vibefolio</h1>
        </div>
        
        <div style="background: white; padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
          <div style="white-space: pre-wrap; line-height: 1.6; color: #374151;">
            ${message.replace(/\n/g, '<br>')}
          </div>
        </div>
        
        <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
          <p>© 2026 Vibefolio. All rights reserved.</p>
          <p>이 이메일은 Vibefolio 관리자가 발송했습니다.</p>
        </div>
      </div>
    `;

    const result = await sendEmail({
      from: `Vibefolio <${from}>`,
      to,
      subject,
      html,
      text: message,
    });

    return NextResponse.json({
      success: true,
      id: result.id,
    });

  } catch (error: any) {
    console.error('[Admin Email Send] Error:', error);
    return NextResponse.json(
      { error: error.message || '이메일 발송 실패' },
      { status: 500 }
    );
  }
}
