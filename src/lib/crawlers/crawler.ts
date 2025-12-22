// src/lib/crawlers/crawler.ts
import { CrawledItem, CrawlResult } from './types';
import { CRAWLER_SOURCES, CRAWL_KEYWORDS } from './sources';

/**
 * 실제 크롤링 로직
 * 
 * 주의: 실제 운영 환경에서는 다음을 고려해야 합니다:
 * 1. robots.txt 준수
 * 2. 사이트 이용약관 확인
 * 3. Rate limiting (요청 제한)
 * 4. User-Agent 설정
 * 5. 법적 문제 검토
 * 
 * 현재는 데모/프로토타입 버전으로, 실제로는 공식 API를 사용하거나
 * RSS 피드를 활용하는 것이 권장됩니다.
 */

/**
 * 특정 타입의 항목들을 크롤링
 */
export async function crawlByType(type: 'job' | 'contest' | 'event'): Promise<CrawlResult> {
  const sources = CRAWLER_SOURCES.filter(s => s.type === type && s.enabled);
  
  try {
    const allItems: CrawledItem[] = [];
    
    for (const source of sources) {
      try {
        // 실제 크롤링 로직 (현재는 시뮬레이션)
        const items = await crawlSource(source.url, type);
        allItems.push(...items);
      } catch (error) {
        console.error(`Failed to crawl ${source.name}:`, error);
        // 개별 소스 실패는 전체 크롤링을 중단하지 않음
      }
    }
    
    return {
      success: true,
      itemsFound: allItems.length,
      items: allItems,
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

/**
 * 모든 타입의 항목들을 크롤링
 */
export async function crawlAll(): Promise<CrawlResult> {
  try {
    const [jobs, contests, events] = await Promise.all([
      crawlByType('job'),
      crawlByType('contest'),
      crawlByType('event'),
    ]);
    
    const allItems = [
      ...jobs.items,
      ...contests.items,
      ...events.items,
    ];
    
    return {
      success: true,
      itemsFound: allItems.length,
      items: allItems,
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

/**
 * 개별 소스 크롤링 (시뮬레이션)
 * 
 * 실제 구현 시에는:
 * 1. cheerio 또는 puppeteer를 사용하여 HTML 파싱
 * 2. 공식 API가 있다면 API 사용
 * 3. RSS 피드가 있다면 RSS 파서 사용
 */
async function crawlSource(url: string, type: 'job' | 'contest' | 'event'): Promise<CrawledItem[]> {
  // 실제 환경에서는 여기서 실제 크롤링을 수행
  // 현재는 데모 데이터 반환
  
  // 시뮬레이션: 랜덤하게 0-3개의 항목 생성
  const count = Math.floor(Math.random() * 4);
  const items: CrawledItem[] = [];
  
  for (let i = 0; i < count; i++) {
    items.push(generateMockItem(type, url));
  }
  
  return items;
}

/**
 * 목 데이터 생성 (개발/테스트용)
 */
function generateMockItem(type: 'job' | 'contest' | 'event', sourceUrl: string): CrawledItem {
  const today = new Date();
  const futureDate = new Date(today);
  futureDate.setDate(today.getDate() + Math.floor(Math.random() * 60) + 7); // 7-67일 후
  
  const mockData = {
    job: {
      titles: [
        'UI/UX 디자이너 채용',
        '그래픽 디자이너 (신입/경력)',
        '영상 크리에이터 모집',
        '제품 디자이너 채용',
        'AI 디자인 툴 개발자',
      ],
      companies: ['스타트업A', '디자인스튜디오B', '테크컴퍼니C', '크리에이티브랩D'],
      salaries: ['연봉 3,500~5,000만원', '연봉 4,000~6,000만원', '협의 후 결정'],
      employmentTypes: ['정규직', '계약직', '프리랜서'],
    },
    contest: {
      titles: [
        '2025 디자인 공모전',
        'AI 크리에이티브 챌린지',
        '영상 콘텐츠 공모전',
        '일러스트레이션 어워드',
        'UX 디자인 경진대회',
      ],
      prizes: ['대상 500만원', '총 상금 1,000만원', '우수상 300만원'],
      companies: ['한국디자인진흥원', '문화체육관광부', '디자인협회', '크리에이터연합'],
    },
    event: {
      titles: [
        '디자이너 네트워킹 데이',
        'AI 디자인 워크샵',
        '포트폴리오 리뷰 세션',
        '크리에이터 컨퍼런스 2025',
        'UX 디자인 세미나',
      ],
      companies: ['디자인허브', '크리에이터스페이스', '이벤트홀A', '컨퍼런스센터B'],
    },
  };
  
  const data = mockData[type];
  const randomTitle = data.titles[Math.floor(Math.random() * data.titles.length)];
  const randomCompany = data.companies[Math.floor(Math.random() * data.companies.length)];
  
  const baseItem: CrawledItem = {
    title: randomTitle,
    description: `${randomTitle}에 대한 상세 설명입니다. ${CRAWL_KEYWORDS[Math.floor(Math.random() * CRAWL_KEYWORDS.length)]} 관련 기회입니다.`,
    type,
    date: futureDate.toISOString().split('T')[0],
    company: randomCompany,
    location: ['서울 강남구', '서울 마포구', '온라인', '부산 해운대구'][Math.floor(Math.random() * 4)],
    link: `${sourceUrl}/detail/${Math.random().toString(36).substr(2, 9)}`,
    sourceUrl,
  };
  
  if (type === 'job') {
    baseItem.salary = mockData.job.salaries[Math.floor(Math.random() * mockData.job.salaries.length)];
    baseItem.employmentType = mockData.job.employmentTypes[Math.floor(Math.random() * mockData.job.employmentTypes.length)];
  } else if (type === 'contest') {
    baseItem.prize = mockData.contest.prizes[Math.floor(Math.random() * mockData.contest.prizes.length)];
  }
  
  return baseItem;
}

/**
 * 실제 크롤링 구현 예시 (cheerio 사용)
 * 
 * 실제 사용 시 주석 해제하고 cheerio 설치 필요: npm install cheerio
 */
/*
import * as cheerio from 'cheerio';

async function crawlSourceReal(url: string, type: 'job' | 'contest' | 'event'): Promise<CrawledItem[]> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; VibefolioCrawler/1.0)',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    const items: CrawledItem[] = [];
    
    // 사이트별 셀렉터는 각 사이트 구조에 맞게 조정 필요
    $('.item-card').each((index, element) => {
      const $el = $(element);
      
      const item: CrawledItem = {
        title: $el.find('.title').text().trim(),
        description: $el.find('.description').text().trim(),
        type,
        date: parseDate($el.find('.date').text().trim()),
        company: $el.find('.company').text().trim(),
        location: $el.find('.location').text().trim(),
        link: $el.find('a').attr('href') || '',
        sourceUrl: url,
      };
      
      items.push(item);
    });
    
    return items;
  } catch (error) {
    console.error(`Error crawling ${url}:`, error);
    return [];
  }
}

function parseDate(dateStr: string): string {
  // 날짜 파싱 로직 (사이트별로 다를 수 있음)
  // 예: "2025.12.31" -> "2025-12-31"
  return dateStr.replace(/\./g, '-');
}
*/
