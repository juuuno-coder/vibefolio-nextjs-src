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
      .eq('project_id', parseInt(projectId));

    if (countsError) throw countsError;

    const counts: Record<string, number> = {};
    countsData?.forEach((item: any) => {
        counts[item.vote_type] = (counts[item.vote_type] || 0) + 1;
    });

    // 2. Get Project Data (for custom poll configuration)
    const { data: project } = await supabaseAdmin
      .from('Project')
      .select('custom_data')
      .eq('project_id', parseInt(projectId))
      .single();

    // 3. Get My Vote (if logged in)
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

    return NextResponse.json({ counts, myVote, project });

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

        // [Point System] Reward for Voting (50 Points)
        try {
            const { count } = await supabaseAdmin
              .from('point_logs')
              .select('*', { count: 'exact', head: true })
              .eq('user_id', userId)
              .eq('reason', `스티커 투표 보상 (Project ${projectId})`);
            
            if ((count || 0) === 0) {
                const REWARD = 50;
                const { data: profile } = await supabaseAdmin.from('profiles').select('points').eq('id', userId).single();
                await supabaseAdmin.from('profiles').update({ points: (profile?.points || 0) + REWARD }).eq('id', userId);
                await supabaseAdmin.from('point_logs').insert({
                    user_id: userId,
                    amount: REWARD,
                    reason: `스티커 투표 보상 (Project ${projectId})`
                });
            }
        } catch (e) {
            console.error('[Point System] Failed to reward vote points:', e);
        }

        return NextResponse.json({ success: true, action: 'upserted' });
    }

  } catch (error) {
    console.error("Vote Error:", error);
    return NextResponse.json({ error: "Failed to vote" }, { status: 500 });
  }
}
