import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const projectId = params.id;

  try {
    // 1. Fetch Ratings
    const { data: allRatings, error: ratingError } = await supabaseAdmin
      .from('ProjectRating')
      .select('score, score_1, score_2, score_3, score_4')
      .eq('project_id', projectId);

    if (ratingError) throw ratingError;

    // Process Ratings
    let michelinAvg = 0;
    let categoryAvgs = [0, 0, 0, 0, 0]; // 0: UX/UI, 1: Idea, 2: Biz, 3: Tech, 4: Design (Approx)
    let totalRatings = allRatings.length;
    let scoreDistribution = [0, 0, 0, 0, 0]; // 5, 4, 3, 2, 1 점대 개수

    if (totalRatings > 0) {
       const sum = allRatings.reduce((acc, curr) => acc + (Number(curr.score) || 0), 0);
       michelinAvg = Number((sum / totalRatings).toFixed(1));

       // Category-wise averages
       const sums = allRatings.reduce((acc, curr) => [
          acc[0] + (Number(curr.score) || 0),
          acc[1] + (Number(curr.score_1) || 0),
          acc[2] + (Number(curr.score_2) || 0),
          acc[3] + (Number(curr.score_3) || 0),
          acc[4] + (Number(curr.score_4) || 0),
       ], [0, 0, 0, 0, 0]);
       categoryAvgs = sums.map(s => Number((s / totalRatings).toFixed(1)));

       // Calculate Distribution (Integral part of score)
       allRatings.forEach(r => {
          const s = Math.round(Number(r.score) || 0);
          if (s >= 1 && s <= 5) scoreDistribution[5 - s]++; 
       });
    }

    // 2. Fetch Polls (Stickers)
    const { data: polls, error: pollError } = await supabaseAdmin
      .from('ProjectPoll')
      .select('vote_type')
      .eq('project_id', projectId);
    
    if (pollError) throw pollError;

    const pollCounts = {
        launch: 0,
        research: 0,
        more: 0
    };
    polls.forEach(p => {
        if (p.vote_type === 'launch' || p.vote_type === 'launch_now') pollCounts.launch++;
        else if (p.vote_type === 'research' || p.vote_type === 'need_research') pollCounts.research++;
        else if (p.vote_type === 'more' || p.vote_type === 'develop_more') pollCounts.more++;
    });

    const topStickers = [
        { icon: '🚀', count: pollCounts.launch, label: '당장 쓸게요' },
        { icon: '💎', count: pollCounts.more, label: '더 개발해주세요' },
        { icon: '🧪', count: pollCounts.research, label: '연구 필요' }
    ].sort((a, b) => b.count - a.count);

    // 3. Fetch Secret Comments (Proposals)
    const { count: secretCount, error: secretError } = await supabaseAdmin
       .from('Comment')
       .select('*', { count: 'exact', head: true })
       .eq('project_id', projectId)
       .eq('is_secret', true);

    const { count: totalComments, error: commentError } = await supabaseAdmin
       .from('Comment')
       .select('*', { count: 'exact', head: true })
       .eq('project_id', projectId);

    if (secretError || commentError) console.error(secretError || commentError);

    return NextResponse.json({
        success: true,
        stats: {
            michelinAvg,
            categoryAvgs,
            totalRatings,
            scoreDistribution, // [5점개수, 4점개수 ... 1점개수]
            topStickers,
            secretProposals: secretCount || 0,
            totalComments: totalComments || 0
        }
    });

  } catch (error: any) {
    console.error("Report Fetch Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
