// 채용/공모전/이벤트 크롤링 API
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 사람인 채용 크롤링
async function crawlSaramin() {
  const items = [];
  try {
    const response = await fetch('https://www.saramin.co.kr/zf_user/jobs/list/job-category?cat_cd=404%2C405%2C406&panel_type=&search_optional_item=y&search_done=y&panel_count=y');
    const html = await response.text();
    const $ = cheerio.load(html);
    
    $('.item_recruit').each((i, el) => {
      if (i >= 10) return false; // 최대 10개
      
      const title = $(el).find('.job_tit a').text().trim();
      const company = $(el).find('.corp_name a').text().trim();
      const link = 'https://www.saramin.co.kr' + $(el).find('.job_tit a').attr('href');
      const deadline = $(el).find('.job_date .date').text().trim();
      
      if (title && company) {
        items.push({
          type: 'job',
          title,
          company,
          link,
          deadline,
          source: '사람인'
        });
      }
    });
  } catch (error) {
    console.error('사람인 크롤링 실패:', error);
  }
  
  return items;
}

// 씽굿 공모전 크롤링
async function crawlThinkgood() {
  const items = [];
  try {
    const response = await fetch('https://www.thinkcontest.com/Contest/AjaxList');
    const data = await response.json();
    
    data.slice(0, 10).forEach((item: any) => {
      items.push({
        type: 'contest',
        title: item.title,
        organizer: item.organizer,
        link: `https://www.thinkcontest.com/Contest/View/${item.id}`,
        deadline: item.deadline,
        prize: item.prize,
        source: '씽굿'
      });
    });
  } catch (error) {
    console.error('씽굿 크롤링 실패:', error);
  }
  
  return items;
}

// 온오프믹스 이벤트 크롤링  
async function crawlOnoffmix() {
  const items = [];
  try {
    const response = await fetch('https://www.onoffmix.com/event/main?c=100');
    const html = await response.text();
    const $ = cheerio.load(html);
    
    $('.event-list li').each((i, el) => {
      if (i >= 10) return false;
      
      const title = $(el).find('.event-title').text().trim();
      const link = 'https://www.onoffmix.com' + $(el).find('a').attr('href');
      const date = $(el).find('.event-date').text().trim();
      
      if (title) {
        items.push({
          type: 'event',
          title,
          link,
          date,
          source: '온오프믹스'
        });
      }
    });
  } catch (error) {
    console.error('온오프믹스 크롤링 실패:', error);
  }
  
  return items;
}

export async function GET(request: NextRequest) {
  try {
    // 크롤링 로그 조회
    const { data: logs } = await supabase
      .from('crawl_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    
    // 통계 조회
    const recruitItems = JSON.parse(localStorage.getItem('recruitItems') || '[]');
    const statistics = {
      total: recruitItems.length,
      crawled: recruitItems.filter((item: any) => item.source).length,
      manual: recruitItems.filter((item: any) => !item.source).length,
      byType: {
        job: recruitItems.filter((item: any) => item.type === 'job').length,
        contest: recruitItems.filter((item: any) => item.type === 'contest').length,
        event: recruitItems.filter((item: any) => item.type === 'event').length,
      }
    };
    
    return NextResponse.json({ logs: logs || [], statistics });
  } catch (error) {
    console.error('크롤링 상태 조회 실패:', error);
    return NextResponse.json({ error: 'Failed to fetch crawl status' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const { type = 'all' } = await request.json();
    
    let allItems: any[] = [];
    
    // 타입별 크롤링 실행
    if (type === 'all' || type === 'job') {
      const jobs = await crawlSaramin();
      allItems = [...allItems, ...jobs];
    }
    
    if (type === 'all' || type === 'contest') {
      const contests = await crawlThinkgood();
      allItems = [...allItems, ...contests];
    }
    
    if (type === 'all' || type === 'event') {
      const events = await crawlOnoffmix();
      allItems = [...allItems, ...events];
    }
    
    // localStorage에 저장 (임시 - 추후 DB로 이전)
    const existingItems = JSON.parse(localStorage.getItem('recruitItems') || '[]');
    const newItems = allItems.filter(item => 
      !existingItems.some((existing: any) => existing.link === item.link)
    );
    
    const updatedItems = [...existingItems, ...newItems];
    localStorage.setItem('recruitItems', JSON.stringify(updatedItems));
    
    // 크롤링 로그 저장
    const duration = Date.now() - startTime;
    await supabase.from('crawl_logs').insert({
      type,
      status: 'success',
      items_found: allItems.length,
      items_added: newItems.length,
      items_updated: 0,
      duration_ms: duration,
    });
    
    return NextResponse.json({
      success: true,
      itemsFound: allItems.length,
      itemsAdded: newItems.length,
      itemsUpdated: 0,
    });
    
  } catch (error: any) {
    console.error('크롤링 실패:', error);
    
    // 에러 로그 저장
    await supabase.from('crawl_logs').insert({
      type: 'all',
      status: 'error',
      items_found: 0,
      items_added: 0,
      items_updated: 0,
      error_message: error.message,
      duration_ms: Date.now() - startTime,
    });
    
    return NextResponse.json({ error: 'Crawl failed', message: error.message }, { status: 500 });
  }
}
