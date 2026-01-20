# API Integration Guide (API 연동 가이드)

VibeFolio 플랫폼의 프로젝트를 외부 애플리케이션이나 클라이언트에서 관리하기 위한 API 명세서입니다.

## 1. 인증 (Authentication)

API 요청 시 두 가지 인증 방식을 지원합니다. 상황에 맞는 방식을 선택해 사용하세요.

### A. API Key (서버 간 통신용)

백엔드 스크립트나 외부 서버에서 요청할 때 사용합니다.

- **Header:** `Authorization: Bearer vf_YOUR_API_KEY`
- **특징:** 만료되지 않으며(설정에 따라), 높은 권한을 가질 수 있습니다.

### B. JWT Token (클라이언트/브라우저용)

웹 클라이언트나 앱에서 로그인한 사용자의 토큰을 그대로 사용할 때 사용합니다.

- **Header:** `Authorization: Bearer eyJhbGciOiJIUzI1...` (Supabase Access Token)
- **특징:** 로그인 세션과 동일한 권한을 가지며, Supabase RLS 정책을 따릅니다.

---

## 2. 프로젝트 API

### 2-1. 프로젝트 생성 (Create)

새로운 프로젝트를 생성합니다.

- **Endpoint:** `POST /api/projects`
- **Content-Type:** `application/json`

**요청 본문 (Request Body):**

```json
{
  "title": "내 프로젝트 제목",
  "content_text": "HTML 포맷의 본문 내용...",
  "description": "검색 및 요약용 텍스트 (선택)",
  "thumbnail_url": "https://example.com/cover.jpg",
  "visibility": "public",

  // [옵션] 시리즈(컬렉션)에 에피소드로 추가 시
  "collection_id": 15,

  // [옵션] 예약 발행 (ISO 8601 Format)
  "scheduled_at": "2026-02-01T09:00:00Z",

  // [중요] 메타데이터 및 설정 - JSON 객체로 전송
  "custom_data": {
    "genres": ["photo", "3d"],
    "fields": ["branding"],
    "is_feedback_requested": true, // 피드백 요청 여부
    "tags": ["AI", "Generative Art"]
  },

  // 사용된 에셋 이미지 URL 목록 (선택)
  "assets": [{ "type": "image", "url": "https://..." }]
}
```

### 2-2. 프로젝트 수정 (Update)

기존 프로젝트의 내용을 수정합니다. **부분 업데이트(Partial Update)**를 지원합니다.
전송하지 않은 필드는 기존 값이 유지됩니다.

- **Endpoint:** `PUT /api/projects/{id}`

**요청 본문 (Request Body Example):**

```json
{
  "title": "수정된 제목",
  "visibility": "unlisted", // 링크만 공개 (피드백 전용)

  // [Smart Merge 적용]
  // 기존 custom_data의 다른 값은 유지되고, genres만 업데이트됩니다.
  "custom_data": {
    "genres": ["graphic"]
  }
}
```

**공개 범위 (`visibility`) 옵션:**

- `public`: 전체 공개 (메인 노출)
- `unlisted`: 링크만 공개 (메인 미노출, 피드백 전용)
- `private`: 비공개 (나만 보기)

**참고 (Smart Merge):**
`custom_data`와 `assets` 필드는 기존 데이터를 덮어쓰지 않고 병합됩니다. 예를 들어, 기존에 `{"tags": ["a"]}`가 있을 때 `{"genres": ["b"]}`만 보내면 최종 결과는 `{"tags": ["a"], "genres": ["b"]}`가 됩니다.

### 2-3. 프로젝트 삭제 (Delete)

프로젝트를 삭제(Soft Delete)합니다. DB에는 남지만 서비스에서는 보이지 않게 됩니다.

- **Endpoint:** `DELETE /api/projects/{id}`

**응답 (Response):**

```json
{
  "message": "프로젝트가 삭제되었습니다.",
  "id": 123
}
```

---

## 3. 에러 코드 (Common Errors)

- `401 Unauthorized`: 인증 헤더가 없거나 토큰이 유효하지 않음.
- `403 Forbidden`: 해당 리소스에 대한 접근 권한이 없음 (본인이 쓴 글이 아님).
- `404 Not Found`: 존재하지 않는 프로젝트 ID.
- `429 Too Many Requests`: API 요청 한도 초과 (Rate Limit).
