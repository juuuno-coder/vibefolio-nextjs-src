// src/components/ImageCard.tsx

"use client";

import React, { forwardRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart, faChartSimple, faImage } from "@fortawesome/free-solid-svg-icons";
import { addCommas } from "@/lib/format/comma";

// 기본 폴백 이미지
const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop";
const FALLBACK_AVATAR = "/globe.svg";

// Props 인터페이스 정의
interface ImageCardProps {
  props: {
    id: string;
    urls: { regular: string; full: string };
    user: {
      username: string;
      profile_image: { large: string; small: string };
    };
    likes: number;
    views?: number;
    description?: string | null;
    alt_description?: string | null;
    created_at?: string;
    width?: number;
    height?: number;
  } | null;
  onClick?: () => void;
}

// forwardRef를 사용하여 컴포넌트를 래핑하고 ref와 나머지 props를 받습니다.
export const ImageCard = forwardRef<HTMLDivElement, ImageCardProps>(
  ({ props, onClick, ...rest }, ref) => {
    const [imgError, setImgError] = useState(false);
    const [avatarError, setAvatarError] = useState(false);

    if (!props) return null;

    return (
      <div
        className="masonry-item behance-card cursor-pointer group transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
        ref={ref}
        onClick={onClick}
        {...rest}
      >
        {/* 이미지 영역 */}
        <div className="relative overflow-hidden image-hover">
          {imgError ? (
            <div className="w-full aspect-square bg-gray-100 flex items-center justify-center">
              <FontAwesomeIcon icon={faImage} className="w-12 h-12 text-gray-300" />
            </div>
          ) : (
            <img
              src={props.urls.regular || FALLBACK_IMAGE}
              alt={props.alt_description || "@THUMBNAIL"}
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
                <span className="font-medium">{addCommas(props.likes)}</span>
              </div>
              {props.views !== undefined && (
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faChartSimple} className="w-5 h-5" />
                  <span className="font-medium text-lg">{addCommas(props.views)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 카드 정보 */}
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img
                src={avatarError ? FALLBACK_AVATAR : (props.user.profile_image.large || FALLBACK_AVATAR)}
                alt="@PROFILE_IMAGE"
                className="w-8 h-8 rounded-full avatar object-cover bg-gray-100"
                onError={() => setAvatarError(true)}
              />
              <p className="text-sm font-medium text-primary">{props.user.username}</p>
            </div>
            <div className="flex items-center gap-3 text-secondary">
              <div className="flex items-center gap-1.5">
                <FontAwesomeIcon icon={faHeart} className="w-4 h-4 text-red-400" />
                <span className="text-sm font-semibold text-gray-700">{addCommas(props.likes)}</span>
              </div>
              {props.views !== undefined && (
                <div className="flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faChartSimple} className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-semibold text-gray-700">{addCommas(props.views)}</span>
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
