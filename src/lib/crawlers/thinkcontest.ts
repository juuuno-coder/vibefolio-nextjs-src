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
 */
export async function crawlThinkContest(): Promise<CrawledItem[]> {
  // 씽굿 리스트 URL (index.do 대신 list.do 시도)
  const listUrl = 'https://www.thinkcontest.com/thinkgood/user/contest/list.do';
  const indexUrl = 'https://www.thinkcontest.com/thinkgood/user/contest/index.do';
  
  const allItems: CrawledItem[] = [];
  const seenTitles = new Set<string>();

  const crawlUrl = async (url: string, isIndex: boolean = false) => {
    try {
      const res = await fetch(url, {
        headers: { 
          'User-Agent': USER_AGENT,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
        }
      });
      if (!res.ok) return;
      const html = await res.text();
      const $ = cheerio.load(html);

      // 1. 일반 리스트 파싱
      const selectors = [
        '.contest-list li',
        '.board-list li',
        '.list-item',
        'table tr', // 테이블 형식 대응
        '.user-area__content li', // 랭킹 리스트 대응
      ];

      for (const selector of selectors) {
        $(selector).each((_, el) => {
          if (allItems.length >= 30) return false;

          const $item = $(el);
          
          // 제목 추출
          const title = $item.find('a, .title, .tit, h3, h4, .subject').first().text().replace(/^\d+\.\s/, '').trim();
          if (!title || title.length < 3 || seenTitles.has(title)) return;
          
          // 링크 추출
          let link = $item.find('a').first().attr('href') || '';
          if (!link || link.includes('javascript')) return;
          if (!link.startsWith('http')) {
            link = `https://www.thinkcontest.com${link.startsWith('/') ? '' : '/'}${link}`;
          }

          seenTitles.add(title);
          
          // 이미지
          let image = $item.find('img').first().attr('src') || '';
          if (image && !image.startsWith('http')) {
            image = `https://www.thinkcontest.com${image.startsWith('/') ? '' : '/'}${image}`;
          }

          // 날짜
          const dateText = $item.find('.date, .dday, .deadline, .period').first().text().trim();
          const date = parseDate(dateText);

          // 주최
          const company = $item.find('.company, .host, .organizer, .organ').first().text().trim() || '씽굿';
          
          const aiScore = getAIRelevanceScore(title, '');

          allItems.push({
            title,
            description: '씽굿 공모전 정보입니다.',
            type: 'contest',
            date: date || '상시모집',
            company,
            location: '온라인',
            link: link,
            sourceUrl: 'https://www.thinkcontest.com',
            image: image || undefined,
            categoryTags: aiScore > 0 ? 'AI, 공모전' : '공모전',
          });
        });
      }
    } catch (e) {
      console.error(`ThinkContest crawl error for ${url}:`, e);
    }
  };

  // 두 URL 모두 시도
  await crawlUrl(listUrl);
  if (allItems.length < 5) {
    await crawlUrl(indexUrl, true);
  }
  
  // 수동 랭킹 리스트 추가 파싱 (전략적 보완)
  console.log(`[ThinkContest] Total crawled: ${allItems.length} items`);
  return allItems;
}

