import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { useState, useEffect } from "react";
import { createNotification } from "@/hooks/useNotifications";

/**
 * 프로젝트 좋아요 관련 기능을 제공하는 커스텀 훅
 * @param projectId 프로젝트 ID (없을 경우 훅이 비활성화됨)
 * @param initialLikes 초기 좋아요 수 (Optimistic UI용)
 */
export function useLikes(projectId?: string, initialLikes: number = 0) {
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);

  // 현재 로그인한 사용자 확인
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    })();
  }, []);

  // 1. 좋아요 여부 조회 (로그인 시에만)
  const { data: isLiked = false } = useQuery({
    queryKey: ["like", projectId, userId],
    queryFn: async () => {
      if (!projectId || !userId) return false;
      const { data } = await supabase
        .from("Like" as any)
        .select("created_at")
        .eq("project_id", projectId)
        .eq("user_id", userId)
        .maybeSingle();
      return !!data;
    },
    enabled: !!projectId && !!userId, // projectId와 userId가 있을 때만 실행
  });

  // 2. 좋아요 토글 Mutation
  const toggleLikeMutation = useMutation({
    mutationFn: async ({ currentIsLiked }: { currentIsLiked: boolean }) => {
      if (!projectId || !userId) throw new Error("로그인이 필요하거나 잘못된 프로젝트입니다.");

      if (currentIsLiked) {
        const { error } = await supabase
          .from("Like" as any)
          .delete()
          .match({ project_id: projectId, user_id: userId } as any);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("Like" as any)
          .insert({ project_id: projectId, user_id: userId } as any);
        if (error) throw error;

        // 알림 생성 (자신의 게시물이 아닐 때만)
        try {
          // 1. 프로젝트 정보 및 소유자 조회
          const { data: project } = await supabase
            .from("Project" as any)
            .select("user_id, title")
            .eq("project_id", Number(projectId))
            .single() as any;

          if (project && project.user_id !== userId) {
            // 2. 알림 저장
            await createNotification({
              userId: project.user_id,
              type: "like",
              title: "새로운 좋아요!",
              message: `내 프로젝트 '${project.title}'에 새로운 좋아요가 달렸습니다.`,
              link: `/project/${projectId}`,
              senderId: userId,
            });
          }
        } catch (err) {
          console.error("알림 생성 무시됨 (비치명적):", err);
        }
      }
    },
    onMutate: async ({ currentIsLiked }) => {
      // Optimistic Update
      const queryKey = ["like", projectId, userId];
      await queryClient.cancelQueries({ queryKey });
      const previousLiked = queryClient.getQueryData<boolean>(queryKey);

      // UI 즉시 업데이트 (좋아요 상태 반전)
      queryClient.setQueryData(queryKey, !currentIsLiked);

      return { previousLiked };
    },
    onError: (err, newTodo, context) => {
      // 에러 시 롤백
      queryClient.setQueryData(["like", projectId, userId], context?.previousLiked);
      alert("좋아요 처리에 실패했습니다.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["like", projectId, userId] });
    },
  });

  const toggleLike = () => {
    // Note: ImageCard에서 이미 로그인 체크를 하지만, 훅 자체의 안전성을 위해 남겨둠
    if (!userId) {
       // 호출부에서 처리하므로 여기서는 return만 해도 됨
       return;
    }
    toggleLikeMutation.mutate({ currentIsLiked: isLiked });
  };

  return {
    isLiked,
    toggleLike,
    isLoading: toggleLikeMutation.isPending,
  };
}
