// src/lib/crawlers/crawler.ts
// 통합 크롤러 - 다양한 소스에서 채용/공모전/이벤트 정보 수집

import * as cheerio from 'cheerio';
import { CrawledItem, CrawlResult } from './types';
import { isAIRelated, getAIRelevanceScore, getThemedPlaceholder, formatDateString } from './sources';
import { crawlThinkContest } from './thinkcontest';
import { crawlRocketPunch } from './rocketpunch';
import { crawlDevpost } from './devpost';
import { crawlNaverNews } from './naver_news';
import { crawlHaebojago } from './haebojago';
import { crawlMcpSearch } from './search_mcp';

// ============================================================
// Wevity (Contest) - 상세 요약 정보 강화
// ============================================================
async function crawlWevity(keyword?: string): Promise<CrawledItem[]> {
  // AI/영상 관련 카테고리 추가, 키워드 있으면 검색 URL 사용
  let urls: string[] = [];
  
  if (keyword) {
    // 키워드 검색 URL
    urls = [`https://www.wevity.com/?c=find&s=1&mode=total&keyword=${encodeURIComponent(keyword)}`];
  } else {
    // 기본 카테고리 크롤링
    urls = [
        'https://www.wevity.com/?c=find&s=1&gub=1&cidx=20', // 디자인/웹 분야
        'https://www.wevity.com/?c=find&s=1&gub=1&cidx=22', // 영상/UCC 분야
        'https://www.wevity.com/?c=find&s=1&gub=1&cidx=21', // IT/SW 분야
    ];
  }
  
  const allItems: CrawledItem[] = [];
  const seenTitles = new Set<string>();
  
  for (const url of urls) {
    try {
      const res = await fetch(url, { 
        headers: { 
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' 
        } 
      });
      if (!res.ok) continue;
      const html = await res.text();
      const $ = cheerio.load(html);
      
      // 상세 정보 파싱을 위한 헬퍼 함수
      const fetchDetailInfo = async (detailUrl: string) => {
        try {
          const detailRes = await fetch(detailUrl, { 
            headers: { 
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' 
            } 
          });
          if (!detailRes.ok) return {};
          const detailHtml = await detailRes.text();
          const $detail = cheerio.load(detailHtml);
          
          // 공식 홈페이지 주소 추출
          let officialUrl = $detail('.contest-detail .btn-area a:contains("홈페이지 바로가기")').attr('href') ||
                            $detail('.contest-detail-info a:contains("홈페이지 바로가기")').attr('href') ||
                            $detail('a:contains("홈페이지")').filter((_, el) => $detail(el).text().includes('바로가기')).attr('href');
          
          const info: any = { officialLink: officialUrl };
          
          $detail('.contest-detail-info li').each((_, el) => {
            const rawText = $detail(el).text().replace(/\s+/g, ' ').trim();
            
            const extractValue = (label: string) => {
              if (rawText.includes(label)) {
                return rawText.split(label)[1]?.replace(/^[:\s]+/, '').trim();
              }
              return null;
            };

            const category = extractValue('분야'); if (category) info.categoryTags = category;
            const target = extractValue('대상'); if (target) info.applicationTarget = target;
            const host = extractValue('주최/주관'); if (host) info.company = host;
            const sponsor = extractValue('후원/협찬'); if (sponsor) info.sponsor = sponsor;
            const totalP = extractValue('총 상금'); if (totalP) info.totalPrize = totalP;
            const firstP = extractValue('1등 상금'); if (firstP) info.firstPrize = firstP;
            
            const awardDetail = extractValue('시상내역') || extractValue('상금');
            if (awardDetail) info.prize = awardDetail;

            if (rawText.includes('접수기간')) {
              const period = extractValue('접수기간');
              if (period && period.includes('~')) {
                const startPart = period.split('~')[0].trim();
                info.startDate = formatDateString(startPart);
              }
            }
          });

          // 포스터 이미지
          const posterImg = $detail('.thumb img').attr('src');
          if (posterImg) {
            info.image = posterImg.startsWith('http') ? posterImg : `https://www.wevity.com${posterImg.startsWith('/') ? '' : '/'}${posterImg}`;
          }

          return info;
        } catch (e) {
          return {};
        }
      };

      const listElements = $('.list li, .contest-list li').toArray();

      for (const el of listElements) {
        if (allItems.length >= 25) break;

        const $li = $(el);
        const $titleLink = $li.find('.tit a, .hide-tit a, a.subject, .title a').first();
        const title = $titleLink.text().trim();
        if (!title || title.length < 2 || seenTitles.has(title)) continue;
        seenTitles.add(title);
        
        const linkHref = $titleLink.attr('href');
        let link = linkHref || '';
        if (link && !link.startsWith('http')) {
          link = `https://www.wevity.com${link.startsWith('/') ? '' : '/'}${link}`;
        }
        
        const detailInfo = await fetchDetailInfo(link);

        let image = detailInfo.image || $li.find('.thumb img, .img img').attr('src');
        if (image && !image.startsWith('http')) {
          image = `https://www.wevity.com${image.startsWith('/') ? '' : '/'}${image}`;
        }
        
        if (!image || image.includes('no_image')) {
          image = getThemedPlaceholder(title, 'contest');
        }
        
        const rawDate = $li.find('.dday, .hide-dday, .date').first().text().trim();
        const formattedDate = formatDateString(rawDate);
        
        const category = detailInfo.categoryTags || $li.find('.cat, .hide-cat').first().text().trim();
        const company = detailInfo.company || $li.find('.organ, .company').first().text().trim() || '주최측 미상';
        
        // AI 연관성 점수 계산
        const aiScore = getAIRelevanceScore(title, category || '');

        // Description 생성 로직 개선 (상세 정보 조합)
        const descParts = [];
        if (detailInfo.applicationTarget) descParts.push(`대상: ${detailInfo.applicationTarget}`);
        if (detailInfo.totalPrize || detailInfo.prize) descParts.push(`시상: ${detailInfo.totalPrize || detailInfo.prize}`);
        if (category) descParts.push(`분야: ${category}`);
        
        const richDescription = descParts.length > 0 
          ? descParts.join(' / ') 
          : (category || '공모전 정보를 확인하세요.');
        
        allItems.push({
          title,
          description: richDescription,
          type: 'contest',
          date: formattedDate || '상시모집',
          company: company,
          location: '온라인/기타',
          link: link, 
          officialLink: detailInfo.officialLink,
          sourceUrl: 'https://www.wevity.com',
          image,
          prize: detailInfo.prize || detailInfo.totalPrize,
          applicationTarget: detailInfo.applicationTarget,
          sponsor: detailInfo.sponsor,
          totalPrize: detailInfo.totalPrize,
          firstPrize: detailInfo.firstPrize,
          startDate: detailInfo.startDate,
          categoryTags: (detailInfo.categoryTags || '') + (aiScore > 0 ? ', AI' : ''),
        });
      }
    } catch (e) {
      console.error('Wevity crawl error:', e);
    }
  }
  
  // AI 관련 항목 우선 정렬 (키워드 검색 시에는 검색 정확도 우선이겠지만 여기서도 AI score가 유효)
  allItems.sort((a, b) => {
    const scoreA = getAIRelevanceScore(a.title, a.description);
    const scoreB = getAIRelevanceScore(b.title, b.description);
    return scoreB - scoreA;
  });
  
  console.log(`[Wevity] Crawled ${allItems.length} items (Keyword: ${keyword || 'Basic'})`);
  return allItems;
}

// ============================================================
// Wanted (Job) - 상세 정보 크롤링 (주요업무, 자격요건)
// ============================================================
async function crawlWanted(): Promise<CrawledItem[]> {
  // Wanted does not support easy keyword search URL in this mock. Use default relevant tags.
  // AI/ML 관련 태그 ID 추가
  const tagIds = [
    '518',  // Software Engineer
    '872',  // AI/ML
    '669',  // Data Science
    '660',  // Design
  ];
  
  const allItems: CrawledItem[] = [];
  const seenIds = new Set<number>();
  
  for (const tagId of tagIds) {
    try {
      const url = `https://www.wanted.co.kr/api/v4/jobs?country=kr&tag_type_ids=${tagId}&job_sort=job.latest_order&locations=all&years=-1&limit=10`;
      
      const res = await fetch(url, {
        headers: { 
           // Header 생략 ...
        }
      });
      if (!res.ok) continue;
      const data = await res.json();
      const jobList = data.data || [];

      // 병렬로 상세 정보 가져오기
      const detailedJobs = await Promise.all(jobList.map(async (job: any) => {
        if (seenIds.has(job.id)) return null;
        seenIds.add(job.id);

        try {
            // 상세 API 호출
            const detailRes = await fetch(`https://www.wanted.co.kr/api/v4/jobs/${job.id}`);
            if (!detailRes.ok) throw new Error('Detail fetch failed');
            const detailData = await detailRes.json();
            const detail = detailData.job?.detail || {};

            // 기술 스택
            const skills = (job.skill_tags || []).map((t: any) => t.title).join(', ');
            
            // 설명 구성
            const parts = [];
            if (skills) parts.push(`[기술스택] ${skills}`);
            if (detail.main_tasks) parts.push(`[주요업무] ${detail.main_tasks.substring(0, 100).replace(/\n/g, ' ')}...`);
            if (detail.requirements) parts.push(`[자격요건] ${detail.requirements.substring(0, 100).replace(/\n/g, ' ')}...`);

            const description = parts.length > 0 
                ? parts.join('\n\n') 
                : (skills ? `기술스택: ${skills}` : '상세 내용은 링크를 참고하세요.');

            // AI 연관성 점수
            const aiScore = getAIRelevanceScore(job.position, description);

            return {
                title: job.position,
                description,
                type: 'job',
                date: job.due_time || '상시',
                company: job.company?.name || 'Unknown',
                location: job.address?.location || '서울',
                link: `https://www.wanted.co.kr/wd/${job.id}`,
                sourceUrl: 'https://www.wanted.co.kr',
                image: job.title_img?.thumb || getThemedPlaceholder(job.position, 'job'),
                salary: job.reward?.total ? `보상금: ${job.reward.total}` : undefined,
                categoryTags: aiScore > 0 ? 'AI, 채용' : '채용',
            } as CrawledItem;

        } catch (err) {
            // 상세 조회 실패 시 기본 정보만 반환
            const skills = (job.skill_tags || []).map((t: any) => t.title).join(', ');
            return {
                title: job.position,
                description: skills ? `기술스택: ${skills}` : '채용 정보를 확인하세요.',
                type: 'job',
                date: job.due_time || '상시',
                company: job.company?.name || 'Unknown',
                location: job.address?.location || '서울',
                link: `https://www.wanted.co.kr/wd/${job.id}`,
                sourceUrl: 'https://www.wanted.co.kr',
                image: job.title_img?.thumb || getThemedPlaceholder(job.position, 'job'),
                categoryTags: '채용',
            } as CrawledItem;
        }
      }));

      // null 제거 및 추가
      detailedJobs.forEach(item => {
        if (item) allItems.push(item);
      });

    } catch (e) {
      console.error('Wanted crawl error:', e);
    }
  }
  
  // AI 관련 항목 우선 정렬
  allItems.sort((a, b) => {
    const scoreA = getAIRelevanceScore(a.title, a.description || '');
    const scoreB = getAIRelevanceScore(b.title, b.description || '');
    return scoreB - scoreA;
  });
  
  console.log(`[Wanted] Crawled ${allItems.length} items`);
  return allItems;
}

// ============================================================
// 통합 크롤링 함수
// ============================================================

export async function crawlByType(type: 'job' | 'contest' | 'event', keyword?: string): Promise<CrawlResult> {
  let items: CrawledItem[] = [];
  
  try {
    const tasks: Promise<CrawledItem[]>[] = [];

    if (type === 'contest') {
      // 1. Wevity (항상 실행, 키워드 지원)
      tasks.push(crawlWevity(keyword));

      if (keyword) {
          // 2. 키워드가 있으면 [웹서치 모드] -> 네이버 뉴스 + Haebojago + [New] MCP Search
          tasks.push(crawlNaverNews(keyword).catch(() => []));
          tasks.push(crawlHaebojago(keyword).catch(() => []));
          tasks.push(crawlMcpSearch(keyword).catch(() => []));
      } else {
          // 3. 키워드가 없으면 [일반 수집 모드] -> 씽굿 일반 목록 수집
          tasks.push(crawlThinkContest().catch(() => []));
      }
    } else if (type === 'job') {
      if (keyword) {
          // 키워드가 있으면 MCP Search 활용 (Job 특화 검색)
          tasks.push(crawlMcpSearch(keyword).catch(() => []));
      } else {
          const [wantedItems, rocketItems] = await Promise.all([
            crawlWanted(),
            crawlRocketPunch().catch(() => []),
          ]);
          items = [...wantedItems, ...rocketItems];
      }
    } else if (type === 'event') {
      // Devpost supports keyword
      tasks.push(crawlDevpost(keyword).catch(() => []));
      
      if (keyword) {
          tasks.push(crawlHaebojago(keyword).catch(() => []));
          tasks.push(crawlMcpSearch(keyword).catch(() => []));
      }
    }
    
    // Execute all tasks (if any were pushed)
    if (tasks.length > 0) {
        const results = await Promise.all(tasks);
        items = [...items, ...results.flat()];
    }
    
    // 중복 제거 (제목 기준)
    const seen = new Set<string>();
    items = items.filter(item => {
      const key = item.title.toLowerCase().trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    
    // AI 관련 항목 우선 정렬
    items.sort((a, b) => {
      const scoreA = getAIRelevanceScore(a.title, a.description);
      const scoreB = getAIRelevanceScore(b.title, b.description);
      return scoreB - scoreA;
    });
    
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

export async function crawlAll(keyword?: string): Promise<CrawlResult> {
  console.log(`[Crawler] Starting full crawl... (Keyword: ${keyword || 'None'})`);
  
  const tasks = [];
  
  // 1. Contest
  tasks.push(crawlByType('contest', keyword));
  
  // 2. Event
  tasks.push(crawlByType('event', keyword));
  
  // 3. Job (keyword가 있으면 Job도 crawlByType(job, keyword)로 처리되므로 안심)
  tasks.push(crawlByType('job', keyword));
  
  const results = await Promise.all(tasks);
  
  let allItems: CrawledItem[] = [];
  results.forEach(res => {
      if (res.success && res.items) {
          allItems = [...allItems, ...res.items];
      }
  });
  
  // 최종 AI 연관성 정렬
  allItems.sort((a, b) => {
    const scoreA = getAIRelevanceScore(a.title, a.description);
    const scoreB = getAIRelevanceScore(b.title, b.description);
    return scoreB - scoreA;
  });
  
  console.log(`[Crawler] Total crawled: ${allItems.length} items`);
  
  return {
    success: true,
    itemsFound: allItems.length,
    items: allItems,
  };
}

/**
 * AI 관련 항목만 필터링하여 반환
 */
export async function crawlAIOnly(): Promise<CrawlResult> {
  const result = await crawlAll();
  
  const aiItems = result.items.filter(item => 
    isAIRelated(item.title, item.description)
  );
  
  console.log(`[Crawler] AI-related items: ${aiItems.length} / ${result.itemsFound}`);
  
  return {
    success: true,
    itemsFound: aiItems.length,
    items: aiItems,
  };
}
