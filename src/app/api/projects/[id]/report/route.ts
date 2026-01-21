import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const projectId = params.id;

  try {
    // 1. Fetch Ratings
    const { data: ratings, error: ratingError } = await supabaseAdmin
      .from("ProjectRating")
      .select("*")
      .eq("project_id", projectId);

    if (ratingError) throw ratingError;

    // 2. Fetch Polls
    const { data: votes, error: voteError } = await supabaseAdmin
      .from("ProjectPoll")
      .select("*")
      .eq("project_id", projectId);

    // 3. Fetch Secret Reviews (Proposals)
    const { data: proposals, error: proposalError } = await supabaseAdmin
      .from("Proposal")
      .select("id, title, content, created_at, contact")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    // Aggregation Logic
    const totalCount = ratings.length;
    let averages = { score_1: 0, score_2: 0, score_3: 0, score_4: 0 };
    let totalAvg = 0;

    if (totalCount > 0) {
      const sums = ratings.reduce(
        (acc: any, curr: any) => ({
          score_1: acc.score_1 + (Number(curr.score_1) || 0),
          score_2: acc.score_2 + (Number(curr.score_2) || 0),
          score_3: acc.score_3 + (Number(curr.score_3) || 0),
          score_4: acc.score_4 + (Number(curr.score_4) || 0),
        }),
        { score_1: 0, score_2: 0, score_3: 0, score_4: 0 }
      );

      averages = {
        score_1: Number((sums.score_1 / totalCount).toFixed(1)),
        score_2: Number((sums.score_2 / totalCount).toFixed(1)),
        score_3: Number((sums.score_3 / totalCount).toFixed(1)),
        score_4: Number((sums.score_4 / totalCount).toFixed(1)),
      };
      
      const sumAvgs = Object.values(averages).reduce((a, b) => a + b, 0);
      totalAvg = Number((sumAvgs / 4).toFixed(1));
    }

    const voteCounts = {
      launch: votes?.filter(v => v.vote_type === 'launch').length || 0,
      more: votes?.filter(v => v.vote_type === 'more').length || 0,
      research: votes?.filter(v => v.vote_type === 'research').length || 0,
    };

    return NextResponse.json({
      success: true,
      report: {
        totalReviewers: totalCount,
        michelin: {
          averages,
          totalAvg,
          count: totalCount
        },
        polls: voteCounts,
        secretReviews: proposals || []
      }
    });

  } catch (err: any) {
    console.error("Report fetch error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
