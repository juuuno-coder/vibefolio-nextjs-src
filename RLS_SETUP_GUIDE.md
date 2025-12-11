# 🔐 Supabase RLS 정책 적용 가이드

## ⚠️ **중요: 이 작업을 반드시 수행해야 합니다!**

현재 Vibefolio 앱이 제대로 작동하지 않는 이유는 **Supabase RLS(Row Level Security) 정책이 적용되지 않았기 때문**입니다.

---

## 📋 **적용 방법**

### **1. Supabase Dashboard 접속**

1. https://supabase.com 로그인
2. Vibefolio 프로젝트 선택
3. 왼쪽 메뉴에서 **SQL Editor** 클릭

### **2. SQL 파일 실행**

1. **New Query** 버튼 클릭
2. 아래 파일 내용을 복사하여 붙여넣기:
   - `supabase/migrations/002_rls_policies.sql`
3. **Run** 버튼 클릭 (또는 Ctrl + Enter)

### **3. 확인**

실행 후 다음 메시지가 표시되면 성공:

```
Success. No rows returned
```

---

## 🔍 **적용 후 확인사항**

### **테이블별 RLS 활성화 확인**

1. 왼쪽 메뉴 **Table Editor** 클릭
2. 각 테이블 선택
3. 오른쪽 상단 **RLS enabled** 확인

**RLS가 활성화되어야 하는 테이블:**

- ✅ Project
- ✅ Like
- ✅ Wishlist
- ✅ Comment
- ✅ Proposal
- ✅ Category (읽기 전용)

---

## 🚨 **문제 해결**

### **오류: "permission denied"**

- RLS 정책이 충돌하는 경우
- 해결: 기존 정책 삭제 후 재실행

### **오류: "relation does not exist"**

- 테이블이 없는 경우
- 해결: 먼저 테이블 생성 스키마 실행

---

## ✅ **완료 후**

RLS 정책 적용 후:

1. 로그인/회원가입 정상 작동
2. 좋아요/북마크 기능 작동
3. 댓글 작성/조회 가능
4. 프로젝트 등록/수정/삭제 가능

**이제 앱이 정상적으로 작동합니다!** 🎉
