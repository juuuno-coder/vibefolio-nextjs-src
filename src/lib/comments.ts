// src/lib/comments.ts
import { supabase } from "./supabase";

export interface Comment {
  id: string;
  project_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles: {
    username: string;
    avatar_url: string;
  };
}

/**
 * Get all comments for a project.
 */
export async function getProjectComments(projectId: string): Promise<Comment[]> {
  const { data, error } = await supabase
    .from("comments")
    .select(`
      id,
      project_id,
      user_id,
      content,
      created_at,
      profiles (
        username,
        avatar_url
      )
    `)
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching comments:", error);
    return [];
  }

  return data as Comment[];
}

/**
 * Add a comment to a project.
 */
export async function addComment(projectId: string, content: string): Promise<Comment | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("comments")
    .insert({
      project_id: projectId,
      user_id: user.id,
      content,
    })
    .select(`
      id,
      project_id,
      user_id,
      content,
      created_at,
      profiles (
        username,
        avatar_url
      )
    `)
    .single();

  if (error) {
    console.error("Error adding comment:", error);
    return null;
  }

  return data as Comment;
}

/**
 * Delete a comment.
 */
export async function deleteComment(commentId: string): Promise<void> {
  const { error } = await supabase
    .from("comments")
    .delete()
    .eq("id", commentId);

  if (error) {
    console.error("Error deleting comment:", error);
  }
}

/**
 * Get the comment count for a project.
 */
export async function getCommentCount(projectId: string): Promise<number> {
  const { count, error } = await supabase
    .from("comments")
    .select("*", { count: "exact", head: true })
    .eq("project_id", projectId);

  if (error) {
    console.error("Error getting comment count:", error);
    return 0;
  }

  return count || 0;
}
