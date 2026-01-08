// src/lib/crawlers/types.ts
export interface CrawledItem {
  title: string;
  description: string;
  type: 'job' | 'contest' | 'event';
  date: string; // YYYY-MM-DD format
  location?: string;
  prize?: string;
  salary?: string;
  company?: string;
  employmentType?: string;
  link?: string;
  officialLink?: string;
  thumbnail?: string;
  image?: string;
  sourceUrl: string;
  
  // 상세 정보 추가
  applicationTarget?: string;
  sponsor?: string;
  totalPrize?: string;
  firstPrize?: string;
  startDate?: string;
  categoryTags?: string;
}

export interface CrawlResult {
  success: boolean;
  itemsFound: number;
  items: CrawledItem[];
  error?: string;
}

export interface CrawlerConfig {
  name: string;
  url: string;
  type: 'job' | 'contest' | 'event';
  enabled: boolean;
}
