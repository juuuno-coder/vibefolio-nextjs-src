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

    // 사용자 정보 조회 (profiles 테이블 사용 - 성능 개선)
    if (data && data.length > 0) {
      const userIds = Array.from(new Set(data.map((c: any) => c.user_id).filter(Boolean))) as string[];
      
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

      data.forEach((comment: any) => {
        const user = userMap.get(comment.user_id);
        comment.user = user || {
          username: 'Unknown',
          profile_image_url: '/globe.svg'
        };
      });

      // 대댓글 구조화
      const commentMap = new Map();
      const rootComments: any[] = [];

      data.forEach((comment: any) => {
        comment.replies = [];
        commentMap.set(comment.comment_id, comment);
      });

      data.forEach((comment: any) => {
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

    return NextResponse.json({ comments: data });
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
    const { projectId, content, parentCommentId, mentionedUserId } = body;

    console.log('댓글 작성 요청:', { 
      userId: user.id, 
      projectId, 
      content, 
      parentCommentId, 
      mentionedUserId 
    });

    if (!projectId || !content) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      );
    }

    const { data, error } = await (supabaseAdmin as any)
      .from('Comment')
      .insert([
        {
          user_id: user.id,
          project_id: projectId,
          content,
          parent_comment_id: parentCommentId || null,
          mentioned_user_id: mentionedUserId || null,
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
