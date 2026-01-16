// src/lib/crawlers/haebojago.ts
// Haebojago MCP Client - 외부 MCP 서버를 통해 다양한 AI 정보 검색

import { CrawledItem } from './types';
import { getAIRelevanceScore } from './sources';

const MCP_ENDPOINT = 'https://haebojago.fly.dev/mcp/gabojago/messages';

// Helper to parse Markdown response from Haebojago MCP
// Example format:
// ### Title
// - **ID**: `94`
// - **일정**: 2025-03-01 ...
// - **내용**: ...
function parseMcpMarkdownResponse(text: string, category: string): any[] {
  const items: any[] = [];
  if (!text) return items;

  // Split by "### " header
  const sections = text.split('### ').slice(1);

  for (const section of sections) {
    const lines = section.split('\n');
    const title = lines[0].trim();
    if (!title) continue;
    
    // Regex extractors
    const idMatch = section.match(/\*\*ID\*\*:\s*`(\d+)`/);
    const dateMatch = section.match(/\*\*일정\*\*:\s*(.*?)(?=\n|$)/);
    const typeMatch = section.match(/\*\*유형\*\*:\s*(\w+)/);
    const placeMatch = section.match(/\*\*장소\*\*:\s*(.*?)(?=\n|$|\|)/); 
    const companyMatch = section.match(/\*\*주최\*\*:\s*(.*?)(?=\n|$)/) || section.match(/\*\*작성\/주최\*\*:\s*(.*?)(?=\n|$)/);
    
    // For Trends/Recipes/Tools, content might be under "**내용**" or just text
    const descMatch = section.match(/\*\*내용\*\*:\s*(.*?)(?=\n|$)/);

    // Extract values
    const id = idMatch ? idMatch[1] : null;
    let date = dateMatch ? dateMatch[1].trim() : undefined;
    const type = typeMatch ? typeMatch[1].trim() : category; // Default to category if type not found
    const location = placeMatch ? placeMatch[1].replace(/\|/, '').trim() : 'Online';
    const company = companyMatch ? companyMatch[1].trim() : 'MCP Intelligence';
    
    let description = descMatch ? descMatch[1].trim() : section.trim();
    // Clean description if it's too long or full markdown
    if (description.length > 300) description = description.substring(0, 300) + "...";

    items.push({
      title,
      id,
      date,
      type,
      location,
      company,
      description,
      originalText: section
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

    const textContent = data.result?.content?.[0]?.text;
    if (!textContent) return null;

    try {
        const parsed = JSON.parse(textContent);
        if (typeof parsed === 'object') return parsed;
        return textContent;
    } catch {
        return textContent; 
    }
  } catch (e) {
    console.error('MCP Network Error:', e);
    return null;
  }
}

/**
 * Unified Search Function for various MCP Categories
 * @param category 'opportunity' | 'job' | 'trend' | 'recipe' | 'tool'
 * @param keyword User query
 */
export async function searchMcp(category: string, keyword: string): Promise<CrawledItem[]> {
  if (!keyword) return [];

  let toolName = 'search_activities';
  let args: any = { keyword };

  // Map category to specific MCP tool
  switch (category) {
      case 'opportunity':
          toolName = 'search_activities';
          break;
      case 'job':
          toolName = 'search_ai_jobs';
          break;
      case 'trend': // Insight
          toolName = 'get_ai_trends';
          break;
      case 'recipe':
          toolName = 'search_ai_recipes';
          args = { style: keyword }; // Recipe tool expects 'style'
          break;
      case 'tool':
          toolName = 'recommend_ai_tools';
          args = { purpose: keyword }; // Tool recommender expects 'purpose'
          break;
      default:
          toolName = 'search_activities';
  }

  console.log(`[Haebojago] Searching '${category}' with tool '${toolName}' for: ${keyword}`);
  
  const toolResult = await callMcpTool(toolName, args);
  
  let resultItems: any[] = [];

  if (Array.isArray(toolResult)) {
      resultItems = toolResult;
  } else if (typeof toolResult === 'string') {
      resultItems = parseMcpMarkdownResponse(toolResult, category);
  }

  if (resultItems.length === 0) return [];

  // Map to common CrawledItem format
  const items: CrawledItem[] = resultItems.map((item: any) => {
    const aiScore = getAIRelevanceScore(item.title || '', item.description || '');
    
    // Fallback date for non-dated items (trends, recipes)
    const displayDate = item.date || new Date().toISOString().split('T')[0];

    // Link generation
    const link = item.id 
        ? `https://haebojago.fly.dev/activity/${item.id}` 
        : 'https://haebojago.fly.dev';

    return {
        title: item.title,
        description: item.description || '상세 정보 없음',
        type: category, // Use the requested category as type
        date: displayDate,
        company: item.company,
        location: item.location,
        link: link,
        sourceUrl: 'https://haebojago.fly.dev',
        image: undefined,
        categoryTags: `${keyword}, ${category}` + (aiScore > 0 ? ', AI' : ''),
    } as CrawledItem;
  });

  console.log(`[Haebojago] Found ${items.length} items for ${category}`);
  return items;
}

// Legacy wrapper for existing crawler
export async function crawlHaebojago(keyword: string): Promise<CrawledItem[]> {
    return searchMcp('opportunity', keyword);
}
