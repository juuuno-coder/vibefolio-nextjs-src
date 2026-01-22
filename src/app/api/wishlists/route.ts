// src/app/api/wishlists/route.ts
// 위시리스트(컬렉션) 추가/제거 API

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
    const { projectId, project_id } = body;
    const targetProjectId = projectId || project_id;

    if (!targetProjectId) {
      return NextResponse.json(
        { error: '프로젝트 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 이미 위시리스트에 있는지 확인
    const { data: existingWishlist } = await supabaseAdmin
      .from('bookmark')
      .select()
      .eq('user_id', user.id)
      .eq('project_id', targetProjectId)
      .single();

    if (existingWishlist) {
      // 위시리스트에서 제거
      const { error } = await supabaseAdmin
        .from('bookmark')
        .delete()
        .eq('user_id', user.id)
        .eq('project_id', targetProjectId);

      if (error) {
        console.error('위시리스트 제거 실패:', error);
        return NextResponse.json(
          { error: '위시리스트 제거에 실패했습니다.' },
          { status: 500 }
        );
      }

      return NextResponse.json({ bookmarked: false, message: '위시리스트에서 제거되었습니다.' });
    } else {
      // 위시리스트에 추가
      const { error } = await supabaseAdmin
        .from('bookmark')
        .insert({ user_id: user.id, project_id: targetProjectId });

      if (error) {
        console.error('위시리스트 추가 실패:', error);
        return NextResponse.json(
          { error: '위시리스트 추가에 실패했습니다.' },
          { status: 500 }
        );
      }

      return NextResponse.json({ bookmarked: true, message: '위시리스트에 추가되었습니다.' });
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
      // 특정 프로젝트에 대한 위시리스트 여부 확인
      const { data } = await supabaseAdmin
        .from('bookmark')
        .select()
        .eq('user_id', userId)
        .eq('project_id', projectId)
        .single();

      return NextResponse.json({ bookmarked: !!data });
    } else if (userId) {
      // 사용자의 위시리스트 조회
      const { data, error } = await supabaseAdmin
        .from('bookmark')
        .select(`
          *,
          Project (
            *,
            Category (
              category_id,
              name
            )
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('위시리스트 조회 실패:', error);
        return NextResponse.json(
          { error: '위시리스트 조회에 실패했습니다.' },
          { status: 500 }
        );
      }

      return NextResponse.json({ wishlists: data });
    }

    return NextResponse.json({ wishlists: [] });
  } catch (error) {
    console.error('서버 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
