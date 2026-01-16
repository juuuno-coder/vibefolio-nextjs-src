// src/app/api/tools/search-opportunity/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { crawlByType } from '@/lib/crawlers/crawler';
import { createClient } from '@supabase/supabase-js';

// Supabase Admin Client for logging
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export async function POST(request: NextRequest) {
  try {
    const { keyword } = await request.json();

    if (!keyword) {
      return NextResponse.json({ success: false, error: 'Keyword is required' }, { status: 400 });
    }

    console.log(`[Opportunity Tool] Searching for: ${keyword}`);

    // 사용자 식별 (로그 기록용)
    const authHeader = request.headers.get('Authorization');
    let userId = null;
    
    if (authHeader) {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user } } = await supabaseAdmin.auth.getUser(token);
        if (user) userId = user.id;
    }

    // 통합 크롤링 실행 (MCP + Web)
    const result = await crawlByType('contest', keyword);

    // 검색 기록 저장 (로그인한 유저만)
    if (userId) {
        // 비동기로 저장 (사용자 응답 지연 방지)
        supabaseAdmin.from('ai_search_logs').insert({
            user_id: userId,
            keyword: keyword,
            items_found: result.itemsFound,
            search_type: 'opportunity'
        }).then(({ error }) => {
            if (error) console.error('[History Log Error]', error);
        });
    }

    return NextResponse.json({
      success: true,
      items: result.items || [],
      count: result.itemsFound
    });

  } catch (error) {
    console.error('[Opportunity Tool] Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
