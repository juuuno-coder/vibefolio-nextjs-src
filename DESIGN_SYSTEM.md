# Vibefolio Design System (v1.0)

Vibefolio의 디자인 시스템은 **"Clean, Modern, and Premium"**을 핵심 가치로 삼으며, 크리에이터들의 작업을 돋보이게 하는 미니멀하면서도 감각적인 인터페이스를 지향합니다.

---

## 1. 핵심 디자인 원칙 (Core Principles)

- **Airy & Spacious**: 과감한 여백(White Space)을 사용하여 콘텐츠 간의 호흡을 확보하고 가독성을 높입니다.
- **Micro-interactions**: 부드러운 스케일링, 페이드인 애니메이션을 통해 살아있는 듯한 인터페이스를 제공합니다.
- **High Quality Visuals**: 깨진 이미지를 방지하기 위한 폴백(Fallback)과 고해상도 이미지를 우선시합니다.
- **Glassmorphism**: 블러(Blur)와 반투명 효과를 적절히 섞어 고급스러운 깊이감을 표현합니다.

---

## 2. 컬러 팔레트 (Color Palette)

### 메인 테마 (Primary Theme: Clean & Modern Ver.)

Vibefolio는 신뢰감과 창의성을 상징하는 **Green & Mint**를 포인트 컬러로 사용합니다.

- **Primary (Vibe Green)**: `#16A34A` (`hsl(142, 76%, 36%)`) - 메인 버튼, 핵심 강조 요소, 배지 포인트.
- **Accent (Lime Green)**: `#84CC16` (`hsl(84, 81%, 44%)`) - 보조 강조.
- **Foreground (Navy Black)**: `#0F172A` (`hsl(222, 47%, 11%)`) - 텍스트, 아이콘 기본값.
- **Background (Pure White)**: `#FFFFFF` (`hsl(0, 0%, 100%)`) - 기본 배경.

### 중립 컬러 (Neutral Colors)

- **Border/Divider**: `#E2E8F0` (`hsl(214, 32%, 91%)`)
- **Secondary/Muted**: `#F1F5F9` (`hsl(210, 40%, 96.1%)`)
- **Muted Foreground**: `#64748B` (`hsl(215, 16%, 47%)`)

---

## 3. 타이포그래피 (Typography)

Vibefolio는 국문 가독성의 표준인 **Pretendard**를 메인 서체로 사용합니다.

- **Main Font**: `Pretendard`, sans-serif
- **Hero Title**: `text-4xl` ~ `text-6xl`, `font-black`, `tracking-tighter`
- **Section Title**: `text-2xl`, `font-bold`, `tracking-tight`
- **Body Text**: `text-base`, `font-medium`, `leading-relaxed` (가독성을 위한 넓은 행간)
- **Metadata/Label**: `text-xs`, `font-black`, `tracking-widest`, `uppercase`

---

## 4. 레이아웃 & 그리드 (Layout & Grid)

- **Container**: 최대 폭 `1400px` (`max-w-7xl`), 중앙 정렬.
- **Radius (둥근 모서리)**:
  - **Large**: `48px` / `40px` / `32px` (섹션 카드, 히어로 배너)
  - **Medium**: `12px` (`var(--radius)`) (기본 카드, 버튼)
  - **Small**: `8px` (입력창, 작은 버튼)
- **Shadows**:
  - `shadow-sm`: 미세한 구분선 대체용.
  - `shadow-xl`: 부유하는 카드 효과.
  - `shadow-2xl`: 메인 히어로 및 팝업 모달.

---

## 5. UI 컴포넌트 표준 (Component Standards)

### 버튼 (Buttons - Pill Shape)

- **Primary**: 검정 배경(`bg-[#111]`) + 흰색 글자. 호버 시 Green(`bg-[#16A34A]`)으로 변화 및 `translate-y-[-1px]`.
- **Secondary**: 투명 배경 + 테두리. 호버 시 Vibe Green 포인트 컬러 적용.
- **Action**: `rounded-2xl` 또는 `rounded-full` 형태를 선호합니다.

### 카드 (Cards)

- **Recruit Item Card**: `aspect-[4/5]` 비율의 이미지를 상단에 가득 채움(`object-cover`). 하단 텍스트 영역 가변 높이 방지를 위한 고정 높이 처리.
- **Banner Card**: `rounded-[40px]`, `overflow-hidden`, **16:9 (`aspect-video`) 비율 적용**. 내부 텍스트는 좌하단 플로팅 스타일. **한 줄 설명(description_one_line)**을 우선 노출하여 미니멀리즘 유지.

### 배지 (Badges)

- `rounded-full`, `font-black`, `tracking-widest`.
- 정보의 성격에 따라 Vibe Green(`#16A34A`), Slate, Red(D-Day) 등을 활용.

---

## 6. 인터랙션 & 애니메이션 (Interaction)

- **Hover Scale**: 카드나 이미지 위에 마우스를 올릴 때 `scale(1.02)`~`scale(1.05)` 변화. (`transition-all duration-500`)
- **Fade In**: 페이지 로드 시 하단에서 상단으로 10px 올라오며 등장하는 `fade-in` 애니메이션.
- **Blur Cleanup**: 스크롤 시 상단 헤더가 콘텐츠와 중첩될 때 `backdrop-filter: blur(10px)` 적용으로 가독성 유지.

---

## 7. 기타 자산 (Assets)

- **Icons**: `Lucide-React`. `stroke-width={1.5}` 또는 `2`를 사용해 일관된 선 굵기 유지.
- **Placeholders**: `Unsplash Source API`를 활용한 테마별 랜덤 이미지 또는 브랜드 컬러 그라데이션 사용.
