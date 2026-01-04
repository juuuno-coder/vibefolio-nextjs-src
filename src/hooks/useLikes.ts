import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { useState, useEffect } from "react";

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

  // 2. 좋아요 수 실시간 조회 (선택 사항: 실시간성을 위해 query 사용 가능하지만, 일단 props나 Optimistic update로 처리)
  // 여기서는 별도 fetch 없이 initialLikes와 mutation 결과를 조합해 관리하거나, 
  // 리스트 조회 시 가져온 값을 믿습니다.

  // 3. 좋아요 토글 Mutation
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
      // 프로젝트 리스트나 상세 정보도 갱신하면 좋음
      // queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  const toggleLike = () => {
    if (!userId) {
      if (confirm("로그인이 필요한 기능입니다. 로그인하시겠습니까?")) {
        window.location.href = "/login";
      }
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
