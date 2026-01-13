// src/app/api/projects/[id]/route.ts
// 개별 프로젝트 조회, 수정, 삭제 API

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { supabaseAdmin } from '@/lib/supabase/admin';

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
      .single() as { data: any, error: any };

    if (error) {
      console.error('프로젝트 조회 실패:', error);
      return NextResponse.json(
        { error: '프로젝트를 찾을 수 없습니다.', details: error.message },
        { status: 404 }
      );
    }

    // Supabase Admin을 직접 사용하여 사용자 정보 가져오기
    if (data && data.user_id) {
      try {
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.getUserById(data.user_id);
        if (!authError && authData.user) {
          data.User = {
            user_id: authData.user.id,
            username: authData.user.user_metadata?.nickname || authData.user.email?.split('@')[0] || 'Unknown',
            profile_image_url: authData.user.user_metadata?.profile_image_url || '/globe.svg'
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

const ADMIN_EMAILS = [
  "juuuno@naver.com", 
  "juuuno1116@gmail.com", 
  "designd@designd.co.kr", 
  "designdlab@designdlab.co.kr", 
  "admin@vibefolio.net"
];

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    // 1. 인증 확인
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

    // 2. 권한 확인 (관리자 또는 프로젝트 소유자)
    const isAdminEmail = user.email && ADMIN_EMAILS.includes(user.email);
    
    // DB상 관리자 권한 확인
    let isDbAdmin = false;
    if (!isAdminEmail) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      isDbAdmin = profile?.role === 'admin';
    }

    const isAuthorizedAdmin = isAdminEmail || isDbAdmin;

    // 프로젝트 소유자 확인을 위해 먼저 프로젝트 조회
    const { data: existingProject, error: fetchError } = await (supabaseAdmin as any)
      .from('Project')
      .select('user_id')
      .eq('project_id', id)
      .single();

    if (fetchError || !existingProject) {
      return NextResponse.json(
        { error: '프로젝트를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 관리자가 아니고 소유자도 아니면 거부
    if (!isAuthorizedAdmin && existingProject.user_id !== user.id) {
       return NextResponse.json(
        { error: '수정 권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 3. 업데이트 수행 (supabaseAdmin 사용)
    const body = await request.json();
    const { title, content_text, thumbnail_url, category_id, rendering_type, custom_data } = body;

    const { data, error } = await (supabaseAdmin as any)
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

    // Supabase Admin을 직접 사용하여 사용자 정보 가져오기
    if (data && data.user_id) {
      try {
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.getUserById(data.user_id);
        if (!authError && authData.user) {
          data.User = {
            user_id: authData.user.id,
            username: authData.user.user_metadata?.nickname || authData.user.email?.split('@')[0] || 'Unknown',
            profile_image_url: authData.user.user_metadata?.profile_image_url || '/globe.svg'
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
    // Authorization 헤더에서 토큰 추출
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    
    // 토큰으로 사용자 확인
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: '인증에 실패했습니다.' },
        { status: 401 }
      );
    }

    // 프로젝트 소유자 확인
    const { data: project, error: fetchError } = await (supabaseAdmin as any)
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

    // 프로젝트 삭제 (soft delete)
    const { error } = await (supabaseAdmin as any)
      .from('Project')
      .update({ deleted_at: new Date().toISOString() })
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
