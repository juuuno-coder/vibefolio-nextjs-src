"use client";

import React, { forwardRef, useState } from "react";
import { useRouter } from "next/navigation";
import { OptimizedImage } from '@/components/OptimizedImage';
import { FontAwesomeIcon } from "./FaIcon";
import { 
  faHeart, 
  faChartSimple, 
  faImage, 
  faPenToSquare, 
  faRocket, 
  faTrash, 
  faEye, 
  faBullhorn, 
  faBolt, 
  faClock,
  faSpinner
} from "@fortawesome/free-solid-svg-icons";
import { faHeart as faHeartRegular } from "@fortawesome/free-regular-svg-icons";
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
    custom_data?: any;
    audit_deadline?: string;
    scheduled_at?: string;
  } | null;
  className?: string;
  onClick?: () => void;
  onDelete?: (id: string) => void;
  priority?: boolean;
}

// forwardRef를 사용하여 컴포넌트를 래핑
// forwardRef 및 React.memo를 사용하여 컴포넌트 최적화
export const ImageCard = React.memo(forwardRef<HTMLDivElement, ImageCardProps>(
  ({ props, onClick, onDelete, className, priority, ...rest }, ref) => {
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
    const imageUrl = props.urls?.regular || props.urls?.full || (props as any).thumbnail_url || (props as any).image_url || FALLBACK_IMAGE;
    const username = props.user?.username || 'Unknown';
    const avatarUrl = props.user?.profile_image?.large || props.user?.profile_image?.small || (props.user as any)?.profile_image_url || FALLBACK_AVATAR;
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
          {/* 이미지 영역 - 4:3 비율 고정 */}
        <div className="relative overflow-hidden rounded-xl aspect-[4/3] bg-gray-100 shadow-sm">
           {/* Owner Actions Overlay */}
            {isOwner && (
             <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity z-20 flex flex-col items-center justify-center gap-2 backdrop-blur-[2px] p-4">
                {/* 1. 보기 */}
                <button 
                  onClick={(e) => { 
                      if (onClick) onClick();
                  }}
                  className="bg-gray-100 text-gray-900 px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 hover:bg-white transition-colors transform hover:scale-105 shadow-lg w-36 justify-center"
                >
                  <FontAwesomeIcon icon={faEye} className="w-4 h-4" /> 보기
                </button>

                {/* 2. 피드백 요청 */}
                {!props.is_feedback_requested && (
                    <button 
                      onClick={handlePromote}
                      className="bg-gradient-to-r from-orange-400 to-red-500 text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 hover:from-orange-500 hover:to-red-600 transition-colors transform hover:scale-105 shadow-lg w-36 justify-center"
                    >
                      <FontAwesomeIcon icon={faBullhorn} className="w-4 h-4" /> 피드백 요청
                    </button>
                )}
                
                {/* 3. 새 에피소드 */}
                <button 
                  onClick={(e) => { e.stopPropagation(); router.push(`/project/upload?mode=version&projectId=${props.id}`); }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 hover:bg-blue-700 transition-colors transform hover:scale-105 shadow-lg w-36 justify-center"
                >
                  <FontAwesomeIcon icon={faRocket} className="w-4 h-4" /> 새 에피소드
                </button>

                {/* 4. 수정 */}
                <button 
                  onClick={(e) => { 
                     e.stopPropagation(); 
                     const cData = typeof props.custom_data === 'string' ? JSON.parse(props.custom_data) : props.custom_data;
                     const isAudit = cData?.audit_config;
                     router.push(`/project/upload?mode=${isAudit ? 'audit' : 'default'}&edit=${props.id}`);
                  }}
                  className="bg-white text-gray-900 px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 hover:bg-green-500 hover:text-white transition-colors transform hover:scale-105 shadow-lg w-36 justify-center"
                >
                  <FontAwesomeIcon icon={faPenToSquare} className="w-4 h-4" /> 수정
                </button>
                
                {/* 5. 삭제 */}
                {onDelete && (
                  <button 
                    onClick={(e) => { 
                        e.stopPropagation(); 
                        onDelete(props.id);
                    }}
                    className="bg-red-50 text-red-600 px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 hover:bg-red-100 transition-colors transform hover:scale-105 shadow-lg w-36 justify-center"
                  >
                    <FontAwesomeIcon icon={faTrash} className="w-4 h-4" /> 삭제
                  </button>
                )}

                {/* 6. 진단 리포트 (Growth Mode) */}
                {(props.is_growth_requested || props.is_feedback_requested) && (
                    <button 
                      onClick={(e) => { 
                          e.stopPropagation(); 
                          router.push(`/mypage/projects/${props.id}/audit`);
                      }}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 hover:bg-indigo-700 transition-colors transform hover:scale-105 shadow-lg w-36 justify-center"
                    >
                      <FontAwesomeIcon icon={faChartSimple} className="w-4 h-4" /> 진단 리포트
                    </button>
                )}
             </div>
           )}
          {/* Badges Container */}
          <div className="absolute top-3 left-3 z-10 flex flex-col gap-2 items-start pointer-events-none">
              {(props.custom_data?.audit_config || props.audit_deadline) && (
                <div className="bg-orange-600 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-md flex items-center gap-1 backdrop-blur-md">
                   <FontAwesomeIcon icon={faBolt} className="w-3 h-3" /> <span>피드백 진행 중</span>
                </div>
              )}
              {props.scheduled_at && new Date(props.scheduled_at) > new Date() && (
                 <div className="bg-yellow-400 text-yellow-900 text-[10px] font-black px-2 py-1 rounded-full shadow-md flex items-center gap-1 animate-pulse">
                   <FontAwesomeIcon icon={faClock} className="w-3 h-3" />
                   <span>{new Date(props.scheduled_at).toLocaleDateString()}</span>
                 </div>
              )}
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
          </div>
          
            {imgError ? (
            <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-50">
              <FontAwesomeIcon icon={faImage} className="w-12 h-12" />
            </div>
          ) : (
            <OptimizedImage
              src={imageUrl}
              alt={altText}
              className={`object-cover transition-all duration-500 group-hover:brightness-110 group-hover:scale-105 ${props.scheduled_at && new Date(props.scheduled_at) > new Date() ? 'grayscale-[0.8]' : ''}`}
              fill
              priority={priority}
            />
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
                      <FontAwesomeIcon icon={faRocket} className="w-2.5 h-2.5" />
                   </span>
                 )}
               </span>
            </div>
            
            <div className="flex items-center gap-3 text-xs text-gray-400 flex-shrink-0">
               <div 
                  className="flex items-center gap-1 cursor-pointer hover:bg-gray-100 p-1 rounded-full px-2 transition-colors" 
                  title={`좋아요 ${displayLikes}`}
                  onClick={(e) => {
                      e.stopPropagation();
                      if (!user) {
                          toast.error("로그인이 필요합니다.");
                          router.push('/login');
                          return;
                      }
                      toggleLike();
                  }}
               >
                  <FontAwesomeIcon icon={isLiked ? faHeart : faHeartRegular} className={`w-3.5 h-3.5 transition-colors ${isLiked ? "text-red-500" : "group-hover:text-red-400"}`} />
                  <span className={isLiked ? "text-red-500 font-bold" : ""}>{addCommas(displayLikes)}</span>
               </div>
               <div className="flex items-center gap-1" title={`조회수 ${views}`}>
                  <FontAwesomeIcon icon={faChartSimple} className="w-3.5 h-3.5" />
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
));

ImageCard.displayName = "ImageCard";
