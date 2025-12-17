// src/components/ImageCard.tsx

"use client";

import React, { forwardRef, useState } from "react";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart, faChartSimple, faImage } from "@fortawesome/free-solid-svg-icons";
import { addCommas } from "@/lib/format/comma";

// 기본 폴백 이미지
const FALLBACK_IMAGE = "/placeholder.jpg";
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

    if (!props) return null;

    // 안전한 데이터 접근
    const imageUrl = props.urls?.regular || props.urls?.full || FALLBACK_IMAGE;
    const username = props.user?.username || 'Unknown';
    const avatarUrl = props.user?.profile_image?.large || props.user?.profile_image?.small || FALLBACK_AVATAR;
    const likes = props.likes ?? 0;
    const views = props.views;
    const altText = props.alt_description || props.title || '@THUMBNAIL';

    return (
      <div
        className="masonry-item behance-card cursor-pointer group" // 중복 호버 클래스 제거
        ref={ref}
        onClick={onClick}
        {...rest}
      >
        {/* 이미지 영역 */}
        <div className="relative overflow-hidden image-hover">
          {/* 인기 프로젝트 뱃지 (좋아요 100개 이상) */}
          {likes >= 100 && (
            <div className="absolute top-3 left-3 z-10 bg-yellow-400 text-yellow-950 text-[10px] font-bold px-2 py-1 rounded-full shadow-md flex items-center gap-1">
               <span>🏆</span> <span>POPULAR</span>
            </div>
          )}
          
          {imgError ? (
            <div className="w-full aspect-square bg-gray-100 flex items-center justify-center">
              <FontAwesomeIcon icon={faImage} className="w-12 h-12 text-gray-300" />
            </div>
          ) : (
            <img
              src={imageUrl}
              alt={altText}
              className="w-full h-auto object-cover"
              loading="lazy"
              decoding="async"
              onError={() => setImgError(true)}
            />
          )}
          
          {/* 호버 시 나타나는 정보 */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
            <div className="flex items-center gap-6 text-white">
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faHeart} className="w-5 h-5" />
                <span className="font-medium">{addCommas(likes)}</span>
              </div>
              {views !== undefined && (
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faChartSimple} className="w-5 h-5" />
                  <span className="font-medium text-lg">{addCommas(views)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 카드 정보 */}
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="relative w-8 h-8 rounded-full overflow-hidden bg-gray-100">
                <Image
                  src={avatarError ? FALLBACK_AVATAR : avatarUrl}
                  alt="@PROFILE_IMAGE"
                  fill
                  className="object-cover"
                  onError={() => setAvatarError(true)}
                  sizes="32px"
                />
              </div>
              <p className="text-sm font-medium text-primary">{username}</p>
            </div>
            <div className="flex items-center gap-3 text-secondary">
              <div className="flex items-center gap-1.5">
                <FontAwesomeIcon icon={faHeart} className="w-4 h-4 text-red-400" />
                <span className="text-sm font-semibold text-gray-700">{addCommas(likes)}</span>
              </div>
              {views !== undefined && (
                <div className="flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faChartSimple} className="w-4 h-4 text-blue-400" />
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
