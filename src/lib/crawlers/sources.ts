// src/lib/crawlers/sources.ts
import { CrawlerConfig } from './types';

/**
 * 크롤링 소스 목록
 * 실제 운영 시 각 사이트의 robots.txt를 확인하고 이용약관을 준수해야 합니다.
 */
export const CRAWLER_SOURCES: CrawlerConfig[] = [
  // 공모전 사이트
  {
    name: '씽굿',
    url: 'https://www.thinkcontest.com',
    type: 'contest',
    enabled: true,
  },
  {
    name: '위비티',
    url: 'https://www.wevity.com',
    type: 'contest',
    enabled: true,
  },
  {
    name: '대티즌',
    url: 'https://www.detizen.com',
    type: 'contest',
    enabled: true,
  },
  {
    name: '콘테스트코리아',
    url: 'https://www.contestkorea.com',
    type: 'contest',
    enabled: true,
  },
  // 채용 사이트
  {
    name: '원티드',
    url: 'https://www.wanted.co.kr',
    type: 'job',
    enabled: true,
  },
  {
    name: '로켓펀치',
    url: 'https://www.rocketpunch.com',
    type: 'job',
    enabled: true,
  },
  {
    name: '점핏',
    url: 'https://jumpit.saramin.co.kr',
    type: 'job',
    enabled: true,
  },
  // 이벤트/글로벌
  {
    name: 'Devpost',
    url: 'https://devpost.com',
    type: 'event',
    enabled: true,
  },
  {
    name: 'AI Film Festival',
    url: 'https://theaifilmfestival.com',
    type: 'contest',
    enabled: true,
  },
];

/**
 * 크롤링 키워드 (크리에이터/디자이너/AI 관련)
 */
export const CRAWL_KEYWORDS = [
  '디자이너',
  '크리에이터',
  'UI/UX',
  '그래픽 디자인',
  '영상 제작',
  '콘텐츠 제작',
  '일러스트',
  '포트폴리오',
  'AI 디자인',
  '생성형 AI',
];

/**
 * AI 관련 키워드 - 생성형 AI 콘텐츠 필터링용 (확장판)
 */
export const AI_KEYWORDS = [
  // 한글 키워드 - 일반
  '생성형',
  '생성형AI',
  '생성형 AI',
  '인공지능',
  'AI 영상',
  'AI 이미지',
  'AI 디자인',
  'AI 콘텐츠',
  'AI 광고',
  'AI 마케팅',
  'AI 아트',
  'AI 음악',
  'AI 보이스',
  'AI 더빙',
  'AI 자막',
  'AI 편집',
  'AI 툴',
  
  // 한글 키워드 - 도구명
  '미드저니',
  '스테이블',
  '스테이블 디퓨전',
  '달리',
  '소라',
  '런웨이',
  '피카',
  '클링',
  '루마',
  '헤이젠',
  
  // 한글 키워드 - 기술
  'GPT',
  'LLM',
  '딥러닝',
  '머신러닝',
  '딥페이크',
  '뉴럴',
  '트랜스포머',
  'RAG',
  '파인튜닝',
  '프롬프트',
  
  // 영문 키워드 - 일반
  'Generative AI',
  'GenAI',
  'Gen AI',
  'Artificial Intelligence',
  'Machine Learning',
  'Deep Learning',
  'Neural Network',
  'Transformer',
  'Diffusion Model',
  'Large Language Model',
  
  // 영문 키워드 - 이미지/비디오 도구
  'Midjourney',
  'MidJourney',
  'Stable Diffusion',
  'StableDiffusion',
  'DALL-E',
  'DALL·E',
  'Dalle',
  'Sora',
  'Runway',
  'RunwayML',
  'Pika',
  'Pika Labs',
  'Kling',
  'Luma',
  'Luma AI',
  'HeyGen',
  'Synthesia',
  'D-ID',
  'ElevenLabs',
  'Suno',
  'Udio',
  'Kaiber',
  'Leonardo',
  'Leonardo.ai',
  'Firefly',
  'Adobe Firefly',
  'Imagen',
  'Ideogram',
  'Flux',
  
  // 영문 키워드 - LLM
  'OpenAI',
  'Anthropic',
  'Claude',
  'Gemini',
  'ChatGPT',
  'GPT-4',
  'GPT-5',
  'Llama',
  'Mistral',
  'Perplexity',
  'Copilot',
  'GitHub Copilot',
  'Cursor',
  
  // 영문 키워드 - 기술 용어
  'Text-to-Image',
  'Text-to-Video',
  'Text-to-Speech',
  'Text-to-Music',
  'Image-to-Video',
  'AI Film',
  'AI Art',
  'AI Video',
  'AI Music',
  'AI Voice',
  'AI Avatar',
  'AI Agent',
  'Agentic AI',
  'RAG',
  'Fine-tuning',
  'Prompt Engineering',
  'LoRA',
  'ControlNet',
  'ComfyUI',
  'Automatic1111',
  'Hugging Face',
  'HuggingFace',
  
  // 공모전/행사 관련
  'AI 공모전',
  'AI 콘테스트',
  'AI 챌린지',
  'AI 해커톤',
  'AI Festival',
  'AI Competition',
  'AI Challenge',
  'AI Hackathon',
];

/**
 * 제목/설명에서 AI 관련 컨텐츠인지 판별
 */
export function isAIRelated(title: string, description: string = ''): boolean {
  const text = `${title} ${description}`.toLowerCase();
  return AI_KEYWORDS.some(keyword => text.includes(keyword.toLowerCase()));
}

/**
 * AI 관련도 점수 계산 (0-100)
 */
export function getAIRelevanceScore(title: string, description: string = ''): number {
  const text = `${title} ${description}`.toLowerCase();
  let score = 0;
  let matchedKeywords: string[] = [];
  
  AI_KEYWORDS.forEach(keyword => {
    if (text.includes(keyword.toLowerCase())) {
      score += 10;
      matchedKeywords.push(keyword);
    }
  });
  
  return Math.min(score, 100);
}

/**
 * 날짜 문자열 파싱 (다양한 형식 지원)
 */
export function formatDateString(str: string): string | null {
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
    
    if (now.getMonth() < 3 && parseInt(month) > 9) {
      year = (currentYear - 1).toString();
    } else if (now.getMonth() > 9 && parseInt(month) < 3) {
      year = (currentYear + 1).toString();
    }
  } else {
    return null;
  }
  
  const result = `${year}-${month}-${day}`;
  return isNaN(Date.parse(result)) ? null : result;
}

/**
 * 제목 키워드를 분석하여 고화질 테마 이미지를 반환합니다.
 */
export function getThemedPlaceholder(title: string, type: string): string {
  const t = title.toLowerCase();
  let keyword = "artificial-intelligence"; // Default

  if (type === 'contest') {
    if (t.includes('디자인') || t.includes('디지털아트') || t.includes('미디어')) keyword = "abstract-art";
    else if (t.includes('해커톤') || t.includes('sw') || t.includes('it') || t.includes('ai')) keyword = "cyber-coding";
    else if (t.includes('광고') || t.includes('영상') || t.includes('숏폼')) keyword = "video-production";
    else if (t.includes('아이디어') || t.includes('기획')) keyword = "creative-brainstorm";
    else keyword = "premium-banner";
  } else if (type === 'job') {
    if (t.includes('ai') || t.includes('ml') || t.includes('딥러닝')) keyword = "artificial-intelligence";
    else keyword = "minimal-office";
  } else {
    keyword = "event-concert";
  }

  // Unsplash Source API (Random but keyword-themed)
  return `https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=800&h=600&sig=${encodeURIComponent(title)}`;
}
