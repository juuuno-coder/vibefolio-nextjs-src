# 채용/공모전 크롤링 시스템 설정 가이드

## 환경 변수 설정

`.env.local` 파일에 다음 환경 변수를 추가하세요:

```bash
# Supabase (기존)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Cron Job Secret (새로 추가)
CRON_SECRET=your-random-secret-key-here
```

`CRON_SECRET`은 스케줄된 크롤링을 보호하기 위한 비밀 키입니다.
랜덤한 문자열을 생성하여 사용하세요.

## 데이터베이스 설정

1. Supabase 대시보드에서 SQL 에디터를 엽니다
2. `supabase/CREATE_RECRUIT_ITEMS_TABLE.sql` 파일의 내용을 실행합니다
3. 테이블과 정책이 생성되었는지 확인합니다

## Vercel 배포 설정

1. Vercel 프로젝트 설정에서 Environment Variables에 위의 환경 변수들을 추가합니다
2. `vercel.json` 파일이 프로젝트 루트에 있는지 확인합니다
3. Vercel에 배포하면 자동으로 Cron Job이 설정됩니다

## 크롤링 스케줄

- **자동 실행**: 매일 오전 6시 (KST 기준, UTC로는 전날 21:00)
- **수동 실행**: 관리자 페이지 `/admin/recruit/crawl`에서 언제든지 실행 가능

## 사용 방법

### 관리자 페이지 접근

1. `/admin/recruit/crawl` 페이지로 이동
2. 크롤링 통계 및 히스토리 확인
3. 필요시 수동 크롤링 실행

### 크롤링 소스 관리

`src/lib/crawlers/sources.ts` 파일에서 크롤링 소스를 추가/수정할 수 있습니다:

```typescript
export const CRAWLER_SOURCES: CrawlerConfig[] = [
  {
    name: "사이트명",
    url: "https://example.com",
    type: "job", // 'job' | 'contest' | 'event'
    enabled: true,
  },
  // 추가 소스...
];
```

### 실제 크롤링 구현

현재는 데모 데이터를 생성하는 시뮬레이션 모드입니다.
실제 크롤링을 구현하려면:

1. `cheerio` 또는 `puppeteer` 설치:

   ```bash
   npm install cheerio
   ```

2. `src/lib/crawlers/crawler.ts`의 주석 처리된 실제 크롤링 코드를 참고하여 구현

3. 각 사이트의 `robots.txt`와 이용약관을 확인하고 준수

## 주의사항

⚠️ **법적 고려사항**:

- 크롤링 전 각 사이트의 `robots.txt` 확인
- 이용약관 준수
- Rate limiting 적용
- 가능하면 공식 API 사용 권장

⚠️ **성능 고려사항**:

- 크롤링 빈도 조절
- 서버 부하 모니터링
- 에러 핸들링 및 재시도 로직

## API 엔드포인트

### POST /api/crawl

크롤링 실행

**Request Body**:

```json
{
  "type": "all" | "job" | "contest" | "event",
  "secret": "your-cron-secret" // 스케줄러용
}
```

**Response**:

```json
{
  "success": true,
  "itemsFound": 10,
  "itemsAdded": 5,
  "itemsUpdated": 3,
  "duration": 1234
}
```

### GET /api/crawl

크롤링 상태 조회 (관리자만)

**Response**:

```json
{
  "logs": [...],
  "statistics": {
    "total": 100,
    "crawled": 80,
    "manual": 20,
    "byType": {
      "job": 40,
      "contest": 35,
      "event": 25
    }
  }
}
```

## 문제 해결

### 크롤링이 실행되지 않음

- Vercel Cron Jobs가 활성화되어 있는지 확인
- 환경 변수가 올바르게 설정되어 있는지 확인
- Vercel 로그에서 에러 메시지 확인

### 데이터가 저장되지 않음

- Supabase RLS 정책 확인
- `SUPABASE_SERVICE_ROLE_KEY`가 올바른지 확인
- 데이터베이스 테이블이 생성되어 있는지 확인

### 중복 데이터 발생

- 크롤링 로직의 중복 체크 부분 확인
- 제목과 링크 조합으로 중복을 판단합니다
