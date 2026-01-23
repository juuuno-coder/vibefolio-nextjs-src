# V-Audit (제 평가는요?) Functional Specification v1.0

## 1. 개요

**V-Audit**은 프로젝트 창작자가 전문가나 동료들에게 정밀 진단을 의뢰하고, 체계적인 피드백을 수합하여 개선 방향을 도출하는 전문 평가 시스템입니다. 기존 Vibefolio의 단순 댓글 시스템을 넘어, 다각도의 분석 도구와 시각화된 리포트를 제공합니다.

## 2. 3단계 정밀 진단 프로세스 (Flow)

사용자 경험을 최적화하기 위해 기존 4단계를 통합하여 **총 3단계**의 진단 흐름을 가집니다.

### Phase 1: 항목별 다각도 별점 진단 (Michelin Rating)

- **목적**: 프로젝트의 정량적 가치를 측정하고 레이더 차트로 시각화.
- **기능**:
  - 창작자가 설정한 N개의 평가 기준(예: 독창성, 완성도, 시장성 등)에 대해 5점 만점의 별점 부여.
  - 각 기준별로 '스티커' UX(아이콘 기반)를 활용하여 직관성 극대화.
- **데이터**: `scores` (Object), `radar_data` (Object).

### Phase 2: 직관적 투표 및 합불 판정 (Intuitive Poll)

- **목적**: 작품에 대한 최종적인 의사결정 또는 직관적인 선호도 확인.
- **기능**:
  - 창작자가 설정한 2~4개의 옵션 중 하나를 선택 (예: "당장 쓸게요!", "개선이 필요해요").
  - A/B 테스트 모드 지원: 두 가지 시안 중 하나를 투표 가능.
- **데이터**: `poll_choice` (String/ID).

### Phase 3: 심층 질문 및 종합 제안 (Deep-Dive & Summary)

- **목적**: 주관식 답변을 통한 정밀 피드백 수집 (기존 Phase 2와 4 통합).
- **기능**:
  - **심층 질문 (Custom Questions)**: 창작자가 등록한 특정 질문들에 대해 상세 답변 작성.
  - **종합 총평 (Final Comments)**: 프로젝트 전체에 대한 전문가적 소감 및 개선 제안 작성.
- **데이터**: `custom_answers` (Record<string, string>), `proposal` (String).

---

## 3. 기능 상세 (Features)

### 3.1 진단 의뢰 (Creator Mode)

- **미디어 설정**: 웹 링크(URL), 이미지 갤러리(Multiple), 유튜브 영상(Embed) 중 선택.
- **A/B 테스트**: 시안 A와 B를 동시에 보여주고 비교 진단 요청 가능.
- **동적 질문 관리**:
  - 평가 기준(Categories), 투표 옵션(Poll Options), 심층 질문(Audit Questions)을 사용자가 직접 **추가 및 삭제** 가능.
  - 각 항목별 기본 템플릿 제공.

### 3.2 진단 참여 (Reviewer Mode)

- **Split-View UX**: 화면 좌측에는 프로젝트 미리보기(Internal Browser), 우측에는 진단 패널 배치.
- **기기 모드 전환**: PC와 Mobile 뷰를 실시간으로 전환하며 진단 가능.
- **진행 상태 표시**: 현재 단계를 인디케이터로 노출 (1/3, 2/3, 3/3).
- **최종 완료**: 모든 단계 완료 시 최종 전송 및 완료 애니메이션 노출.

---

## 4. 데이터 모델 (Data Schema)

### Project (진단 설정 정보)

```json
{
  "custom_data": {
    "audit_config": {
      "type": "link | image | video",
      "mediaA": "string | string[]",
      "isAB": "boolean",
      "mediaB": "string | null",
      "categories": [
        { "id": "uuid", "label": "독창성", "desc": "아이디어가 참신한가요?" }
      ],
      "poll": {
        "desc": "이 작품에 대해 어떻게 생각하시나요?",
        "options": [
          { "id": "p1", "label": "당장 쓸게요!", "desc": "매우 만족..." }
        ]
      },
      "questions": ["가장 인상적인 부분은 어디인가요?"]
    }
  }
}
```

### ProjectRating (진단 결과 정보)

```json
{
  "scores": { "creative": 4, "visual": 5, ... },
  "poll_choice": "p1",
  "custom_answers": {
    "가장 인상적인 부분은 어디인가요?": "배색 처리가 돋보입니다."
  },
  "proposal": "전반적으로 훌륭하나 버튼 폰트를 조금 키우면 좋겠습니다."
}
```

---

## 5. 기술 스택

- **Frontend**: Next.js 14, TailwindCSS, Framer Motion, Lucide Icons.
- **Backend**: Supabase (Database, Auth, Storage), Vercel.
- **Components**: Shadcn UI 기반 커스텀 컴포넌트.
