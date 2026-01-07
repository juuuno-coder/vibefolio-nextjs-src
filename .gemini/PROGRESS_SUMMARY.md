# 🎉 크롤링 시스템 구축 완료!

## ✅ 완료된 작업

### 1. **코드 구현** ✅

- [x] GitHub Actions 워크플로우 (`.github/workflows/daily-crawl.yml`)
- [x] 크롤링 스크립트 (`scripts/crawl-recruit.js`)
- [x] 관리자 승인 페이지 (`/admin/recruit-approval`)
- [x] DB 스키마 SQL (`.gemini/SQL_CREATE_RECRUIT_ITEMS.sql`)
- [x] `/recruit` 페이지 업데이트 (승인된 항목만 표시)

### 2. **데이터베이스** ✅

- [x] Supabase에 `recruit_items` 테이블 생성 완료

### 3. **의존성** ✅

- [x] `cheerio`, `axios` 설치 완료

---

## 🚀 다음 단계 (지금 진행할 것)

### Step 2: GitHub Secrets 설정

**📖 상세 가이드**: `.gemini/STEP_2_GITHUB_SECRETS.md` 파일 참고

#### 빠른 시작:

1. **Supabase에서 정보 가져오기**

   - Supabase Dashboard → Project Settings → API
   - `Project URL` 복사
   - `service_role` 키 복사 (Reveal 버튼 클릭)

2. **GitHub Secrets 설정**

   - 👉 [여기 클릭하여 GitHub Secrets 페이지로 이동](https://github.com/vibefolio/vibefolio-nextjs-src/settings/secrets/actions)
   - "New repository secret" 클릭
   - 다음 2개 추가:
     ```
     NEXT_PUBLIC_SUPABASE_URL = https://xxxxx.supabase.co
     SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
     ```

3. **GitHub Actions 테스트**
   - 👉 [여기 클릭하여 Actions 페이지로 이동](https://github.com/vibefolio/vibefolio-nextjs-src/actions)
   - "Daily Recruit News Crawl" 선택
   - "Run workflow" 버튼 클릭
   - 실행 결과 확인

---

## 📊 시스템 작동 방식

```
┌─────────────────────────────────────────────────────────────┐
│  1. GitHub Actions (매일 오전 6시 자동 실행)                │
│     └─ scripts/crawl-recruit.js 실행                        │
│        └─ 여러 사이트에서 채용/공모전/이벤트 크롤링         │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  2. Supabase Database                                       │
│     └─ recruit_items 테이블에 저장                          │
│        - is_approved: false (승인 대기)                     │
│        - is_active: false                                   │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  3. 관리자 검토 (/admin/recruit-approval)                   │
│     └─ 크롤링된 항목 확인                                   │
│        ├─ ✅ 승인: is_approved = true, is_active = true     │
│        └─ ❌ 거부: 항목 삭제                                │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  4. 사용자 페이지 (/recruit)                                │
│     └─ 승인된 항목만 표시                                   │
│        (is_approved = true AND is_active = true)            │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 현재 상태

| 단계 | 작업                     | 상태             |
| ---- | ------------------------ | ---------------- |
| 1    | 코드 구현                | ✅ 완료          |
| 2    | Supabase 테이블 생성     | ✅ 완료          |
| 3    | 의존성 설치              | ✅ 완료          |
| 4    | GitHub Secrets 설정      | ⏳ **다음 단계** |
| 5    | GitHub Actions 테스트    | ⏳ 대기 중       |
| 6    | 크롤링 소스 커스터마이징 | ⏳ 대기 중       |

---

## 🔧 주요 파일 위치

### 설정 파일

- `.github/workflows/daily-crawl.yml` - GitHub Actions 워크플로우
- `scripts/crawl-recruit.js` - 크롤링 스크립트
- `.gemini/SQL_CREATE_RECRUIT_ITEMS.sql` - DB 스키마

### 페이지

- `/admin/recruit-approval` - 관리자 승인 페이지
- `/recruit` - 사용자용 채용/공모전 페이지

### 가이드 문서

- `.gemini/QUICK_START.md` - 빠른 시작 가이드
- `.gemini/NEXT_STEPS.md` - 전체 설정 가이드
- `.gemini/STEP_2_GITHUB_SECRETS.md` - GitHub Secrets 설정 가이드
- `.gemini/GITHUB_SECRETS_GUIDE.md` - Secrets 상세 가이드

---

## 🧪 로컬 테스트 (선택사항)

GitHub Actions 실행 전에 로컬에서 먼저 테스트할 수 있습니다:

```bash
# .env.local에 환경변수 추가 (이미 있다면 확인만)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# 크롤링 스크립트 실행
node scripts/crawl-recruit.js
```

---

## ⚠️ 중요 참고사항

### 1. Service Role Key 보안

- ✅ **안전**: GitHub Actions (서버 환경)
- ❌ **위험**: 클라이언트 코드, 브라우저, 공개 저장소

### 2. 크롤링 소스 커스터마이징

현재 `scripts/crawl-recruit.js`의 선택자는 **예시**입니다.  
실제 사이트 HTML 구조에 맞게 수정해야 데이터가 수집됩니다.

### 3. RLS (Row Level Security)

- 일반 사용자: 승인된 항목만 조회 가능
- 관리자: 모든 항목 조회/수정/삭제 가능
- Service Role Key: RLS 우회 (크롤링 스크립트용)

---

## 📞 문제 해결

### Q: GitHub Actions에서 "Error: Invalid Supabase credentials"

**A**: GitHub Secrets이 올바르게 설정되었는지 확인

- Secret 이름이 정확한지 확인
- Service Role Key를 사용했는지 확인 (Anon Key 아님!)

### Q: 크롤링은 되는데 항목이 0개

**A**: 정상입니다! 현재 선택자가 예시이기 때문입니다.

- 실제 사이트 HTML 구조에 맞게 `scripts/crawl-recruit.js` 수정 필요

### Q: /recruit 페이지에 항목이 표시되지 않음

**A**: `/admin/recruit-approval`에서 항목을 승인했는지 확인

- 승인된 항목만 표시됩니다

---

## 🎉 완료 후 기대 효과

✅ **자동화**

- 매일 오전 6시 자동 크롤링
- 수동 작업 불필요

✅ **품질 관리**

- 관리자 승인 시스템
- 부적절한 항목 필터링

✅ **사용자 경험**

- 최신 채용/공모전 정보 제공
- 신뢰할 수 있는 정보

---

**다음 단계**: `.gemini/STEP_2_GITHUB_SECRETS.md` 파일을 열어서 GitHub Secrets 설정을 진행하세요! 🚀
