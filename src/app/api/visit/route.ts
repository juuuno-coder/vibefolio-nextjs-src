import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function POST(request: NextRequest) {
  try {
    // Body Parsing (path, referrer from client)
    let body = {};
    try { body = await request.json(); } catch (e) {}
    const { path, referrer } = body as any;

    // 한국 시간 기준 날짜 구하기 (UTC+9)
    const now = new Date();
    const kstOffset = 9 * 60 * 60 * 1000;
    const kstDate = new Date(now.getTime() + kstOffset);
    const today = kstDate.toISOString().split('T')[0];
    
    // 1. 일별 집계 증가 (RPC 호출)
    const { error } = await (supabase.rpc as any)('increment_daily_visits', {
      target_date: today
    });

    if (error) {
       console.error("Visit count error:", error);
       // 집계 실패해도 로그는 남기도록 에러 반환 보류할 수도 있지만, 
       // 일단 에러 로깅만 하고 진행하지 않거나 500 리턴
    }

    // 2. 상세 방문 로그 저장 (비동기 수행)
    // 사용자 경험 저해하지 않도록 await 없이 백그라운드 처리 시도 
    // (Vercel 등 서버리스 환경에선 함수 종료 시 끊길 수 있으므로 await 권장이나, 응답 속도 위해 일단 fire-and-forget 시도. 
    //  중요하면 await 하거나 Edge Function 사용)
    const userAgent = request.headers.get('user-agent') || '';
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
    const isMobile = /mobile|android|iphone|ipad/i.test(userAgent);
    const deviceType = isMobile ? 'mobile' : 'desktop';

    (async () => {
      try {
        await (supabase as any).from('visit_logs').insert({
          ip_address: ip,
          user_agent: userAgent,
          device_type: deviceType,
          referrer: referrer || 'Direct', // Referrer 없으면 Direct
          path: path || '/'
        });
      } catch (logErr) {
        console.error("Visit Log Error:", logErr);
      }
    })();


    return NextResponse.json({ success: true, date: today });
  } catch (err: any) {
    console.error("Visit API Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
