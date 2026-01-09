# 🤖 자동 크롤링 시스템 가이드 (v2.0 - AI 강화 버전)

## 📋 시스템 개요

### 현재 구현된 크롤러

| 소스                       | 유형   | 상태    | 설명                                |
| -------------------------- | ------ | ------- | ----------------------------------- |
| **Wevity (위비티)**        | 공모전 | ✅ 활성 | 디자인/웹, 영상/UCC, IT/SW 카테고리 |
| **ThinkContest (씽굿)**    | 공모전 | ✅ 활성 | 영상/UCC, 디자인/캐릭터, IT/SW      |
| **Wanted (원티드)**        | 채용   | ✅ 활성 | AI/ML, Data Science, Design 포지션  |
| **RocketPunch (로켓펀치)** | 채용   | ✅ 활성 | IT 스타트업, AI, 디자인             |
| **Devpost**                | 이벤트 | ✅ 활성 | 글로벌 AI 해커톤/챌린지             |

---

## 🎯 AI 콘텐츠 우선 수집

### 지원 키워드 (자동 필터링)

#### 한글 키워드

- 생성형, 인공지능, AI 영상, AI 이미지, AI 디자인
- 미드저니, 스테이블, 달리, 소라, GPT, LLM
- 딥러닝, 머신러닝

#### 영문 키워드

- Generative AI, GenAI, Machine Learning, Deep Learning
- Midjourney, Stable Diffusion, DALL-E, Sora, Runway, Pika
- OpenAI, Anthropic, Claude, Gemini, ChatGPT
- Text-to-Image, Text-to-Video, AI Film, AI Art

### AI 연관성 점수 시스템

크롤링된 항목은 AI 키워드 매칭에 따라 0-100점의 연관성 점수가 부여됩니다.
점수가 높은 항목이 목록 상단에 노출됩니다.

```typescript
// 사용 예시
import { isAIRelated, getAIRelevanceScore } from "@/lib/crawlers/sources";

const isAI = isAIRelated(title, description); // true/false
const score = getAIRelevanceScore(title, description); // 0-100
```

---

## 📁 파일 구조

```
src/lib/crawlers/
├── crawler.ts        # 메인 크롤러 (통합 관리)
├── types.ts          # TypeScript 타입 정의
├── sources.ts        # 크롤링 소스 및 AI 키워드 설정
├── thinkcontest.ts   # 씽굿 크롤러
├── rocketpunch.ts    # 로켓펀치 크롤러
└── devpost.ts        # Devpost 크롤러
```

---

## 🚀 사용 방법

### 1. 전체 크롤링 실행

```typescript
import { crawlAll } from "@/lib/crawlers/crawler";

const result = await crawlAll();
console.log(`수집된 항목: ${result.itemsFound}개`);
```

### 2. 유형별 크롤링

```typescript
import { crawlByType } from "@/lib/crawlers/crawler";

// 공모전만 수집
const contests = await crawlByType("contest");

// 채용만 수집
const jobs = await crawlByType("job");

// 이벤트/해커톤만 수집
const events = await crawlByType("event");
```

### 3. AI 관련 항목만 수집

```typescript
import { crawlAIOnly } from "@/lib/crawlers/crawler";

const aiItems = await crawlAIOnly();
console.log(`AI 관련 항목: ${aiItems.itemsFound}개`);
```

---

## ⚙️ 스케줄링 옵션

### Option 1: Vercel Cron Jobs (현재 사용 중)

`vercel.json` 설정:

```json
{
  "crons": [
    {
      "path": "/api/crawl",
      "schedule": "0 21 * * *"
    }
  ]
}
```

> UTC 21:00 = KST 06:00 (매일 오전 6시)

### Option 2: GitHub Actions (무료, 추천)

`.github/workflows/daily-crawl.yml`:

```yaml
name: Daily News Crawl

on:
  schedule:
    - cron: "0 21 * * *"
  workflow_dispatch:

jobs:
  crawl:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "18"
      - run: npm install
      - run: npx ts-node scripts/crawl-all.ts
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
```

### Option 3: 수동 실행

관리자 페이지 `/admin/crawl`에서 수동으로 크롤링 실행 가능.

---

## 🗄️ 데이터베이스 스키마

`recruit_items` 테이블 필수 컬럼:

```sql
-- 기존 필드
title TEXT NOT NULL,
description TEXT,
type TEXT CHECK (type IN ('job', 'contest', 'event')),
date DATE,
company TEXT,
location TEXT,
link TEXT,
thumbnail TEXT,

-- 크롤링 관련 필드
is_approved BOOLEAN DEFAULT false,
is_active BOOLEAN DEFAULT false,
crawled_at TIMESTAMP WITH TIME ZONE,
source_link TEXT,

-- AI 관련 필드
category_tags TEXT,  -- 쉼표로 구분된 태그 (예: "AI, 영상, 디자인")

-- 상세 정보 필드
application_target TEXT,
sponsor TEXT,
total_prize TEXT,
first_prize TEXT,
start_date DATE,
banner_image_url TEXT,
views_count INTEGER DEFAULT 0
```

---

## 🔐 보안 주의사항

1. **Rate Limiting**: 각 사이트별 요청 간격 유지 (1-2초)
2. **User-Agent**: 실제 브라우저 User-Agent 사용
3. **Robots.txt**: 크롤링 허용 여부 사전 확인
4. **API Keys**: 환경 변수로 안전하게 관리

---

## 🔧 새 크롤러 추가 방법

1. `src/lib/crawlers/` 디렉토리에 새 파일 생성 (예: `newsite.ts`)

2. 크롤러 함수 구현:

```typescript
import { CrawledItem } from "./types";
import { getAIRelevanceScore } from "./sources";

export async function crawlNewSite(): Promise<CrawledItem[]> {
  // 크롤링 로직 구현
  // AI 연관성 점수 계산
  // 정렬 및 반환
}
```

3. `crawler.ts`에서 import 및 통합:

```typescript
import { crawlNewSite } from "./newsite";

// crawlByType 함수에 추가
```

4. `sources.ts`의 `CRAWLER_SOURCES`에 설정 추가

---

## 📊 크롤링 현황 모니터링

크롤링 결과는 다음에서 확인 가능:

- **관리자 대시보드**: `/admin`
- **승인 센터**: `/admin/approval` (승인 대기 항목)
- **로그**: Vercel/GitHub Actions 실행 로그

---

## 🆘 문제 해결

### 크롤링 실패 시

1. 해당 사이트의 HTML 구조 변경 확인
2. selector 업데이트 필요 여부 검토
3. Rate limit 또는 차단 여부 확인

### 데이터 중복 시

- 크롤러 내 `seenTitles` Set으로 중복 제거
- DB upsert 또는 unique constraint 활용

---

## 🔄 업데이트 이력

| 날짜       | 버전 | 변경 내용                                              |
| ---------- | ---- | ------------------------------------------------------ |
| 2026-01-09 | v2.0 | AI 키워드 필터 강화, 씽굿/로켓펀치/Devpost 크롤러 추가 |
| 2025-12-28 | v1.0 | Wevity/Wanted 크롤러 초기 구현                         |

---

구현이 필요하시면 말씀해주세요! 🚀
