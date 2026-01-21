# 리뷰 페이지 PC 2분할 화면 구현 완료

**작업 날짜**: 2026년 1월 21일  
**작업 시간**: 18:00 - 18:03

---

## ✅ 완료된 작업

### 1. PC 2분할 화면 구현

- **좌측**: 프로젝트 미리보기 (iframe)
  - 상단에 PC/Mobile/새창열기 버튼 배치
  - 프로젝트 콘텐츠를 자유롭게 조작 가능
- **우측**: 평가 3단계 폼 (450px 고정 패널)
  - 모달 없이 바로 고정 패널로 표시
  - 스크롤 가능한 평가 폼
  - 닫기 버튼(X)으로 패널 숨김 가능

### 2. Cloche 클릭 동작 개선

- **PC 버전**: Cloche 클릭 시 즉시 2분할 화면으로 전환
  - 좌측: 프로젝트 미리보기
  - 우측: 평가 폼 자동 표시
- **모바일 버전**: 기존 Bottom Sheet 유지
  - 하단에서 올라오는 모달 형태
  - 평가하기 버튼 클릭 시 표시

### 3. 새창열기 기능 단순화

- **이전**: Companion Mode 오버레이 표시
- **현재**: 단순히 새 탭만 열기
- 현재 탭은 2분할 화면 유지
- 사용자가 새 탭에서 콘텐츠에 집중 가능

### 4. UI/UX 개선사항

- ✅ 인트로(Cloche) 단계에서 상단 버튼 숨김
- ✅ Viewer 단계에서만 PC/Mobile/새창열기 버튼 표시
- ✅ PC에서 평가 패널 열릴 때 프로젝트 뷰어 자동 여백 확보
- ✅ PC에서 배경 오버레이 제거 (프로젝트 계속 조작 가능)
- ✅ 평가 패널 닫기 버튼 추가 (Desktop 전용)
- ✅ Companion Mode 오버레이 완전 제거

---

## 🔧 기술적 변경사항

### 파일: `src/app/review/page.tsx`

#### 1. 상태 관리 단순화

```tsx
// 제거된 상태
- const [isExternalView, setIsExternalView] = useState(false);

// 유지된 상태
const [isReviewOpen, setIsReviewOpen] = useState(false);
```

#### 2. 자동 평가 폼 표시 로직

```tsx
useEffect(() => {
  if (phase === "viewer" && viewerMode === "desktop") {
    setIsReviewOpen(true); // PC에서 자동으로 평가 폼 표시
  }
}, [phase, viewerMode]);
```

#### 3. 새창열기 버튼 단순화

```tsx
// 이전
onClick={() => {
  window.open(url1 || '', '_blank');
  setIsExternalView(true);
  setIsReviewOpen(true);
}}

// 현재
onClick={() => {
  window.open(url1 || '', '_blank');
}}
```

#### 4. Companion Mode 오버레이 제거

- 약 40줄의 오버레이 UI 코드 삭제
- `isExternalView` 관련 로직 모두 제거

#### 5. 레이아웃 조정

```tsx
// 프로젝트 뷰어 컨테이너
className={cn(
  "flex transition-all duration-500 ease-in-out h-full",
  viewerMode === 'mobile'
    ? "w-[375px] h-[812px] ..."
    : cn("w-full h-full", isReviewOpen && "md:pr-[450px]")
)}
```

---

## 📊 사용자 경험 개선

### PC 사용자

1. **Cloche 클릭** → 즉시 2분할 화면
2. **좌측**: 프로젝트 자유롭게 탐색
3. **우측**: 평가 폼 작성
4. **새창열기**: 새 탭에서 전체 화면으로 콘텐츠 감상

### 모바일 사용자

1. **Cloche 클릭** → 프로젝트 전체 화면
2. **평가하기 버튼** → 하단 시트 표시
3. 기존 UX 완전히 유지

---

## 🎯 달성된 목표

✅ PC에서 모달 없는 2분할 화면 구현  
✅ 프로젝트 보면서 동시에 평가 가능  
✅ 새창열기 기능 단순화  
✅ Companion Mode 오버레이 제거  
✅ 인트로 화면 깔끔하게 정리  
✅ 모바일 경험 유지

---

## 🚀 다음 단계

- [ ] 사용자 테스트 진행
- [ ] 피드백 수집
- [ ] 필요시 추가 UX 개선

---

## 📝 참고사항

### 코드 변경 요약

- **삭제**: 약 50줄 (Companion Mode 관련)
- **수정**: 약 10줄 (새창열기, 자동 표시 로직)
- **순 감소**: 약 40줄

### 성능 영향

- 불필요한 상태 관리 제거로 성능 향상
- 렌더링 최적화

### 호환성

- 모든 주요 브라우저 지원
- 반응형 디자인 유지
