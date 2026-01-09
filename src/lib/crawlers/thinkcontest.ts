// src/lib/crawlers/thinkcontest.ts
// 씽굿(ThinkContest) 크롤러 - 공모전 전문 사이트

import * as cheerio from 'cheerio';
import { CrawledItem } from './types';
import { getAIRelevanceScore } from './sources';

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/**
 * 날짜 문자열 파싱 (다양한 형식 지원)
 */
function parseDate(dateStr: string): string {
  if (!dateStr) return '';
  
  // "2025.01.15" or "25.01.15" or "2025-01-15" 형식
  const cleaned = dateStr.replace(/[^0-9./-]/g, '').trim();
  
  // 점(.)으로 구분된 형식
  if (cleaned.includes('.')) {
    const parts = cleaned.split('.');
    if (parts.length >= 3) {
      let year = parts[0];
      const month = parts[1].padStart(2, '0');
      const day = parts[2].padStart(2, '0');
      if (year.length === 2) year = '20' + year;
      return `${year}-${month}-${day}`;
    }
  }
  
  // 이미 ISO 형식이면 그대로 반환
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) {
    return cleaned;
  }
  
  return '';
}

/**
 * 씽굿 공모전 목록 크롤링
 * 새로운 URL 패턴: https://www.thinkcontest.com/thinkgood/user/contest/index.do
 */
export async function crawlThinkContest(): Promise<CrawledItem[]> {
  // 씽굿 새로운 URL 패턴
  const baseUrl = 'https://www.thinkcontest.com/thinkgood/user/contest/index.do';
  
  const allItems: CrawledItem[] = [];
  
  try {
    const res = await fetch(baseUrl, {
      headers: { 
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
      }
    });
    
    if (!res.ok) {
      console.error(`ThinkContest fetch failed: ${res.status}`);
      return [];
    }
    
    const html = await res.text();
    const $ = cheerio.load(html);
    
    // 공모전 목록 파싱 (다양한 셀렉터 시도)
    const selectors = [
      '.contest-list li',
      '.list-item',
      '.contest-item',
      '.board-list li',
      'ul.list > li',
      '.content-list > div',
      '[class*="contest"] li',
      '[class*="list"] li',
    ];
    
    let foundItems = false;
    
    for (const selector of selectors) {
      const elements = $(selector);
      if (elements.length === 0) continue;
      
      foundItems = true;
      
      elements.each((idx, el) => {
        if (allItems.length >= 15) return false; // 최대 15개
        
        const $item = $(el);
        
        // 제목 추출 (다양한 셀렉터)
        const title = $item.find('a, .title, .tit, h3, h4, .subject').first().text().trim()
          || $item.find('[class*="title"]').first().text().trim();
        
        if (!title || title.length < 3) return;
        
        // 링크 추출
        let link = $item.find('a').first().attr('href') || '';
        if (link && !link.startsWith('http')) {
          link = `https://www.thinkcontest.com${link.startsWith('/') ? '' : '/'}${link}`;
        }
        
        // 이미지 추출
        let image = $item.find('img').first().attr('src') || '';
        if (image && !image.startsWith('http')) {
          image = `https://www.thinkcontest.com${image.startsWith('/') ? '' : '/'}${image}`;
        }
        
        // 날짜 추출
        const dateText = $item.find('.date, .dday, .deadline, .period, [class*="date"]').first().text().trim();
        const date = parseDate(dateText);
        
        // 주최사 추출
        const company = $item.find('.company, .host, .organizer, .organ, [class*="company"]').first().text().trim() || '씽굿';
        
        // 상금 추출
        const prize = $item.find('.prize, .reward, .benefit, [class*="prize"]').first().text().trim();
        
        // 설명 추출
        const description = $item.find('.desc, .description, .summary, p, [class*="desc"]').first().text().trim() 
          || '씽굿 공모전 - 상세 내용을 확인하세요.';
        
        // AI 연관성 점수 계산
        const aiScore = getAIRelevanceScore(title, description);
        
        allItems.push({
          title,
          description,
          type: 'contest',
          date: date || '상시모집',
          company,
          location: '온라인',
          link: link || baseUrl,
          sourceUrl: 'https://www.thinkcontest.com',
          image: image || undefined,
          prize: prize || undefined,
          categoryTags: aiScore > 0 ? 'AI, 공모전' : '공모전',
        });
      });
      
      if (foundItems && allItems.length > 0) break;
    }
    
    // 만약 위 방법으로 못 찾으면 베스트 리스트에서 추출
    if (allItems.length === 0) {
      $('a[href*="javascript"]').each((idx, el) => {
        if (allItems.length >= 10) return false;
        
        const text = $(el).text().trim();
        // "1. 제목" 형태에서 제목만 추출
        if (/^\d+\.\s/.test(text)) {
          const title = text.replace(/^\d+\.\s/, '').trim();
          if (title.length > 5) {
            const aiScore = getAIRelevanceScore(title, '');
            allItems.push({
              title,
              description: '씽굿 인기 공모전입니다.',
              type: 'contest',
              date: '상시모집',
              company: '씽굿',
              location: '온라인',
              link: baseUrl,
              sourceUrl: 'https://www.thinkcontest.com',
              categoryTags: aiScore > 0 ? 'AI, 공모전' : '공모전',
            });
          }
        }
      });
    }
    
  } catch (e) {
    console.error('ThinkContest crawl error:', e);
  }
  
  // AI 관련 항목 우선 정렬
  allItems.sort((a, b) => {
    const scoreA = getAIRelevanceScore(a.title, a.description);
    const scoreB = getAIRelevanceScore(b.title, b.description);
    return scoreB - scoreA;
  });
  
  console.log(`[ThinkContest] Crawled ${allItems.length} items`);
  return allItems;
}
