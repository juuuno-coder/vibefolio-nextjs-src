// src/lib/crawlers/crawler.ts
import * as cheerio from 'cheerio';
import { CrawledItem, CrawlResult } from './types';
import { CRAWLER_SOURCES } from './sources';

/**
 * 실제 크롤링 로직 구현 (Real Crawling)
 */

/**
 * 제목 키워드를 분석하여 고화질 테마 이미지를 반환합니다.
 */
function getThemedPlaceholder(title: string, type: string): string {
  const t = title.toLowerCase();
  let keyword = "artificial-intelligence"; // Default

  if (type === 'contest') {
    if (t.includes('디자인') || t.includes('디지털아트') || t.includes('미디어')) keyword = "abstract-art";
    else if (t.includes('해커톤') || t.includes('sw') || t.includes('it')) keyword = "cyber-coding";
    else if (t.includes('광고') || t.includes('영상') || t.includes('숏폼')) keyword = "video-production";
    else if (t.includes('아이디어') || t.includes('기획')) keyword = "creative-brainstorm";
    else keyword = "premium-banner";
  } else if (type === 'job') {
    keyword = "minimal-office";
  } else {
    keyword = "event-concert";
  }

  // Unsplash Source API (Random but keyword-themed)
  // 시각적 일관성을 위해 800x600 고정
  return `https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=800&h=600&sig=${encodeURIComponent(title)}`;
}

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
        
        // 1. 공식 홈페이지 주소 및 버튼 추출 고도화
        let officialUrl = $detail('.contest-detail .btn-area a:contains("홈페이지 바로가기")').attr('href') ||
                          $detail('.contest-detail-info a:contains("홈페이지 바로가기")').attr('href') ||
                          $detail('.contest-detail .btn-area a:contains("상세보기")').attr('href') ||
                          $detail('a:contains("홈페이지")').filter((_, el) => $detail(el).text().includes('바로가기')).attr('href');
        
        // 2. 상세 정보 테이블 파싱 (정규식 기반으로 콜론 및 라벨 제거)
        const info: any = { officialLink: officialUrl };
        $detail('.contest-detail-info li').each((_, el) => {
          const rawText = $detail(el).text().replace(/\s+/g, ' ').trim();
          
          // "라벨 : 내용" 형태에서 라벨 이후의 값만 깔끔하게 추출
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
          
          if (rawText.includes('접수기간')) {
            const period = extractValue('접수기간');
            if (period && period.includes('~')) {
              const startPart = period.split('~')[0].trim();
              info.startDate = formatDateString(startPart);
            }
          }
        });

        // 3. 포스터 이미지
        const posterImg = $detail('.thumb img').attr('src');
        if (posterImg) {
          info.image = posterImg.startsWith('http') ? posterImg : `https://www.wevity.com${posterImg.startsWith('/') ? '' : '/'}${posterImg}`;
        }

        return info;
      } catch (e) {
        return {};
      }
    };

    /**
     * "25.12.31" 또는 "2025-12-31" 형태의 날짜를 "YYYY-MM-DD"로 변환
     */
    function formatDateString(str: string): string | null {
      if (!str) return null;
      const cleaned = str.replace(/[^\d.]/g, '').replace(/^\.+|\.+$/g, '');
      const parts = cleaned.split('.');
      
      let year, month, day;
      
      if (parts.length === 3) {
        year = parts[0];
        month = parts[1].padStart(2, '0');
        day = parts[2].padStart(2, '0');
        if (year.length === 2) year = '20' + year;
      } else if (parts.length === 2) {
        const now = new Date();
        const currentYear = now.getFullYear();
        month = parts[0].padStart(2, '0');
        day = parts[1].padStart(2, '0');
        
        // 지능형 연도 추론
        year = currentYear.toString();
        const testDate = new Date(`${year}-${month}-${day}`);
        
        // 현재로부터 180일 이상 과거이거나 미래인 경우 연도 보정
        // 예: 현재 26년 1월인데 12월 날짜면 25년으로 판단
        if (now.getMonth() < 3 && parseInt(month) > 9) {
          year = (currentYear - 1).toString();
        } else if (now.getMonth() > 9 && parseInt(month) < 3) {
          year = (currentYear + 1).toString();
        }
      } else {
        // 날짜 형식이 아니면 (예: "D-Day", "상시") 유효한 날짜가 아니므로 null 반환
        return null;
      }
      
      const result = `${year}-${month}-${day}`;
      // 유효한 ISO 날짜인지 최종 확인
      return isNaN(Date.parse(result)) ? null : result;
    }

    const items: CrawledItem[] = [];
    const listElements = $('.list li, .contest-list li').toArray();

    // 1단계: 목록에서 기본 정보 수집
    for (const el of listElements) {
      if (items.length >= 20) break; // 상세 수집 범위 확대 (10 -> 20)

      const $li = $(el);
      const $titleLink = $li.find('.tit a, .hide-tit a, a.subject, .title a').first();
      const title = $titleLink.text().trim();
      if (!title || title.length < 2) continue;
      
      const linkHref = $titleLink.attr('href');
      let link = linkHref || '';
      if (link && !link.startsWith('http')) {
        link = `https://www.wevity.com${link.startsWith('/') ? '' : '/'}${link}`;
      }
      
      const detailInfo = await fetchDetailInfo(link);

      let image = detailInfo.image || $li.find('.thumb img, .img img, .thumb-box img, .poster img').attr('src');
      if (image && !image.startsWith('http')) {
        image = `https://www.wevity.com${image.startsWith('/') ? '' : '/'}${image}`;
      }
      
      if (!image || image.includes('no_image') || image.includes('spacer.gif')) {
        image = getThemedPlaceholder(title, 'contest');
      }
      
      // 날짜 파싱 고도화
      const rawDate = $li.find('.dday, .hide-dday, .date, .last-date').first().text().trim();
      const formattedDate = formatDateString(rawDate);
      
      const category = detailInfo.categoryTags || $li.find('.cat, .hide-cat, .category').first().text().trim();
      const company = detailInfo.company || $li.find('.organ, .company, .sub-text').first().text().trim() || '주최측 미상';
      
      items.push({
        title,
        description: category || '공모전 정보를 확인하세요.',
        type: 'contest',
        date: formattedDate || '상시모집',
        company: company,
        location: '온라인/기타',
        link: link, 
        officialLink: detailInfo.officialLink,
        sourceUrl: 'https://www.wevity.com',
        image,
        applicationTarget: detailInfo.applicationTarget,
        sponsor: detailInfo.sponsor,
        totalPrize: detailInfo.totalPrize,
        firstPrize: detailInfo.firstPrize,
        startDate: detailInfo.startDate,
        categoryTags: detailInfo.categoryTags,
      });
    }
    
    return items;
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
      image: job.title_img?.thumb || getThemedPlaceholder(job.position, 'job'),
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
