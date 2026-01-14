import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

// 피드백 요청 (프로모션) API
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const projectId = params.id;
  
  // 1. Auth Check
  const authHeader = req.headers.get('authorization');
  if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Call RPC to deduct points and promote project
  // Cost default: 5 points
  const COST = 5;

  const { data, error } = await supabaseAdmin.rpc('request_project_feedback', {
      p_project_id: Number(projectId),
      p_user_id: user.id,
      p_cost: COST
  });

  if (error) {
      console.error("Promotion failed:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // RPC returns JSONB (success, message, remaining_points)
  const result = data as any;

  if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
  }

  return NextResponse.json({ 
      success: true, 
      message: "피드백 요청이 등록되었습니다!", 
      remaining_points: result.remaining_points 
  });
}
