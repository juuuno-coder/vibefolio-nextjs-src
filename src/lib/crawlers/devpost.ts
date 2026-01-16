// src/lib/crawlers/devpost.ts
// Devpost 크롤러 - 글로벌 해커톤/AI 챌린지 전문 사이트

import * as cheerio from 'cheerio';
import { CrawledItem } from './types';
import { getAIRelevanceScore } from './sources';

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/**
 * 날짜 파싱 (영문 형식)
 * "Jan 15, 2025" -> "2025-01-15"
 */
function parseEnglishDate(dateStr: string): string {
  if (!dateStr) return '';
  
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch {
    return '';
  }
}

/**
 * Devpost 해커톤 크롤링
 * AI/ML 관련 해커톤 및 챌린지 수집
 */
export async function crawlDevpost(keyword?: string): Promise<CrawledItem[]> {
  const searchTerm = keyword ? encodeURIComponent(keyword) : 'AI';
  const url = `https://devpost.com/hackathons?search=${searchTerm}&status[]=open&status[]=upcoming`;
  
  try {
    const res = await fetch(url, {
      headers: { 
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    });
    
    if (!res.ok) {
      console.error(`Devpost fetch failed: ${res.status}`);
      return [];
    }
    
    const html = await res.text();
    const $ = cheerio.load(html);
    
    const items: CrawledItem[] = [];
    
    // Devpost 해커톤 목록 파싱 (다양한 셀렉터)
    const selectors = [
      '.hackathon-tile',
      '.challenge-listing',
      '.hackathon-card',
      '[data-hackathon-tile]',
      '.software-thumbnail',
      'article',
      '.challenge',
    ];
    
    for (const selector of selectors) {
      const elements = $(selector);
      if (elements.length === 0) continue;
      
      elements.each((idx, el) => {
        if (items.length >= 10) return false;
        
        const $item = $(el);
        
        // 제목
        const title = $item.find('h2, h3, .title, .challenge-title, .hackathon-title, [class*="title"]').first().text().trim()
          || $item.find('a').first().text().trim();
        
        if (!title || title.length < 3) return;
        
        // 링크
        let link = $item.find('a').first().attr('href') || '';
        if (link && !link.startsWith('http')) {
          link = `https://devpost.com${link.startsWith('/') ? '' : '/'}${link}`;
        }
        
        // 이미지
        const image = $item.find('img').first().attr('src') || '';
        
        // 날짜 (submission deadline)
        const dateText = $item.find('.date, .deadline, .submission-period, time, [class*="date"]').first().text().trim();
        const date = parseEnglishDate(dateText);
        
        // 상금 (prizes)
        const prize = $item.find('.prize, .prizes, .prize-amount, [class*="prize"]').first().text().trim();
        
        // 주최
        const company = $item.find('.host, .organizer, .hosted-by, [class*="host"]').first().text().trim() || 'Devpost';
        
        // 설명
        const description = $item.find('.tagline, .description, .excerpt, p').first().text().trim() || 'Global AI Hackathon';
        
        // 참가자 수
        const participants = $item.find('.participants, .registrations, [class*="participant"]').first().text().trim();
        
        items.push({
          title: `[GLOBAL] ${title}`,
          description: description + (participants ? ` (${participants})` : ''),
          type: 'event',
          date: date || '상시',
          company,
          location: 'Online (Global)',
          link: link || url,
          sourceUrl: 'https://devpost.com',
          image: image || undefined,
          prize: prize || undefined,
          categoryTags: 'AI, 해커톤, 글로벌',
        });
      });
      
      if (items.length > 0) break;
    }
    
    // 셀렉터로 못 찾으면 링크에서 추출 시도
    if (items.length === 0) {
      $('a[href*="/hackathons/"]').each((idx, el) => {
        if (items.length >= 8) return false;
        
        const $link = $(el);
        const href = $link.attr('href') || '';
        const title = $link.text().trim();
        
        // 유효한 해커톤 링크인지 확인
        if (href.includes('/hackathons/') && title.length > 5 && !title.includes('Log') && !title.includes('Sign')) {
          const fullLink = href.startsWith('http') ? href : `https://devpost.com${href}`;
          
          items.push({
            title: `[GLOBAL] ${title}`,
            description: 'Devpost AI Hackathon - Join the global developer community!',
            type: 'event',
            date: '상시',
            company: 'Devpost',
            location: 'Online (Global)',
            link: fullLink,
            sourceUrl: 'https://devpost.com',
            categoryTags: 'AI, 해커톤, 글로벌',
          });
        }
      });
    }
    
    // AI 점수순 정렬
    items.sort((a, b) => {
      const scoreA = getAIRelevanceScore(a.title, a.description);
      const scoreB = getAIRelevanceScore(b.title, b.description);
      return scoreB - scoreA;
    });
    
    console.log(`[Devpost] Crawled ${items.length} items (Keyword: ${keyword || 'AI'})`);
    return items;
    
  } catch (e) {
    console.error('Devpost crawl error:', e);
    return [];
  }
}
