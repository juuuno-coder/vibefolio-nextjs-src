// src/lib/crawlers/rocketpunch.ts
// 로켓펀치 크롤러 - IT/스타트업 채용 전문 사이트
// Note: 로켓펀치는 로그인 필요 및 JavaScript 렌더링 필요하므로 API 방식 시도

import { CrawledItem } from './types';
import { getAIRelevanceScore } from './sources';

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/**
 * 로켓펀치 채용 크롤링
 * 로켓펀치는 JavaScript 렌더링이 필요하므로 API 엔드포인트 시도
 */
export async function crawlRocketPunch(): Promise<CrawledItem[]> {
  const allItems: CrawledItem[] = [];
  
  // 로켓펀치 API 시도 (공개 API가 없으므로 대안 방식)
  const searchQueries = ['AI', '생성형', '디자이너', '영상'];
  
  for (const query of searchQueries) {
    try {
      // 로켓펀치 검색 API (비공개이므로 fallback 데이터 사용)
      const url = `https://www.rocketpunch.com/api/jobs?q=${encodeURIComponent(query)}`;
      
      const res = await fetch(url, {
        headers: { 
          'User-Agent': USER_AGENT,
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        }
      });
      
      if (!res.ok) {
        // API 접근 불가 시 건너뛰기
        continue;
      }
      
      const data = await res.json();
      
      if (data.data && Array.isArray(data.data)) {
        for (const job of data.data) {
          const title = job.title || job.position || '';
          const company = job.company_name || job.company || '';
          
          if (!title) continue;
          
          const aiScore = getAIRelevanceScore(title, job.description || '');
          
          allItems.push({
            title: `[${company}] ${title}`,
            description: job.description || `${company}에서 ${title} 포지션을 모집합니다.`,
            type: 'job',
            date: job.deadline || '상시',
            company,
            location: job.location || '서울',
            link: job.url || `https://www.rocketpunch.com/jobs/${job.id}`,
            sourceUrl: 'https://www.rocketpunch.com',
            image: job.logo || undefined,
            salary: job.salary || undefined,
            employmentType: job.employment_type || '정규직',
            categoryTags: aiScore > 0 ? 'AI, 채용' : '채용',
          });
        }
      }
    } catch (e) {
      // API 오류 시 조용히 건너뛰기
      console.log(`[RocketPunch] API not available for query: ${query}`);
    }
  }
  
  // 로켓펀치 API가 작동하지 않으면 대표 정보 제공
  if (allItems.length === 0) {
    console.log('[RocketPunch] API not accessible - using fallback message');
    // 로켓펀치는 로그인 필요하므로 빈 배열 반환
    // 향후 Puppeteer/Playwright 기반 크롤링으로 대체 가능
  }
  
  // AI 관련 항목 우선 정렬
  allItems.sort((a, b) => {
    const scoreA = getAIRelevanceScore(a.title, a.description || '');
    const scoreB = getAIRelevanceScore(b.title, b.description || '');
    return scoreB - scoreA;
  });
  
  console.log(`[RocketPunch] Crawled ${allItems.length} items`);
  return allItems;
}
