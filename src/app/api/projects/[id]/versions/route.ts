import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const projectId = params.id;
  
  // 1. Auth Check
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Ownership Check
  const { data: project } = await supabase
    .from("Project")
    .select("user_id")
    .eq("project_id", projectId)
    .single();

  if (!project || project.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden: You don't own this project" }, { status: 403 });
  }

  // 3. Parse Body
  const body = await req.json();
  const { version_name, content_html, content_text, images, changelog } = body;

  if (!version_name) {
      return NextResponse.json({ error: "Version name is required" }, { status: 400 });
  }

  // 4. Insert Version
  const { data, error } = await supabase
    .from("ProjectVersion")
    .insert({
      project_id: Number(projectId),
      version_name,
      content_html,
      content_text,
      changelog, // Summary or Short description
      images: images || [],
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    console.error("Version insert error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, version: data });
}
