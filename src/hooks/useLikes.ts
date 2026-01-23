import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { createNotification } from "@/hooks/useNotifications";
import { useAuth } from "@/lib/auth/AuthContext";

/**
 * 프로젝트 좋아요 관련 기능을 제공하는 커스텀 훅
 * @param projectId 프로젝트 ID (없을 경우 훅이 비활성화됨)
 * @param initialLikes 초기 좋아요 수 (Optimistic UI용 - 사용하지 않음, 호환성 유지)
 */
export function useLikes(projectId?: string, initialLikes: number = 0) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id || null;

  // 0. 좋아요 수 상태 관리
  const [likesCount, setLikesCount] = useState(initialLikes);

  // 실시간 좋아요 수 동기화 (구독)
  useEffect(() => {
    if (!projectId) return;
    const numericId = Number(projectId);
    if (isNaN(numericId)) return;

    // 초기 로딩 (정확한 수치)
    const fetchCount = async () => {
        const { count } = await supabase
            .from("Like")
            .select("*", { count: "exact", head: true })
            .eq("project_id", numericId);
        if (count !== null) setLikesCount(count);
    };
    fetchCount();

    const channel = supabase
      .channel(`project-likes-${numericId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "Like",
          filter: `project_id=eq.${numericId}`,
        },
        (payload) => {
           // Insert/Delete 발생 시 카운트 다시 가져오기 (가장 정확)
           if (payload.eventType === 'INSERT' || payload.eventType === 'DELETE') {
               fetchCount();
           }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);

  // 1. 좋아요 여부 조회 (로그인 시에만)
  const { data: isLiked = false } = useQuery({
    queryKey: ["like", projectId, userId],
    queryFn: async () => {
      if (!projectId || !userId) return false;
      
      const numericId = Number(projectId);
      if (isNaN(numericId)) return false;

      const { data, error } = await supabase
        .from("Like")
        .select("created_at")
        .eq("project_id", numericId)
        .eq("user_id", userId)
        .maybeSingle();
      
      if (error) return false;
      return !!data;
    },
    enabled: !!projectId && !!userId,
    staleTime: 1000 * 60 * 5,
  });

  // 2. 좋아요 토글 Mutation
  const toggleLikeMutation = useMutation({
    mutationFn: async ({ currentIsLiked }: { currentIsLiked: boolean }) => {
      if (!projectId || !userId) throw new Error("로그인이 필요하거나 잘못된 프로젝트입니다.");
      
      const numericId = Number(projectId);
      if (isNaN(numericId)) throw new Error("Invalid Project ID");

      if (currentIsLiked) {
        const { error } = await supabase
          .from("Like")
          .delete()
          .match({ project_id: numericId, user_id: userId });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("Like")
          .insert({ project_id: numericId, user_id: userId });
        if (error) throw error;

        // 알림 생성 로직 (생략 - 위와 동일)
        try {
           const { data: project } = await supabase
            .from("Project")
            .select("user_id, title")
            .eq("project_id", numericId)
            .single();
           if (project && project.user_id !== userId) {
             await createNotification({
               userId: project.user_id, 
               type: "like", 
               title: "새로운 좋아요!", 
               message: `내 프로젝트에 좋아요가 달렸습니다.`, 
               link: `/project/${projectId}`, 
               senderId: userId 
             });
           }
        } catch (e) { console.error(e); }
      }
    },
    onMutate: async ({ currentIsLiked }) => {
      const queryKey = ["like", projectId, userId];
      await queryClient.cancelQueries({ queryKey });
      const previousLiked = queryClient.getQueryData<boolean>(queryKey);

      // UI 즉시 업데이트
      queryClient.setQueryData(queryKey, !currentIsLiked);
      
      // 카운트도 즉시 반영 (Optimistic)
      setLikesCount((prev: number) => currentIsLiked ? Math.max(0, prev - 1) : prev + 1);

      return { previousLiked };
    },
    onError: (err, newTodo, context) => {
      if (context?.previousLiked !== undefined) {
         queryClient.setQueryData(["like", projectId, userId], context.previousLiked);
         // 카운트 롤백
         setLikesCount((prev: number) => context.previousLiked ? prev + 1 : Math.max(0, prev - 1));
      }
      console.error("Like toggle error:", err);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["like", projectId, userId] });
    },
  });

  const toggleLike = () => {
    if (!userId) return; // 로그인 팝업 등 처리는 호출부 위임 또는 여기서 추가
    toggleLikeMutation.mutate({ currentIsLiked: isLiked });
  };

  return {
    isLiked,
    likesCount, // 추가됨
    toggleLike,
    isLoading: toggleLikeMutation.isPending,
  };
}
