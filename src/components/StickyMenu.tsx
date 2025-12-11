// src/components/StickyMenu.tsx

"use client";

import { useState } from "react";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LucideIcon,
  ArrowUpDown,
  Brush,
  Camera,
  ChevronDown,
  CirclePlay,
  Gem,
  IdCard,
  Layers,
  MousePointerClick,
  Package,
  Palette,
  Panda,
  PenTool,
  Sparkles,
  Type,
  TrendingUp,
  Clock,
  Heart,
  Eye,
} from "lucide-react";

// 카테고리 항목의 TypeScript 인터페이스 정의
interface Category {
  icon: LucideIcon;
  label: string;
  isActive: boolean;
  value: string;
}

// 정렬 옵션 정의
const sortOptions = [
  { label: "최신순", value: "latest", icon: Clock },
  { label: "인기순", value: "popular", icon: TrendingUp },
  { label: "좋아요순", value: "likes", icon: Heart },
  { label: "조회순", value: "views", icon: Eye },
];

// StickyMenu 컴포넌트의 Props 인터페이스 정의
interface StickyMenuProps {
  onSetCategory: (value: string) => void;
  onSetSort?: (value: string) => void;
  props: string;
  currentSort?: string;
}

// 카테고리 데이터 정의
const categories: Category[] = [
  { icon: Layers, label: "전체", isActive: true, value: "korea" },
  { icon: CirclePlay, label: "영상/모션그래픽", isActive: false, value: "video" },
  { icon: Palette, label: "그래픽 디자인", isActive: false, value: "graphic-design" },
  { icon: IdCard, label: "브랜딩/편집", isActive: false, value: "brand" },
  { icon: MousePointerClick, label: "UI/UX", isActive: false, value: "ui" },
  { icon: PenTool, label: "일러스트레이션", isActive: false, value: "illustration" },
  { icon: Camera, label: "디지털 아트", isActive: false, value: "digital-art" },
  { icon: Sparkles, label: "AI", isActive: false, value: "ai" },
  { icon: Panda, label: "캐릭터 디자인", isActive: false, value: "cartoon" },
  { icon: Package, label: "제품/패키지 디자인", isActive: false, value: "product-design" },
  { icon: Camera, label: "포토그래피", isActive: false, value: "photography" },
  { icon: Type, label: "타이포그래피", isActive: false, value: "typography" },
  { icon: Gem, label: "공예", isActive: false, value: "craft" },
  { icon: Brush, label: "파인아트", isActive: false, value: "art" },
];

export function StickyMenu({ props, onSetCategory, onSetSort, currentSort = "latest" }: StickyMenuProps) {
  const [selectedSort, setSelectedSort] = useState(currentSort);

  const handleSortChange = (value: string) => {
    setSelectedSort(value);
    onSetSort?.(value);
  };

  const currentSortLabel = sortOptions.find(opt => opt.value === selectedSort)?.label || "최신순";

  return (
    <section className="sticky top-14 z-10 w-full flex items-center justify-start px-4 md:px-20 py-2 gap-4 md:gap-8 mt-8 bg-white">
      {/* 1. 정렬 드롭다운 메뉴 */}
      <DropdownMenu>
        <DropdownMenuTrigger className="hidden lg:flex items-center gap-2 min-w-fit px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none">
          <ArrowUpDown size={18} className="text-neutral-700" />
          <span className="text-sm font-medium text-neutral-700">{currentSortLabel}</span>
          <ChevronDown size={14} className="text-neutral-500" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-40">
          {sortOptions.map((option) => {
            const IconComponent = option.icon;
            return (
              <DropdownMenuItem
                key={option.value}
                onClick={() => handleSortChange(option.value)}
                className={`flex items-center gap-2 cursor-pointer ${
                  selectedSort === option.value ? "bg-[#4ACAD4]/10 text-[#4ACAD4]" : ""
                }`}
              >
                <IconComponent size={16} />
                <span>{option.label}</span>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* 구분선 */}
      <Separator orientation="vertical" className="hidden lg:block h-10" />

      {/* 2. 카테고리 목록 (가로 스크롤) */}
      <div className="flex items-center gap-6 md:gap-10 overflow-x-auto no-scrollbar flex-1">
        {categories.map((category, index) => {
          const IconComponent = category.icon;
          const isActive = props === category.value;

          return (
            <div
              key={index}
              className={`min-w-fit flex flex-col items-center gap-1.5 cursor-pointer transition-all duration-200 ${
                isActive ? "transform scale-105" : "hover:transform hover:scale-105"
              }`}
              onClick={() => onSetCategory(category.value)}
            >
              <IconComponent
                size={22}
                className={`transition-colors ${
                  isActive
                    ? "text-[#4ACAD4]"
                    : "text-neutral-500 hover:text-neutral-700"
                }`}
              />
              <p
                className={`text-xs md:text-sm whitespace-nowrap font-medium transition-colors ${
                  isActive ? "text-[#4ACAD4]" : "text-neutral-600"
                }`}
              >
                {category.label}
              </p>
              {/* 활성화 인디케이터 */}
              {isActive && (
                <div className="w-full h-0.5 bg-[#4ACAD4] rounded-full mt-1" />
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default StickyMenu;
