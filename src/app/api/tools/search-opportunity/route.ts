// src/app/api/tools/search-opportunity/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { crawlByType } from '@/lib/crawlers/crawler';
import { searchMcp } from '@/lib/crawlers/haebojago';
import { createClient } from '@supabase/supabase-js';

// Supabase Admin Client for logging
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export async function POST(request: NextRequest) {
  try {
    const { keyword, category = 'opportunity' } = await request.json();

    if (!keyword) {
      return NextResponse.json({ success: false, error: 'Keyword is required' }, { status: 400 });
    }

    console.log(`[Opportunity Tool] Searching for: ${keyword} (Category: ${category})`);

    // 사용자 식별 (로그 기록용)
    const authHeader = request.headers.get('Authorization');
    let userId = null;
    
    if (authHeader) {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user } } = await supabaseAdmin.auth.getUser(token);
        if (user) userId = user.id;
    }

    let resultItems: any[] = [];
    let itemsFound = 0;

    // 카테고리별 검색 로직 분기
    if (['job', 'trend', 'recipe', 'tool'].includes(category)) {
        // AI 특화 기능은 MCP 전용 검색 사용
        resultItems = await searchMcp(category, keyword);
        itemsFound = resultItems.length;
    } else {
        // 기본 '기회 탐색(opportunity)'은 웹 크롤링 + MCP 통합 검색
        const result = await crawlByType('contest', keyword);
        resultItems = result.items;
        itemsFound = result.itemsFound;
    }

    // 검색 기록 저장 (로그인한 유저만)
    if (userId) {
        supabaseAdmin.from('ai_search_logs').insert({
            user_id: userId,
            keyword: keyword,
            items_found: itemsFound,
            search_type: category // Store specific category
        }).then(({ error }) => {
            if (error) console.error('[History Log Error]', error);
        });
    }

    return NextResponse.json({
      success: true,
      items: resultItems || [],
      count: itemsFound
    });

  } catch (error) {
    console.error('[Opportunity Tool] Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
