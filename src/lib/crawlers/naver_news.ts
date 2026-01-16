// src/lib/crawlers/naver_news.ts
// 네이버 뉴스 검색 크롤러 - 특정 키워드의 공모전/해커톤 뉴스 수집
// "위비티에 없는 기업 공모전"을 뉴스 기사를 통해 발굴
// Updated: Dynamic class names support via heuristic selection

import * as cheerio from 'cheerio';
import { CrawledItem } from './types';
import { getAIRelevanceScore } from './sources';

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

function parseNaverDate(dateText: string): string {
    const now = new Date();
    if (dateText.includes('전')) return now.toISOString().split('T')[0];
    if (dateText.includes('어제')) {
        now.setDate(now.getDate() - 1);
        return now.toISOString().split('T')[0];
    }
    const cleanDate = dateText.replace(/\.$/, '');
    const parts = cleanDate.split('.');
    if (parts.length === 3) {
        return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
    }
    return '';
}

export async function crawlNaverNews(keyword: string): Promise<CrawledItem[]> {
  if (!keyword) return [];

  // 검색어 조합: "{키워드} 공모전 모집"
  const query = encodeURIComponent(`${keyword} 공모전 모집`);
  const url = `https://search.naver.com/search.naver?where=news&query=${query}&sm=tab_opt&sort=1`; // sort=1 (Latest)

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT }
    });

    if (!res.ok) {
        console.error(`Naver News fetch failed: ${res.status}`);
        return [];
    }

    const html = await res.text();
    const $ = cheerio.load(html);
    const items: CrawledItem[] = [];

    // Strategy: Select all 'a' tags and filter by heuristics because class names are obfuscated
    const candidates: any[] = [];
    
    $('a').each((idx, el) => {
        const $a = $(el);
        const text = $a.text().trim();
        const href = $a.attr('href') || '';
        
        // Filter heuristics
        if (text.length < 10) return; // Too short
        if (!href.startsWith('http')) return; // Internal or invalid
        if (href.includes('search.naver')) return; // Pagination or internalNav
        if (href.includes('nid.naver')) return; // Login

        // Relevance check
        // Check if text contains the keyword (case-insensitive) or "공모" or "모집" or "해커톤"
        const lowerText = text.toLowerCase();
        const lowerKey = keyword.toLowerCase();
        
        // Only accept if it matches Keyword OR ("公募" or "Contest" related)
        // But strict keyword match is better for "User Search"
        const hasKeyword = lowerText.includes(lowerKey);
        
        if (hasKeyword) {
            candidates.push({ $a, text, href });
        }
    });

    // Deduplicate by href
    const seenUrls = new Set();
    const uniqueCandidates = candidates.filter(c => {
        if (seenUrls.has(c.href)) return false;
        seenUrls.add(c.href);
        return true;
    });

    // Take top 8
    for (const cand of uniqueCandidates.slice(0, 8)) {
        const { $a, text, href } = cand;
        
        // Try to find description and thumbnail nearby
        // Use standard traversal: go up to parent `li` or `div` wrapper
        // Since classes are weird, just look for next/prev siblings containing text?
        // Or just map title for now.
        
        let description = '';
        let thumbnail = '';
        let date = '';
        let press = 'News';

        // Heuristic: Try to find a sibling div that has text (description)
        // Or parent's text minus title text?
        // Let's keep it simple: just Title + Link is enough for "News Search"
        
        const aiScore = getAIRelevanceScore(text, '');

        items.push({
            title: `[NEWS] ${text}`,
            description: `검색된 뉴스 기사입니다: ${text}`, // Placeholder for description
            type: 'contest',
            date: new Date().toISOString().split('T')[0], // Default to today/recent
            company: press, 
            location: 'Online',
            link: href,
            sourceUrl: 'https://news.naver.com',
            image: undefined,
            categoryTags: keyword + (aiScore > 0 ? ', AI' : ''),
            applicationTarget: '기사 참조',
            isNews: true 
        } as any); // Type assertion needed for isNews
    }

    console.log(`[NaverNews] Crawled ${items.length} news items for keyword: ${keyword}`);
    return items;

  } catch (e) {
    console.error('Naver News crawl error:', e);
    return [];
  }
}
