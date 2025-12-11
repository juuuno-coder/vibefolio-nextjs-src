# 헤더 개선 작업 가이드

## 1. 프로필 드롭다운 메뉴

### 변경 사항

**기존**: 마이페이지 / 로그아웃 버튼
**변경**: 프로필 이미지 → 드롭다운 메뉴

### 드롭다운 메뉴 항목

1. - 프로젝트 등록하기
2. 나의 프로젝트
3. 마이페이지
4. 로그아웃

### 구현 방법

```tsx
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Upload, Grid, User, LogOut } from "lucide-react";

// 로그인 상태
<DropdownMenu>
  <DropdownMenuTrigger>
    <Avatar className="w-10 h-10 cursor-pointer">
      <AvatarImage src={userProfile?.profile_image_url} />
      <AvatarFallback>
        <User />
      </AvatarFallback>
    </Avatar>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end" className="w-56">
    <DropdownMenuItem onClick={() => router.push("/project/upload")}>
      <Upload className="mr-2 h-4 w-4" />
      프로젝트 등록하기
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => router.push("/mypage/projects")}>
      <Grid className="mr-2 h-4 w-4" />
      나의 프로젝트
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => router.push("/mypage")}>
      <User className="mr-2 h-4 w-4" />
      마이페이지
    </DropdownMenuItem>
    <DropdownMenuItem onClick={handleLogout}>
      <LogOut className="mr-2 h-4 w-4" />
      로그아웃
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>;
```

## 2. 회원가입 관심 카테고리

### 추가 필드

- 체크박스 형태의 카테고리 선택
- 최소 1개, 최대 5개 선택 가능

### 카테고리 목록

- 영상/모션그래픽
- 그래픽 디자인
- 브랜딩/편집
- UI/UX
- 일러스트레이션
- 디지털 아트
- AI
- 캐릭터 디자인
- 제품/패키지 디자인
- 포토그래피
- 타이포그래피
- 공예
- 파인아트

## 3. 프로젝트 등록 화면 개선

### 현재 문제

- 블럭 형태로 개체가 나타남

### 해결 방법

- 깔끔한 폼 레이아웃
- 인라인 입력 필드
- 부드러운 스타일

## 파일

- `src/components/AuthButtons.tsx` - 프로필 드롭다운
- `src/app/signup/page.tsx` - 관심 카테고리
- `src/app/project/upload/page.tsx` - 등록 화면 스타일
