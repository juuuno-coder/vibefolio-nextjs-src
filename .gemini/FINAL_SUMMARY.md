# 🎯 크롤링 시스템 + 배너 시스템 완성!

## ✅ 완료된 작업

### 1. 크롤링 시스템

- [x] GitHub Actions 자동 크롤링 (매일 오전 6시)
- [x] 관리자 승인 시스템 (`/admin/recruit-approval`)
- [x] 자동 만료 기능 (마감일 지난 항목 비활성화)
- [x] 테스트 데이터 추가 스크립트

### 2. 배너 시스템 (NEW!)

- [x] DB 스키마 확장 (배너 관련 필드 추가)
- [x] 관리자 배너 관리 페이지 (`/admin/banner`)
- [x] 배너 위치 설정 (둘러보기/연결하기/둘 다)
- [x] 배너 우선순위 관리

---

## 🚀 사용 방법

### Step 1: Supabase에서 배너 필드 추가

1. Supabase Dashboard → SQL Editor
2. `.gemini/SQL_ADD_BANNER_FIELDS.sql` 파일 내용 복사
3. 실행 (Run 버튼 클릭)

### Step 2: GitHub Secrets 설정

**👉 [GitHub Secrets 페이지](https://github.com/vibefolio/vibefolio-nextjs-src/settings/secrets/actions)**

다음 2개의 Secret 추가:

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

### Step 3: 배너 관리

1. **관리자 로그인**
2. **`/admin/recruit-approval`** - 크롤링된 항목 승인
3. **`/admin/banner`** - 승인된 항목을 배너로 설정

---

## 📊 시스템 흐름

```
1. GitHub Actions (매일 오전 6시)
   ↓
2. 크롤링 실행 (scripts/crawl-recruit.js)
   ↓
3. DB 저장 (is_approved = false)
   ↓
4. 관리자 승인 (/admin/recruit-approval)
   - 승인 → is_approved = true, is_active = true
   ↓
5. 배너 설정 (/admin/banner)
   - 배너로 추가 → show_as_banner = true
   - 위치 선택 → banner_location (discover/recruit/both)
   - 우선순위 조정 → banner_priority
   ↓
6. 메인 페이지 표시
   - /discover (둘러보기) - banner_location = 'discover' or 'both'
   - /recruit (연결하기) - banner_location = 'recruit' or 'both'
```

---

## 🎨 배너 시스템 기능

### 배너 관리 페이지 (`/admin/banner`)

#### 현재 배너 섹션

- ✅ 배너로 설정된 항목 목록
- ✅ 우선순위 조정 (위/아래 화살표)
- ✅ 배너 제거 버튼
- ✅ 위치 변경 (둘러보기/연결하기/둘 다)

#### 사용 가능한 항목 섹션

- ✅ 승인된 항목 중 배너가 아닌 항목
- ✅ "배너로 추가" 버튼

### 배너 위치 옵션

1. **둘러보기** - `/discover` 페이지에만 표시
2. **연결하기** - `/recruit` 페이지에만 표시
3. **둘 다** - 두 페이지 모두 표시

### 우선순위 시스템

- 숫자가 낮을수록 먼저 표시
- 화살표 버튼으로 순서 조정

---

## 📝 다음 단계

### 1. Supabase SQL 실행

```sql
-- .gemini/SQL_ADD_BANNER_FIELDS.sql 실행
```

### 2. 메인 페이지에 배너 컴포넌트 추가

둘러보기(`/discover`)와 연결하기(`/recruit`) 페이지에 배너를 표시할 컴포넌트를 추가해야 합니다.

예시:

```tsx
// src/components/RecruitBanner.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export function RecruitBanner({
  location,
}: {
  location: "discover" | "recruit";
}) {
  const [banners, setBanners] = useState([]);

  useEffect(() => {
    loadBanners();
  }, []);

  const loadBanners = async () => {
    const { data } = await supabase
      .from("recruit_items")
      .select("*")
      .eq("show_as_banner", true)
      .eq("is_approved", true)
      .eq("is_active", true)
      .or(`banner_location.eq.${location},banner_location.eq.both`)
      .order("banner_priority", { ascending: true })
      .limit(3);

    setBanners(data || []);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {banners.map((banner) => (
        <div key={banner.id} className="bg-white rounded-lg shadow p-4">
          <h3 className="font-bold">{banner.title}</h3>
          <p className="text-sm text-gray-600">{banner.description}</p>
          {banner.link && (
            <a href={banner.link} target="_blank" className="text-green-600">
              자세히 보기 →
            </a>
          )}
        </div>
      ))}
    </div>
  );
}
```

### 3. GitHub Actions 테스트

**👉 [GitHub Actions 페이지](https://github.com/vibefolio/vibefolio-nextjs-src/actions)**

- "Daily Recruit News Crawl" 워크플로우 수동 실행
- 로그 확인

---

## 🎉 완료 후 기대 효과

### 자동화

- ✅ 매일 자동 크롤링
- ✅ 마감일 자동 체크
- ✅ 만료 항목 자동 비활성화

### 관리 편의성

- ✅ 관리자 승인 시스템
- ✅ 배너 관리 시스템
- ✅ 우선순위 조정

### 사용자 경험

- ✅ 메인 페이지에 최신 정보 배너 표시
- ✅ 둘러보기/연결하기 페이지별 맞춤 배너
- ✅ 신뢰할 수 있는 정보

---

## 📂 파일 구조

```
vibefolio-nextjs/
├── .github/workflows/
│   └── daily-crawl.yml          # GitHub Actions 워크플로우
├── scripts/
│   ├── crawl-recruit.js         # 크롤링 스크립트
│   ├── auto-expire.js           # 자동 만료 스크립트
│   ├── add-test-data.js         # 테스트 데이터 추가
│   └── check-data.js            # 데이터 확인
├── src/app/
│   ├── admin/
│   │   ├── recruit-approval/    # 승인 페이지
│   │   │   └── page.tsx
│   │   └── banner/              # 배너 관리 페이지 (NEW!)
│   │       └── page.tsx
│   └── recruit/                 # 사용자 페이지
│       └── page.tsx
└── .gemini/
    ├── SQL_CREATE_RECRUIT_ITEMS.sql  # 기본 테이블
    └── SQL_ADD_BANNER_FIELDS.sql     # 배너 필드 추가 (NEW!)
```

---

## 🔧 문제 해결

### Q: Vercel 빌드 에러

**A**: `cheerio`를 API Route에서 사용하지 마세요. 서버 스크립트에서만 사용하세요.

### Q: 배너가 표시되지 않음

**A**:

1. Supabase에서 SQL 실행했는지 확인
2. `/admin/banner`에서 배너로 설정했는지 확인
3. `show_as_banner = true`인지 확인

### Q: 크롤링이 작동하지 않음

**A**: GitHub Secrets이 올바르게 설정되었는지 확인

---

**모든 준비가 완료되었습니다!** 🚀

다음 단계:

1. `.gemini/SQL_ADD_BANNER_FIELDS.sql` 실행
2. GitHub Secrets 설정
3. `/admin/banner` 페이지에서 배너 관리

질문이 있으면 언제든 말씀하세요! 😊
