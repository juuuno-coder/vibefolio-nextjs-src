// src/app/api/comments/route.ts
// 댓글 CRUD API

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';

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
      .select(`
        *,
        User!Comment_user_id_fkey (
          user_id,
          nickname,
          profile_image_url
        )
      `)
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
    const body = await request.json();
    const { user_id, project_id, content } = body;

    if (!user_id || !project_id || !content) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('Comment')
      .insert([
        {
          user_id,
          project_id,
          content,
        },
      ])
      .select(`
        *,
        User!Comment_user_id_fkey (
          user_id,
          nickname,
          profile_image_url
        )
      `)
      .single();

    if (error) {
      console.error('댓글 작성 실패:', error);
      return NextResponse.json(
        { error: '댓글 작성에 실패했습니다.' },
        { status: 500 }
      );
    }

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
      .single();

    if (!comment) {
      return NextResponse.json(
        { error: '댓글을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    if (comment.user_id.toString() !== userId) {
      return NextResponse.json(
        { error: '댓글을 삭제할 권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 소프트 삭제
    const { error } = await supabaseAdmin
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
