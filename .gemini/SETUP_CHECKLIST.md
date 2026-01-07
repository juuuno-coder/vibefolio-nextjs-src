# 🎯 GitHub Secrets 설정 - 체크리스트

## 📝 필요한 정보 (메모장에 복사해두세요)

### Supabase에서 가져올 정보:

```
1. Project URL:
   https://_____________________.supabase.co

2. Service Role Key:
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9._____________________
```

---

## 🔗 단계별 링크

### Step 1: Supabase 정보 가져오기

1. **Supabase Dashboard 접속**
   👉 https://supabase.com/dashboard

2. **프로젝트 선택** (vibefolio)

3. **Project Settings → API**

   - 왼쪽 하단 ⚙️ 아이콘 클릭
   - "API" 메뉴 클릭

4. **정보 복사**
   - **Project URL** 복사 → 위의 1번에 붙여넣기
   - **service_role** 섹션 찾기
   - "Reveal" 버튼 클릭
   - 전체 키 복사 → 위의 2번에 붙여넣기

---

### Step 2: GitHub Secrets 설정

**👉 [GitHub Secrets 페이지 열기](https://github.com/vibefolio/vibefolio-nextjs-src/settings/secrets/actions)**

1. **"New repository secret" 버튼 클릭**

2. **첫 번째 Secret 추가**

   ```
   Name: NEXT_PUBLIC_SUPABASE_URL
   Secret: (위에서 복사한 Project URL 붙여넣기)
   ```

   → "Add secret" 클릭

3. **다시 "New repository secret" 버튼 클릭**

4. **두 번째 Secret 추가**

   ```
   Name: SUPABASE_SERVICE_ROLE_KEY
   Secret: (위에서 복사한 Service Role Key 붙여넣기)
   ```

   → "Add secret" 클릭

5. **확인**
   - 2개의 Secret이 목록에 표시되면 성공!

---

### Step 3: GitHub Actions 테스트

**👉 [GitHub Actions 페이지 열기](https://github.com/vibefolio/vibefolio-nextjs-src/actions)**

1. **왼쪽에서 "Daily Recruit News Crawl" 클릭**

2. **"Run workflow" 버튼 클릭**

   - 오른쪽 상단 드롭다운
   - Branch: `main` 확인
   - 녹색 "Run workflow" 버튼 클릭

3. **페이지 새로고침 (F5)**

4. **실행 중인 워크플로우 클릭**

   - 노란색 점: 실행 중
   - 녹색 체크: 성공
   - 빨간색 X: 실패

5. **"crawl" 작업 클릭 → "Run crawler" 단계 확인**

---

## ✅ 예상 결과

성공하면 다음과 같은 로그가 표시됩니다:

```
🚀 Starting crawl at: 2026-01-07T05:32:50.000Z
📋 Crawling contests...
✅ Wevity: 0 items
✅ ThinkContest: 0 items
💼 Crawling jobs...
✅ Wanted: 0 items
⚠️ No items crawled
✨ Crawl completed successfully!
```

**"0 items"는 정상입니다!** (CSS 선택자가 예시이기 때문)

---

## 🎉 완료 후

### 자동 크롤링 시작!

- ✅ 매일 오전 6시 (KST) 자동 실행
- ✅ 별도 설정 불필요

### 관리자 페이지

- `/admin/recruit-approval`에서 크롤링된 항목 검토

### 사용자 페이지

- `/recruit`에서 승인된 항목 표시

---

**지금 바로 위의 링크들을 클릭하여 진행하세요!** 🚀

문제가 발생하면 언제든 말씀해주세요!
