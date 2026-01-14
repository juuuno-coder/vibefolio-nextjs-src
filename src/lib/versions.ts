import { supabase } from "./supabase/client";
import dayjs from "dayjs";

export interface ProjectVersion {
  id: number;
  project_id: number;
  version_name: string;
  changelog: string | null;
  content_html?: string | null;
  content_text?: string | null;
  images?: string[] | null;
  created_at: string;
}

export async function getProjectVersions(projectId: string | number): Promise<ProjectVersion[]> {
  const { data, error } = await supabase
    .from("ProjectVersion" as any)
    .select("*")
    .eq("project_id", Number(projectId))
    .order("created_at", { ascending: false }); // 최신순 정렬

  if (error) {
    console.error("Error fetching project versions:", error);
    return [];
  }

  return (data || []) as unknown as ProjectVersion[];
}
