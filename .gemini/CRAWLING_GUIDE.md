# 🤖 자동 크롤링 시스템 구현 가이드

## 📋 요구사항

- **스케줄**: 매일 오전 6시 자동 실행
- **프로세스**: 크롤링 → 관리자 승인 → 게시
- **대상 페이지**: `/recruit` (연결 - 채용·공모전·이벤트)

---

## ❌ Next.js 크롤링의 문제점

### 1. **서버리스 환경의 제약**

- Vercel/Netlify 같은 플랫폼에서는 함수 실행 시간 제한 (10~60초)
- 크롤링은 여러 사이트를 순회하므로 시간이 오래 걸림
- 메모리 제한 (1GB 이하)

### 2. **스케줄링 어려움**

- Next.js 자체에는 cron job 기능이 없음
- 매일 특정 시간 실행이 복잡함

### 3. **비용 문제**

- 서버리스 함수 호출마다 과금
- 크롤링은 리소스를 많이 사용

---

## ✅ 추천 해결책 (3가지 옵션)

### **Option 1: Vercel Cron Jobs** (가장 간단)

**장점:**

- Vercel에 내장된 기능
- 설정이 매우 간단
- 추가 서비스 불필요

**단점:**

- Vercel Pro 플랜 필요 ($20/월)
- 실행 시간 제한 (60초)

**구현 방법:**

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/crawl-news",
      "schedule": "0 6 * * *" // 매일 오전 6시 (UTC 기준이므로 21:00 = KST 06:00)
    }
  ]
}
```

```typescript
// src/app/api/cron/crawl-news/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  // Vercel Cron Secret으로 보안 확인
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. 크롤링 실행
    const crawledItems = await crawlRecruitSites();

    // 2. DB에 저장 (is_approved = false)
    const { data, error } = await supabaseAdmin.from("recruit_items").insert(
      crawledItems.map((item) => ({
        ...item,
        is_approved: false, // 관리자 승인 대기
        is_active: false, // 비활성 상태
        crawled_at: new Date().toISOString(),
      }))
    );

    if (error) throw error;

    return NextResponse.json({
      success: true,
      count: crawledItems.length,
    });
  } catch (error) {
    console.error("Crawl error:", error);
    return NextResponse.json({ error: "Crawl failed" }, { status: 500 });
  }
}

// 크롤링 함수 (예시)
async function crawlRecruitSites() {
  const items = [];

  // 예시: 공모전 사이트 크롤링
  const contestSites = [
    "https://www.wevity.com",
    "https://www.thinkcontest.com",
  ];

  for (const site of contestSites) {
    // Cheerio나 Puppeteer 사용
    const siteItems = await crawlSite(site);
    items.push(...siteItems);
  }

  return items;
}
```

---

### **Option 2: GitHub Actions** (무료, 추천!)

**장점:**

- 완전 무료
- 안정적인 스케줄링
- 실행 시간 제한 없음 (6시간까지)

**단점:**

- GitHub 저장소 필요
- 설정이 약간 복잡

**구현 방법:**

```yaml
# .github/workflows/daily-crawl.yml
name: Daily News Crawl

on:
  schedule:
    - cron: "0 21 * * *" # UTC 21:00 = KST 06:00
  workflow_dispatch: # 수동 실행도 가능

jobs:
  crawl:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"

      - name: Install dependencies
        run: npm install

      - name: Run crawler
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY }}
        run: node scripts/crawl-recruit.js
```

```javascript
// scripts/crawl-recruit.js
const { createClient } = require("@supabase/supabase-js");
const cheerio = require("cheerio");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function main() {
  console.log("Starting crawl...");

  // 크롤링 로직
  const items = await crawlAllSites();

  // DB에 저장
  const { data, error } = await supabase.from("recruit_items").insert(
    items.map((item) => ({
      ...item,
      is_approved: false,
      is_active: false,
      crawled_at: new Date().toISOString(),
    }))
  );

  if (error) {
    console.error("Error:", error);
    process.exit(1);
  }

  console.log(`Successfully crawled ${items.length} items`);
}

main();
```

---

### **Option 3: Supabase Edge Functions** (가장 안정적)

**장점:**

- Supabase 생태계와 완벽 통합
- 무료 티어 제공
- Deno 런타임으로 빠름

**단점:**

- Deno/TypeScript 학습 필요
- 별도 배포 과정 필요

**구현 방법:**

```bash
# Supabase CLI 설치
npm install -g supabase

# Edge Function 생성
supabase functions new crawl-recruit

# 배포
supabase functions deploy crawl-recruit
```

```typescript
// supabase/functions/crawl-recruit/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  // 크롤링 로직
  const items = await crawlSites();

  // DB 저장
  const { data, error } = await supabase.from("recruit_items").insert(
    items.map((item) => ({
      ...item,
      is_approved: false,
      is_active: false,
    }))
  );

  return new Response(JSON.stringify({ success: true, count: items.length }), {
    headers: { "Content-Type": "application/json" },
  });
});
```

그리고 **pg_cron**으로 스케줄링:

```sql
-- Supabase SQL Editor에서 실행
SELECT cron.schedule(
  'daily-crawl',
  '0 6 * * *',  -- 매일 오전 6시
  $$
  SELECT net.http_post(
    url:='https://your-project.supabase.co/functions/v1/crawl-recruit',
    headers:='{"Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
  );
  $$
);
```

---

## 🗄️ DB 스키마 수정

관리자 승인 기능을 위해 테이블에 컬럼 추가:

```sql
-- recruit_items 테이블에 컬럼 추가
ALTER TABLE recruit_items
ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS crawled_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id);

-- 인덱스 추가 (성능 향상)
CREATE INDEX IF NOT EXISTS idx_recruit_items_approved
ON recruit_items(is_approved, is_active);
```

---

## 👨‍💼 관리자 승인 페이지

`/admin/recruit-approval` 페이지 생성 필요:

```typescript
// src/app/admin/recruit-approval/page.tsx
export default function RecruitApprovalPage() {
  const [pendingItems, setPendingItems] = useState([]);

  // is_approved = false인 항목 조회
  useEffect(() => {
    loadPendingItems();
  }, []);

  const handleApprove = async (id: number) => {
    await supabase
      .from("recruit_items")
      .update({
        is_approved: true,
        is_active: true,
        approved_at: new Date().toISOString(),
      })
      .eq("id", id);

    loadPendingItems();
  };

  const handleReject = async (id: number) => {
    await supabase.from("recruit_items").delete().eq("id", id);

    loadPendingItems();
  };

  // UI 렌더링...
}
```

---

## 🎯 최종 추천

**GitHub Actions (Option 2)** 를 추천합니다!

**이유:**

1. ✅ 완전 무료
2. ✅ 안정적이고 신뢰성 높음
3. ✅ 실행 시간 제한 없음
4. ✅ 설정이 비교적 간단
5. ✅ 이미 GitHub 사용 중

**다음 단계:**

1. `scripts/crawl-recruit.js` 크롤링 스크립트 작성
2. `.github/workflows/daily-crawl.yml` 워크플로우 설정
3. DB 스키마 수정 (is_approved 컬럼 추가)
4. 관리자 승인 페이지 구현

---

## 📦 필요한 패키지

```bash
npm install cheerio axios
# 또는 더 강력한 크롤링을 위해
npm install puppeteer
```

---

## 🔐 보안 주의사항

1. **Secrets 관리**: GitHub Secrets에 API 키 저장
2. **Rate Limiting**: 크롤링 시 요청 간격 두기
3. **User-Agent**: 봇으로 차단되지 않도록 설정
4. **Robots.txt**: 크롤링 허용 여부 확인

---

구현이 필요하시면 말씀해주세요! 🚀
