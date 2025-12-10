// src/app/api/likes/route.ts
// 좋아요 추가/제거 API

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, project_id } = body;

    if (!user_id || !project_id) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // 이미 좋아요가 있는지 확인
    const { data: existingLike } = await supabaseAdmin
      .from('Like')
      .select()
      .eq('user_id', user_id)
      .eq('project_id', project_id)
      .single();

    if (existingLike) {
      // 좋아요 제거
      const { error } = await supabaseAdmin
        .from('Like')
        .delete()
        .eq('user_id', user_id)
        .eq('project_id', project_id);

      if (error) {
        console.error('좋아요 제거 실패:', error);
        return NextResponse.json(
          { error: '좋아요 제거에 실패했습니다.' },
          { status: 500 }
        );
      }

      return NextResponse.json({ liked: false, message: '좋아요가 취소되었습니다.' });
    } else {
      // 좋아요 추가
      const { error } = await supabaseAdmin
        .from('Like')
        .insert([{ user_id, project_id }] as any);

      if (error) {
        console.error('좋아요 추가 실패:', error);
        return NextResponse.json(
          { error: '좋아요 추가에 실패했습니다.' },
          { status: 500 }
        );
      }

      return NextResponse.json({ liked: true, message: '좋아요를 추가했습니다.' });
    }
  } catch (error) {
    console.error('서버 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const projectId = searchParams.get('projectId');

    if (userId && projectId) {
      // 특정 프로젝트에 대한 좋아요 여부 확인
      const { data } = await supabaseAdmin
        .from('Like')
        .select()
        .eq('user_id', userId)
        .eq('project_id', projectId)
        .single();

      return NextResponse.json({ liked: !!data });
    } else if (userId) {
      // 사용자가 좋아요한 모든 프로젝트 조회
      const { data, error } = await supabaseAdmin
        .from('Like')
        .select(`
          *,
          Project!inner (
            *,
            users (
              id,
              nickname,
              profile_image_url
            )
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('좋아요 목록 조회 실패:', error);
        return NextResponse.json(
          { error: '좋아요 목록 조회에 실패했습니다.' },
          { status: 500 }
        );
      }

      return NextResponse.json({ likes: data });
    } else if (projectId) {
      // 프로젝트의 좋아요 수 조회
      const { count, error } = await supabaseAdmin
        .from('Like')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', projectId);

      if (error) {
        console.error('좋아요 수 조회 실패:', error);
        return NextResponse.json(
          { error: '좋아요 수 조회에 실패했습니다.' },
          { status: 500 }
        );
      }

      return NextResponse.json({ count: count || 0 });
    }

    return NextResponse.json(
      { error: 'userId 또는 projectId가 필요합니다.' },
      { status: 400 }
    );
  } catch (error) {
    console.error('서버 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
