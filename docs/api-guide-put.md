# 프로젝트 수정 (PUT) API 가이드

API를 통해 프로젝트를 성공적으로 수정하기 위한 명세 및 예시입니다.

## 1. 기본 정보

- **Endpoint:** `PUT {{BASE_URL}}/api/projects/{project_id}`
- **Method:** `PUT`
- **Headers:**
  - `Content-Type`: `application/json`
  - `Authorization`: `Bearer vf_xxxxxxxxxxxxxxxxxxxxxxxx` (본인의 API Key)

## 2. 요청 본문 (JSON Structure)

수정이 필요한 필드만 선택적으로 전송할 수 있습니다. (Partial Update)

```json
{
  "title": "수정된 프로젝트 제목",
  "content_text": "업데이트된 본문 내용...",
  "description": "검색용 요약 설명 (선택)",
  "visibility": "public",
  "thumbnail_url": "https://example.com/new_thumb.jpg",

  // [중요] 기존 데이터를 덮어쓰지 않고 안전하게 병합됩니다.
  "custom_data": {
    "genre": "fantasy",
    "mood": "dark"
  },

  // 에디터 등에서 사용된 에셋 목록
  "assets": ["https://example.com/image1.png", "https://example.com/image2.png"]
}
```

### `visibility` 옵션

- `public`: 전체 공개 (메인 노출)
- `private`: 비공개 (나만 보기)
- `unlisted`: 링크가 있는 사람만 보기 (메인 미노출)

## 3. 응답 (Response)

**성공 시 (200 OK):**

```json
{
  "message": "프로젝트가 수정되었습니다.",
  "data": {
    "project_id": 123,
    "title": "수정된 프로젝트 제목",
    "updated_at": "2026-01-19T...",
    ...
  }
}
```

**실패 시 예시:**

- `403 Forbidden`: 본인의 프로젝트가 아니거나 API Key 권한 없음
- `404 Not Found`: 해당 ID의 프로젝트가 없음
