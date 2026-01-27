// src/components/skeleton/Skeleton.tsx

import React from "react";
// 🚨 상위 components/ui 폴더에서 Skeleton 컴포넌트를 임포트합니다.
import { Skeleton } from "@/components/ui/skeleton";
import { FontAwesomeIcon } from "@/components/FaIcon";
import { faChartBar, faHeart } from "@fortawesome/free-solid-svg-icons";

/**
 * ImageCard 컴포넌트의 로딩 상태를 표시하는 스켈레톤 UI입니다.
 * 이 파일은 여러 스켈레톤 컴포넌트들을 모아두는 역할을 합니다.
 */
export function SkeletonImageCard() {
  return (
    <div className="w-full flex flex-col gap-2">
      <Skeleton className="w-full aspect-square" />
      <div className="w-full flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="w-7 h-7 rounded-full" />
          <Skeleton className="w-12 h-4" />
        </div>
        <div className="flex items-center gap-3">
          {/* 조회수 스켈레톤 */}
          <div className="flex items-center gap-1">
            <FontAwesomeIcon
              icon={faChartBar}
              className="text-neutral-400"
            />
            <Skeleton className="w-8 h-4" />
          </div>
          {/* 좋아요 스켈레톤 */}
          <div className="flex items-center gap-1">
            <FontAwesomeIcon icon={faHeart} className="text-neutral-400" />
            <Skeleton className="w-8 h-4" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 프로젝트 카드 스켈레톤 UI
 */
export function ProjectCardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="bg-gray-200 rounded-lg aspect-[3/4] mb-3"></div>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
        <div className="h-4 bg-gray-200 rounded w-24"></div>
      </div>
      <div className="flex gap-3">
        <div className="h-3 bg-gray-200 rounded w-12"></div>
        <div className="h-3 bg-gray-200 rounded w-12"></div>
      </div>
    </div>
  );
}

/**
 * 프로젝트 그리드 스켈레톤 UI
 */
export function ProjectGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ProjectCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * 컬렉션 스켈레톤 UI
 */
export function CollectionSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
        <div>
          <div className="h-5 bg-gray-200 rounded w-32 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-24"></div>
        </div>
      </div>
      <ProjectGridSkeleton count={4} />
    </div>
  );
}
