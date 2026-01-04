// src/lib/views.ts
import { supabase } from "./supabase";

/**
 * Get the current user.
 */
async function getUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/**
 * Add a view to a project.
 * Increments the views column in the Project table.
 * Includes simple client-side deduplication using localStorage to prevent spamming.
 */
export async function addView(projectId: string): Promise<void> {
  // 1. Client-side deduplication using localStorage
  if (typeof window !== "undefined") {
    const viewedKey = `viewed_project_${projectId}`;
    const lastViewed = localStorage.getItem(viewedKey);
    const now = Date.now();

    // If viewed within last 1 hour, ignore
    if (lastViewed && now - parseInt(lastViewed) < 1000 * 60 * 60) {
      return;
    }

    localStorage.setItem(viewedKey, now.toString());
  }

  // 2. Server-side update (RPC preferred)
  const { error: rpcError } = await supabase.rpc('increment_project_views', { p_id: projectId });

  if (rpcError) {
    // Fallback: Fetch current views and update (less safe but works without RPC)
    const { data: project, error: fetchError } = await supabase
      .from("Project")
      .select("views")
      .eq("project_id", projectId)
      .single();

    if (fetchError || !project) {
      console.error("Error fetching project views:", fetchError);
      return;
    }

    const { error: updateError } = await supabase
      .from("Project")
      .update({ views: (project.views || 0) + 1 })
      .eq("project_id", projectId);

    if (updateError) {
      console.error("Error updating views:", updateError);
    }
  }
}

/**
 * Get the view count for a project.
 */
export async function getProjectViewCount(projectId: string): Promise<number> {
  const { data, error } = await supabase
    .from("Project")
    .select("views")
    .eq("project_id", projectId)
    .single();

  if (error) {
    console.error("Error getting project view count:", error);
    return 0;
  }

  return data?.views || 0;
}
