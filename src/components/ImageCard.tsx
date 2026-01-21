"use client";

import React, { forwardRef, useState } from "react";
import { useRouter } from "next/navigation";
import { OptimizedImage } from '@/components/OptimizedImage';
import { Heart, BarChart3, Image as ImageIcon, Edit, Rocket, Trash2, Eye, Megaphone } from 'lucide-react';
import { supabase } from "@/lib/supabase/client";
import { addCommas } from "@/lib/format/comma";
import { useLikes } from "@/hooks/useLikes";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth/AuthContext";
import { cn } from "@/lib/utils";
import dayjs from "dayjs";
import { FeedbackReportModal } from "./FeedbackReportModal";
import { FeedbackRequestModal } from "./FeedbackRequestModal";
import { getCategoryName } from "@/lib/categoryMap";

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
      expertise?: { fields: string[] } | null;
    };
    likes?: number;
    views?: number;
    description?: string | null;
    alt_description?: string | null;
    title?: string;
    created_at?: string;
    updated_at?: string;
    width?: number;
    height?: number;
    category?: string;
    categorySlug?: string;
    field?: string;
    userId?: string;
    is_feedback_requested?: boolean;
    is_growth_requested?: boolean;
  } | null;
  className?: string;
  onClick?: () => void;
}

// forwardRef를 사용하여 컴포넌트를 래핑
export const ImageCard = forwardRef<HTMLDivElement, ImageCardProps>(
  ({ props, onClick, className, ...rest }, ref) => {
    const [imgError, setImgError] = useState(false);
    const [avatarError, setAvatarError] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [showFeedbackRequestModal, setShowFeedbackRequestModal] = useState(false);
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

    // Update Badge Logic
    const isRecentlyUpdated = React.useMemo(() => {
        if (!props.updated_at || !props.created_at) return false;
        const created = dayjs(props.created_at);
        const updated = dayjs(props.updated_at);
        const now = dayjs();
        
        // 1. created와 updated가 1시간 이상 차이 (단순 생성 시점 갱신 제외)
        const isModified = updated.diff(created, 'hour') >= 1;
        // 2. 최근 7일 이내 업데이트
        const isRecent = now.diff(updated, 'day') <= 7;
        
        return isModified && isRecent;
    }, [props.created_at, props.updated_at]);

    // 화면상의 좋아요 수 계산 (Optimistic UI 보정)
    const displayLikes = likes + (isLiked ? 1 : 0) - (props.likes && isLiked ? 0 : 0);

    const handlePromote = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowFeedbackRequestModal(true);
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
                {!props.is_feedback_requested && (
                    <button 
                      onClick={handlePromote}
                      className="bg-gradient-to-r from-orange-400 to-red-500 text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 hover:from-orange-500 hover:to-red-600 transition-colors transform hover:scale-105 shadow-lg w-32 justify-center mb-2"
                    >
                      <Megaphone className="w-4 h-4" /> 피드백 요청
                    </button>
                )}
                
                {/* [Report Button] V-Audit or Growth Mode */}
                {(props.is_growth_requested || props.is_feedback_requested) && (
                    <button 
                      onClick={(e) => { 
                          e.stopPropagation(); 
                          router.push(`/mypage/projects/${props.id}/audit`);
                      }}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 hover:bg-indigo-700 transition-colors transform hover:scale-105 shadow-lg w-32 justify-center mb-2"
                    >
                      <BarChart3 className="w-4 h-4" /> 진단 리포트
                    </button>
                )}

                <div className="flex flex-col gap-2">
                    <button 
                      onClick={(e) => { 
                          if (onClick) onClick();
                      }}
                      className="bg-gray-100 text-gray-900 px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 hover:bg-white transition-colors transform hover:scale-105 shadow-lg w-32 justify-center"
                    >
                      <Eye className="w-4 h-4" /> 보기
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); router.push(`/project/edit/${props.id}`); }}
                      className="bg-white text-gray-900 px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 hover:bg-green-500 hover:text-white transition-colors transform hover:scale-105 shadow-lg w-32 justify-center"
                    >
                      <Edit className="w-4 h-4" /> 수정
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); router.push(`/project/upload?mode=version&projectId=${props.id}`); }}
                      className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 hover:bg-blue-700 transition-colors transform hover:scale-105 shadow-lg w-32 justify-center"
                    >
                      <Rocket className="w-4 h-4" /> 새 에피소드
                    </button>
                    <button 
                      onClick={(e) => { 
                          e.stopPropagation(); 
                          toast.error("삭제 기능은 상위 컴포넌트에서 처리해야 합니다.");
                      }}
                      className="bg-red-50 text-red-600 px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 hover:bg-red-100 transition-colors transform hover:scale-105 shadow-lg w-32 justify-center"
                    >
                      <Trash2 className="w-4 h-4" /> 삭제
                    </button>
                </div>
             </div>
           )}
          {/* Badges Container */}
          <div className="absolute top-3 left-3 z-10 flex flex-col gap-2 items-start pointer-events-none">
              {likes >= 100 && (
                <div className="bg-yellow-400 text-yellow-950 text-[10px] font-bold px-2 py-1 rounded-full shadow-md flex items-center gap-1">
                   <span>🏆</span> <span>POPULAR</span>
                </div>
              )}
              {isRecentlyUpdated && (
                <div className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-md flex items-center gap-1">
                   <span>✨</span> <span>NEW RELEASE</span>
                </div>
              )}
              {(props.is_growth_requested || props.is_feedback_requested) && (
                <div className="bg-slate-900 border border-white/20 text-white text-[9px] font-black px-2.5 py-1.5 rounded-full shadow-2xl flex items-center gap-1.5">
                   <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping" />
                   <span className="tracking-widest">V-AUDIT ACTIVE</span>
                </div>
              )}
          </div>

          {/* [Removed] 카테고리 & 분야 뱃지 제거됨 */}
          
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

        {/* 하단 정보 영역 */}
        <div className="pt-3 px-1">
          <h3 className="font-bold text-gray-900 text-[15px] mb-2 truncate group-hover:text-green-600 transition-colors">
            {props.title || "제목 없음"}
          </h3>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 min-w-0">
               <div className="relative w-5 h-5 rounded-full overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-100">
                  <OptimizedImage 
                    src={props.user?.profile_image?.small || FALLBACK_AVATAR} 
                    alt={props.user?.username || 'user'}
                    fill
                    className="object-cover"
                  />
               </div>
               <span className="text-xs text-gray-500 truncate flex items-center gap-1">
                 {props.user?.username || 'Unknown'}
                 {props.user?.expertise?.fields && props.user.expertise.fields.length > 0 && (
                   <span 
                     className="inline-flex items-center justify-center w-3.5 h-3.5 bg-blue-100 text-blue-600 rounded-full"
                     title={`전문가: ${props.user.expertise.fields.join(', ')}`}
                   >
                      <Rocket className="w-2.5 h-2.5 fill-current" />
                   </span>
                 )}
               </span>
            </div>
            
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

        {/* Feedback Report Modal */}
        {showReportModal && (
            <FeedbackReportModal 
               open={showReportModal} 
               onOpenChange={setShowReportModal}
               projectTitle={props.title || "Untitled"}
               projectId={props.id}
            />
        )}
        
        {/* Feedback Request Modal (New) */}
        {showFeedbackRequestModal && (
             <FeedbackRequestModal 
                open={showFeedbackRequestModal}
                onOpenChange={setShowFeedbackRequestModal}
                projectId={props.id}
                projectTitle={props.title || "Untitled"}
             />
        )}
      </div>
    );
  }
);

ImageCard.displayName = "ImageCard";
