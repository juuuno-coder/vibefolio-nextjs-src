"use client";

import { FontAwesomeIcon } from "@/components/FaIcon";
import { faMagnifyingGlass, faFolderOpen } from "@fortawesome/free-solid-svg-icons";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  actionLink?: string;
  icon?: "search" | "folder";
}

export function EmptyState({
  title = "데이터가 없습니다",
  description = "조건에 맞는 결과를 찾을 수 없습니다.",
  actionLabel,
  actionLink,
  icon = "folder"
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-200">
      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-6">
        {icon === "search" ? (
          <FontAwesomeIcon icon={faMagnifyingGlass} className="w-8 h-8 text-slate-400" />
        ) : (
          <FontAwesomeIcon icon={faFolderOpen} className="w-8 h-8 text-slate-400" />
        )}
      </div>
      <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-500 mb-8 max-w-sm mx-auto">{description}</p>
      
      {actionLabel && actionLink && (
        <Button asChild variant="outline">
          <Link href={actionLink}>{actionLabel}</Link>
        </Button>
      )}
    </div>
  );
}
