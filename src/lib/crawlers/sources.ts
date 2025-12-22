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
    name: '온오프믹스',
    url: 'https://onoffmix.com',
    type: 'event',
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
  // 추가 소스는 여기에 계속 추가
];

/**
 * 크롤링 키워드 (크리에이터/디자이너 관련)
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
