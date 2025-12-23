// src/lib/crawlers/crawler.ts
import * as cheerio from 'cheerio';
import { CrawledItem, CrawlResult } from './types';
import { CRAWLER_SOURCES } from './sources';

/**
 * 실제 크롤링 로직 구현 (Real Crawling)
 */

// Wevity (Contest)
async function crawlWevity(): Promise<CrawledItem[]> {
  const url = 'https://www.wevity.com/?c=find&s=1&gub=1&cidx=20'; // 디자인/웹 분야
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!res.ok) throw new Error(`Wevity fetch failed: ${res.status}`);
    const html = await res.text();
    const $ = cheerio.load(html);
    
    const items: CrawledItem[] = [];
    
    // Select items from the list. Based on inspection: li .hide-info
    // Finding all elements that look like items
    $('li').each((_, el) => {
      const $li = $(el);
      const $info = $li.find('.hide-info');
      if ($info.length === 0) return;
      
      const $titleLink = $info.find('.hide-tit a');
      const title = $titleLink.text().trim();
      if (!title) return;
      
      const linkHref = $titleLink.attr('href');
      const link = linkHref ? `https://www.wevity.com/${linkHref}` : '';
      
      const $img = $li.find('img');
      const imgSrc = $img.attr('src');
      const image = imgSrc ? `https://www.wevity.com${imgSrc}` : undefined;
      
      const dday = $info.find('.hide-dday').text().trim();
      const category = $info.find('.hide-cat').text().trim();
      
      items.push({
        title,
        description: category || '공모전',
        type: 'contest',
        date: dday, // D-day format
        company: 'Wevity Info', // 주최사 정보가 이 뷰에 없어서 대체
        location: 'Online',
        link,
        sourceUrl: 'https://www.wevity.com',
        image,
      });
    });
    
    return items.slice(0, 10); // Limit to 10
  } catch (e) {
    console.error('Wevity crawl error:', e);
    return [];
  }
}

// Wanted (Job)
async function crawlWanted(): Promise<CrawledItem[]> {
  // 518: Software Engineer, Design category ids... need to check. 
  // Using 518 (Dev) and generic Design search if possible.
  // Using a broad query.
  const url = 'https://www.wanted.co.kr/api/v4/jobs?country=kr&tag_type_ids=518&job_sort=job.latest_order&locations=all&years=-1&limit=12';
  
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Wanted API failed: ${res.status}`);
    const data = await res.json();
    
    return (data.data || []).map((job: any) => ({
      title: job.position,
      description: `기술스택: ${(job.skill_tags || []).map((t: any) => t.title).join(', ')}`,
      type: 'job',
      date: job.due_time || '상시',
      company: job.company?.name || 'Unknown',
      location: job.address?.location || '서울',
      link: `https://www.wanted.co.kr/wd/${job.id}`,
      sourceUrl: 'https://www.wanted.co.kr',
      image: job.title_img?.thumb,
      salary: job.reward?.total ? `보상금: ${job.reward.total}` : undefined,
    }));
  } catch (e) {
    console.error('Wanted crawl error:', e);
    return [];
  }
}

// Mock for Events (OnOffMix is hard to crawl)
function generateMockEvents(): CrawledItem[] {
  return [
    {
      title: '2025 디자인 트렌드 컨퍼런스_MOCK',
      description: 'AI와 함께하는 디자인의 미래',
      type: 'event',
      date: '2025-01-15',
      company: '디자인코리아',
      location: '서울 코엑스',
      link: 'https://onoffmix.com',
      sourceUrl: 'https://onoffmix.com',
    },
     {
      title: '개발자 네트워킹 데이_MOCK',
      description: '주니어/시니어 만남의 장',
      type: 'event',
      date: '2025-02-01',
      company: 'DevHub',
      location: '강남',
      link: 'https://onoffmix.com',
      sourceUrl: 'https://onoffmix.com',
    }
  ];
}


export async function crawlByType(type: 'job' | 'contest' | 'event'): Promise<CrawlResult> {
  let items: CrawledItem[] = [];
  
  try {
    if (type === 'contest') {
      items = await crawlWevity();
    } else if (type === 'job') {
      items = await crawlWanted();
    } else if (type === 'event') {
      items = generateMockEvents();
    }
    
    return {
      success: true,
      itemsFound: items.length,
      items,
    };
  } catch (error) {
    return {
      success: false,
      itemsFound: 0,
      items: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function crawlAll(): Promise<CrawlResult> {
  const [jobs, contests, events] = await Promise.all([
    crawlByType('job'),
    crawlByType('contest'),
    crawlByType('event'),
  ]);
  
  const allItems = [...jobs.items, ...contests.items, ...events.items];
  
  return {
    success: true,
    itemsFound: allItems.length,
    items: allItems,
  };
}
