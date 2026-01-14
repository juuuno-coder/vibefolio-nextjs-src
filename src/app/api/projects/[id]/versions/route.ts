import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const projectId = params.id;
  
  // 1. Auth Check (Token based)
  const authHeader = req.headers.get('authorization');
  if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Ownership Check
  const { data: project } = await supabaseAdmin
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
  // Note: Using 'any' cast because the types might not be perfectly generated for the new table yet
  const { data, error } = await (supabaseAdmin as any)
    .from("ProjectVersion")
    .insert({
      project_id: Number(projectId),
      version_name,
      content_html,
      content_text,
      changelog,
      images: images || [],
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    console.error("Version insert error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // [New] Update Project content to reflect latest version
  // This ensures the main view shows the new content
  const updatePayload: any = {
      content_text: content_text, // Update main content
      updated_at: new Date().toISOString()
  };

  const { error: projectUpdateError } = await supabaseAdmin
      .from("Project")
      .update(updatePayload)
      .eq("project_id", Number(projectId));

  if (projectUpdateError) {
      console.warn("Failed to update project main content:", projectUpdateError);
  }

  return NextResponse.json({ success: true, version: data });
}
