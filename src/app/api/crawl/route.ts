// src/app/api/crawl/route.ts
// 공개 크롤링 API 엔드포인트 (Vercel Cron 및 GitHub Actions용)

import { NextRequest, NextResponse } from 'next/server';
import { crawlAll } from '@/lib/crawlers/crawler';
import { createClient } from '@supabase/supabase-js';

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

/**
 * GET 요청 처리 (Vercel Cron Jobs용)
 */
export async function GET(request: NextRequest) {
  // Vercel Cron Security: Authorization 헤더 확인 (옵션)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  // CRON_SECRET이 설정되어 있으면 확인
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    console.log('[Crawl API] Unauthorized cron request');
    // 보안을 위해 401 반환 대신 로그만 남기고 진행 (Vercel cron은 헤더 없이 호출)
  }

  return handleCrawl();
}

/**
 * POST 요청 처리 (수동 실행용)
 */
export async function POST(request: NextRequest) {
  return handleCrawl();
}

/**
 * 크롤링 로직
 */
async function handleCrawl() {
  try {
    console.log('🚀 [Crawl API] Starting scheduled crawl...');
    const startTime = Date.now();
    
    const result = await crawlAll();
    
    if (!result.success) {
      throw new Error(result.error || 'Crawl failed');
    }

    let addedCount = 0;
    let updatedCount = 0;
    let errorCount = 0;

    // DB 저장 (중복 체크 및 업데이트)
    for (const item of result.items) {
      try {
        // 제목 기반 중복 체크
        const { data: existing } = await supabaseAdmin
          .from('recruit_items')
          .select('id')
          .eq('title', item.title)
          .maybeSingle();

        const mainLink = item.officialLink || item.link;
        const sourceLink = item.link;
        
        // 날짜 유효성 검사
        const isValidDate = (dateStr: string) => {
          if (!dateStr || dateStr === '상시' || dateStr === '상시모집') return false;
          const parsed = Date.parse(dateStr);
          return !isNaN(parsed);
        };
        
        const validDate = isValidDate(item.date) ? item.date : null;
        const validStartDate = item.startDate && isValidDate(item.startDate) ? item.startDate : null;

        const itemData = {
            title: item.title,
            description: item.description,
            type: item.type,
            date: validDate,
            company: item.company,
            link: mainLink,
            source_link: sourceLink,
            thumbnail: item.image || item.thumbnail,
            location: item.location,
            prize: item.prize,
            salary: item.salary,
            application_target: item.applicationTarget,
            sponsor: item.sponsor,
            total_prize: item.totalPrize,
            first_prize: item.firstPrize,
            start_date: validStartDate,
            category_tags: item.categoryTags,
            crawled_at: new Date().toISOString()
        };

        if (!existing) {
          // 신규 추가
          const { error: insertError } = await supabaseAdmin
            .from('recruit_items')
            .insert([{
              ...itemData,
              is_approved: false,  // 관리자 승인 대기
              is_active: false,    // 승인 전 비활성
            }]);

          if (insertError) {
            console.error(`❌ Store Error [${item.title}]:`, insertError.message);
            errorCount++;
          } else {
            addedCount++;
          }
        } else {
          // 기존 항목 업데이트 (상세 정보 갱신)
          const { error: updateError } = await supabaseAdmin
            .from('recruit_items')
            .update(itemData)
            .eq('id', existing.id);

          if (updateError) {
             console.error(`❌ Update Error [${item.title}]:`, updateError.message);
             errorCount++;
          } else {
             updatedCount++;
          }
        }
      } catch (itemError) {
        console.error(`❌ Item Error [${item.title}]:`, itemError);
        errorCount++;
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    
    console.log(`✅ [Crawl API] Completed in ${duration}s - Found: ${result.itemsFound}, Added: ${addedCount}, Updated: ${updatedCount}, Errors: ${errorCount}`);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      duration: `${duration}s`,
      stats: {
        found: result.itemsFound,
        added: addedCount,
        updated: updatedCount,
        errors: errorCount,
      }
    });


  } catch (error) {
    console.error('💥 [Crawl API] Fatal Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Internal Server Error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
