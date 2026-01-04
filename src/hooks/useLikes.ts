// src/hooks/useLikes.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { isProjectLiked, getProjectLikeCount, toggleLike } from "@/lib/likes";

interface UseLikesReturn {
  isLiked: boolean;
  likeCount: number;
  toggle: () => void;
  isLoading: boolean;
}

export function useLikes(projectId: string | null | undefined, initialLikes: number = 0): UseLikesReturn {
  const queryClient = useQueryClient();
  const isValidId = Boolean(projectId);
  const queryKey = ["likes", projectId];

  // Fetch like status and count
  const { data } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!projectId) return { liked: false, count: initialLikes };
      const [liked, count] = await Promise.all([
        isProjectLiked(projectId),
        getProjectLikeCount(projectId),
      ]);
      return { liked, count };
    },
    initialData: { liked: false, count: initialLikes },
    staleTime: 1000 * 60, // 1 minute
    enabled: isValidId, // Only run query if ID is valid
  });

  // Mutation for toggling like
  const { mutate } = useMutation({
    mutationFn: async () => {
        if (!projectId) return;
        return toggleLike(projectId);
    },
    onMutate: async () => {
      if (!projectId) return;

      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey });

      // Snapshot previous value
      const previousData = queryClient.getQueryData<{ liked: boolean; count: number }>(queryKey);

      // Optimistically update
      if (previousData) {
        queryClient.setQueryData(queryKey, {
          liked: !previousData.liked,
          count: previousData.liked ? previousData.count - 1 : previousData.count + 1,
        });
      }

      return { previousData };
    },
    onError: (err, newTodo, context) => {
      if (!projectId) return;
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
    },
    onSettled: () => {
      if (!projectId) return;
      // Refetch after error or success
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    isLiked: data?.liked ?? false,
    likeCount: data?.count ?? initialLikes,
    toggle: () => mutate(),
    isLoading: false,
  };
}
