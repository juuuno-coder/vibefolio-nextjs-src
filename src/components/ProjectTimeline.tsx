"use client";

import React from "react";
import dayjs from "dayjs";
import { GitCommit, History, Clock, Tag } from "lucide-react";
import { ProjectVersion } from "@/lib/versions";

interface ProjectTimelineProps {
  versions: ProjectVersion[];
}

export function ProjectTimeline({ versions }: ProjectTimelineProps) {
  if (!versions || versions.length === 0) {
    return null; // 버전 기록이 없으면 렌더링하지 않음
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-6">
        <History className="w-5 h-5 text-green-600" />
        <h3 className="font-bold text-lg text-gray-900">업데이트 히스토리</h3>
      </div>

      <div className="relative pl-2">
        {/* 수직 타임라인 선 */}
        <div className="absolute top-2 left-[19px] h-[calc(100%-20px)] w-[2px] bg-gray-100" />

        <div className="space-y-8">
          {versions.map((version, index) => {
            const isLatest = index === 0;
            return (
              <div key={version.id} className="relative pl-10 group">
                {/* 타임라인 노드 (점) */}
                <div 
                  className={`absolute left-2.5 top-1.5 w-5 h-5 -translate-x-1/2 rounded-full border-4 transition-colors z-10 ${
                    isLatest 
                      ? "bg-white border-green-500 shadow-[0_0_0_2px_rgba(34,197,94,0.2)]" 
                      : "bg-white border-gray-300 group-hover:border-gray-400"
                  }`} 
                />

                <div className="flex flex-col gap-1">
                  {/* 헤더: 버전명 & 날짜 */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span 
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold border ${
                        isLatest 
                          ? "bg-green-50 text-green-700 border-green-200" 
                          : "bg-gray-50 text-gray-600 border-gray-200"
                      }`}
                    >
                      <Tag className="w-3 h-3" />
                      {version.version_name}
                      {isLatest && <span className="ml-1 text-[9px] bg-green-600 text-white px-1 rounded-sm">LATEST</span>}
                    </span>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {dayjs(version.created_at).format("YYYY.MM.DD")}
                    </span>
                  </div>

                  {/* 변경 내용 */}
                  <div className={`text-sm leading-relaxed mt-1 break-keep whitespace-pre-wrap ${isLatest ? 'text-gray-800 font-medium' : 'text-gray-500'}`}>
                    {version.changelog || "변경 사항이 기록되지 않았습니다."}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
