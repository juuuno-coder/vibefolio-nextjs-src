// src/components/ImageCard.tsx

"use client";

import React, { forwardRef } from "react";
import { Heart, Eye } from "lucide-react";
import { addCommas } from "@/lib/format/comma";

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
    if (!props) return null;

    return (
      <div
        className="masonry-item behance-card cursor-pointer group"
        ref={ref}
        onClick={onClick}
        {...rest}
      >
        {/* 이미지 영역 */}
        <div className="relative overflow-hidden image-hover">
          <img
            src={props.urls.regular}
            alt="@THUMBNAIL"
            className="w-full h-auto object-cover"
          />
          
          {/* 호버 시 나타나는 정보 */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
            <div className="flex items-center gap-6 text-white">
              <div className="flex items-center gap-2">
                <Heart size={20} fill="white" />
                <span className="font-medium">{addCommas(props.likes)}</span>
              </div>
              {props.views && (
                <div className="flex items-center gap-2">
                  <Eye size={20} />
                  <span className="font-medium">{addCommas(props.views)}</span>
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
                src={props.user.profile_image.large}
                alt="@PROFILE_IMAGE"
                className="w-8 h-8 rounded-full avatar object-cover"
              />
              <p className="text-sm font-medium text-primary">{props.user.username}</p>
            </div>
            <div className="flex items-center gap-3 text-secondary">
              <div className="flex items-center gap-1">
                <Heart size={14} className="text-gray-400" />
                <span className="text-xs">{addCommas(props.likes)}</span>
              </div>
              {props.views !== undefined && (
                <div className="flex items-center gap-1">
                  <Eye size={14} className="text-gray-400" />
                  <span className="text-xs">{addCommas(props.views)}</span>
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
```
