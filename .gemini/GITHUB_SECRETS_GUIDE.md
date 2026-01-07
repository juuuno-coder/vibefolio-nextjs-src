# 🔐 GitHub Secrets 설정 가이드

## 필요한 정보

GitHub Actions에서 크롤링 스크립트를 실행하려면 다음 2개의 Secret이 필요합니다:

### 1. NEXT_PUBLIC_SUPABASE_URL

- **설명**: Supabase 프로젝트 URL
- **형식**: `https://xxxxxxxxxxxxx.supabase.co`
- **찾는 방법**:
  1. Supabase Dashboard 접속
  2. Project Settings (톱니바퀴 아이콘)
  3. API 섹션
  4. "Project URL" 복사

### 2. SUPABASE_SERVICE_ROLE_KEY

- **설명**: Supabase Service Role Key (관리자 권한)
- **형식**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (매우 긴 문자열)
- **찾는 방법**:
  1. Supabase Dashboard 접속
  2. Project Settings (톱니바퀴 아이콘)
  3. API 섹션
  4. "service_role" 섹션 찾기
  5. "Reveal" 버튼 클릭
  6. 전체 키 복사

⚠️ **주의**: `service_role` 키를 사용해야 합니다! `anon` 키가 아닙니다!

---

## GitHub Secrets 설정 방법

### 단계 1: GitHub 저장소 Settings 접속

1. GitHub 저장소 페이지 접속

   - URL: https://github.com/vibefolio/vibefolio-nextjs-src

2. 상단 메뉴에서 **Settings** 클릭

3. 왼쪽 사이드바에서:
   - **Secrets and variables** 클릭
   - **Actions** 클릭

### 단계 2: Secret 추가

#### Secret 1: NEXT_PUBLIC_SUPABASE_URL

1. **New repository secret** 버튼 클릭

2. 입력:

   ```
   Name: NEXT_PUBLIC_SUPABASE_URL
   Secret: https://xxxxxxxxxxxxx.supabase.co
   ```

   (실제 Supabase URL로 교체)

3. **Add secret** 클릭

#### Secret 2: SUPABASE_SERVICE_ROLE_KEY

1. 다시 **New repository secret** 버튼 클릭

2. 입력:

   ```
   Name: SUPABASE_SERVICE_ROLE_KEY
   Secret: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

   (실제 Service Role Key로 교체)

3. **Add secret** 클릭

### 단계 3: 확인

설정이 완료되면 다음과 같이 표시됩니다:

```
Repository secrets
├── NEXT_PUBLIC_SUPABASE_URL
└── SUPABASE_SERVICE_ROLE_KEY
```

---

## 🧪 테스트: GitHub Actions 수동 실행

Secrets 설정이 완료되면 바로 테스트할 수 있습니다:

### 방법:

1. **GitHub 저장소 → Actions 탭**

   - URL: https://github.com/vibefolio/vibefolio-nextjs-src/actions

2. **왼쪽에서 "Daily Recruit News Crawl" 선택**

3. **오른쪽 상단 "Run workflow" 버튼 클릭**

   - 드롭다운이 열립니다
   - Branch: `main` 선택
   - 녹색 "Run workflow" 버튼 클릭

4. **실행 결과 확인**
   - 페이지를 새로고침하면 새로운 워크플로우 실행이 표시됩니다
   - 클릭해서 로그 확인
   - 각 단계별로 성공/실패 확인

### 예상 결과:

✅ **성공하면**:

- "Run crawler" 단계에서 크롤링 로그 확인
- "💾 Saved X new items to database" 메시지 확인
- Supabase Table Editor에서 `recruit_items` 테이블에 데이터 확인

❌ **실패하면**:

- 로그에서 에러 메시지 확인
- Secrets이 올바르게 설정되었는지 재확인
- 테이블이 제대로 생성되었는지 확인

---

## 🔒 보안 참고사항

### Service Role Key의 중요성:

- ✅ **안전한 사용**: GitHub Actions (서버 환경)
- ❌ **절대 금지**: 클라이언트 코드, 공개 저장소, 브라우저

### 왜 Service Role Key가 필요한가?

- RLS (Row Level Security)를 우회할 수 있는 권한
- 크롤링 스크립트가 `is_approved = false` 상태로 데이터 삽입 가능
- 일반 사용자는 승인된 항목만 볼 수 있음

---

## 📊 다음 단계

Secrets 설정과 테스트가 완료되면:

1. ✅ 매일 오전 6시 자동 크롤링 시작
2. 👨‍💼 `/admin/recruit-approval`에서 항목 검토
3. ✅ 승인된 항목만 `/recruit` 페이지에 표시

---

**준비되셨으면 GitHub Secrets 설정을 시작하세요!** 🚀
