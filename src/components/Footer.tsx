// src/components/Footer.tsx

"use client"; // 🚨 FontAwesomeIcon, AppTooltip 등 클라이언트 상호작용 컴포넌트 사용을 위해 지정
import React from "react";
import { Separator } from "@/components/ui/separator"; // 🚨 Alias 경로 수정
import Link from "next/link";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// 🚨 FontAwesome 라이브러리가 설치되어 있다고 가정합니다. (npm install @fortawesome/react-fontawesome @fortawesome/fontawesome-svg-core @fortawesome/free-solid-svg-icons)
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core"; // 타입 임포트

// 🚨 FOOTER_CONTETNS의 타입 정의 및 임시 더미 데이터 (실제 파일에 따라 경로 및 내용 수정 필요)
interface FooterContentItem {
  icon: IconProp; // Font Awesome 아이콘 타입
  label: string;
}

// 🚨 FOOTER_CONTETNS 파일의 경로를 가정하여 임포트합니다.
// 실제 FOOTER_CONTETNS 상수와 경로가 일치하지 않으면 오류가 발생합니다.
// 예시: import { FOOTER_CONTETNS } from "@/constants/footer";

// 🚨 임시 FOOTER_CONTETNS 정의 (FontAwesome 아이콘 정의가 없으므로 임시로 빈 배열을 사용하거나, 필요한 아이콘을 정의해야 합니다.)
// FontAwesome 아이콘 정의는 복잡하므로, 일단 임시로 배열을 비워두고, 실제 아이콘을 사용할 때 import 해야 합니다.
const FOOTER_CONTETNS: FooterContentItem[] = [
  // { icon: ['fab', 'instagram'], label: "인스타그램" }, // 실제 사용 예시
  // { icon: ['fab', 'facebook'], label: "페이스북" },
  // { icon: ['fab', 'youtube'], label: "유튜브" },
];

// 🚨 컴포넌트 이름 변경
export function Footer() {
  // 🚨 AppTooltip이 없으므로, Tooltip 컴포넌트를 사용하여 인라인으로 구현합니다.
  const TooltipWrapper = ({
    description,
    children,
  }: {
    description: string;
    children: React.ReactNode;
  }) => (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent>
        <p>{description}</p>
      </TooltipContent>
    </Tooltip>
  );

  return (
    // 🚨 className의 h-3! 같은 tailwind 확장자는 정의되어 있어야 합니다.
    <footer className="fixed bottom-0 left-0 hidden w-full h-9 lg:flex items-center justify-between bg-white border-t px-8">
      {/* 텍스트 묶음 영역 */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <p className="text-xs font-semibold">(주)디어스</p>
          <p className="text-xs">사업자 정보</p>
        </div>
        {/* h-3! 대신 h-3으로 수정하거나, 높이 유틸리티 클래스가 정의되어 있어야 합니다. */}
        <Separator orientation="vertical" className="h-3" />
        <div className="flex items-center gap-3">
          <Link href="/service" className="text-xs hover:text-gray-900 transition-colors">서비스 소개</Link>
          <Link href="/notices" className="text-xs hover:text-gray-900 transition-colors">공지사항</Link>
          <Link href="/policy/operation" className="text-xs hover:text-gray-900 transition-colors">운영정책</Link>
          <Link href="/policy/privacy" className="text-xs hover:text-gray-900 transition-colors font-bold">개인정보처리방침</Link>
          <Link href="/faq" className="text-xs hover:text-gray-900 transition-colors">자주묻는 질문</Link>
          <Link href="/ads" className="text-xs hover:text-gray-900 transition-colors">광고상품</Link>
          <Link href="/contact" className="text-xs hover:text-gray-900 transition-colors">문의하기</Link>
        </div>
      </div>

      {/* 아이콘 묶음 영역 */}
      <div className="flex items-center gap-3">
        {FOOTER_CONTETNS.map((item, index) => {
          return (
            // 🚨 AppTooltip 대신 인라인 TooltipWrapper 사용
            <React.Fragment key={index}>
              <TooltipWrapper description={item.label}>
                <FontAwesomeIcon icon={item.icon} />
              </TooltipWrapper>

              {/* h-3! 대신 h-3으로 수정 */}
              {index === 1 && (
                <Separator orientation="vertical" className="h-3" />
              )}
              {index === 4 && (
                <Separator orientation="vertical" className="h-3" />
              )}
            </React.Fragment>
          );
        })}
        {/* 🚨 이미지 경로 수정: public 폴더를 기준으로 변경해야 합니다. */}
        <img src="/logo.svg" alt="@LOGO" className="w-22 ml-8" />
      </div>
    </footer>
  );
}

export default Footer;
