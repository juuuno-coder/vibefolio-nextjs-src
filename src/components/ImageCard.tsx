"use client";

import React, { forwardRef, useState } from "react";
import { OptimizedImage } from '@/components/OptimizedImage';
import { Heart, BarChart3, Image as ImageIcon } from 'lucide-react';
import { addCommas } from "@/lib/format/comma";
import { useLikes } from "@/hooks/useLikes";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth/AuthContext";
import { cn } from "@/lib/utils";

// 기본 폴백 이미지
const FALLBACK_IMAGE = "/placeholder.svg";
const FALLBACK_AVATAR = "/globe.svg";

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
          {/* 인기 프로젝트 뱃지 */}
          {likes >= 100 && (
            <div className="absolute top-3 left-3 z-10 bg-yellow-400 text-yellow-950 text-[10px] font-bold px-2 py-1 rounded-full shadow-md flex items-center gap-1">
               <span>🏆</span> <span>POPULAR</span>
            </div>
          )}
          
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
              {/* 오버레이 그라데이션 및 제목 */}
              <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/60 to-transparent pointer-events-none flex flex-col justify-end p-4">
                 <h3 className="text-white font-bold text-lg drop-shadow-md truncate leading-snug">
                   {props.title || "제목 없음"}
                 </h3>
                 {/* 부가 정보(작성자 등)는 깔끔함을 위해 호버 시에만 살짝 보여주거나 생략할 수 있음. 여기서는 요청대로 '제목만' 강조 */}
                 <div className="flex items-center gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span className="text-white/80 text-xs font-medium drop-shadow-sm flex items-center gap-1">
                      by {props.user?.username || 'user'}
                    </span>
                 </div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }
);

ImageCard.displayName = "ImageCard";
