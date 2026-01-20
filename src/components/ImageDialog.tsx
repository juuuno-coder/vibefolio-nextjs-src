// src/components/ImageDialog.tsx

"use client";

import React from "react";
import { Calendar, Grid2X2, Heart, AlignLeft, User, Send, Download, MessageSquare, FolderPlus } from "lucide-react";
import dayjs from "dayjs";
import { addCommas } from "@/lib/format/comma";

import { ImageCard } from "@/components/ImageCard";
import { useLikes } from "@/hooks/useLikes";
import { useAuth } from "@/lib/auth/AuthContext";
import { recordView } from "@/lib/views";
import { toast } from "sonner";
import { CommentModal } from "./CommentModal";
import { CollectionModal } from "./CollectionModal";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProjectComments, addComment, Comment } from "@/lib/comments";

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

// ImageDialog Props TypeScript 인터페이스 정의
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
    expertise?: { fields: string[] } | null;
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

export function ImageDialog({ props }: { props: ImageDialogProps }) {
  const { user: currentUser, userProfile } = useAuth();
  const { isLiked, toggleLike } = useLikes(props.id, props.likes || 0);
  
  // Optimistic like count
  const displayLikes = (props.likes || 0) + (isLiked ? 1 : 0) - (props.likes && isLiked ? 0 : 0);
  const [isCommentModalOpen, setIsCommentModalOpen] = React.useState(false);
  const [isCollectionModalOpen, setIsCollectionModalOpen] = React.useState(false);

  const queryClient = useQueryClient();

  // Comments Query
  const { data: comments = [] } = useQuery({
    queryKey: ['comments', props.id],
    queryFn: () => getProjectComments(props.id),
  });

  // Add Comment Mutation
  const { mutate: postComment } = useMutation({
    mutationFn: (text: string) => {
        if (!currentUser || !userProfile) throw new Error("User info missing");
        return addComment(
            props.id,
            currentUser.id,
            text,
            userProfile.username,
            userProfile.profile_image_url
        );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', props.id] });
      toast.success("댓글이 등록되었습니다.");
    },
    onError: () => {
      toast.error("댓글 등록에 실패했습니다.");
    }
  });

  const handleLikeToggle = () => {
    if (!currentUser) {
      if (confirm("로그인이 필요한 기능입니다. 로그인하시겠습니까?")) {
        window.location.href = "/login";
      }
      return;
    }
    toggleLike();
  };

  const handleAddComment = (text: string) => {
      if (!currentUser) {
          toast.error("로그인이 필요합니다.");
          return;
      }
      postComment(text);
  };

  // View Count Increment
  React.useEffect(() => {
    // Only increment view if modal is open (component mounted)
    if (currentUser) {
       // Optional: Add strict check to avoid dev mode double count
       recordView(props.id);
    }
  }, [props.id, currentUser]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        {/* Pass ID to ImageCard so it can use its own hook if needed,
            though ImageDialog also handles likes in the modal.
            The optimistic update in hook uses queryKey, so they should sync. */}
        <div className="w-full">
           <ImageCard props={props} />
        </div>
      </DialogTrigger>

      <DialogContent
        className="
          p-0
          sm:max-w-[700px] lg:max-w-[1000px] max-h-[90vh]
          overflow-y-auto
          bg-black text-white
        "
      >
        <div className="absolute top-4 right-4 z-10 flex flex-col gap-3">
          <ActionTooltip
            icon={
              <Heart
                size={20}
                className={isLiked ? "fill-red-500 text-red-500" : ""}
              />
            }
            label={displayLikes > 0 ? addCommas(displayLikes) : "좋아요"}
            onClick={handleLikeToggle}
          />
          <ActionTooltip
            icon={<MessageSquare size={20} />}
            label="댓글"
            onClick={() => setIsCommentModalOpen(true)}
          />
           <ActionTooltip
            icon={<FolderPlus size={20} />}
            label="컬렉션"
            onClick={() => {
                if (!currentUser) {
                    toast.error("로그인이 필요합니다.");
                    return;
                }
                setIsCollectionModalOpen(true);
            }}
          />
          <ActionTooltip icon={<User size={20} />} label="프로필" />
          <ActionTooltip icon={<Send size={20} />} label="제안하기" />
          <ActionTooltip icon={<Download size={20} />} label="다운로드" />
        </div>

        <div className="p-6">
          <DialogHeader>
            <DialogTitle>Image Title</DialogTitle>
            <DialogDescription>
              {props.description || "등록된 설명이 없습니다."}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3">
            <img
              src={props.urls.full}
              alt={props.alt_description || "@IMAGE"}
              className="w-full aspect-auto max-h-[60vh] object-contain rounded-md"
            />

            <div className="w-full flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img
                  src={props.user.profile_image.small}
                  alt="@PROFILE_IMAGE"
                  className="w-7 h-7 rounded-full"
                />
                <p className="text-sm flex items-center gap-1.5">
                   {props.user.username}
                   {props.user.expertise?.fields && props.user.expertise.fields.length > 0 && (
                     <span 
                       className="inline-flex items-center justify-center px-1.5 py-0.5 bg-blue-500 text-white text-[9px] font-bold rounded-full uppercase tracking-tighter"
                       title={`분야: ${props.user.expertise.fields.join(', ')}`}
                     >
                        Expert
                     </span>
                   )}
                </p>
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
                  <p className="text-sm">{addCommas(displayLikes)}</p>
                </div>
              </div>
            </div>

            <Separator />

            <div className="flex flex-col gap-2">
              <div className="flex items-start gap-2">
                <AlignLeft
                  size={16}
                  className="min-w-4 mt-1.5 text-neutral-500"
                />
                <p className="text-neutral-500 line-clamp-3">
                  {props.alt_description || "등록된 설명이 없습니다."}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-neutral-500" />
                <p className="text-neutral-500">
                  {dayjs(props.created_at).format("YYYY. MM. DD")}
                </p>
              </div>

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

      {/* 댓글 모달 */}
      <CommentModal
        open={isCommentModalOpen}
        onOpenChange={setIsCommentModalOpen}
        comments={comments.map((c: any) => ({
            id: c.id,
            user: c.username || 'Unknown',
            text: c.content,
            created_at: c.createdAt
        }))}
        onAddComment={handleAddComment}
        isLoggedIn={!!currentUser}
        userProfile={userProfile ? { username: userProfile.username, profile_image: userProfile.profile_image_url } : undefined}
      />

      {/* 컬렉션 모달 */}
      <CollectionModal
        open={isCollectionModalOpen}
        onOpenChange={setIsCollectionModalOpen}
        projectId={props.id}
      />
    </Dialog>
  );
}
