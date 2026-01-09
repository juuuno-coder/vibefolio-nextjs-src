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
  onClick?: () => void;
}

// forwardRef를 사용하여 컴포넌트를 래핑
export const ImageCard = forwardRef<HTMLDivElement, ImageCardProps>(
  ({ props, onClick, ...rest }, ref) => {
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
        className="masonry-item behance-card cursor-pointer group rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-xl hover:border-green-200 hover:-translate-y-1 transition-all duration-300"
        ref={ref}
        onClick={onClick}
        {...rest}
      >
        {/* 이미지 영역 - 4:3 비율 고정 */}
        <div className="relative overflow-hidden rounded-t-xl aspect-[4/3] bg-gray-50">
          {/* 인기 프로젝트 뱃지 (좋아요 100개 이상) */}
          {likes >= 100 && (
            <div className="absolute top-3 left-3 z-10 bg-yellow-400 text-yellow-950 text-[10px] font-bold px-2 py-1 rounded-full shadow-md flex items-center gap-1">
               <span>🏆</span> <span>POPULAR</span>
            </div>
          )}
          
            {imgError ? (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <ImageIcon className="w-12 h-12" />
            </div>
          ) : (
            <OptimizedImage
              src={imageUrl}
              alt={altText}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              width={800}
              height={600}
            />
          )}
        </div>

        {/* 카드 정보 (하단) */}
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="relative w-8 h-8 rounded-full overflow-hidden bg-gray-100">
                <OptimizedImage
                  src={avatarError ? FALLBACK_AVATAR : avatarUrl}
                  alt="@PROFILE_IMAGE"
                  fill
                  className="object-cover"
                  width={32}
                  height={32}
                />
              </div>
              <p className="text-sm font-medium text-primary">{username}</p>
            </div>
            <div className="flex items-center gap-3 text-secondary">
              <div 
                className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={handleLikeClick}
              >
                <Heart className={cn("w-4 h-4", isLiked ? "fill-red-500 text-red-500" : "text-red-400")} />
                <span className="text-sm font-semibold text-gray-700">{addCommas(displayLikes)}</span>
              </div>
              {views !== undefined && (
                  <div className="flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-semibold text-gray-700">{addCommas(views)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
);

ImageCard.displayName = "ImageCard";
