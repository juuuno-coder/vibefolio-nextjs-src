// src/app/api/wishlist/route.ts
// 위시리스트(북마크) 추가/제거 API

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

// 위시리스트 토글 (추가/제거)
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

    // 이미 위시리스트에 있는지 확인
    const { data: existingWishlist } = await supabaseAdmin
      .from('Wishlist')
      .select()
      .eq('user_id', user_id)
      .eq('project_id', project_id)
      .single();

    if (existingWishlist) {
      // 위시리스트에서 제거
      const { error } = await (supabaseAdmin as any)
        .from('Wishlist')
        .delete()
        .eq('user_id', user_id)
        .eq('project_id', project_id);

      if (error) {
        console.error('위시리스트 제거 실패:', error);
        return NextResponse.json(
          { error: '위시리스트 제거에 실패했습니다.' },
          { status: 500 }
        );
      }

      return NextResponse.json({ 
        bookmarked: false, 
        message: '위시리스트에서 제거되었습니다.' 
      });
    } else {
      // 위시리스트에 추가
      const { error } = await (supabaseAdmin as any)
        .from('Wishlist')
        .insert([{ user_id, project_id }] as any);

      if (error) {
        console.error('위시리스트 추가 실패:', error);
        return NextResponse.json(
          { error: '위시리스트 추가에 실패했습니다.' },
          { status: 500 }
        );
      }

      return NextResponse.json({ 
        bookmarked: true, 
        message: '위시리스트에 추가되었습니다.' 
      });
    }
  } catch (error) {
    console.error('서버 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 위시리스트 조회
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const projectId = searchParams.get('projectId');

    if (userId && projectId) {
      // 특정 프로젝트가 위시리스트에 있는지 확인
      const { data } = await supabaseAdmin
        .from('Wishlist')
        .select()
        .eq('user_id', userId)
        .eq('project_id', projectId)
        .single();

      return NextResponse.json({ bookmarked: !!data });
    } else if (userId) {
      // 사용자의 위시리스트 전체 조회
      const { data, error } = await supabaseAdmin
        .from('Wishlist')
        .select(`
          *,
          Project!inner (
            *,
            users (
              id,
              nickname,
              profile_image_url
            ),
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

      return NextResponse.json({ wishlist: data });
    }

    return NextResponse.json(
      { error: 'userId가 필요합니다.' },
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
