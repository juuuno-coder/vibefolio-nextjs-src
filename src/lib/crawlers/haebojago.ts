// src/lib/crawlers/haebojago.ts
// Haebojago MCP Client - 외부 MCP 서버를 통해 공모전/활동 정보 검색

import { CrawledItem } from './types';
import { getAIRelevanceScore } from './sources';

const MCP_ENDPOINT = 'https://haebojago.fly.dev/mcp/gabojago/messages';

interface HaebojagoToolResponse {
  jsonrpc: string;
  id: number;
  result: {
    content: Array<{
      type: string;
      text: string;
    }>;
    isError?: boolean;
  }
}

// Helper to parse Markdown response from Haebojago MCP
// Example format:
// ### Title
// - **ID**: `94`
// - **일정**: 2025-03-01 ~ 2025-03-31
// - **유형**: contest | **장소**: Location...
function parseMcpMarkdownResponse(text: string): any[] {
  const items: any[] = [];
  if (!text) return items;

  // Split by "### " header, ignoring anything before the first header
  const sections = text.split('### ').slice(1);

  for (const section of sections) {
    const lines = section.split('\n');
    const title = lines[0].trim();
    if (!title) continue;
    
    // Regex extractors
    const idMatch = section.match(/\*\*ID\*\*:\s*`(\d+)`/);
    const dateMatch = section.match(/\*\*일정\*\*:\s*(.*?)(?=\n|$)/);
    const typeMatch = section.match(/\*\*유형\*\*:\s*(\w+)/);
    // Location often comes after type with | separator or separate line, logic adapted to find "장소"
    // Regex looks for "**장소**: value" until newline or pipe
    const placeMatch = section.match(/\*\*장소\*\*:\s*(.*?)(?=\n|$|\|)/); 
    const companyMatch = section.match(/\*\*주최\*\*:\s*(.*?)(?=\n|$)/);
    
    // Extract values
    const id = idMatch ? idMatch[1] : null;
    let date = dateMatch ? dateMatch[1].trim() : '일정 미정';
    const type = typeMatch ? typeMatch[1].trim() : 'event';
    const location = placeMatch ? placeMatch[1].replace(/\|/, '').trim() : 'Online';
    const company = companyMatch ? companyMatch[1].trim() : 'Unknown';

    items.push({
      title,
      id,
      date,
      type,
      location,
      company,
      description: section.trim() // Keep full text block as description for now
    });
  }
  return items;
}

async function callMcpTool(toolName: string, args: any) {
  try {
    const res = await fetch(MCP_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: Date.now(),
        method: "tools/call",
        params: {
          name: toolName,
          arguments: args
        }
      })
    });

    if (!res.ok) {
       console.error(`MCP Call Failed: ${res.status} ${res.statusText}`);
       return null;
    }

    const data = await res.json();
    if (data.error) {
       console.error('MCP Error:', data.error);
       return null;
    }

    // 결과 텍스트 추출
    const textContent = data.result?.content?.[0]?.text;
    if (!textContent) return null;

    try {
        const parsed = JSON.parse(textContent);
        // Sometimes LLM returns a JSON inside a string but it might be just text if it failed
        if (typeof parsed === 'object') return parsed;
        return textContent;
    } catch {
        return textContent; // JSON 파싱 실패시 텍스트 그대로 반환 (마크다운일 확률 높음)
    }
  } catch (e) {
    console.error('MCP Network Error:', e);
    return null;
  }
}

export async function crawlHaebojago(keyword: string): Promise<CrawledItem[]> {
  if (!keyword) return [];

  console.log(`[Haebojago] Searching for: ${keyword}`);
  
  // 1. search_activities 도구 호출
  const toolResult = await callMcpTool('search_activities', { keyword });
  
  let resultItems: any[] = [];

  // 2. 결과 처리 (JSON 배열 혹은 마크다운 문자열)
  if (Array.isArray(toolResult)) {
      resultItems = toolResult;
  } else if (typeof toolResult === 'string') {
      // 문자열인 경우 마크다운 파싱 시도
      resultItems = parseMcpMarkdownResponse(toolResult);
  }

  if (resultItems.length === 0) {
     // 결과 없음
     return [];
  }

  // 3. 결과 매핑
  const items: CrawledItem[] = resultItems.map((item: any) => {
    const aiScore = getAIRelevanceScore(item.title || '', item.description || '');
    
    // 타입 매핑
    let crawlType: 'contest' | 'event' | 'job' = 'event';
    if (item.type && (item.type.includes('contest') || item.type.includes('공모'))) {
        crawlType = 'contest';
    }

    // 링크 생성 (상세조회는 아직 없으므로 메인+ID 형태 혹은 가상 링크)
    const link = item.id 
        ? `https://haebojago.fly.dev/activity/${item.id}` 
        : 'https://haebojago.fly.dev';

    return {
        title: `[검색] ${item.title}`,
        description: item.description || '상세 정보 없음',
        type: crawlType,
        date: item.date,
        company: item.company,
        location: item.location,
        link: link,
        sourceUrl: 'https://haebojago.fly.dev',
        image: undefined, // 마크다운에 이미지가 없으므로 undefined (크롤러가 자동 테마 적용)
        categoryTags: `${keyword}, ${item.type || 'Activity'}` + (aiScore > 0 ? ', AI' : ''),
        prize: undefined,
        // 추가 정보가 있다면 여기에 매핑
    } as CrawledItem;
  });

  console.log(`[Haebojago] Found ${items.length} items for keyword: ${keyword}`);
  return items;
}
