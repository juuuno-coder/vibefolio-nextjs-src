// src/app/search/page.tsx

"use client";

import { Suspense } from "react";
import SearchPageContent from "./SearchPageContent";

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="w-full min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">검색 페이지 로딩 중...</p>
        </div>
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  );
}
