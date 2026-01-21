# Review Page Split View 구현 계획

## 목표

PC 사용자를 위한 Split View UI 구현

- **좌측**: 프로젝트 미리보기
- **우측**: 평가 폼 (450px 고정 너비)

## 현재 상태 분석

### 기존 구조

1. **Phase 시스템**: `cloche` → `viewer`
2. **평가 폼**: Bottom Sheet Modal (모바일 최적화)
3. **Viewer Mode**: `desktop` / `mobile` 토글

### 문제점

- 복잡한 리팩토링 시도로 인한 빌드 오류
- React Hooks 순서 문제
- JSX 구조 변경으로 인한 런타임 오류

## 구현 전략 (안전한 접근)

### Phase 1: CSS 기반 레이아웃 변경 (최소 침습)

**목표**: 기존 모달 구조 유지하면서 CSS만으로 위치 변경

#### 변경 사항

1. **모달 스타일 조건부 적용**

   ```tsx
   // Desktop: 우측 고정 패널
   // Mobile: 하단 Bottom Sheet (기존 유지)
   className={cn(
     viewerMode === 'desktop'
       ? "fixed top-0 right-0 bottom-0 w-[450px]"
       : "fixed bottom-0 left-0 right-0 max-h-[92dvh]"
   )}
   ```

2. **애니메이션 방향 조정**

   ```tsx
   // Desktop: 우측에서 슬라이드 인
   // Mobile: 하단에서 슬라이드 업 (기존 유지)
   initial={{
     x: viewerMode === 'desktop' ? '100%' : 0,
     y: viewerMode === 'desktop' ? 0 : '100%'
   }}
   ```

3. **자동 열기 로직**
   ```tsx
   useEffect(() => {
     if (phase === "viewer" && viewerMode === "desktop") {
       setIsReviewOpen(true);
     }
   }, [phase, viewerMode]);
   ```

#### 위험도: ⭐ (매우 낮음)

- 기존 JSX 구조 변경 없음
- 새로운 컴포넌트 생성 없음
- CSS 클래스와 애니메이션만 조정

### Phase 2: UX 개선 (선택적)

**목표**: 사용자 경험 향상

#### 변경 사항

1. **Desktop에서 배경 오버레이 제거**
   - Split View에서는 배경 어둡게 할 필요 없음
2. **평가 버튼 숨김**
   - Desktop에서는 자동으로 열리므로 버튼 불필요

3. **Top Bar 개선**
   - Cloche 단계에서 숨김
   - Viewer 단계에서 표시

#### 위험도: ⭐⭐ (낮음)

- 조건부 렌더링만 추가
- 기존 로직 변경 최소화

## 구현 순서

### Step 1: 모달 스타일 수정 (5분)

- 파일: `src/app/review/page.tsx`
- 라인: ~830 (모달 컴포넌트)
- 변경: `className`과 애니메이션 속성만

### Step 2: 자동 열기 로직 추가 (3분)

- 파일: `src/app/review/page.tsx`
- 라인: ~200 (useEffect 섹션)
- 변경: 새 useEffect 하나 추가

### Step 3: 테스트 (2분)

- Desktop 모드에서 Cloche 클릭 → 우측 패널 확인
- Mobile 모드에서 Cloche 클릭 → 하단 시트 확인

### Step 4: UX 개선 (선택, 5분)

- 배경 오버레이 조건부 처리
- 평가 버튼 조건부 숨김

## 롤백 계획

문제 발생 시:

```bash
git checkout src/app/review/page.tsx
```

## 성공 기준

✅ Desktop: 우측에 450px 패널로 평가 폼 표시
✅ Mobile: 기존 하단 시트 유지
✅ 빌드 오류 없음
✅ 런타임 오류 없음
✅ 기존 기능 모두 정상 작동

## 주의사항

❌ **하지 말아야 할 것**

- 새로운 컴포넌트 생성
- JSX 구조 대규모 변경
- React Hooks 순서 변경
- 복잡한 리팩토링

✅ **해야 할 것**

- 기존 구조 최대한 유지
- CSS와 조건부 렌더링만 활용
- 단계별 테스트
- 각 변경사항 커밋
