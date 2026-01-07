# 🔐 GitHub Secrets 설정 - 간단 가이드

## ✅ 보안 확인

**Q: 환경변수 사용이 안전한가요?**

**A: 네, 완전히 안전합니다!** 이유:

1. ✅ `.env.local`은 Git에 업로드되지 않음 (`.gitignore`에 포함)
2. ✅ 크롤링 스크립트는 서버에서만 실행 (브라우저 노출 없음)
3. ✅ GitHub Secrets는 암호화되어 저장됨
4. ✅ 업계 표준 방식 (모든 CI/CD 시스템이 사용)

### 위험한 경우 vs 안전한 경우

| 환경                       | 안전성  | 이유                    |
| -------------------------- | ------- | ----------------------- |
| 로컬 스크립트 (`scripts/`) | ✅ 안전 | `.env.local`은 Git 제외 |
| GitHub Actions             | ✅ 안전 | Secrets로 암호화        |
| API Routes (`/api/`)       | ✅ 안전 | 서버에서만 실행         |
| 클라이언트 컴포넌트        | ❌ 위험 | 브라우저에 노출         |

**현재 구조는 100% 안전합니다!** 🔒

---

## 🚀 GitHub Secrets 설정 (3단계)

### 1단계: Supabase 정보 가져오기

1. **Supabase Dashboard 접속**

   - https://supabase.com/dashboard
   - 프로젝트 선택

2. **Project Settings → API**

   - 왼쪽 하단 ⚙️ Project Settings 클릭
   - API 메뉴 클릭

3. **정보 복사**
   ```
   ✅ Project URL: https://xxxxx.supabase.co
   ✅ service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
   - "Reveal" 버튼 클릭하여 service_role 키 확인
   - 메모장에 임시 저장

---

### 2단계: GitHub Secrets 추가

**👉 [여기 클릭하여 GitHub Secrets 페이지로 이동](https://github.com/vibefolio/vibefolio-nextjs-src/settings/secrets/actions)**

1. **"New repository secret" 버튼 클릭**

2. **첫 번째 Secret 추가**

   ```
   Name: NEXT_PUBLIC_SUPABASE_URL
   Secret: https://xxxxx.supabase.co
   ```

   → "Add secret" 클릭

3. **두 번째 Secret 추가**

   ```
   Name: SUPABASE_SERVICE_ROLE_KEY
   Secret: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

   → "Add secret" 클릭

4. **확인**
   - 2개의 Secret이 목록에 표시되면 완료!

---

### 3단계: GitHub Actions 테스트

**👉 [여기 클릭하여 Actions 페이지로 이동](https://github.com/vibefolio/vibefolio-nextjs-src/actions)**

1. **왼쪽에서 "Daily Recruit News Crawl" 선택**

2. **"Run workflow" 버튼 클릭**

   - 오른쪽 상단 드롭다운
   - Branch: `main` 선택
   - 녹색 "Run workflow" 버튼 클릭

3. **실행 결과 확인**

   - 페이지 새로고침 (F5)
   - 새로운 워크플로우 실행 클릭
   - "crawl" 작업 → "Run crawler" 단계 확인

4. **예상 출력**
   ```
   🚀 Starting crawl at: 2026-01-07T05:27:22.361Z
   📋 Crawling contests...
   ✅ Wevity: 0 items
   ✅ ThinkContest: 0 items
   💼 Crawling jobs...
   ✅ Wanted: 0 items
   ⚠️ No items crawled
   ✨ Crawl completed successfully!
   ```

---

## 🎉 완료 후

### 자동 크롤링 활성화

- ✅ 매일 오전 6시 (KST) 자동 실행
- ✅ 별도 설정 불필요

### 관리자 페이지

- URL: `/admin/recruit-approval`
- 크롤링된 항목 검토 및 승인

### 사용자 페이지

- URL: `/recruit`
- 승인된 항목만 표시

---

## ❓ FAQ

### Q: "0 items"가 정상인가요?

**A**: 네! 현재 CSS 선택자가 예시이기 때문입니다.  
실제 사이트 구조에 맞게 수정하면 데이터가 수집됩니다.

### Q: Service Role Key가 노출되면 어떻게 되나요?

**A**:

- GitHub Secrets는 암호화되어 저장됩니다
- Actions 로그에서 자동으로 `***`로 마스킹됩니다
- 저장소 관리자만 설정/수정 가능합니다

### Q: 로컬에서 테스트하려면?

**A**:

```bash
node scripts/crawl-recruit.js
```

`.env.local` 파일의 환경변수를 자동으로 읽습니다.

---

## 📊 보안 체크리스트

- [x] `.env.local`이 `.gitignore`에 포함됨
- [x] Service Role Key는 서버 환경에서만 사용
- [x] GitHub Secrets로 암호화 저장
- [x] 클라이언트 코드에서 사용하지 않음
- [x] 로그에서 자동 마스킹

**모든 보안 요구사항 충족! ✅**

---

**지금 바로 GitHub Secrets 설정을 시작하세요!** 🚀

위의 링크를 클릭하여 단계별로 진행하시면 됩니다.
