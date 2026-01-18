// app/api/admin/emails/route.ts
// Admin Email List API

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  try {
    // 수신 이메일 목록 조회 (received_emails 테이블)
    const { data: emails, error } = await (supabaseAdmin as any)
      .from('received_emails')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('[Admin Emails] Fetch error:', error);
      // 테이블이 없으면 빈 배열 반환
      return NextResponse.json({ success: true, emails: [] });
    }

    return NextResponse.json({
      success: true,
      emails: emails || [],
    });

  } catch (error: any) {
    console.error('[Admin Emails] Error:', error);
    return NextResponse.json(
      { error: error.message || '이메일 조회 실패' },
      { status: 500 }
    );
  }
}
