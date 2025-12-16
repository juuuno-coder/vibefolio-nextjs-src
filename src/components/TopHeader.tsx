// src/components/TopHeader.tsx

"use client";

import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";

export function TopHeader() {
  return (
    <div className="sticky top-0 z-50 w-full min-h-[44px] flex items-center bg-gradient-to-r from-[#4ACAD4] to-[#05BCC6]">
      <div className="max-w-7xl mx-auto px-6 py-2 w-full flex items-center justify-between">
        <p className="text-sm md:text-base font-semibold text-white">
          AI 창작자를 위한 포트폴리오 플랫폼
        </p>
        <Link 
          href="/templates"
          className="flex items-center gap-1 text-sm font-medium text-white hover:text-white/80 transition-colors whitespace-nowrap"
        >
          디자인 템플릿 보기
          <FontAwesomeIcon icon={faArrowRight} className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

export default TopHeader;
