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
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faCamera,
  faWandMagicSparkles,
  faPalette,
  faPenRuler,
  faVideo,
  faFilm,
  faHeadphones,
  faCube,
  faFileLines,
  faCode,
  faMobileScreen,
  faGamepad,
  faLayerGroup,
  faArrowsUpDown,
  faChevronDown,
  faChevronUp,
  faClock,
  faFireFlameCurved,
  faHeart,
  faEye,
  faIndustry,
  faXmark,
  faCheck,
} from "@fortawesome/free-solid-svg-icons";

// 카테고리 항목의 TypeScript 인터페이스 정의
interface Category {
  iconSolid: IconDefinition;
  label: string;
  value: string;
}

// 산업 분야 카테고리
const fieldCategories = [
  { id: "finance", label: "경제/금융" },
  { id: "healthcare", label: "헬스케어" },
  { id: "beauty", label: "뷰티/패션" },
  { id: "pet", label: "반려" },
  { id: "fnb", label: "F&B" },
  { id: "travel", label: "여행/레저" },
  { id: "education", label: "교육" },
  { id: "it", label: "IT" },
  { id: "lifestyle", label: "라이프스타일" },
  { id: "business", label: "비즈니스" },
];

// 정렬 옵션 정의
const sortOptions = [
  { label: "최신순", value: "latest", icon: faClock },
  { label: "인기순", value: "popular", icon: faFireFlameCurved },
  { label: "좋아요순", value: "likes", icon: faHeart },
  { label: "조회순", value: "views", icon: faEye },
];

// StickyMenu 컴포넌트의 Props 인터페이스 정의
interface StickyMenuProps {
  onSetCategory: (value: string | string[]) => void;
  onSetSort?: (value: string) => void;
  onSetField?: (value: string[]) => void;
  props: string | string[];
  currentSort?: string;
  currentFields?: string[];
}

// 새로운 메인 카테고리 (장르) - Font Awesome 아이콘
const categories: Category[] = [
  { iconSolid: faLayerGroup, label: "전체", value: "all" },
  { iconSolid: faCamera, label: "포토", value: "photo" },
  { iconSolid: faWandMagicSparkles, label: "애니메이션", value: "animation" },
  { iconSolid: faPalette, label: "그래픽", value: "graphic" },
  { iconSolid: faPenRuler, label: "디자인", value: "design" },
  { iconSolid: faVideo, label: "영상", value: "video" },
  { iconSolid: faFilm, label: "영화·드라마", value: "cinema" },
  { iconSolid: faHeadphones, label: "오디오", value: "audio" },
  { iconSolid: faCube, label: "3D", value: "3d" },
  { iconSolid: faFileLines, label: "텍스트", value: "text" },
  { iconSolid: faCode, label: "코드", value: "code" },
  { iconSolid: faMobileScreen, label: "웹/앱", value: "webapp" },
  { iconSolid: faGamepad, label: "게임", value: "game" },
];

export function StickyMenu({ 
  props, 
  onSetCategory, 
  onSetSort, 
  onSetField,
  currentSort = "latest",
  currentFields = []
}: StickyMenuProps) {
  const [selectedSort, setSelectedSort] = useState(currentSort);
  const [selectedFields, setSelectedFields] = useState<string[]>(currentFields);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    Array.isArray(props) ? props : (props === "all" ? [] : [props])
  );
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [isFieldPanelOpen, setIsFieldPanelOpen] = useState(false);

  const handleSortChange = (value: string) => {
    setSelectedSort(value);
    onSetSort?.(value);
  };

  // 카테고리 토글 (복수 선택)
  const handleCategoryToggle = (value: string) => {
    if (value === "all") {
      // 전체 선택 시 모두 해제
      setSelectedCategories([]);
      onSetCategory("all");
    } else {
      const newCategories = selectedCategories.includes(value)
        ? selectedCategories.filter(c => c !== value)
        : [...selectedCategories, value];
      
      setSelectedCategories(newCategories);
      onSetCategory(newCategories.length === 0 ? "all" : newCategories);
    }
  };

  // 분야 토글 (복수 선택)
  const handleFieldToggle = (id: string) => {
    const newFields = selectedFields.includes(id)
      ? selectedFields.filter(f => f !== id)
      : [...selectedFields, id];
    
    setSelectedFields(newFields);
    onSetField?.(newFields);
  };

  // 필터 초기화
  const handleResetFilters = () => {
    setSelectedCategories([]);
    setSelectedFields([]);
    setIsFieldPanelOpen(false);
    onSetCategory("all");
    onSetField?.([]);
  };

  const currentSortLabel = sortOptions.find(opt => opt.value === selectedSort)?.label || "최신순";
  const hasActiveFilters = selectedCategories.length > 0 || selectedFields.length > 0;

  return (
    <div className="sticky top-14 z-10 w-full bg-white border-b border-gray-100 overflow-visible">
      {/* 메인 카테고리 바 */}
      <section className="flex items-center justify-between px-2 md:px-12 lg:px-20 py-3 md:py-6 pt-6 md:pt-14">
        {/* 카테고리 목록 */}
        <div className="flex items-center justify-between flex-1 gap-1 md:gap-4 lg:gap-6 overflow-x-auto overflow-y-visible no-scrollbar">
          {categories.map((category) => {
            const isActive = category.value === "all" 
              ? selectedCategories.length === 0 
              : selectedCategories.includes(category.value);
            const isHovered = hoveredCategory === category.value;
            const showActive = isActive || isHovered;

            return (
              <div
                key={category.value}
                className="min-w-fit flex flex-col items-center gap-1 md:gap-2 cursor-pointer transition-all duration-200 group flex-1"
                onClick={() => handleCategoryToggle(category.value)}
                onMouseEnter={() => setHoveredCategory(category.value)}
                onMouseLeave={() => setHoveredCategory(null)}
              >
                {/* 아이콘 */}
                <div className="relative pt-1 md:pt-2 overflow-visible">
                  <FontAwesomeIcon 
                    icon={category.iconSolid} 
                    className={`w-5 h-5 md:w-7 md:h-7 transition-colors duration-200 ${
                      showActive
                        ? "text-[#4ACAD4]"
                        : "text-gray-400 group-hover:text-[#4ACAD4]"
                    }`}
                  />
                  {/* 복수 선택 시 체크 표시 - 오른쪽 상단 */}
                  {isActive && category.value !== "all" && (
                    <div className="absolute top-0 -right-1 w-3 h-3 bg-[#4ACAD4] rounded-full flex items-center justify-center">
                      <FontAwesomeIcon icon={faCheck} className="w-2 h-2 text-white" />
                    </div>
                  )}
                </div>
                {/* 라벨 - 모바일에서 숨김 */}
                <p
                  className={`hidden md:block text-xs md:text-sm whitespace-nowrap font-medium transition-colors ${
                    isActive 
                      ? "text-[#4ACAD4] font-semibold" 
                      : "text-gray-500 group-hover:text-[#4ACAD4]"
                  }`}
                >
                  {category.label}
                </p>
                {/* 활성화 시 밑줄 표시 */}
                <div 
                  className={`h-0.5 w-full rounded-full transition-all duration-200 ${
                    isActive ? "bg-[#4ACAD4]" : "bg-transparent"
                  }`} 
                />
              </div>
            );
          })}
        </div>

        {/* 구분선 - 데스크톱만 */}
        <Separator orientation="vertical" className="hidden lg:block h-12 mx-4" />

        {/* 오른쪽 컨트롤 영역 - 모바일에서 축소 */}
        <div className="flex flex-row md:flex-col gap-1 md:gap-2 items-center md:items-end">
          {/* 정렬 드롭다운 */}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1 md:gap-2 min-w-fit px-2 md:px-4 py-1.5 md:py-2 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none">
              <FontAwesomeIcon icon={faArrowsUpDown} className="text-neutral-600 w-3 h-3 md:w-4 md:h-4" />
              <span className="hidden md:inline text-sm font-medium text-neutral-700">{currentSortLabel}</span>
              <FontAwesomeIcon icon={faChevronDown} className="text-neutral-500 w-2 h-2 md:w-3 md:h-3" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              {sortOptions.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => handleSortChange(option.value)}
                  className={`flex items-center gap-2 cursor-pointer ${
                    selectedSort === option.value ? "bg-[#4ACAD4]/10 text-[#4ACAD4]" : ""
                  }`}
                >
                  <FontAwesomeIcon icon={option.icon} className="w-4 h-4" />
                  <span>{option.label}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* 분야별 버튼 */}
          <button
            onClick={() => setIsFieldPanelOpen(!isFieldPanelOpen)}
            className={`flex items-center gap-1 md:gap-2 px-2 md:px-4 py-1.5 md:py-2 rounded-lg transition-colors ${
              isFieldPanelOpen || selectedFields.length > 0
                ? "bg-indigo-50 text-indigo-600"
                : "hover:bg-gray-100 text-neutral-700"
            }`}
          >
            <FontAwesomeIcon icon={faIndustry} className="w-3 h-3 md:w-4 md:h-4" />
            <span className="hidden md:inline text-sm font-medium">
              분야별 {selectedFields.length > 0 && `(${selectedFields.length})`}
            </span>
            {selectedFields.length > 0 && (
              <span className="md:hidden text-xs font-medium">{selectedFields.length}</span>
            )}
            <FontAwesomeIcon 
              icon={isFieldPanelOpen ? faChevronUp : faChevronDown} 
              className="w-2 h-2 md:w-3 md:h-3" 
            />
          </button>
        </div>
      </section>

      {/* 분야별 확장 패널 - 한 줄로 */}
      {isFieldPanelOpen && (
        <div className="px-4 md:px-12 lg:px-20 py-3 border-t border-gray-100 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
            <span className="text-sm font-medium text-gray-600 whitespace-nowrap">분야</span>
            {fieldCategories.map((field) => {
              const isSelected = selectedFields.includes(field.id);
              return (
                <button
                  key={field.id}
                  onClick={() => handleFieldToggle(field.id)}
                  className={`px-3 py-1.5 rounded-full border text-sm font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    isSelected
                      ? "bg-indigo-500 border-indigo-500 text-white"
                      : "bg-white border-gray-200 text-gray-600 hover:border-indigo-400 hover:text-indigo-500"
                  }`}
                >
                  {field.label}
                  {isSelected && <FontAwesomeIcon icon={faCheck} className="w-2.5 h-2.5" />}
                </button>
              );
            })}
            {selectedFields.length > 0 && (
              <button
                onClick={() => {
                  setSelectedFields([]);
                  onSetField?.([]);
                }}
                className="text-xs text-gray-400 hover:text-red-500 whitespace-nowrap"
              >
                초기화
              </button>
            )}
          </div>
        </div>
      )}

      {/* 현재 필터 표시 - 분야별 패널이 열려있을 때만 */}
      {isFieldPanelOpen && hasActiveFilters && (
        <div className="px-4 md:px-12 lg:px-20 py-2 flex items-center gap-2 text-sm flex-wrap">
          <span className="text-gray-400 text-xs">선택됨:</span>
          {selectedCategories.map(cat => {
            const category = categories.find(c => c.value === cat);
            return category ? (
              <span 
                key={cat}
                className="px-2 py-1 bg-[#4ACAD4]/20 text-[#4ACAD4] rounded-full text-xs font-medium flex items-center gap-1"
              >
                {category.label}
                <button onClick={() => handleCategoryToggle(cat)}>
                  <FontAwesomeIcon icon={faXmark} className="w-2 h-2" />
                </button>
              </span>
            ) : null;
          })}
          {selectedFields.map(fieldId => {
            const field = fieldCategories.find(f => f.id === fieldId);
            return field ? (
              <span 
                key={fieldId}
                className="px-2 py-1 bg-indigo-100 text-indigo-600 rounded-full text-xs font-medium flex items-center gap-1"
              >
                {field.label}
                <button onClick={() => handleFieldToggle(fieldId)}>
                  <FontAwesomeIcon icon={faXmark} className="w-2 h-2" />
                </button>
              </span>
            ) : null;
          })}
          <button
            onClick={handleResetFilters}
            className="ml-auto text-xs text-gray-500 hover:text-red-500"
          >
            전체 초기화
          </button>
        </div>
      )}
    </div>
  );
}

export default StickyMenu;
