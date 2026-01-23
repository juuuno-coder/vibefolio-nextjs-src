# V-Audit (전문 진단 서비스: 제 평가는요?) Functional Specification v1.1

## 1. 개요

**V-Audit**은 Vibefolio 내의 전문 피드백 및 프로젝트 진단 시스템입니다. 창작자가 자신의 프로젝트에 대해 전문가나 동료들에게 정밀 진단을 의뢰하고, 체계적인 데이터를 수집하여 성장을 도모하는 것을 목적으로 합니다. 기존의 단순 댓글 시스템을 넘어선 다각도 분석 UX와 시각화된 리포트를 제공합니다.

---

## 2. 주요 아키텍처 및 흐름

### 2.1 창작자 전용: 고도화된 등록 및 관리 플로우

복잡한 진단 설정을 사용자 경험(UX) 관점에서 체계화하여 **3단계 위저드** 시스템으로 구현했습니다.

- **Step 1: 미디어 및 마감 기한**
  - 진단 대상 선택 (웹 링크, 이미지 갤러리, 유튜브 영상)
  - A/B 테스트 모드 지원 (시안 A와 B의 비교 분석)
  - 진단 마감일(Deadline) 설정 기능
- **Step 2: 심사 기준 설정 (Dynamic Categories)**
  - 최대 6개의 평가 항목을 창작자가 직접 정의
  - 각 항목별 고유 스티커(아이콘) 이미지 업로드 지원
  - 실시간 레이더 차트 시각화 구성 요소
- **Step 3: 심층 진단 구성 (Poll & Questions)**
  - 직관적 반응 수집을 위한 스티커 투표(Poll) 구성
  - 서술형 답변 유도를 위한 사용자 지정 질문 리스트 작성
  - 마이페이지/랜딩 페이지 노출 설정 (성장하기 갤러리 공개 여부)

### 2.2 리뷰어 전용: 1:1 정밀 진단 뷰어

전문적인 진단을 위해 분할 화면과 최적화된 UX를 제공합니다.

- **Split-View**: 좌측 프로젝트 프리미엄 뷰어 + 우측 진단 패널
- **3-Phase 진단 흐름**:
  1. **Phase 1: Michelin Rating**: 항목별 별점 및 시각적 피드백
  2. **Phase 2: Stick Poll**: 직관적이고 빠른 반응 투표
  3. **Phase 3: Deep Proposal**: 주관식 답변 및 최종 개선 제안서 작성

---

## 3. 서비스 통합 위치 (Integration)

V-Audit은 Vibefolio의 핵심 가치인 '성장'을 극대화하기 위해 플랫폼 전반에 유기적으로 통합되어 있습니다.

- **MyPage (관리)**: '제 평가는요?' 프로젝트 전용 필터를 통해 자신의 진단 의뢰 현황을 한눈에 관리하고, 설정 수정 및 진단 결과 조회가 가능합니다.
- **Landing Page (홍보)**: Vibefolio 메인 화면의 프리미엄 섹션을 통해 현재 진행 중인 핵심 진단 미션들을 홍보하고 참여를 유도합니다.
- **Upload Flow (진입)**: 프로젝트 등록 시 '전문 진단 의뢰(V-Audit)' 모드를 선택하여 간편하게 기능을 시작할 수 있습니다.

---

## 4. 데이터 모델 (Data Schema)

### Project (진단 설정 정보 - `custom_data.audit_config`)

```json
{
  "audit_config": {
    "type": "link | image | video",
    "mediaA": "string | string[]",
    "isAB": "boolean",
    "mediaB": "string | null",
    "categories": [
      {
        "id": "uuid",
        "label": "Label",
        "desc": "Description",
        "sticker": "url"
      }
    ],
    "poll": {
      "desc": "Question",
      "options": [
        { "id": "p1", "label": "Label", "desc": "Desc", "image_url": "url" }
      ]
    },
    "questions": ["Q1", "Q2"]
  }
}
```

### ProjectRating (진단 결과 정보)

```json
{
  "scores": { "cat_id": number },
  "poll_choice": "option_id",
  "custom_answers": { "Question": "Answer" },
  "proposal": "Final feedback summary"
}
```

---

## 5. 향후 로드맵

- **AI 분석 통합 (재개)**: 일시 중단된 AI 정밀 분석 기능을 고도화하여 리뷰어의 의견과 AI의 분석을 결합한 하이브리드 리포트 제공.
- **진단 리포트 PDF**: 수집된 데이터를 수려한 디자인의 PDF 리포트로 다운로드하는 기능.
- **진단 보상 시스템**: 양질의 피드백을 남긴 유저에게 제공할 수 있는 플랫폼 내 보상 체계 구축.

---

_본 문서는 V-Audit 시스템의 최종 구현 사양을 기준으로 작성되었습니다._
