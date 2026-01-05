// src/components/StickyMenu.tsx

"use client";

import { useState, useEffect } from "react";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FontAwesomeIcon } from "./FaIcon";
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
  { iconSolid: faHeart, label: "관심사", value: "interests" },
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
  const [isScrolled, setIsScrolled] = useState(false);

  // 스크롤 감지
  useEffect(() => {
    const handleScroll = () => {
      // 배너 높이 등을 고려하여 임계값 설정 (약 300px)
      setIsScrolled(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSortChange = (value: string) => {
    setSelectedSort(value);
    onSetSort?.(value);
  };

  // 카테고리 클릭 (단일 선택)
  const handleCategoryToggle = (value: string) => {
    if (value === "all") {
      // 전체 선택
      setSelectedCategories([]);
      onSetCategory("all");
    } else {
      // 해당 카테고리만 선택 (단일 선택)
      setSelectedCategories([value]);
      onSetCategory(value);
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
    <>
      {/* Placeholder for layout shift prevention */}
      {isScrolled && <div className="h-16 md:h-20 w-full" />}

      <div className={`${isScrolled ? "fixed top-[72px] left-0 right-0 shadow-md" : "relative"} z-40 w-full transition-all duration-300`}>
        {/* 1. 상단 메인 카테고리 바 */}
        <div className={`w-full bg-white/95 backdrop-blur-sm border-b border-gray-100 transition-all duration-300 ${isScrolled ? "h-12" : "h-16 md:h-20"}`}>
          <section className={`flex items-center justify-between px-3 md:px-6 h-full w-full gap-2`}>
            {/* 카테고리 목록 */}
            <div className="flex items-center justify-start md:justify-center gap-1 md:gap-2 overflow-x-auto no-scrollbar h-full flex-1">
              {categories.map((category) => {
                const isActive = category.value === "all" 
                  ? selectedCategories.length === 0 
                  : selectedCategories.includes(category.value);
                const isHovered = hoveredCategory === category.value;
                const showActive = isActive || isHovered;

                return (
                  <div
                    key={category.value}
                    className={`group flex items-center gap-1.5 md:gap-2 px-3 py-1.5 rounded-full cursor-pointer transition-all duration-200 whitespace-nowrap ${
                      isActive ? "bg-green-50" : "hover:bg-slate-50"
                    }`}
                    onClick={() => handleCategoryToggle(category.value)}
                    onMouseEnter={() => setHoveredCategory(category.value)}
                    onMouseLeave={() => setHoveredCategory(null)}
                  >
                    <div className="relative">
                      <FontAwesomeIcon 
                        icon={category.iconSolid} 
                        className={`transition-all duration-200 ${isScrolled ? "w-3.5 h-3.5" : "w-4 h-4 md:w-[18px] md:h-[18px]"} ${
                          showActive ? "text-green-600" : "text-slate-400 group-hover:text-green-600"
                        }`}
                      />
                      {isActive && category.value !== "all" && !isScrolled && (
                        <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-green-500 rounded-full border border-white" />
                      )}
                    </div>
                    <span className={`transition-all ${isScrolled ? "text-[13px] font-semibold" : "text-sm md:text-[15px] font-medium"} ${
                      isActive ? "text-green-700 font-bold" : "text-slate-600 group-hover:text-green-600"
                    }`}>
                      {category.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* 오른쪽 컨트롤 영역 - 한 줄로 항상 유지 */}
            <div className="flex items-center gap-1 md:gap-2 h-full">
              {/* 구분선 제거됨 */}


              {/* 정렬 드롭다운 */}
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-1.5 px-3 h-9 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none border border-transparent hover:border-gray-200">
                  <FontAwesomeIcon icon={faArrowsUpDown} className="text-gray-600 w-3.5 h-3.5" />
                  <span className={`whitespace-nowrap font-bold pt-[1px] ${isScrolled ? "text-xs" : "text-[13px] md:text-sm text-gray-800"}`}>
                    {currentSortLabel}
                  </span>
                  <FontAwesomeIcon icon={faChevronDown} className="text-gray-500 w-2.5 h-2.5 ml-0.5" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40 bg-white border border-gray-100 shadow-xl rounded-xl p-1">
                  {sortOptions.map((option) => (
                    <DropdownMenuItem
                      key={option.value}
                      onClick={() => handleSortChange(option.value)}
                      className={`flex items-center gap-2 cursor-pointer p-2 rounded-lg my-0.5 ${
                        selectedSort === option.value ? "bg-green-50 text-green-600 font-semibold" : "text-gray-600 hover:bg-gray-50 hover:text-black"
                      }`}
                    >
                      <FontAwesomeIcon icon={option.icon} className={`w-4 h-4 ${selectedSort === option.value ? "opacity-100" : "opacity-50"}`} />
                      <span>{option.label}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* 분야별 버튼 */}
              <button
                onClick={() => setIsFieldPanelOpen(!isFieldPanelOpen)}
                className={`flex items-center gap-1.5 px-3 h-9 rounded-lg transition-all whitespace-nowrap border ${
                  isFieldPanelOpen || selectedFields.length > 0
                    ? "bg-green-50 text-green-700 border-green-200"
                    : "bg-transparent hover:bg-gray-50 text-gray-700 border-transparent hover:border-gray-200"
                }`}
              >
                <FontAwesomeIcon icon={faIndustry} className="w-3.5 h-3.5" />
                <span className={`font-bold pt-[1px] ${isScrolled ? "text-xs" : "text-[13px] md:text-sm"}`}>
                  분야별 {selectedFields.length > 0 && `(${selectedFields.length})`}
                </span>
                <FontAwesomeIcon 
                  icon={isFieldPanelOpen ? faChevronUp : faChevronDown} 
                  className="w-2.5 h-2.5 ml-0.5" 
                />
              </button>
            </div>
          </section>
        </div>

        {/* 2. 분야별 확장 패널 - 스크롤 시 축소 적용 */}
        <div 
          className={`overflow-hidden transition-all duration-300 ease-in-out bg-gray-50/95 backdrop-blur-sm border-b border-gray-100 ${
            isFieldPanelOpen ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className={`px-3 md:px-6 transition-all duration-300 ${isScrolled ? "py-2" : "py-3"}`}>
            <div className="flex items-center justify-start md:justify-center gap-3 overflow-x-auto no-scrollbar">
              <span className={`font-bold text-gray-800 whitespace-nowrap mr-2 transition-all ${isScrolled ? "text-xs" : "text-sm"}`}>분야</span>
              {fieldCategories.map((field) => {
                const isSelected = selectedFields.includes(field.id);
                return (
                  <button
                    key={field.id}
                    onClick={() => handleFieldToggle(field.id)}
                    className={`rounded-full border font-medium transition-all whitespace-nowrap flex items-center gap-2 ${
                      isSelected
                        ? "bg-[#16A34A] border-[#16A34A] text-white"
                        : "bg-white border-gray-200 text-gray-600 hover:border-green-400 hover:text-green-600"
                    } ${isScrolled ? "px-3 py-1 text-xs" : "px-4 py-1.5 text-sm"}`}
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
                  className="text-xs text-gray-400 hover:text-red-500 whitespace-nowrap ml-2"
                >
                  초기화
                </button>
              )}
            </div>
          </div>

          {/* 현재 필터 표시 */}
          {hasActiveFilters && (
            <div className="px-3 md:px-6 py-2 flex items-center justify-start md:justify-center gap-2 text-sm flex-wrap border-t border-gray-100 bg-white/50">
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
                    className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center gap-1"
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
                className="ml-2 text-xs text-gray-500 hover:text-red-500"
              >
                전체 초기화
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default StickyMenu;
