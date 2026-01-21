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
    // 1. Fetch Project for categories
    const { data: project } = await supabaseAdmin
      .from('Project')
      .select('*, user_id, title, category, custom_data')
      .eq('project_id', projectId)
      .single();

    // 2. Fetch All Ratings
    const { data: allRatings, error } = await supabaseAdmin
      .from('ProjectRating')
      .select('*')
      .eq('project_id', projectId);

    if (error) throw error;

    // Determine Categories
    const categories = project?.custom_data?.custom_categories || [
      { id: 'score_1' }, { id: 'score_2' }, { id: 'score_3' }, { id: 'score_4' }
    ];
    const catIds = categories.map((c: any) => c.id);

    // Calculate Average
    let averages: Record<string, number> = {};
    catIds.forEach((id: string) => averages[id] = 0);
    
    let totalAvg = 0;
    const count = allRatings.length;

    if (count > 0) {
      const sums: Record<string, number> = {};
      catIds.forEach((id: string) => sums[id] = 0);

      allRatings.forEach((curr: any) => {
        catIds.forEach((id: string) => {
          sums[id] += (Number(curr[id]) || 0);
        });
      });

      catIds.forEach((id: string) => {
        averages[id] = Number((sums[id] / count).toFixed(1));
      });
      
      const sumAvgs = Object.values(averages).reduce((a, b) => a + b, 0);
      totalAvg = Number((sumAvgs / catIds.length).toFixed(1));
    }

    // 3. Fetch My Rating
    let myRating = null;
    if (userId) {
      myRating = allRatings.find((r: any) => r.user_id === userId) || null;
    }

    // 4. Check Visibility
    let isAuthorized = false;
    if (userId) {
        if (project && project.user_id === userId) isAuthorized = true;
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
      project, // 반환 데이터에 프로젝트 정보 포함
      averages,
      totalAvg,
      totalCount: count,
      myRating,
      isAuthorized
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
      const { score, proposal, custom_answers, ...scores } = body;

      // 1. Upsert Rating
      const { error: ratingError } = await supabaseAdmin
        .from('ProjectRating')
        .upsert({
          project_id: projectId,
          user_id: user.id,
          score,
          score_1: scores.score_1 || 0,
          score_2: scores.score_2 || 0,
          score_3: scores.score_3 || 0,
          score_4: scores.score_4 || 0,
          score_5: scores.score_5 || 0,
          score_6: scores.score_6 || 0,
          proposal: proposal,
          custom_answers: custom_answers,
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

      // [New] 3. Notification for Project Owner
      const { data: projectData } = await supabaseAdmin
        .from('Project')
        .select('user_id, title')
        .eq('project_id', projectId)
        .single();
        
      if (projectData && projectData.user_id !== user.id) {
          await supabaseAdmin
            .from('notifications')
            .insert({
                user_id: projectData.user_id,
                type: 'rating',
                title: '새로운 미슐랭 평가 도착! 📊',
                message: `${maskedName}님이 '${projectData.title}' 프로젝트를 평가했습니다. (평균 ${score}점)`,
                link: `/projects/${projectId}`,
                action_label: '분석 리포트 보기',
                action_url: `/projects/${projectId}#rating-section`,
                sender_id: user.id
            });
      }

      // [Point System] Reward for Evaluating (100 Points)
      try {
          // Check if this is the first time rating this project (upsert check)
          // Actually, we can check if a point log for this project rating exists.
          const { count } = await supabaseAdmin
            .from('point_logs')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('reason', `심사 평가 보상 (Project ${projectId})`);
          
          if ((count || 0) === 0) {
              const REWARD = 100;
              // 1. Add Points
              const { data: profile } = await supabaseAdmin.from('profiles').select('points').eq('id', user.id).single();
              await supabaseAdmin.from('profiles').update({ points: (profile?.points || 0) + REWARD }).eq('id', user.id);
              // 2. Log
              await supabaseAdmin.from('point_logs').insert({
                  user_id: user.id,
                  amount: REWARD,
                  reason: `심사 평가 보상 (Project ${projectId})`
              });
              console.log(`[Point System] Awarded ${REWARD} points to user ${user.id} for rating.`);
          }
      } catch (e) {
          console.error('[Point System] Failed to reward rating points:', e);
      }

      return NextResponse.json({ success: true });

  } catch (error: any) {
     return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
