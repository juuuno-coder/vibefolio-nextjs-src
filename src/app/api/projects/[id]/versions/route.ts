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

  // 2. Ownership Check & Current Data Fetch
  const { data: project } = await supabaseAdmin
    .from("Project")
    .select("user_id, content_text, description") // Fetch content for backup
    .eq("project_id", projectId)
    .single();

  if (!project || project.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden: You don't own this project" }, { status: 403 });
  }

  // [New] Backup Current State (Auto-Archiving)
  // Check if content exists to backup
  if (project.content_text) {
      try {
        await (supabaseAdmin as any).from("ProjectVersion").insert({
            project_id: Number(projectId),
            version_name: `Backup (${new Date().toLocaleString('ko-KR')})`,
            content_text: project.content_text,
            content_html: project.content_text, // Assuming same content
            changelog: "Automatic backup before new version update",
            created_at: new Date().toISOString()
        });
      } catch (backupError) {
          console.warn("Backup failed (non-critical):", backupError);
      }
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

  // [New] Send Notifications to Followers & Fans
  // We run this asynchronously without awaiting to not block the response
  (async () => {
    try {
       const targetUserIds = new Set<string>();
       
       // 1. Likers
       const { data: likers } = await supabaseAdmin.from('Like').select('user_id').eq('project_id', Number(projectId));
       likers?.forEach((l: any) => targetUserIds.add(l.user_id));

       // 2. Bookmarkers
       const { data: bookmarkers } = await supabaseAdmin.from('Wishlist').select('user_id').eq('project_id', Number(projectId));
       bookmarkers?.forEach((b: any) => targetUserIds.add(b.user_id));

       // 3. Followers (User followers)
       // Need to fetch project title if not available (we only fetched user_id before)
       // Re-fetch project title for message
       const { data: projectDetails } = await supabaseAdmin.from('Project').select('title, user_id').eq('project_id', Number(projectId)).single();

       if (projectDetails?.user_id) {
           const { data: followers } = await supabaseAdmin.from('Follow').select('follower_id').eq('following_id', projectDetails.user_id);
           followers?.forEach((f: any) => targetUserIds.add(f.follower_id));
       }

       // Remove self
       targetUserIds.delete(user.id);

       if (targetUserIds.size > 0) {
           const nickname = user.user_metadata?.nickname || user.user_metadata?.full_name || '크리에이터';
           const projectTitle = projectDetails?.title || '프로젝트';
           
           const notifications = Array.from(targetUserIds).map(recipientId => ({
               user_id: recipientId,
               type: 'version',
               title: '새로운 버전 업데이트 🚀',
               message: `'${projectTitle}'의 ${version_name} 버전이 배포되었습니다.`,
               link: `/project/${projectId}`,
               sender_id: user.id,
               is_read: false,
               created_at: new Date().toISOString()
           }));

           const { error: notiError } = await (supabaseAdmin as any).from('Notification').insert(notifications);
           if (notiError) console.error("Failed to send notifications:", notiError);
           else console.log(`Sent version notifications to ${targetUserIds.size} users.`);
       }
    } catch (e) {
        console.error("Notification logic error:", e);
    }
  })();

  return NextResponse.json({ success: true, version: data });
}
