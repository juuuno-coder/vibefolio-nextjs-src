// src/app/api/projects/route.ts
// 프로젝트 목록 조회 및 생성 API - 최적화 버전 (JOIN 적용)

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

    // Supabase JOIN 쿼리: Project 테이블을 기준으로 users와 Category를 조인
    // users 테이블의 외래키 관계 이름이 'users'라고 가정 (보통 테이블명)
    // 만약 관계 이름이 다르면 (e.g., 'user_id_fkey') 에러가 날 수 있음 -> Introspection 필요하지만 일단 표준으로 시도
    let query = (supabase as any)
      .from('Project')
      .select(`
        project_id,
        user_id,
        title,
        thumbnail_url,
        content_text,
        views,
        rendering_type,
        created_at,
        users (
          id,
          nickname,
          profile_image_url
        ),
        Category (
          category_id,
          name
        ),
        likes: Like(count)
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

    // 데이터 가공 (Frontend 호환성 유지)
    const formattedData = data?.map((project: any) => ({
      ...project,
      // Frontend expects 'User' object, Supabase returns 'users' object/array
      User: Array.isArray(project.users) ? project.users[0] : project.users || {
        username: 'Unknown',
        profile_image_url: '/globe.svg'
      },
      // Map likes count
      likes: project.likes?.[0]?.count || 0,
    }));

    return NextResponse.json(
      { projects: formattedData || [], page, limit, hasMore: data?.length === limit },
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
