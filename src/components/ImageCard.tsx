"use client";

import React, { forwardRef, useState } from "react";
import { useRouter } from "next/navigation";
import { OptimizedImage } from '@/components/OptimizedImage';
import { Heart, BarChart3, Image as ImageIcon, Edit, Rocket, Trash2 } from 'lucide-react';
import { addCommas } from "@/lib/format/comma";
import { useLikes } from "@/hooks/useLikes";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth/AuthContext";
import { cn } from "@/lib/utils";

// 기본 폴백 이미지
const FALLBACK_IMAGE = "/placeholder.svg";
const FALLBACK_AVATAR = "/globe.svg";

import { getCategoryName } from "@/lib/categoryMap";

// Props 인터페이스 정의
interface ImageCardProps {
  props: {
    id: string;
    urls?: { regular?: string; full?: string };
    user?: {
      username?: string;
      profile_image?: { large?: string; small?: string };
    };
    likes?: number;
    views?: number;
    description?: string | null;
    alt_description?: string | null;
    title?: string;
    created_at?: string;
    width?: number;
    height?: number;
    category?: string;
    categorySlug?: string;
    field?: string;
    userId?: string;
  } | null;
  className?: string;
  onClick?: () => void;
}

// forwardRef를 사용하여 컴포넌트를 래핑
export const ImageCard = forwardRef<HTMLDivElement, ImageCardProps>(
  ({ props, onClick, className, ...rest }, ref) => {
    const [imgError, setImgError] = useState(false);
    const [avatarError, setAvatarError] = useState(false);
    const { user } = useAuth();
    const router = useRouter();
    
    // 소유자 여부 확인
    const isOwner = user?.id && props?.userId && user.id === props.userId;

    // ✅ Hook 호출: 조건부 리턴(if (!props)) 이전에 호출하여 Rule violation 방지
    const { isLiked, toggleLike } = useLikes(props?.id, props?.likes);

    if (!props) return null;

    // 안전한 데이터 접근
    const imageUrl = props.urls?.regular || props.urls?.full || FALLBACK_IMAGE;
    const username = props.user?.username || 'Unknown';
    const avatarUrl = props.user?.profile_image?.large || props.user?.profile_image?.small || FALLBACK_AVATAR;
    const likes = props.likes ?? 0;
    const views = props.views;
    const altText = props.alt_description || props.title || '@THUMBNAIL';
    const categoryName = props.category;
    const fieldLabel = props.field ? getCategoryName(props.field) : null;

    // 화면상의 좋아요 수 계산 (Optimistic UI 보정)
    const displayLikes = likes + (isLiked ? 1 : 0) - (props.likes && isLiked ? 0 : 0);

    const handleLikeClick = (e: React.MouseEvent) => {
      e.stopPropagation(); // 카드 클릭(모달 열기) 방지
      
      if (!user) {
        toast.error("로그인이 필요합니다.");
        return;
      }
      toggleLike();
    };

    return (
      <div
        ref={ref}
        className={`relative group cursor-pointer break-inside-avoid ${className}`}
        onClick={onClick}
        {...rest}
      >
        {/* 이미지 영역 - 4:3 비율 고정 */}
        <div className="relative overflow-hidden rounded-xl aspect-[4/3] bg-gray-100 shadow-sm">
           {/* Owner Actions Overlay */}
           {isOwner && (
             <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity z-20 flex flex-col items-center justify-center gap-3 backdrop-blur-[2px]">
                <button 
                  onClick={(e) => { e.stopPropagation(); router.push(`/project/edit/${props.id}`); }}
                  className="bg-white text-gray-900 px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 hover:bg-green-500 hover:text-white transition-colors transform hover:scale-105 shadow-lg w-32 justify-center"
                >
                  <Edit className="w-4 h-4" /> 수정
                </button>
                <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    router.push(`/project/upload?mode=version&projectId=${props.id}`); 
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 hover:bg-blue-700 transition-colors transform hover:scale-105 shadow-lg w-32 justify-center"
                >
                  <Rocket className="w-4 h-4" /> 새 버전
                </button>
                <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    if(confirm("정말 삭제하시겠습니까?")) {
                       // Delete logic placeholder
                       toast.error("삭제 기능은 상위 컴포넌트에서 처리해야 합니다.");
                    }
                  }}
                  className="bg-gray-700/80 text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 hover:bg-red-600 transition-colors transform hover:scale-105 shadow-lg w-32 justify-center"
                >
                  <Trash2 className="w-4 h-4" /> 삭제
                </button>
             </div>
           )}
          {/* 인기 프로젝트 뱃지 */}
          {likes >= 100 && (
            <div className="absolute top-3 left-3 z-10 bg-yellow-400 text-yellow-950 text-[10px] font-bold px-2 py-1 rounded-full shadow-md flex items-center gap-1">
               <span>🏆</span> <span>POPULAR</span>
            </div>
          )}

          {/* 카테고리 & 분야 뱃지 (우측 상단) */}
          <div className="absolute top-3 right-3 z-10 flex flex-col items-end gap-1.5 pointer-events-none">
            {categoryName && (
              <span className="bg-black/60 backdrop-blur-md text-white text-[10px] font-medium px-2 py-1 rounded-md border border-white/10 shadow-sm">
                {categoryName}
              </span>
            )}
            {fieldLabel && (
              <span className="bg-white/90 backdrop-blur-md text-slate-700 text-[10px] font-bold px-2 py-1 rounded-md shadow-sm border border-slate-100">
                {fieldLabel}
              </span>
            )}
          </div>
          
            {imgError ? (
            <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-50">
              <ImageIcon className="w-12 h-12" />
            </div>
          ) : (
            <>
              {/* 이미지: 호버 시 확대 없이 밝기만 살짝 증가 */}
              <OptimizedImage
                src={imageUrl}
                alt={altText}
                className="w-full h-full object-cover transition-all duration-300 group-hover:brightness-110"
                width={800}
                height={600}
              />
            </>
          )}
        </div>

        {/* 하단 정보 영역 (복원) */}
        <div className="pt-3 px-1">
          {/* 제목 */}
          <h3 className="font-bold text-gray-900 text-[15px] mb-2 truncate group-hover:text-green-600 transition-colors">
            {props.title || "제목 없음"}
          </h3>
          
          <div className="flex items-center justify-between">
            {/* 좌측: 작성자 (작게) */}
            <div className="flex items-center gap-1.5 min-w-0">
               <div className="relative w-5 h-5 rounded-full overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-100">
                  <OptimizedImage 
                    src={props.user?.profile_image?.small || FALLBACK_AVATAR} 
                    alt={props.user?.username || 'user'}
                    fill
                    className="object-cover"
                  />
               </div>
               <span className="text-xs text-gray-500 truncate">
                 {props.user?.username || 'Unknown'}
               </span>
            </div>
            
            {/* 우측: 좋아요 / 조회수 */}
            <div className="flex items-center gap-3 text-xs text-gray-400 flex-shrink-0">
               <div className="flex items-center gap-1" title={`좋아요 ${displayLikes}`}>
                  <Heart className={`w-3.5 h-3.5 ${isLiked ? "fill-red-500 text-red-500" : ""}`} />
                  <span>{addCommas(displayLikes)}</span>
               </div>
               <div className="flex items-center gap-1" title={`조회수 ${views}`}>
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>{addCommas(views || 0)}</span>
               </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

ImageCard.displayName = "ImageCard";
