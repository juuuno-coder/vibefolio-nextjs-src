import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const commentId = parseInt(id);

    if (isNaN(commentId)) {
      return NextResponse.json({ error: 'Invalid comment ID' }, { status: 400 });
    }

    // 현재 사용자 확인
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    // 댓글 소유자 확인
    const { data: comment, error: fetchError } = await supabase
      .from('Comment')
      .select('user_id')
      .eq('comment_id', commentId)
      .single();

    if (fetchError || !comment) {
      return NextResponse.json({ error: '댓글을 찾을 수 없습니다.' }, { status: 404 });
    }

    if ((comment as any).user_id !== user.id) {
      return NextResponse.json({ error: '본인의 댓글만 삭제할 수 있습니다.' }, { status: 403 });
    }

    // 댓글 삭제
    const { error: deleteError } = await supabase
      .from('Comment')
      .delete()
      .eq('comment_id', commentId);

    if (deleteError) {
      console.error('댓글 삭제 실패:', deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('댓글 삭제 API 오류:', error);
    return NextResponse.json(
      { error: error.message || '댓글 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
