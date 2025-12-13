# 📊 통계 카운팅 시스템 설정 가이드

## 🎯 목적

프로젝트의 좋아요, 조회수, 댓글 수를 자동으로 카운팅하는 시스템을 구축합니다.

## 📋 실행할 SQL 스크립트

### 1. 프로젝트 카운팅 시스템

**파일**: `supabase/setup_project_counts.sql`

이 스크립트는 다음을 수행합니다:

- `likes_count`, `views_count`, `comments_count` 컬럼 추가
- 자동 카운팅 트리거 생성
- 조회수 증가 RPC 함수 생성
- 기존 데이터 동기화

### 2. 대댓글 시스템

**파일**: `supabase/setup_comment_replies.sql`

이 스크립트는 다음을 수행합니다:

- `parent_comment_id` 컬럼 추가 (대댓글)
- `mentioned_user_id` 컬럼 추가 (멘션)
- 인덱스 생성

### 3. 팔로우 시스템

**파일**: `supabase/setup_follow.sql`

이 스크립트는 다음을 수행합니다:

- `Follow` 테이블 생성
- RLS 정책 설정
- 인덱스 생성

## 🚀 실행 방법

1. Supabase Dashboard 접속
2. SQL Editor 열기
3. 각 SQL 파일의 내용을 복사하여 실행
4. 성공 메시지 확인

## ✅ 실행 확인

각 스크립트 실행 후 다음을 확인하세요:

```sql
-- 컬럼 확인
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'Project';

-- 트리거 확인
SELECT trigger_name
FROM information_schema.triggers
WHERE event_object_table = 'Like';

-- 함수 확인
SELECT routine_name
FROM information_schema.routines
WHERE routine_type = 'FUNCTION';
```

## 🎯 기대 효과

- ✅ 실시간 통계 업데이트
- ✅ 성능 향상 (집계 쿼리 불필요)
- ✅ 데이터 일관성 보장
- ✅ 자동화된 카운팅

## 🐛 문제 해결

### 에러: "column already exists"

→ 이미 실행되었습니다. 건너뛰세요.

### 에러: "function already exists"

→ `DROP FUNCTION` 후 재실행

### 카운트가 0으로 표시됨

→ 기존 데이터 동기화 쿼리 재실행
