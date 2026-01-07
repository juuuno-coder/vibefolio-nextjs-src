# ✅ Step 2: GitHub Secrets 설정하기

## 🔗 바로 가기 링크

### 1️⃣ GitHub Secrets 설정 페이지

**👉 [여기를 클릭하여 GitHub Secrets 페이지로 이동](https://github.com/vibefolio/vibefolio-nextjs-src/settings/secrets/actions)**

### 2️⃣ Supabase API 설정 페이지

**👉 Supabase Dashboard → Project Settings → API**

---

## 📝 설정 순서

### 준비물 체크리스트:

- [ ] Supabase Project URL
- [ ] Supabase Service Role Key

---

## 🎯 단계별 가이드

### 1단계: Supabase에서 필요한 정보 가져오기

#### A. Supabase Dashboard 접속

1. https://supabase.com/dashboard 접속
2. 프로젝트 선택 (vibefolio)

#### B. API 설정 페이지 이동

1. 왼쪽 하단 **⚙️ Project Settings** 클릭
2. **API** 메뉴 클릭

#### C. 정보 복사

1. **Project URL** 복사

   - 예: `https://abcdefghijklmnop.supabase.co`
   - 메모장에 임시 저장

2. **service_role key** 복사
   - "service_role" 섹션 찾기
   - **"Reveal"** 버튼 클릭
   - 전체 키 복사 (매우 긴 문자열)
   - 메모장에 임시 저장

⚠️ **주의**: `anon` 키가 아닌 `service_role` 키를 복사해야 합니다!

---

### 2단계: GitHub Secrets 설정하기

#### A. GitHub Secrets 페이지 접속

**👉 [이 링크 클릭](https://github.com/vibefolio/vibefolio-nextjs-src/settings/secrets/actions)**

또는 수동으로:

1. https://github.com/vibefolio/vibefolio-nextjs-src 접속
2. 상단 **Settings** 탭 클릭
3. 왼쪽 사이드바 **Secrets and variables** → **Actions** 클릭

#### B. Secret 1 추가: NEXT_PUBLIC_SUPABASE_URL

1. **"New repository secret"** 버튼 클릭

2. 입력:

   ```
   Name*: NEXT_PUBLIC_SUPABASE_URL
   ```

   ```
   Secret*: (여기에 Supabase Project URL 붙여넣기)
   ```

   예: `https://abcdefghijklmnop.supabase.co`

3. **"Add secret"** 버튼 클릭

#### C. Secret 2 추가: SUPABASE_SERVICE_ROLE_KEY

1. 다시 **"New repository secret"** 버튼 클릭

2. 입력:

   ```
   Name*: SUPABASE_SERVICE_ROLE_KEY
   ```

   ```
   Secret*: (여기에 Service Role Key 붙여넣기)
   ```

   예: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS...`

3. **"Add secret"** 버튼 클릭

---

### 3단계: 설정 확인

설정이 완료되면 다음과 같이 표시됩니다:

```
Repository secrets

NEXT_PUBLIC_SUPABASE_URL          Updated now by [your-username]
SUPABASE_SERVICE_ROLE_KEY         Updated now by [your-username]
```

✅ 2개의 Secret이 모두 표시되면 성공!

---

## 🧪 Step 3: GitHub Actions 테스트 실행

Secrets 설정이 완료되었으니 이제 크롤링을 테스트해봅시다!

### A. GitHub Actions 페이지 접속

**👉 [여기를 클릭하여 Actions 페이지로 이동](https://github.com/vibefolio/vibefolio-nextjs-src/actions)**

또는 수동으로:

1. GitHub 저장소 메인 페이지
2. 상단 **Actions** 탭 클릭

### B. 워크플로우 수동 실행

1. 왼쪽 사이드바에서 **"Daily Recruit News Crawl"** 클릭

2. 오른쪽 상단 **"Run workflow"** 버튼 클릭

   - 드롭다운이 열립니다

3. Branch 확인: `main` 선택되어 있는지 확인

4. 녹색 **"Run workflow"** 버튼 클릭

### C. 실행 결과 확인

1. 페이지 새로고침 (F5)

   - 새로운 워크플로우 실행이 목록에 나타납니다

2. 실행 중인 워크플로우 클릭

   - 노란색 점: 실행 중
   - 녹색 체크: 성공
   - 빨간색 X: 실패

3. **"crawl"** 작업 클릭하여 상세 로그 확인

4. 각 단계별 로그 확인:
   - ✅ Checkout code
   - ✅ Setup Node.js
   - ✅ Install dependencies
   - ✅ Run crawler ← 여기서 크롤링 로그 확인!

### D. 예상 로그 출력

성공하면 다음과 같은 로그가 표시됩니다:

```
🚀 Starting crawl at: 2026-01-07T05:08:35.000Z
📋 Crawling contests...
✅ Wevity: 0 items
✅ ThinkContest: 0 items
💼 Crawling jobs...
✅ Wanted: 0 items
⚠️ No items crawled
✨ Crawl completed successfully!
```

⚠️ **참고**: 처음에는 크롤링 소스가 예시 선택자로 되어있어서 `0 items`가 정상입니다.  
실제 사이트에 맞게 수정하면 데이터가 수집됩니다.

---

## ❌ 문제 해결

### 오류 1: "Error: Invalid Supabase credentials"

**원인**: Secrets이 잘못 설정됨

**해결**:

1. GitHub Secrets 페이지에서 Secret 삭제
2. Supabase에서 정보 다시 복사
3. Secret 다시 추가

### 오류 2: "Table 'recruit_items' does not exist"

**원인**: Supabase 테이블이 생성되지 않음

**해결**:

1. Supabase SQL Editor 접속
2. `.gemini/SQL_CREATE_RECRUIT_ITEMS.sql` 내용 다시 실행

### 오류 3: "Permission denied"

**원인**: Service Role Key 대신 Anon Key를 사용함

**해결**:

1. Supabase API 설정에서 `service_role` 키 확인
2. `anon` 키가 아닌 `service_role` 키 사용

---

## 🎉 성공 후 다음 단계

GitHub Actions 테스트가 성공하면:

### 1. 자동 크롤링 활성화 ✅

- 매일 오전 6시 (KST) 자동 실행
- 별도 설정 불필요 (이미 `.github/workflows/daily-crawl.yml`에 설정됨)

### 2. 관리자 페이지 확인

- URL: `http://localhost:3000/admin/recruit-approval`
- 또는 배포 후: `https://your-domain.vercel.app/admin/recruit-approval`

### 3. 크롤링 소스 커스터마이징

- `scripts/crawl-recruit.js` 파일 수정
- 실제 사이트 HTML 구조에 맞게 선택자 변경
- 다시 커밋 & 푸시하면 자동 반영

---

## 📊 현재 진행 상황

- [x] Step 1: Supabase 테이블 생성 ✅
- [ ] Step 2: GitHub Secrets 설정 ⏳ (지금 진행 중)
- [ ] Step 3: GitHub Actions 테스트 실행 ⏳ (다음 단계)
- [ ] Step 4: 크롤링 소스 커스터마이징
- [ ] Step 5: 관리자 페이지 확인

---

**지금 바로 GitHub Secrets 설정을 시작하세요!** 🚀

위의 링크들을 클릭하여 단계별로 진행하시면 됩니다.
