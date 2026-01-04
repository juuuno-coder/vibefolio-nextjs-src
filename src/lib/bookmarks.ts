// src/lib/bookmarks.ts
import { supabase } from "./supabase";

/**
 * Get the current user.
 */
async function getUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/**
 * Get the list of projects a user has bookmarked.
 */
export async function getUserBookmarks(userId: string) {
  const { data, error } = await supabase
    .from("Bookmark")
    .select("project_id")
    .eq("user_id", userId);
  if (error) {
    console.error("Error fetching user bookmarks:", error);
    return [];
  }
  return data.map((bookmark) => bookmark.project_id);
}

/**
 * Check if a user has bookmarked a specific project.
 */
export async function isProjectBookmarked(projectId: string): Promise<boolean> {
  const user = await getUser();
  if (!user) return false;

  const { data, error } = await supabase
    .from("Bookmark")
    .select("project_id")
    .eq("user_id", user.id)
    .eq("project_id", projectId)
    .single();

  if (error && error.code !== "PGRST116") { // PGRST116 = no rows found
    console.error("Error checking if project is bookmarked:", error);
  }

  return !!data;
}

/**
 * Add a bookmark to a project.
 */
export async function addBookmark(projectId: string): Promise<void> {
  const user = await getUser();
  if (!user) return;

  const { error } = await supabase
    .from("Bookmark")
    .insert({ user_id: user.id, project_id: projectId });

  if (error) {
    console.error("Error adding bookmark:", error);
  }
}

/**
 * Remove a bookmark from a project.
 */
export async function removeBookmark(projectId: string): Promise<void> {
  const user = await getUser();
  if (!user) return;

  const { error } = await supabase
    .from("Bookmark")
    .delete()
    .eq("user_id", user.id)
    .eq("project_id", projectId);

  if (error) {
    console.error("Error removing bookmark:", error);
  }
}

/**
 * Toggle a bookmark on a project.
 */
export async function toggleBookmark(projectId: string): Promise<boolean> {
  const bookmarked = await isProjectBookmarked(projectId);
  if (bookmarked) {
    await removeBookmark(projectId);
    return false;
  } else {
    await addBookmark(projectId);
    return true;
  }
}
