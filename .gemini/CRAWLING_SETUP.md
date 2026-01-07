# 🤖 자동 크롤링 시스템 설정 가이드

## 📋 개요

- **스케줄**: 매일 오전 6시 (KST) 자동 실행
- **방식**: GitHub Actions
- **프로세스**: 크롤링 → DB 저장 (승인 대기) → 관리자 승인 → 게시

---

## 🚀 설정 단계

### 1️⃣ Supabase에서 테이블 생성

Supabase SQL Editor에서 다음 SQL을 실행하세요:

```sql
-- .gemini/SQL_CREATE_RECRUIT_ITEMS.sql 파일 내용 복사해서 실행
```

### 2️⃣ GitHub Secrets 설정

GitHub 저장소 → Settings → Secrets and variables → Actions

다음 2개의 Secret을 추가하세요:

| Secret 이름                 | 값                                                  |
| --------------------------- | --------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`  | Supabase 프로젝트 URL                               |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Role Key (⚠️ 주의: Anon Key 아님!) |

**Supabase Service Role Key 찾는 방법:**

1. Supabase Dashboard → Project Settings
2. API 탭
3. "service_role" 키 복사 (⚠️ 절대 공개하지 마세요!)

### 3️⃣ 크롤링 스크립트 커스터마이징

`scripts/crawl-recruit.js` 파일을 열어서:

1. **크롤링할 사이트 추가/수정**

   ```javascript
   const CRAWL_SOURCES = {
     contests: [
       {
         name: "Wevity",
         url: "https://www.wevity.com",
         selector: ".list-item", // 실제 CSS 선택자로 변경
       },
     ],
   };
   ```

2. **파싱 로직 수정**
   - 각 사이트의 HTML 구조에 맞게 `cheerio` 선택자 수정
   - 브라우저 개발자 도구로 요소 검사 후 선택자 확인

### 4️⃣ 로컬 테스트

```bash
# 의존성 설치
npm install cheerio axios @supabase/supabase-js

# 환경변수 설정 (.env.local)
NEXT_PUBLIC_SUPABASE_URL=your_url
SUPABASE_SERVICE_ROLE_KEY=your_key

# 크롤링 스크립트 실행
node scripts/crawl-recruit.js
```

### 5️⃣ GitHub Actions 수동 실행 (테스트)

1. GitHub 저장소 → Actions 탭
2. "Daily Recruit News Crawl" 워크플로우 선택
3. "Run workflow" 버튼 클릭
4. 실행 결과 확인

---

## 🎯 사용 방법

### 관리자 승인 페이지

1. `/admin/recruit-approval` 접속
2. 크롤링된 항목 검토
3. "승인" 또는 "거부" 클릭
4. 승인된 항목만 `/recruit` 페이지에 표시됨

---

## 🔧 문제 해결

### 크롤링이 실행되지 않아요

- GitHub Actions 탭에서 워크플로우 실행 로그 확인
- Secrets이 올바르게 설정되었는지 확인

### 항목이 저장되지 않아요

- Supabase 테이블이 생성되었는지 확인
- RLS 정책이 올바른지 확인
- Service Role Key를 사용했는지 확인 (Anon Key 아님!)

### 특정 사이트 크롤링이 실패해요

- 해당 사이트의 HTML 구조가 변경되었을 수 있음
- CSS 선택자를 다시 확인하고 수정
- User-Agent 차단 가능성 확인

---

## 📁 파일 구조

```
.github/
  workflows/
    daily-crawl.yml          # GitHub Actions 워크플로우
scripts/
  crawl-recruit.js           # 크롤링 스크립트
src/
  app/
    admin/
      recruit-approval/
        page.tsx             # 관리자 승인 페이지
    recruit/
      page.tsx               # 공개 페이지
.gemini/
  SQL_CREATE_RECRUIT_ITEMS.sql  # DB 스키마
  CRAWLING_SETUP.md             # 이 파일
```

---

## ⚠️ 주의사항

1. **robots.txt 확인**: 크롤링할 사이트의 robots.txt를 확인하고 허용 범위 내에서만 크롤링
2. **Rate Limiting**: 요청 간격을 두어 서버에 부담을 주지 않도록 주의
3. **저작권**: 크롤링한 데이터의 저작권을 존중하고, 링크만 제공
4. **Service Role Key 보안**: 절대 코드에 하드코딩하지 말고 GitHub Secrets 사용

---

## 🎉 완료!

이제 매일 오전 6시마다 자동으로 크롤링이 실행됩니다!

관리자는 `/admin/recruit-approval`에서 항목을 검토하고 승인할 수 있습니다.
