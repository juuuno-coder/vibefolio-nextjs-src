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
    const res = await fetch(url, { 
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' 
      } 
    });
    if (!res.ok) throw new Error(`Wevity fetch failed: ${res.status}`);
    const html = await res.text();
    const $ = cheerio.load(html);
    
    const items: CrawledItem[] = [];
    
    // Wevity list items can be under .list or direct li
    $('.list li, .contest-list li, li').each((_, el) => {
      const $li = $(el);
      
      // Try multiple title selectors
      const $titleLink = $li.find('.tit a, .hide-tit a, a.subject, .title a').first();
      const title = $titleLink.text().trim();
      if (!title || title.length < 2) return;
      
      const linkHref = $titleLink.attr('href');
      let link = linkHref || '';
      if (link && !link.startsWith('http')) {
        link = `https://www.wevity.com${link.startsWith('/') ? '' : '/'}${link}`;
      }
      
      // Image extraction (Thumbnail is critical for banners!)
      const $img = $li.find('.thumb img, .img img, img').first();
      let image = $img.attr('src');
      if (image && !image.startsWith('http')) {
        image = `https://www.wevity.com${image.startsWith('/') ? '' : '/'}${image}`;
      }
      
      // Meta info
      const dday = $li.find('.dday, .hide-dday, .date').first().text().trim();
      const category = $li.find('.cat, .hide-cat, .category').first().text().trim();
      const company = $li.find('.organ, .company, .sub-text').first().text().trim() || '위비티 공모전';
      
      items.push({
        title,
        description: category || '공모전 정보를 확인하세요.',
        type: 'contest',
        date: dday || '상시모집',
        company: company,
        location: '온라인/기타',
        link,
        sourceUrl: 'https://www.wevity.com',
        image: image || undefined,
      });
    });
    
    return items.filter(i => i.title && i.link).slice(0, 15);
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
