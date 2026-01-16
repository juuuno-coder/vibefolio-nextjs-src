import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const projectId = params.id;
  const authHeader = req.headers.get('Authorization');
  let userId = null;

  if (authHeader) {
     const token = authHeader.replace('Bearer ', '');
     const { data: { user } } = await supabaseAdmin.auth.getUser(token);
     if (user) userId = user.id;
  }

  try {
    // 1. Fetch All Ratings for Calculation (Admin access)
    const { data: allRatings, error } = await supabaseAdmin
      .from('ProjectRating')
      .select('*')
      .eq('project_id', projectId);

    if (error) throw error;

    // Calculate Average
    let averages = { score_1: 0, score_2: 0, score_3: 0, score_4: 0 };
    let totalAvg = 0;
    const count = allRatings.length;

    if (count > 0) {
      const sums = allRatings.reduce((acc: any, curr: any) => ({
        score_1: acc.score_1 + (Number(curr.score_1) || 0),
        score_2: acc.score_2 + (Number(curr.score_2) || 0),
        score_3: acc.score_3 + (Number(curr.score_3) || 0),
        score_4: acc.score_4 + (Number(curr.score_4) || 0),
      }), { score_1: 0, score_2: 0, score_3: 0, score_4: 0 });

      averages = {
        score_1: Number((sums.score_1 / count).toFixed(1)),
        score_2: Number((sums.score_2 / count).toFixed(1)),
        score_3: Number((sums.score_3 / count).toFixed(1)),
        score_4: Number((sums.score_4 / count).toFixed(1)),
      };
      
      const sumAvgs = Object.values(averages).reduce((a, b) => a + b, 0);
      totalAvg = Number((sumAvgs / 4).toFixed(1));
    }

    // 2. Fetch My Rating
    let myRating = null;
    if (userId) {
      myRating = allRatings.find((r: any) => r.user_id === userId) || null;
    }

    // 3. Check Visibility for Detailed Ratings (Owner or Collaborator)
    let isAuthorized = false;
    if (userId) {
        // Check Owner
        const { data: project } = await supabaseAdmin
            .from('Project')
            .select('user_id')
            .eq('project_id', projectId)
            .single();
            
        if (project && project.user_id === userId) isAuthorized = true;
        
        // Check Collaborator
        if (!isAuthorized) {
            const { data: collaborator } = await supabaseAdmin
                .from('project_collaborators')
                .select('id')
                .eq('project_id', projectId)
                .eq('user_id', userId)
                .single();
            if (collaborator) isAuthorized = true;
        }
    }

    return NextResponse.json({
      success: true,
      averages,
      totalAvg,
      totalCount: count,
      myRating,
      isAuthorized, // Frontend can use this to show specific UI
      // details: isAuthorized ? allRatings : [] // Uncomment if we list all ratings
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const projectId = params.id;
  
  try {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
      
      if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      
      const body = await req.json();
      const { score_1, score_2, score_3, score_4, score } = body;

      // 1. Upsert Rating
      const { error: ratingError } = await supabaseAdmin
        .from('ProjectRating')
        .upsert({
          project_id: projectId,
          user_id: user.id,
          score_1, score_2, score_3, score_4, score,
          updated_at: new Date().toISOString()
        }, { onConflict: 'project_id, user_id' });

      if (ratingError) throw ratingError;

      // 2. Check if first time rating? 
      // User asked for comment when feed back is left.
      // Ideally check if comment already exists for this rating action to avoid duplicates on update?
      // Logic: "피드백이 달렸을때 댓글에...".
      // Let's Insert comment.
      
      // Get User Nickname for masking
      const nickname = user.user_metadata?.nickname || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
      const maskedName = nickname.length > 2 
        ? nickname.substring(0, 2) + '*'.repeat(3) + '(가림처리)' 
        : nickname.substring(0, 1) + '*'.repeat(3) + '(가림처리)';
        
      const commentContent = `${maskedName}님이 정성스러운 피드백을 남겼어요`;
      
      // Check if system comment already exists from this user for this project?
      // To prevent spam on updates.
      const { data: existingComments } = await supabaseAdmin
        .from('Comment')
        .select('id')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .eq('content', commentContent);
        
      if (!existingComments || existingComments.length === 0) {
          // Insert Comment
          await supabaseAdmin
            .from('Comment')
            .insert({
                project_id: projectId,
                user_id: user.id,
                content: commentContent,
                is_secret: false // Public comment
            });
            
          // Notification logic should be here or handled by DB trigger on Comment
      }

      return NextResponse.json({ success: true });

  } catch (error: any) {
     return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
