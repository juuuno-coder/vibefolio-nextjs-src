// src/app/api/likes/route.ts
// 좋아요 추가/제거 API

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

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
    const { projectId } = body;

    if (!projectId) {
      return NextResponse.json(
        { error: '프로젝트 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 이미 좋아요가 있는지 확인 (필요한 필드만 조회)
    const { data: existingLike } = await supabaseAdmin
      .from('Like')
      .select('user_id, project_id, created_at')
      .eq('user_id', user.id)
      .eq('project_id', projectId)
      .single();

    if (existingLike) {
      // 좋아요 제거
      const { error } = await (supabaseAdmin as any)
        .from('Like')
        .delete()
        .eq('user_id', user.id)
        .eq('project_id', projectId);

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
      const { error } = await (supabaseAdmin as any)
        .from('Like')
        .insert([{ user_id: user.id, project_id: projectId }] as any);

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
      // 특정 프로젝트에 대한 좋아요 여부 확인 (필드 최소화)
      const { data } = await supabaseAdmin
        .from('Like')
        .select('user_id')
        .eq('user_id', userId)
        .eq('project_id', projectId)
        .single();

      return NextResponse.json({ liked: !!data });
    } else if (userId) {
      // 사용자가 좋아요한 모든 프로젝트 조회
      const { data, error } = await supabaseAdmin
        .from('Like')
        .select(`
          project_id,
          created_at,
          Project!inner (
            project_id,
            title,
            thumbnail_url,
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
        .select('project_id', { count: 'exact', head: true })
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
