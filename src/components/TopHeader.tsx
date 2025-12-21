// src/components/TopHeader.tsx

"use client";

import Link from "next/link";

export function TopHeader() {
  return (
    <div className="w-full min-h-[40px] flex items-center bg-[#16A34A] text-white z-50">
      <div className="max-w-screen-2xl mx-auto px-6 py-2 w-full flex items-center justify-center">
        <p className="text-xs md:text-sm font-medium tracking-wide">
          AI 창작자를 위한 포트폴리오 플랫폼, <span className="font-bold">VIBEFOLIO</span>
        </p>
      </div>
    </div>
  );
}

export default TopHeader;
