import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

// GET: 투표 현황 조회
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const projectId = params.id;
  const authHeader = req.headers.get('authorization');
  let currentUserId: string | null = null;
  
  // Try to extract user from token if present (Optional for GET)
  if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabaseAdmin.auth.getUser(token);
      if (user) currentUserId = user.id;
  }

  try {
    // 1. Get Vote Counts
    const { data: countsData, error: countsError } = await supabaseAdmin
      .from('ProjectPoll')
      .select('vote_type')
      .eq('project_id', parseInt(projectId)); // Ensure Integer

    if (countsError) throw countsError;

    const counts = {
      launch: 0,
      more: 0,
      research: 0
    };

    countsData?.forEach((item: any) => {
        if (item.vote_type === 'launch') counts.launch++;
        else if (item.vote_type === 'more') counts.more++;
        else if (item.vote_type === 'research') counts.research++;
    });

    // 2. Get My Vote (if logged in)
    let myVote = null;
    
    if (currentUserId) {
        const { data: myData } = await supabaseAdmin
            .from('ProjectPoll')
            .select('vote_type')
            .eq('project_id', parseInt(projectId))
            .eq('user_id', currentUserId)
            .single();
        
        if (myData) {
            myVote = myData.vote_type;
        }
    }

    return NextResponse.json({ counts, myVote });

  } catch (error) {
    console.error("Poll Error:", error);
    return NextResponse.json({ error: "Failed to fetch poll" }, { status: 500 });
  }
}

// POST: 투표하기
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const projectId = params.id;
  
  // Auth Check
  const authHeader = req.headers.get('authorization');
  if (!authHeader) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }
  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { voteType } = await req.json(); // voteType: 'launch' | 'more' | 'research' | null (cancel)
    const userId = user.id;

    if (!voteType) {
        // Cancel Vote (Delete)
        const { error } = await supabaseAdmin
            .from('ProjectPoll')
            .delete()
            .eq('project_id', parseInt(projectId))
            .eq('user_id', userId);
        
        if (error) throw error;
        return NextResponse.json({ success: true, action: 'deleted' });
    } else {
        // Upsert Vote
        const { error } = await supabaseAdmin
            .from('ProjectPoll')
            .upsert({
                project_id: parseInt(projectId),
                user_id: userId,
                vote_type: voteType
            }, { onConflict: 'project_id, user_id' });

        if (error) throw error;
        return NextResponse.json({ success: true, action: 'upserted' });
    }

  } catch (error) {
    console.error("Vote Error:", error);
    return NextResponse.json({ error: "Failed to vote" }, { status: 500 });
  }
}
