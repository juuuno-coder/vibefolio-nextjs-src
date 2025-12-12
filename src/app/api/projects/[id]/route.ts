// src/app/api/projects/[id]/route.ts
// 개별 프로젝트 조회, 수정, 삭제 API

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { data, error } = await (supabase as any)
      .from('Project')
      .select(`
        *,
        Category (
          category_id,
          name
        )
      `)
      .eq('project_id', id)
      .eq('is_deleted', false)
      .single() as { data: any, error: any };

    if (error) {
      console.error('프로젝트 조회 실패:', error);
      return NextResponse.json(
        { error: '프로젝트를 찾을 수 없습니다.', details: error.message },
        { status: 404 }
      );
    }

    // Supabase Auth에서 사용자 정보 가져오기
    if (data && data.user_id) {
      try {
        const userResponse = await fetch(`${request.nextUrl.origin}/api/users/${data.user_id}`);
        if (userResponse.ok) {
          const userData = await userResponse.json();
          data.User = {
            user_id: userData.user.id,
            username: userData.user.nickname,
            profile_image_url: userData.user.profile_image_url
          };
        }
      } catch (e) {
        console.error('사용자 정보 조회 실패:', e);
        data.User = null;
      }
    }

    // 조회수 증가
    await (supabase as any)
      .from('Project')
      .update({ views: (data.views || 0) + 1 })
      .eq('project_id', id);

    return NextResponse.json({ project: data });
  } catch (error: any) {
    console.error('서버 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.', details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const { title, content_text, thumbnail_url, category_id, rendering_type, custom_data } = body;

    const { data, error } = await (supabase as any)
      .from('Project')
      .update({
        title,
        content_text,
        thumbnail_url,
        category_id,
        rendering_type,
        custom_data,
      })
      .eq('project_id', id)
      .select(`
        *,
        Category (
          category_id,
          name
        )
      `)
      .single();

    if (error) {
      console.error('프로젝트 수정 실패:', error);
      return NextResponse.json(
        { error: '프로젝트 수정에 실패했습니다.', details: error.message },
        { status: 500 }
      );
    }

    // Supabase Auth에서 사용자 정보 가져오기
    if (data && data.user_id) {
      try {
        const userResponse = await fetch(`${request.nextUrl.origin}/api/users/${data.user_id}`);
        if (userResponse.ok) {
          const userData = await userResponse.json();
          data.User = {
            user_id: userData.user.id,
            username: userData.user.nickname,
            profile_image_url: userData.user.profile_image_url
          };
        }
      } catch (e) {
        console.error('사용자 정보 조회 실패:', e);
        data.User = null;
      }
    }

    return NextResponse.json({ project: data });
  } catch (error: any) {
    console.error('서버 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    // 현재 사용자 확인
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    // 프로젝트 소유자 확인
    const { data: project, error: fetchError } = await (supabase as any)
      .from('Project')
      .select('user_id')
      .eq('project_id', id)
      .single();

    if (fetchError || !project) {
      return NextResponse.json(
        { error: '프로젝트를 찾을 수 없습니다.', details: fetchError?.message },
        { status: 404 }
      );
    }

    if (project.user_id !== user.id) {
      return NextResponse.json(
        { error: '본인의 프로젝트만 삭제할 수 있습니다.' },
        { status: 403 }
      );
    }

    // Soft delete: is_deleted = true로 변경
    const { error } = await (supabase as any)
      .from('Project')
      .update({ is_deleted: true })
      .eq('project_id', id);

    if (error) {
      console.error('프로젝트 삭제 실패:', error);
      return NextResponse.json(
        { error: '프로젝트 삭제에 실패했습니다.', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: '프로젝트가 삭제되었습니다.' });
  } catch (error: any) {
    console.error('서버 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.', details: error.message },
      { status: 500 }
    );
  }
}
