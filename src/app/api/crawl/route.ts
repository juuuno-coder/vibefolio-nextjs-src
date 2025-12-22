// src/app/api/crawl/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { crawlAll, crawlByType } from '@/lib/crawlers/crawler';
import { CrawledItem } from '@/lib/crawlers/types';

// Supabase 서비스 역할 클라이언트 (RLS 우회)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // 인증 확인 (관리자만 수동 크롤링 가능)
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 요청 본문 파싱
    const body = await request.json();
    const { type, secret } = body;

    // Cron job secret 확인 (스케줄러용)
    const cronSecret = process.env.CRON_SECRET || 'your-secret-key-here';
    if (secret !== cronSecret) {
      // Secret이 없거나 틀리면 사용자 인증 확인
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
      
      if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // 관리자 권한 확인
      const { data: userData } = await supabaseAdmin
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (userData?.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden: Admin only' }, { status: 403 });
      }
    }

    // 크롤링 실행
    const crawlResult = type && type !== 'all' 
      ? await crawlByType(type as 'job' | 'contest' | 'event')
      : await crawlAll();

    if (!crawlResult.success) {
      throw new Error(crawlResult.error || 'Crawling failed');
    }

    // 데이터베이스에 저장
    let itemsAdded = 0;
    let itemsUpdated = 0;

    for (const item of crawlResult.items) {
      // 중복 체크 (제목과 링크로)
      const { data: existing } = await supabaseAdmin
        .from('recruit_items')
        .select('id')
        .eq('title', item.title)
        .eq('link', item.link)
        .single();

      const itemData = {
        title: item.title,
        description: item.description,
        type: item.type,
        date: item.date,
        location: item.location,
        prize: item.prize,
        salary: item.salary,
        company: item.company,
        employment_type: item.employmentType,
        link: item.link,
        thumbnail: item.thumbnail,
        is_crawled: true,
        source_url: item.sourceUrl,
        crawled_at: new Date().toISOString(),
        is_active: true,
      };

      if (existing) {
        // 업데이트
        await supabaseAdmin
          .from('recruit_items')
          .update(itemData)
          .eq('id', existing.id);
        itemsUpdated++;
      } else {
        // 새로 추가
        await supabaseAdmin
          .from('recruit_items')
          .insert(itemData);
        itemsAdded++;
      }
    }

    const duration = Date.now() - startTime;

    // 크롤링 로그 저장
    await supabaseAdmin.from('crawl_logs').insert({
      type: type || 'all',
      status: 'success',
      items_found: crawlResult.itemsFound,
      items_added: itemsAdded,
      items_updated: itemsUpdated,
      duration_ms: duration,
    });

    return NextResponse.json({
      success: true,
      itemsFound: crawlResult.itemsFound,
      itemsAdded,
      itemsUpdated,
      duration,
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // 에러 로그 저장
    await supabaseAdmin.from('crawl_logs').insert({
      type: 'all',
      status: 'failed',
      items_found: 0,
      items_added: 0,
      items_updated: 0,
      error_message: errorMessage,
      duration_ms: duration,
    });

    console.error('Crawl error:', error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// GET 요청으로 크롤링 상태 확인
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 관리자 권한 확인
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userData?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin only' }, { status: 403 });
    }

    // 최근 크롤링 로그 조회
    const { data: logs, error } = await supabaseAdmin
      .from('crawl_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;

    // 통계 정보
    const { data: stats } = await supabaseAdmin
      .from('recruit_items')
      .select('type, is_crawled')
      .eq('is_active', true);

    const statistics = {
      total: stats?.length || 0,
      crawled: stats?.filter(s => s.is_crawled).length || 0,
      manual: stats?.filter(s => !s.is_crawled).length || 0,
      byType: {
        job: stats?.filter(s => s.type === 'job').length || 0,
        contest: stats?.filter(s => s.type === 'contest').length || 0,
        event: stats?.filter(s => s.type === 'event').length || 0,
      },
    };

    return NextResponse.json({
      logs,
      statistics,
    });

  } catch (error) {
    console.error('Error fetching crawl status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch crawl status' },
      { status: 500 }
    );
  }
}
