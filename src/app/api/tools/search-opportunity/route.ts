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

// [New] 최근 검색 기록 조회
export async function GET(req: NextRequest) {
  try {
     const authHeader = req.headers.get('Authorization');
     if (!authHeader) return NextResponse.json({ history: [] }); // 비로그인은 기록 없음

     const token = authHeader.replace('Bearer ', '');
     const { data: { user } } = await supabaseAdmin.auth.getUser(token);
     
     if (!user) return NextResponse.json({ history: [] });

     // 최근 10개의 고유 검색어 조회
     const { data: logs } = await supabaseAdmin
        .from('ai_search_logs')
        .select('keyword, search_type, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

     if (!logs || logs.length === 0) return NextResponse.json({ history: [] });

     // 클라이언트에서 중복 제거 및 포맷팅 (Log 테이블 컬럼명 확인: search_type vs category)
     // 코드 55라인에서 `search_type: category`로 넣고 있음.
     const uniqueHistory: any[] = [];
     const seen = new Set();
     
     for (const log of logs) {
         const key = `${log.keyword}-${log.search_type}`; // 키워드+카테고리 조합으로 유니크 체크
         if (!seen.has(key)) {
             seen.add(key);
             uniqueHistory.push({
                 keyword: log.keyword,
                 category: log.search_type || 'opportunity',
                 created_at: log.created_at
             });
         }
         if (uniqueHistory.length >= 7) break; // 최대 7개
     }

     return NextResponse.json({ history: uniqueHistory });

  } catch (error: any) {
     return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

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
