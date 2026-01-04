// src/components/ImageDialog.tsx

"use client"; // 🚨 클라이언트 컴포넌트 지정

import React, { useState } from "react"; // 🚨 useState 추가
import { Calendar, Grid2X2, Heart, AlignLeft } from "lucide-react";
import dayjs from "dayjs";
import { addCommas } from "@/lib/format/comma";

import { ImageCard } from "@/components/ImageCard";
import { supabase } from "@/lib/supabase/client";

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Separator,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/index";

// 🚨 ImageDialog Props TypeScript 인터페이스 정의
interface ImageDialogProps {
  id: string;
  urls: {
    full: string;
    regular: string;
  };
  user: {
    username: string;
    profile_image: {
      small: string;
      large: string;
    };
  };
  likes: number;
  description: string | null;
  alt_description: string | null;
  created_at: string;
  width: number;
  height: number;
}

// 툴팁 그룹 컴포넌트를 정의하여 코드를 간결화 (onClick prop 추가)
const ActionTooltip = ({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <div className="flex flex-col items-center justify-center gap-1">
        <Button
          size={"icon"}
          className="rounded-full bg-black/50 hover:bg-black/70 text-white"
          onClick={onClick}
        >
          {icon}
        </Button>
        <p className="text-white text-sm">{label}</p>
      </div>
    </TooltipTrigger>
    <TooltipContent>
      <p>{label}</p>
    </TooltipContent>
  </Tooltip>
);

// 🚨 컴포넌트 이름을 ImageDialog로 변경하고 타입 적용
// 🚨 중복 선언 방지를 위해 함수 선언과 내보내기를 한 줄로 통합했습니다.
export function ImageDialog({ props }: { props: ImageDialogProps }) {
  // 🚨 좋아요 상태 관리 추가
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(props.likes);

  const handleLikeToggle = async () => {
    // 1. 사용자 체크
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      if (confirm("로그인이 필요한 기능입니다. 로그인하시겠습니까?")) {
        // 현재 URL 기억하고 로그인 페이지로 이동 (선택 사항)
        window.location.href = "/login";
      }
      return;
    }

    // 2. 낙관적 업데이트 (UI 먼저 갱신)
    const prevIsLiked = isLiked;
    const prevLikeCount = likeCount;

    setIsLiked(!prevIsLiked);
    setLikeCount(prevIsLiked ? prevLikeCount - 1 : prevLikeCount + 1);

    try {
      if (prevIsLiked) {
        // 좋아요 취소 (DELETE)
        const { error } = await supabase
          .from("Like" as any)
          .delete()
          .match({ project_id: props.id, user_id: user.id } as any);

        if (error) throw error;
      } else {
        // 좋아요 추가 (INSERT)
        const { error } = await supabase
          .from("Like" as any)
          .insert({ project_id: props.id, user_id: user.id } as any);

        if (error) throw error;
      }
    } catch (error) {
      console.error("좋아요 처리 실패:", error);
      // 롤백
      setIsLiked(prevIsLiked);
      setLikeCount(prevLikeCount);
      alert("요청을 처리하는 중 오류가 발생했습니다.");
    }
  };

  // 3. 초기 로딩 시 좋아요 여부 확인
  React.useEffect(() => {
    const checkIsLiked = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("Like" as any)
        .select("created_at")
        .eq("project_id", props.id)
        .eq("user_id", user.id)
        .maybeSingle(); // single() 대신 maybeSingle() 사용 (없어도 에러 아님)

      if (data) {
        setIsLiked(true);
      }
    };

    checkIsLiked();
  }, [props.id]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <ImageCard props={props} />
      </DialogTrigger>

      {/* 🚨🚨🚨 DialogContent에 'bg-black text-white' 추가하여 하얀 선 문제 해결 시도 🚨🚨🚨 */}
      {/* 기본 padding-6 대신 p-0을 적용하고 내부에서 패딩을 조절하여 하얀 여백 제거 */}
      <DialogContent
        className="
          p-0 
          sm:max-w-[700px] lg:max-w-[1000px] max-h-[90vh] 
          overflow-y-auto 
          bg-black text-white
        "
      >
        {/* 🚨 우측 상단 툴팁 버튼들 영역 (위치 조정) */}
        {/* DialogContent의 기본 패딩이 p-6이므로 top-4 right-4로 위치를 조정합니다. */}
        <div className="absolute top-4 right-4 z-10 flex flex-col gap-3">
          <ActionTooltip
            icon={
              <Heart
                size={20}
                className={isLiked ? "fill-red-500 text-red-500" : ""}
              />
            }
            label="좋아요"
            onClick={handleLikeToggle}
          />
          <ActionTooltip icon={<Heart size={20} />} label="프로필" />
          <ActionTooltip icon={<Heart size={20} />} label="제안하기" />
          <ActionTooltip icon={<Heart size={20} />} label="다운로드" />
        </div>

        {/* 🚨 내부 컨텐츠에 패딩 적용 (p-6) */}
        <div className="p-6">
          <DialogHeader>
            <DialogTitle>Image Title</DialogTitle>
            <DialogDescription>
              {props.description || "등록된 설명이 없습니다."}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3">
            {/* 메인 이미지 */}
            <img
              src={props.urls.full}
              alt={props.alt_description || "@IMAGE"}
              className="w-full aspect-auto max-h-[60vh] object-contain rounded-md"
            />

            {/* 이미지 하단 정보: 프로필 및 좋아요 */}
            <div className="w-full flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img
                  src={props.user.profile_image.small}
                  alt="@PROFILE_IMAGE"
                  className="w-7 h-7 rounded-full"
                />
                <p className="text-sm">{props.user.username}</p>
              </div>
              <div className="flex items-center gap-3">
                <div
                  className="flex items-center gap-1 cursor-pointer"
                  onClick={handleLikeToggle}
                >
                  <Heart
                    size={16}
                    className={isLiked ? "text-red-500 fill-red-500" : "text-red-400"}
                    fill={isLiked ? "#ef4444" : "#f87171"}
                  />
                  <p className="text-sm">{addCommas(likeCount)}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* 상세 정보 (설명, 날짜, 크기) */}
            <div className="flex flex-col gap-2">
              {/* 설명 */}
              <div className="flex items-start gap-2">
                <AlignLeft
                  size={16}
                  className="min-w-4 mt-1.5 text-neutral-500"
                />
                <p className="text-neutral-500 line-clamp-3">
                  {props.alt_description || "등록된 설명이 없습니다."}
                </p>
              </div>

              {/* 날짜 */}
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-neutral-500" />
                <p className="text-neutral-500">
                  {dayjs(props.created_at).format("YYYY. MM. DD")}
                </p>
              </div>

              {/* 크기 */}
              <div className="flex items-center gap-2">
                <Grid2X2 size={16} className="text-neutral-500" />
                <p className="text-neutral-500">
                  {props.width} X {props.height} size
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
