
import { CrawledItem } from './types';
import { getAIRelevanceScore, getThemedPlaceholder } from './sources';

const TAVILY_API_KEY = process.env.TAVILY_API_KEY;

export async function crawlMcpSearch(keyword: string): Promise<CrawledItem[]> {
  // Tavily API Key가 없으면 실행 중지
  if (!TAVILY_API_KEY) {
    return [];
  }

  // 검색 쿼리: 사용자가 입력한 키워드 + 채용/공모전 관련 컨텍스트
  const searchQuery = `${keyword} (채용 OR 공모전 OR 해커톤 OR 지원사업) 모집 공고`;
  
  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: TAVILY_API_KEY,
        query: searchQuery,
        search_depth: "basic",
        include_images: true, 
        include_answer: false,
        max_results: 8 
      })
    });

    if (!response.ok) {
        throw new Error(`Tavily API responded with ${response.status}`);
    }

    const data = await response.json();
    const results = data.results || [];

    return results.map((item: any) => {
        const title = item.title;
        const url = item.url;
        const description = item.content;
        
        // AI 관련성 점수
        const score = getAIRelevanceScore(title, description);

        // 제목이나 내용에서 타입 추론
        const lowerTitle = title.toLowerCase();
        const lowerDesc = description.toLowerCase();
        let type = 'contest'; // Default
        
        if (lowerTitle.includes('채용') || lowerTitle.includes('모집') || lowerDesc.includes('frontend') || lowerDesc.includes('backend') || lowerDesc.includes('developer')) {
          type = 'job';
        } else if (lowerTitle.includes('해커톤') || lowerTitle.includes('대회') || lowerTitle.includes('공모전')) {
          type = 'contest';
        }

        const image = getThemedPlaceholder(title, type);

        return {
            title: title.replace(/<[^>]*>?/gm, ''), // HTML 태그 제거
            description: description.substring(0, 200) + '...',
            link: url,
            officialLink: url,
            date: '검색 결과',
            company: extractDomain(url),
            location: 'Web',
            type: type,
            sourceUrl: 'https://tavily.com', 
            image: image,
            categoryTags: 'MCP 검색',
            prize: '',
            salary: '',
        } as CrawledItem;
    });

  } catch (error) {
    console.error('[MCP Search] Crawiling failed:', error);
    return [];
  }
}

function extractDomain(url: string): string {
  try {
    const hostname = new URL(url).hostname;
    return hostname.replace('www.', '');
  } catch {
    return 'Web Search';
  }
}
