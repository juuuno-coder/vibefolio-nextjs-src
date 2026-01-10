import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function POST(request: NextRequest) {
  try {
    // 한국 시간 기준 날짜 구하기 (UTC+9)
    // 서버 시간이 UTC일 수 있으므로 오프셋 적용
    const now = new Date();
    const kstOffset = 9 * 60 * 60 * 1000;
    const kstDate = new Date(now.getTime() + kstOffset);
    const today = kstDate.toISOString().split('T')[0];
    
    // RPC 호출 (increment_daily_visits)
    // .gemini/CREATE_VISIT_INCREMENT_FUNCTION.sql 함수가 DB에 있어야 함.
    const { error } = await (supabase.rpc as any)('increment_daily_visits', {
      target_date: today
    });

    if (error) {
       console.error("Visit count error:", error);
       return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, date: today });
  } catch (err: any) {
    console.error("Visit API Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
