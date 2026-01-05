// src/lib/likes.ts
import { supabase } from "./supabase/client";

/**
 * Get the current user.
 */
async function getUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/**
 * Get the list of projects a user has liked.
 */
export async function getUserLikes(userId: string) {
  const { data, error } = await supabase
    .from("Like")
    .select("project_id")
    .eq("user_id", userId);
  if (error) {
    console.error("Error fetching user likes:", error);
    return [];
  }
  return data.map((like) => like.project_id);
}

/**
 * Check if a user has liked a specific project.
 */
export async function isProjectLiked(projectId: string): Promise<boolean> {
  const user = await getUser();
  if (!user) return false;

  const { data, error } = await supabase
    .from("Like")
    .select("project_id")
    .eq("user_id", user.id)
    .eq("project_id", projectId)
    .single();

  if (error && error.code !== "PGRST116") { // PGRST116 = no rows found
    console.error("Error checking if project is liked:", error);
  }

  return !!data;
}

/**
 * Add a like to a project.
 */
export async function addLike(projectId: string): Promise<void> {
  const user = await getUser();
  if (!user) return;

  const { error } = await supabase
    .from("Like")
    .insert({ user_id: user.id, project_id: projectId });

  if (error) {
    console.error("Error adding like:", error);
  }
}

/**
 * Remove a like from a project.
 */
export async function removeLike(projectId: string): Promise<void> {
  const user = await getUser();
  if (!user) return;

  const { error } = await supabase
    .from("Like")
    .delete()
    .eq("user_id", user.id)
    .eq("project_id", projectId);

  if (error) {
    console.error("Error removing like:", error);
  }
}

/**
 * Toggle a like on a project.
 */
export async function toggleLike(projectId: string): Promise<boolean> {
  const liked = await isProjectLiked(projectId);
  if (liked) {
    await removeLike(projectId);
    return false;
  } else {
    await addLike(projectId);
    return true;
  }
}

/**
 * Get the like count for a project.
 */
export async function getProjectLikeCount(projectId: string): Promise<number> {
  const { count, error } = await supabase
    .from("Like")
    .select("*", { count: "exact", head: true })
    .eq("project_id", projectId);

  if (error) {
    console.error("Error getting project like count:", error);
    return 0;
  }

  return count || 0;
}
