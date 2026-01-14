// src/lib/comments.ts
import { supabase } from "./supabase/client";
import { Database } from "./supabase/types";

type CommentRow = Database["public"]["Tables"]["comment"]["Row"];
type CommentInsert = Database["public"]["Tables"]["comment"]["Insert"];

export interface Comment {
  id: string;
  project_id: number;
  user_id: string;
  content: string;
  createdAt: string; // Fix: Rename to createdAt
  username: string;
  userAvatar: string;
  isSecret?: boolean;
}

/**
 * Get all comments for a project.
 */
export async function getProjectComments(projectId: string | number): Promise<Comment[]> {
  const { data, error } = await supabase
    .from("comment")
    .select("id, project_id, user_id, content, created_at, username, user_avatar_url, is_secret")
    .eq("project_id", Number(projectId))
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching comments:", error);
    return [];
  }

  /* Safe Casting: Supabase returns partial or full Row objects */
  const comments = data as any;
  return (comments || []).map((c: any) => ({
    id: c.id,
    project_id: c.project_id,
    user_id: c.user_id,
    content: c.content,
    createdAt: c.created_at,
    username: c.username,
    userAvatar: c.user_avatar_url,
    isSecret: c.is_secret,
  }));
}

/**
 * Add a comment to a project.
 */
export async function addComment(
  projectId: string | number,
  userId: string,
  content: string,
  username: string,
  avatarUrl: string,
  isSecret: boolean = false
): Promise<Comment | null> {
  const { data, error } = await supabase
    .from("comment")
    .insert({
      project_id: Number(projectId),
      user_id: userId,
      content,
      username,
      user_avatar_url: avatarUrl,
      is_secret: isSecret,
    } as unknown as CommentInsert)
    .select("id, project_id, user_id, content, created_at, username, user_avatar_url, is_secret")
    .single();

  if (error) {
    console.error("Error adding comment:", error);
    return null;
  }

  if (!data) return null;

  const d = data as any;

  return {
    id: d.id,
    project_id: d.project_id,
    user_id: d.user_id,
    content: d.content,
    createdAt: d.created_at,
    username: d.username,
    userAvatar: d.user_avatar_url,
    isSecret: d.is_secret,
  };
}

/**
 * Delete a comment.
 */
export async function deleteComment(commentId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from("comment")
    .delete()
    .eq("id", commentId)
    .eq("user_id", userId);

  if (error) {
    console.error("Error deleting comment:", error);
    throw error;
  }
}

/**
 * Get the comment count for a project.
 */
export async function getCommentCount(projectId: string | number): Promise<number> {
  const { count, error } = await supabase
    .from("comment")
    .select("*", { count: "exact", head: true })
    .eq("project_id", Number(projectId));

  if (error) {
    console.error("Error getting comment count:", error);
    return 0;
  }

  return count || 0;
}
