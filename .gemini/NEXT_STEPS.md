# 🎯 크롤링 시스템 설정 가이드

## 현재 상태: 모든 코드 준비 완료! ✅

이제 실제로 시스템을 작동시키기 위한 설정만 하면 됩니다.

---

## Step 1: Supabase 테이블 생성 🗄️

### 방법:

1. **Supabase Dashboard 접속**

   - https://supabase.com/dashboard
   - 프로젝트 선택

2. **SQL Editor 열기**

   - 왼쪽 메뉴에서 "SQL Editor" 클릭
   - 또는 직접 URL: `https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql`

3. **SQL 실행**

   - `.gemini/SQL_CREATE_RECRUIT_ITEMS.sql` 파일 내용 전체 복사
   - SQL Editor에 붙여넣기
   - **Run** 버튼 클릭

4. **확인**
   - 왼쪽 메뉴 "Table Editor" → `recruit_items` 테이블 확인
   - 컬럼들이 제대로 생성되었는지 확인

### ⚠️ 주의사항:

- `profiles` 테이블이 이미 있어야 합니다 (관리자 권한 체크용)
- 만약 `profiles` 테이블이 없다면, RLS 정책 부분을 수정해야 할 수 있습니다

---

## Step 2: GitHub Secrets 설정 🔐

### 방법:

1. **GitHub 저장소 페이지 접속**

   - https://github.com/YOUR_USERNAME/YOUR_REPO

2. **Settings → Secrets and variables → Actions**

   - 상단 메뉴에서 "Settings" 클릭
   - 왼쪽 메뉴에서 "Secrets and variables" → "Actions" 클릭

3. **New repository secret 클릭**

4. **Secret 1 추가: NEXT_PUBLIC_SUPABASE_URL**

   ```
   Name: NEXT_PUBLIC_SUPABASE_URL
   Secret: https://your-project-id.supabase.co
   ```

   - Supabase Dashboard → Project Settings → API → Project URL 복사

5. **Secret 2 추가: SUPABASE_SERVICE_ROLE_KEY**
   ```
   Name: SUPABASE_SERVICE_ROLE_KEY
   Secret: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
   - ⚠️ **중요**: `service_role` 키를 사용해야 합니다 (anon key 아님!)
   - Supabase Dashboard → Project Settings → API → "service_role" 섹션에서 복사
   - "Reveal" 버튼 클릭 후 복사

### 🔒 보안 주의:

- `service_role` 키는 **절대 클라이언트 코드에 노출하면 안 됩니다**
- GitHub Actions에서만 사용되므로 안전합니다
- 이 키는 RLS를 우회할 수 있는 관리자 권한 키입니다

---

## Step 3: 로컬 테스트 (선택사항) 🧪

GitHub Actions를 실행하기 전에 로컬에서 먼저 테스트할 수 있습니다.

### 방법:

1. **환경변수 설정**

   - `.env.local` 파일에 추가:

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

2. **의존성 설치**

   ```bash
   npm install cheerio axios
   ```

3. **크롤링 스크립트 실행**

   ```bash
   node scripts/crawl-recruit.js
   ```

4. **결과 확인**
   - 콘솔에서 크롤링 결과 확인
   - Supabase Table Editor에서 `recruit_items` 테이블에 데이터가 추가되었는지 확인

### 예상 출력:

```
🚀 Starting crawl at: 2026-01-07T04:59:32.000Z
📋 Crawling contests...
✅ Wevity: 5 items
✅ ThinkContest: 3 items
💼 Crawling jobs...
✅ Wanted: 8 items
💾 Saved 16 new items to database
✨ Crawl completed successfully!
```

---

## Step 4: GitHub Actions 수동 실행 테스트 🎬

### 방법:

1. **GitHub 저장소 → Actions 탭**

   - https://github.com/YOUR_USERNAME/YOUR_REPO/actions

2. **"Daily Recruit News Crawl" 워크플로우 선택**

   - 왼쪽 목록에서 클릭

3. **"Run workflow" 버튼 클릭**

   - 오른쪽 상단의 "Run workflow" 드롭다운 클릭
   - "Run workflow" 버튼 클릭

4. **실행 결과 확인**
   - 워크플로우 실행이 시작됩니다
   - 클릭해서 로그 확인
   - 각 단계별 성공/실패 확인

### 문제 해결:

- ❌ **Secrets 오류**: GitHub Secrets이 올바르게 설정되었는지 확인
- ❌ **DB 오류**: Supabase 테이블이 생성되었는지 확인
- ❌ **크롤링 실패**: 특정 사이트의 HTML 구조가 변경되었을 수 있음

---

## Step 5: 크롤링 소스 커스터마이징 🎨

현재 `scripts/crawl-recruit.js`에는 예시 선택자가 들어있습니다.  
실제 사이트에 맞게 수정해야 합니다.

### 수정 방법:

1. **크롤링할 사이트 접속**

   - 예: https://www.wevity.com

2. **개발자 도구 열기 (F12)**

3. **Elements 탭에서 원하는 요소 찾기**

   - 공모전 목록 항목 찾기
   - 제목, 설명, 링크 등의 요소 확인

4. **CSS 선택자 복사**

   - 요소 우클릭 → Copy → Copy selector

5. **`scripts/crawl-recruit.js` 수정**

   ```javascript
   const CRAWL_SOURCES = {
     contests: [
       {
         name: "Wevity",
         url: "https://www.wevity.com",
         selector: ".actual-selector-here", // ← 실제 선택자로 변경
       },
     ],
   };
   ```

6. **파싱 로직 수정**
   - `crawlContests()` 함수 내부의 선택자들도 수정
   - 실제 HTML 구조에 맞게 조정

### 예시:

```javascript
// 예시: Wevity 실제 구조에 맞게 수정
$(source.selector).each((i, element) => {
  const title = $(element).find("h3.contest-title").text().trim();
  const description = $(element).find("p.contest-desc").text().trim();
  const link = $(element).find("a.contest-link").attr("href");
  const dateText = $(element).find("span.deadline").text().trim();
  // ...
});
```

---

## Step 6: 관리자 페이지 접속 👨‍💼

### 방법:

1. **로그인**

   - 관리자 계정으로 로그인

2. **승인 페이지 접속**

   - URL: `http://localhost:3000/admin/recruit-approval`
   - 또는 배포 후: `https://your-domain.com/admin/recruit-approval`

3. **크롤링된 항목 검토**

   - 자동으로 크롤링된 항목들이 표시됩니다
   - 각 항목의 제목, 설명, 링크 등을 확인

4. **승인 또는 거부**
   - ✅ **승인**: `/recruit` 페이지에 표시됩니다
   - ❌ **거부**: 항목이 삭제됩니다

---

## 🎉 완료 후 자동 실행

모든 설정이 완료되면:

- ⏰ **매일 오전 6시 (KST)** 자동으로 크롤링 실행
- 📧 새로운 항목들이 DB에 저장됨 (승인 대기 상태)
- 👨‍💼 관리자가 `/admin/recruit-approval`에서 검토
- ✅ 승인된 항목만 `/recruit` 페이지에 표시

---

## 📊 진행 체크리스트

- [ ] Step 1: Supabase 테이블 생성
- [ ] Step 2: GitHub Secrets 설정
- [ ] Step 3: 로컬 테스트 (선택)
- [ ] Step 4: GitHub Actions 수동 실행 테스트
- [ ] Step 5: 크롤링 소스 커스터마이징
- [ ] Step 6: 관리자 페이지 접속 확인

---

## 🆘 문제 해결

### Q: "Table 'recruit_items' does not exist" 오류

**A**: Step 1을 완료하지 않았습니다. Supabase에서 SQL을 실행하세요.

### Q: GitHub Actions에서 "Error: Invalid Supabase credentials" 오류

**A**: Step 2의 Secrets이 올바르게 설정되었는지 확인하세요.

- Secret 이름이 정확한지 확인
- Service Role Key를 사용했는지 확인 (Anon Key 아님!)

### Q: 크롤링은 되는데 항목이 표시되지 않음

**A**:

1. `/admin/recruit-approval`에서 항목을 승인했는지 확인
2. `is_approved = true`로 설정되었는지 Supabase에서 확인

### Q: 특정 사이트 크롤링이 계속 실패함

**A**:

1. 해당 사이트의 HTML 구조가 변경되었을 수 있습니다
2. CSS 선택자를 다시 확인하고 수정하세요
3. User-Agent 차단 가능성 확인
4. 사이트가 JavaScript로 렌더링되는 경우, Puppeteer 등 사용 고려

---

## 📚 추가 참고 자료

- [Supabase RLS 가이드](https://supabase.com/docs/guides/auth/row-level-security)
- [GitHub Actions 문서](https://docs.github.com/en/actions)
- [Cheerio 문서](https://cheerio.js.org/)
- [Cron 표현식 생성기](https://crontab.guru/)

---

**준비되셨으면 Step 1부터 시작하세요! 🚀**
