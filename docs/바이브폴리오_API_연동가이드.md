# 바이브폴리오 API 연동가이드

외부 시스템 및 클라이언트 앱 연동을 위한 공식 API 명세입니다.

## 1. 인증 (Authorization)

모든 요청 헤더에 다음 중 하나의 토큰을 포함해야 합니다.

- **서버 통신용**: `Authorization: Bearer vf_YOUR_API_KEY` (API Key)
- **클라이언트용**: `Authorization: Bearer eyJ...` (Supabase Access Token)

## 2. 프로젝트 관리

### 2-1. 생성 (POST)

- **Endpoint**: `POST /api/projects`
- **Body** (JSON):

```json
{
  "title": "프로젝트 제목(필수)",
  "content_text": "HTML 본문 내용...",
  "thumbnail_url": "https://...",
  "visibility": "public", // public: 전체공개, unlisted: 일부공개(피드백용), private: 비공개

  // [옵션] 시리즈(컬렉션) 연결 ID / 예약 발행 시간
  "collection_id": 15,
  "scheduled_at": "2026-02-01T09:00:00Z",

  // [설정] 장르/분야/피드백 등
  "custom_data": {
    "genres": ["photo", "3d"],
    "is_feedback_requested": true, // 피드백 요청 활성화
    "tags": ["AI"]
  },
  "assets": [{ "type": "image", "url": "..." }]
}
```

### 2-2. 수정 (PUT)

부분 업데이트(Partial Update)를 지원하며, `custom_data`와 `assets`는 **자동 병합(Smart Merge)**되어 기존 값을 보존합니다.

- **Endpoint**: `PUT /api/projects/{id}`
- **Body**: (변경할 필드만 전송)

```json
{
  "title": "수정할 제목",
  "visibility": "unlisted",
  "custom_data": {
    "genres": ["graphic"] // 기존 태그 등은 유지됨
  }
}
```

### 2-3. 삭제 (DELETE)

- **Endpoint**: `DELETE /api/projects/{id}`
- **Response**: `{ "message": "삭제 완료", "id": 123 }`

## 3. 에러 코드

- `401`: 인증 실패 (키/토큰 누락)
- `403`: 권한 없음 (본인 글 아님 등)
- `404`: 프로젝트 없음
- `429`: 요청 한도 초과
