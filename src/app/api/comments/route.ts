// src/app/api/comments/route.ts
// 댓글 CRUD API

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

// 댓글 조회
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId가 필요합니다.' },
        { status: 400 }
      );
    }

    // To handle secret comments, we need the current user ID
    const authHeader = request.headers.get('authorization');
    let currentUserId: string | null = null;
    if (authHeader) {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user } } = await supabaseAdmin.auth.getUser(token);
        if (user) currentUserId = user.id;
    }

    // Get project owner ID to allow them to see secret comments
    const { data: projectInfo } = await (supabaseAdmin as any)
        .from('Project')
        .select('user_id')
        .eq('project_id', projectId)
        .single();
    
    const projectOwnerId = projectInfo?.user_id;

    const { data, error } = await supabaseAdmin
      .from('Comment')
      .select('*')
      .eq('project_id', projectId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('댓글 조회 실패:', error);
      return NextResponse.json(
        { error: '댓글 조회에 실패했습니다.' },
        { status: 500 }
      );
    }

    // Privacy Filter: Mask content if secret
    const filteredData = (data || []).map((comment: any) => {
      if (comment.is_secret) {
          const isAuthor = currentUserId && String(comment.user_id) === String(currentUserId);
          const isProjectOwner = currentUserId && String(projectOwnerId) === String(currentUserId);
          
          if (!isAuthor && !isProjectOwner) {
              return { ...comment, content: '🔒 비밀 댓글입니다.' };
          }
      }
      return comment;
    });

    // 사용자 정보 조회 (profiles 테이블 사용 - 성능 개선)
    if (filteredData && filteredData.length > 0) {
      const userIds = Array.from(new Set(filteredData.map((c: any) => c.user_id).filter(Boolean))) as string[];
      
      // profiles 테이블에서 사용자 정보 조회
      const { data: profiles } = await supabaseAdmin
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', userIds);

      const userMap = new Map(
        profiles?.map((p: any) => [
          p.id,
          {
            username: p.username || 'Unknown',
            profile_image_url: p.avatar_url || '/globe.svg'
          }
        ]) || []
      );

      filteredData.forEach((comment: any) => {
        const user = userMap.get(comment.user_id);
        comment.user = user || {
          username: 'Unknown',
          profile_image_url: '/globe.svg'
        };
      });

      // 대댓글 구조화
      const commentMap = new Map();
      const rootComments: any[] = [];

      filteredData.forEach((comment: any) => {
        comment.replies = [];
        commentMap.set(comment.comment_id, comment);
      });

      filteredData.forEach((comment: any) => {
        if (comment.parent_comment_id) {
          const parent = commentMap.get(comment.parent_comment_id);
          if (parent) {
            parent.replies.push(comment);
          }
        } else {
          rootComments.push(comment);
        }
      });

      return NextResponse.json({ comments: rootComments });
    }

    return NextResponse.json({ comments: filteredData });
  } catch (error) {
    console.error('서버 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 댓글 작성
export async function POST(request: NextRequest) {
  try {
    // Authorization 헤더에서 토큰 추출
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: '인증에 실패했습니다.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { projectId, content, parentCommentId, mentionedUserId, isSecret } = body;

    console.log('댓글 작성 요청:', { 
      userId: user.id, 
      projectId, 
      content, 
      parentCommentId, 
      mentionedUserId,
      isSecret,
    });

    if (!projectId || !content) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // 프로젝트 정보 조회 (작성자 확인용)
    const { data: projectData } = await (supabaseAdmin as any)
      .from('Project')
      .select('user_id')
      .eq('project_id', projectId)
      .single();

    const { data, error } = await (supabaseAdmin as any)
      .from('Comment')
      .insert([
        {
          user_id: user.id,
          project_id: projectId,
          content,
          parent_comment_id: parentCommentId || null,
          mentioned_user_id: mentionedUserId || null,
          is_secret: isSecret || false,
        },
      ] as any)
      .select('*')
      .single();

    if (error) {
      console.error('댓글 작성 실패:', error);
      return NextResponse.json(
        { error: `댓글 작성에 실패했습니다: ${error.message || error.code}` },
        { status: 500 }
      );
    }

    console.log('댓글 작성 성공:', data);

    // [Point System] Reward for Feedback (+100)
    // 자신의 글이 아닌 경우에만 지급
    if (projectData && projectData.user_id !== user.id) {
      try {
        const REWARD_FEEDBACK = 100;
        
        // 1. Get current
        const { data: profile } = await (supabaseAdmin as any)
            .from('profiles')
            .select('points')
            .eq('id', user.id)
            .single();
        
        const currentPoints = profile?.points || 0;

        // 2. Add
        await (supabaseAdmin as any)
            .from('profiles')
            .update({ points: currentPoints + REWARD_FEEDBACK })
            .eq('id', user.id);

        // 3. Log
        await (supabaseAdmin as any)
            .from('point_logs')
            .insert({
                user_id: user.id,
                amount: REWARD_FEEDBACK,
                reason: '피드백 작성 보상 (댓글/리뷰)'
            });
            
        console.log(`[Point System] User ${user.id} awarded ${REWARD_FEEDBACK} points for feedback.`);
      } catch (e) {
        console.warn("포인트 지급 실패:", e);
      }
    }

    // 작성한 사용자 정보 추가
    data.user = {
      username: user.user_metadata?.nickname || user.email?.split('@')[0] || 'Unknown',
      profile_image_url: user.user_metadata?.profile_image_url || '/globe.svg'
    };

    return NextResponse.json(
      {
        message: '댓글이 작성되었습니다.',
        comment: data,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('서버 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 댓글 삭제 (소프트 삭제)
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const commentId = searchParams.get('commentId');
    const userId = searchParams.get('userId');

    if (!commentId || !userId) {
      return NextResponse.json(
        { error: 'commentId와 userId가 필요합니다.' },
        { status: 400 }
      );
    }

    // 댓글 소유자 확인
    const { data: comment } = await supabaseAdmin
      .from('Comment')
      .select('user_id')
      .eq('comment_id', commentId)
      .single() as { data: any, error: any }; // 타입 단언 추가

    if (!comment) {
      return NextResponse.json(
        { error: '댓글을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // UUID 비교 (문자열)
    if (comment.user_id !== userId) {
      return NextResponse.json(
        { error: '댓글을 삭제할 권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 소프트 삭제
    const { error } = await (supabaseAdmin as any)
      .from('Comment')
      .update({ is_deleted: true })
      .eq('comment_id', commentId);

    if (error) {
      console.error('댓글 삭제 실패:', error);
      return NextResponse.json(
        { error: '댓글 삭제에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: '댓글이 삭제되었습니다.' });
  } catch (error) {
    console.error('서버 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
