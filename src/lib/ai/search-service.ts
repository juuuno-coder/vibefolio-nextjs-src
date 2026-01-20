import { GoogleGenerativeAI } from "@google/generative-ai";

// This service simulates a Search Agent + LLM.
// In a real production environment, you would integrate:
// 1. Serper.dev or Google Custom Search API for `searchWeb`
// 2. OpenAI or Anthropic API for `generateAnswer` (LLM)

export interface SearchResultItem {
  title: string;
  link: string;
  snippet: string;
  source?: string;
  date?: string;
  // Additional fields for specific categories
  company?: string;
  location?: string;
  tags?: string[];
}

interface AgentResponse {
  answer: string; // The LLM's conversational answer
  results: SearchResultItem[]; // The raw search results to display as cards
}

// Mock Database of "Internet Content" for simulation
const MOCK_DB: Record<string, SearchResultItem[]> = {
  'job': [
    { title: 'Senior Prompt Engineer', company: 'Google Deepmind', location: 'Seoul / Remote', date: '2 days ago', link: '#', snippet: 'Looking for an expert in LLM prompting...', tags: ['LLM', 'Python'] },
    { title: 'AI Art Creator', company: 'Krafton', location: 'Pangyo', date: '1 week ago', link: '#', snippet: 'Create stunning assets using Midjourney...', tags: ['Art', 'Design'] },
    { title: 'Generative AI Hackathon', company: 'Microsoft Korea', location: 'Seoul', date: 'D-5', link: '#', snippet: 'Build the future with Azure OpenAI...', tags: ['Hackathon', 'Azure'] },
    { title: 'AI Service Planner', company: 'Naver Cloud', location: 'Seongnam', date: 'Just now', link: '#', snippet: 'Plan usage of HyperCLOVA X...', tags: ['PM', 'Strategy'] }
  ],
  'trend': [
    { title: 'GPT-5 Rumors Speculation', source: 'TechCrunch', date: '3 hours ago', link: '#', snippet: 'OpenAI might be releasing the next generation model sooner than expected...' },
    { title: 'Apple Intelligence Features', source: 'The Verge', date: 'Yesterday', link: '#', snippet: 'Deep dive into the new on-device AI features coming to iOS 18...' },
    { title: 'Sora Public Access Update', source: 'Wired', date: '2 days ago', link: '#', snippet: 'When will the video generation model be available to everyone?...' },
  ],
  'tool': [
    { title: 'Runway Gen-3', source: 'Video Generation', link: '#', snippet: 'Leading video generation AI tool with realistic physics...', tags: ['Video', 'Paid'] },
    { title: 'Claude 3.5 Sonnet', source: 'LLM Chat', link: '#', snippet: 'Anthropic\'s most intelligent model yet...', tags: ['Chat', 'Free'] },
    { title: 'Gamma App', source: 'Presentation', link: '#', snippet: 'Generate decks, docs & webpages in seconds...', tags: ['Productivity', 'Freemium'] },
  ],
  'recipe': [
    { title: 'Cinematic Lighting Portrait', source: 'Midjourney v6', link: '#', snippet: '/imagine prompt: heroic close-up portrait, cinematic lighting, volatility...', tags: ['Realistic', 'Portrait'] },
    { title: 'Isometric 3D Room', source: 'Stable Diffusion', link: '#', snippet: 'isometric view of a cozy gamer room, blender render style, 8k...', tags: ['3D', 'Cute'] },
  ]
};

export async function processUserQuery(userQuery: string, category: string): Promise<AgentResponse> {
  console.log(`[Agent] Processing query: "${userQuery}" for category: ${category}`);
  
  const keywords = userQuery.split(" ").filter(w => w.length > 1);
  // 1. Get Search Results (Mock for now, can be replaced with Real Search API)
  const rawResults = await mockSearchWeb(keywords, category);

  // 2. Generate Answer using Gemini (or fallback mock)
  let answer = "";
  try {
     if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) throw new Error("No API Key");
     answer = await generateGeminiResponse(userQuery, rawResults, category);
  } catch (e) {
     console.warn("Gemini Error/Missing Key, falling back to mock:", e);
     answer = generateMockLLMResponse(userQuery, rawResults, category);
  }

  return {
    answer,
    results: rawResults
  };
}

async function generateGeminiResponse(query: string, results: SearchResultItem[], category: string): Promise<string> {
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);
    // Using a reliable model, flash is faster/cheaper for this use case
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const context = results.map(r => `- ${r.title}: ${r.snippet} (${r.source || r.company})`).join('\n');
    
    let specializedInstruction = "";
    if (category === 'lean-canvas') {
        specializedInstruction = "You are a Lean Startup Coach. Help the user clarify their business idea (Problem, Customer, UVP) so that a Lean Canvas can be generated later. Ask one insightful question at a time.";
    } else if (category === 'persona') {
        specializedInstruction = "You are a UX Persona Expert. Ask questions to understand the demographic, psychological, and behavioral traits of the target user to build a detailed persona.";
    }

    const prompt = `
    Role: You are an engaging and helpful AI Assistant specializing in "${category}". ${specializedInstruction}
    Task: Answer the user's query based on the following search results used as context. If the search results aren't sufficient, use your own general knowledge to be helpful, but prioritize the provided context.
    
    User Query: "${query}"
    
    Context (Search Results):
    ${context}
    
    Instructions:
    - Respond in Korean.
    - Be concise, professional, yet friendly.
    - Summarize the key findings from the context.
    - Do not explicitly mention "I found these search results", just give the answer naturally.
    - Max length: roughly 3-4 sentences.
    - Use Markdown for emphasis (e.g. bolding key tools or companies).
    `;

    const result = await model.generateContent(prompt);
    return result.response.text();
}

async function mockSearchWeb(keywords: string[], category: string): Promise<SearchResultItem[]> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1000));

  const db = MOCK_DB[category] || [];
  
  // Simple filter logic to mimic search engine
  if (keywords.length === 0) return db.slice(0, 3); // Default return

  // Filter based on mock matching (very simple)
  const filtered = db.filter(item => {
    const text = (item.title + item.snippet + (item.tags?.join('') || '')).toLowerCase();
    return keywords.some(k => text.includes(k.toLowerCase()));
  });

  // If no matches, return generic fallback to avoid empty state in demo
  return filtered.length > 0 ? filtered : db.slice(0, 2); 
}

function generateMockLLMResponse(query: string, results: SearchResultItem[], category: string): string {
  if (results.length === 0) return "죄송합니다. 관련 정보를 찾지 못했습니다. 다른 키워드로 검색해보시겠어요?";

  const count = results.length;
  
  if (category === 'job') {
    return `"${query}" 관련하여 현재 ${count}건의 채용 정보와 기회를 찾았습니다. \n주로 ${results[0].location || '서울'} 지역의 공고가 눈에 띄네요.`;
  }
  if (category === 'trend') {
    return `"${query}"에 대한 최신 트렌드 뉴스입니다. \n${results[0].source} 등에서 관련 소식을 다루고 있습니다.`;
  }
  if (category === 'tool') {
    return `작업에 도움이 될 만한 도구들을 찾았습니다. \n특히 "${results[0].title}"가 사용 목적에 잘 맞을 것 같습니다.`;
  }
  if (category === 'recipe') {
    return `요청하신 스타일에 맞는 프롬프트 레시피입니다. \n"${results[0].source}" 모델을 활용한 결과를 참고해보세요.`;
  }
  
  return `검색 결과 ${count}건을 찾았습니다.`;
}
