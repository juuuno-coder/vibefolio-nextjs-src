# 🎉 GitHub Actions 자동 크롤링 시스템 구축 완료!

## ✅ 구현 완료 항목

### 1. **GitHub Actions 워크플로우** ✅

- 파일: `.github/workflows/daily-crawl.yml`
- 스케줄: 매일 오전 6시 (KST) 자동 실행
- 수동 실행도 가능 (테스트용)

### 2. **크롤링 스크립트** ✅

- 파일: `scripts/crawl-recruit.js`
- 기능:
  - 채용, 공모전, 이벤트 자동 크롤링
  - 중복 체크 (제목 + 링크)
  - DB 자동 저장 (승인 대기 상태)

### 3. **관리자 승인 페이지** ✅

- 경로: `/admin/recruit-approval`
- 기능:
  - 크롤링된 항목 검토
  - 승인/거부 버튼
  - 실시간 업데이트

### 4. **데이터베이스 스키마** ✅

- 파일: `.gemini/SQL_CREATE_RECRUIT_ITEMS.sql`
- 테이블: `recruit_items`
- 필드: is_approved, crawled_at 등

### 5. **의존성 설치** ✅

- cheerio (HTML 파싱)
- axios (HTTP 요청)

---

## 🚀 이제 해야 할 일 (3단계)

### Step 1: Supabase에서 테이블 생성

1. Supabase Dashboard 접속
2. SQL Editor 열기
3. `.gemini/SQL_CREATE_RECRUIT_ITEMS.sql` 파일 내용 복사
4. 실행 (Run 버튼 클릭)

**중요**: 이 단계를 먼저 완료해야 합니다!

---

### Step 2: GitHub Secrets 설정

1. GitHub 저장소 페이지 접속
2. **Settings** → **Secrets and variables** → **Actions**
3. **New repository secret** 클릭
4. 다음 2개의 Secret 추가:

#### Secret 1: NEXT_PUBLIC_SUPABASE_URL

```
이름: NEXT_PUBLIC_SUPABASE_URL
값: https://your-project.supabase.co
```

#### Secret 2: SUPABASE_SERVICE_ROLE_KEY

```
이름: SUPABASE_SERVICE_ROLE_KEY
값: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**⚠️ 주의**:

- `SUPABASE_SERVICE_ROLE_KEY`는 **Service Role Key**입니다 (Anon Key 아님!)
- Supabase Dashboard → Project Settings → API → "service_role" 키 복사

---

### Step 3: 크롤링 소스 커스터마이징

`scripts/crawl-recruit.js` 파일을 열어서:

```javascript
// 크롤링할 사이트 추가/수정
const CRAWL_SOURCES = {
  contests: [
    {
      name: "Wevity",
      url: "https://www.wevity.com",
      selector: ".list-item", // ← 실제 CSS 선택자로 변경
    },
    // 더 많은 사이트 추가...
  ],
  jobs: [
    {
      name: "Wanted",
      url: "https://www.wanted.co.kr/wdlist/518",
      selector: ".job-card", // ← 실제 CSS 선택자로 변경
    },
  ],
};
```

**CSS 선택자 찾는 방법:**

1. 크롤링할 사이트 접속
2. F12 (개발자 도구) 열기
3. Elements 탭에서 원하는 요소 찾기
4. 우클릭 → Copy → Copy selector

---

## 🧪 테스트 방법

### 로컬 테스트

```bash
# 환경변수 설정 (.env.local에 추가)
NEXT_PUBLIC_SUPABASE_URL=your_url
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# 크롤링 스크립트 실행
node scripts/crawl-recruit.js
```

### GitHub Actions 수동 실행

1. GitHub 저장소 → **Actions** 탭
2. **Daily Recruit News Crawl** 워크플로우 선택
3. **Run workflow** 버튼 클릭
4. 실행 결과 확인 (로그 보기)

---

## 📋 사용 흐름

```
1. [매일 오전 6시]
   GitHub Actions 자동 실행
   ↓
2. [크롤링 스크립트]
   여러 사이트에서 데이터 수집
   ↓
3. [DB 저장]
   recruit_items 테이블에 저장
   (is_approved = false)
   ↓
4. [관리자 검토]
   /admin/recruit-approval 접속
   ↓
5. [승인/거부]
   승인 → /recruit 페이지에 표시
   거부 → 삭제
```

---

## 🎯 관리자 페이지 접속

1. 로그인 (관리자 계정)
2. `/admin/recruit-approval` 접속
3. 크롤링된 항목 검토
4. "승인" 또는 "거부" 클릭

---

## 🔧 문제 해결

### Q: 크롤링이 실행되지 않아요

**A**: GitHub Actions 탭에서 워크플로우 로그 확인

- Secrets이 올바르게 설정되었는지 확인
- 워크플로우가 활성화되어 있는지 확인

### Q: 항목이 DB에 저장되지 않아요

**A**:

1. Supabase에서 `recruit_items` 테이블이 생성되었는지 확인
2. Service Role Key를 사용했는지 확인 (Anon Key 아님!)
3. RLS 정책이 올바른지 확인

### Q: 특정 사이트 크롤링이 실패해요

**A**:

1. 해당 사이트의 HTML 구조가 변경되었을 수 있음
2. CSS 선택자를 다시 확인하고 수정
3. User-Agent 차단 가능성 확인

---

## 📊 현재 상태

| 항목                      | 상태         |
| ------------------------- | ------------ |
| GitHub Actions 워크플로우 | ✅ 완료      |
| 크롤링 스크립트           | ✅ 완료      |
| 관리자 승인 페이지        | ✅ 완료      |
| DB 스키마                 | ⏳ 실행 필요 |
| GitHub Secrets            | ⏳ 설정 필요 |
| 크롤링 소스 커스터마이징  | ⏳ 수정 필요 |

---

## 🎉 완료 후

모든 설정이 완료되면:

1. **자동 실행**: 매일 오전 6시마다 자동으로 크롤링
2. **관리자 승인**: `/admin/recruit-approval`에서 검토
3. **자동 게시**: 승인된 항목만 `/recruit`에 표시

---

## 📚 참고 문서

- `.gemini/CRAWLING_GUIDE.md` - 크롤링 시스템 전체 가이드
- `.gemini/CRAWLING_SETUP.md` - 상세 설정 가이드
- `.gemini/SQL_CREATE_RECRUIT_ITEMS.sql` - DB 스키마

---

**질문이나 문제가 있으면 언제든 말씀해주세요!** 🚀
