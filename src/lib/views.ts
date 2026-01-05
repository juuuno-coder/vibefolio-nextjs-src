// src/lib/views.ts
import { supabase } from "./supabase/client";
import { Database } from "./supabase/types";

type ViewRow = Database["public"]["Tables"]["view"]["Row"];
type ViewInsert = Database["public"]["Tables"]["view"]["Insert"];

/**
 * Get the current user.
 */
async function getUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/**
 * Records a view for a project.
 * Does not count multiple views from the same user within a short time frame.
 */
export async function recordView(projectId: string | number): Promise<void> {
  const user = await getUser();
  if (!user) return;

  // Check if the user has already viewed this project
  const { data, error: selectError } = await supabase
    .from("view")
    .select("user_id")
    .eq("user_id", user.id)
    .eq("project_id", Number(projectId))
    .single();

  if (selectError && selectError.code !== "PGRST116") { // PGRST116 = no rows found
    console.error("Error checking for existing view:", selectError);
    return;
  }

  // If the user has not viewed the project, add a new view
  if (!data) {
    const { error: insertError } = await supabase
      .from("view")
      .insert({ user_id: user.id, project_id: Number(projectId) } as ViewInsert);

    if (insertError) {
      console.error("Error adding view:", insertError);
    }
  }
}

/**
 * Get the view count for a project.
 */
export async function getProjectViewCount(projectId: string | number): Promise<number> {
  const { count, error } = await supabase
    .from("view")
    .select("*", { count: "exact", head: true })
    .eq("project_id", Number(projectId));

  if (error) {
    console.error("Error getting project view count:", error);
    return 0;
  }

  return count || 0;
}
