import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

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
    
    // 1. 일별 집계 증가 (RPC 호출 - Admin 권한 사용)
    const { error } = await supabaseAdmin.rpc('increment_daily_visits', {
      target_date: today
    });

    if (error) {
       console.error("Visit count error:", error);
    }

    // 2. 상세 방문 로그 저장 (비동기 수행 - Admin 권한 사용)
    const userAgent = request.headers.get('user-agent') || '';
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
    const isMobile = /mobile|android|iphone|ipad/i.test(userAgent);
    const deviceType = isMobile ? 'mobile' : 'desktop';

    (async () => {
      try {
        await supabaseAdmin.from('visit_logs').insert({
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
