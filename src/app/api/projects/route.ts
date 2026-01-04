// src/app/api/projects/route.ts
// 프로젝트 목록 조회 및 생성 API - 최적화 버전

import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase/client';
import { GENRE_TO_CATEGORY_ID } from '@/lib/constants';

// 캐시 설정 추가
export const revalidate = 60; // 60초마다 재검증

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '20');
    const page = parseInt(searchParams.get('page') || '1');
    const search = searchParams.get('search');
    
    const offset = (page - 1) * limit;

    // 필요한 필드만 선택 (최적화)
    let query = (supabase as any)
      .from('Project')
      .select(`
        project_id,
        user_id,
        title,
        thumbnail_url,
        content_text,
        likes: Like(count),
        views,
        rendering_type,
        created_at,
        Category (
          category_id,
          name
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // 검색어 필터
    if (search) {
      query = query.or(`title.ilike.%${search}%,content_text.ilike.%${search}%`);
    }

    // 카테고리 필터
    if (category && category !== 'korea' && category !== 'all') {
      const categoryId = GENRE_TO_CATEGORY_ID[category];
      if (categoryId) query = query.eq('category_id', categoryId);
    }

    // 사용자 필터
    if (userId) query = query.eq('user_id', userId);

    const { data, error } = await query;

    if (error) {
      console.error('프로젝트 조회 실패:', error);
      return NextResponse.json(
        { error: '프로젝트 조회에 실패했습니다.', details: error.message },
        { status: 500 }
      );
    }

    // 사용자 정보 병합: auth.admin 호출을 반복하지 않고 public.users 테이블에서 한 번에 조회합니다.
    if (data && data.length > 0) {
      const userIds = [...new Set(data.map((p: any) => p.user_id).filter(Boolean))] as string[];

      if (userIds.length > 0) {
        const { data: usersData, error: usersError } = await supabaseAdmin
          .from('users')
          .select('id, nickname, profile_image_url')
          .in('id', userIds);

        const userMap = new Map<string, { user_id: string; username: string; profile_image_url: string }>();

        if (!usersError && Array.isArray(usersData)) {
          usersData.forEach((u: any) => {
            userMap.set(u.id, {
              user_id: u.id,
              username: u.nickname || 'Unknown',
              profile_image_url: u.profile_image_url || '/globe.svg',
            });
          });
        }

        data.forEach((project: any) => {
          project.User = userMap.get(project.user_id) || { username: 'Unknown', profile_image_url: '/globe.svg' };
          // Map likes: Like(count) to simple count if needed, or frontend handles it
          project.likes = project.likes?.[0]?.count || 0;
        });
      }
    }

    // 캐시 헤더 추가
    return NextResponse.json(
      { projects: data || [], page, limit, hasMore: data?.length === limit },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      }
    );
  } catch (error: any) {
    console.error('서버 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, category_id, title, content_text, thumbnail_url, rendering_type, custom_data } = body;

    if (!user_id || !category_id || !title) {
      return NextResponse.json({ error: '필수 필드가 누락되었습니다.' }, { status: 400 });
    }

    // Insert using 'Project' table (Capitalized)
    const { data, error } = await (supabaseAdmin as any)
      .from('Project')
      .insert([{
        user_id,
        category_id,
        title,
        content_text,
        thumbnail_url,
        rendering_type,
        custom_data,
        views: 0 // Initialize views
      }] as any)
      .select()
      .single();

    if (error) {
      console.error('프로젝트 생성 실패:', error);
      return NextResponse.json(
        { error: `프로젝트 생성 실패: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ project: data }, { status: 201 });
  } catch (error: any) {
    console.error('서버 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
