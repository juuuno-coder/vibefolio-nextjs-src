// src/app/api/projects/[id]/route.ts
// 개별 프로젝트 조회, 수정, 삭제 API

import { NextRequest, NextResponse } from 'next/server';
import { supabase as supabaseAnon } from '@/lib/supabase/client';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { data, error } = await (supabaseAnon as any)
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
    await (supabaseAnon as any)
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

// ADMIN_EMAILS preserved
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
    // [Strict Auth] 1. Identify User (API Key OR Session)
    let authenticatedUser: { id: string, email?: string } | null = null;
    const authHeader = request.headers.get('authorization');

    if (authHeader) {
        const token = authHeader.replace(/^Bearer\s+/i, '').trim();
        if (token.startsWith('vf_')) {
             // API Key
             const { data: keyRecord } = await supabaseAdmin
                .from('api_keys')
                .select('user_id')
                .eq('api_key', token)
                .eq('is_active', true)
                .single();
             if (keyRecord) {
                 // Fetch email for Admin check
                 const { data: userData } = await supabaseAdmin.auth.admin.getUserById(keyRecord.user_id);
                 authenticatedUser = { 
                     id: keyRecord.user_id, 
                     email: userData.user?.email 
                 };
             }
        }
    } 
    
    if (!authenticatedUser) {
        // Session Fallback
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            authenticatedUser = { id: user.id, email: user.email };
        }
    }

    if (!authenticatedUser) {
        return NextResponse.json({ error: 'Unauthorized', code: 'AUTH_REQUIRED' }, { status: 401 });
    }

    // 2. 권한 확인 (관리자 또는 프로젝트 소유자)
    const isAdminEmail = authenticatedUser.email && ADMIN_EMAILS.includes(authenticatedUser.email);
    let isDbAdmin = false;
    
    if (!isAdminEmail) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', authenticatedUser.id)
        .single();
      isDbAdmin = profile?.role === 'admin';
    }

    const isAuthorizedAdmin = isAdminEmail || isDbAdmin;

    // 프로젝트 소유자 확인
    const { data: existingProject, error: fetchError } = await (supabaseAdmin as any)
      .from('Project')
      .select('user_id')
      .eq('project_id', id)
      .single();

    if (fetchError || !existingProject) {
      return NextResponse.json({ error: '프로젝트를 찾을 수 없습니다.' }, { status: 404 });
    }

    if (!isAuthorizedAdmin && existingProject.user_id !== authenticatedUser.id) {
       return NextResponse.json({ error: '수정 권한이 없습니다.' }, { status: 403 });
    }

    // 3. 업데이트 수행
    const body = await request.json();
    const { 
        title, content_text, description, summary, alt_description, 
        thumbnail_url, category_id, rendering_type, custom_data,
        allow_michelin_rating, allow_stickers, allow_secret_comments 
    } = body;

    // description이 없으면 content_text를 사용 (하위 호환성)
    const finalDescription = description !== undefined ? description : content_text;

    let { data, error } = await (supabaseAdmin as any)
      .from('Project')
      .update({
        title,
        description: finalDescription,
        summary,
        alt_description,
        thumbnail_url,
        category_id,
        rendering_type,
        custom_data,
        allow_michelin_rating,
        allow_stickers,
        allow_secret_comments,
        updated_at: new Date().toISOString()
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
      return NextResponse.json({ error: `수정 실패: ${error.message}` }, { status: 500 });
    }

    // [New] Fields 매핑 동기화
    if (custom_data) {
        // (기존 로직 유지 - 생략 없이 복사)
        try {
            const parsedCustom = typeof custom_data === 'string' ? JSON.parse(custom_data) : custom_data;
            const fieldSlugs = parsedCustom.fields; 

            // 기존 매핑 삭제
            await (supabaseAdmin as any).from('project_fields').delete().eq('project_id', id);

            if (Array.isArray(fieldSlugs) && fieldSlugs.length > 0) {
                const { data: fieldRecords } = await (supabaseAdmin as any)
                    .from('fields').select('id, slug').in('slug', fieldSlugs);

                if (fieldRecords && fieldRecords.length > 0) {
                    const mappings = fieldRecords.map((f: any) => ({
                        project_id: id,
                        field_id: f.id,
                    }));
                    await (supabaseAdmin as any).from('project_fields').insert(mappings);
                }
            }
        } catch (e) {
            console.error('[API] Syncing fields failed:', e);
        }
    }
    
    // [New] Category 매핑 동기화
    if (custom_data) {
        try {
            const parsedCustom = typeof custom_data === 'string' ? JSON.parse(custom_data) : custom_data;
            const genres = parsedCustom.genres || [];
            
            await (supabaseAdmin as any).from('project_categories').delete().eq('project_id', id);

            if (Array.isArray(genres) && genres.length > 0) {
                const { GENRE_TO_CATEGORY_ID } = await import('@/lib/constants');
                const categoryMappings = genres.map((genreSlug: string) => {
                        const catId = GENRE_TO_CATEGORY_ID[genreSlug];
                        return catId ? { project_id: parseInt(id), category_id: catId, category_type: 'genre' } : null;
                    }).filter(Boolean);
                
                if (categoryMappings.length > 0) {
                    await (supabaseAdmin as any).from('project_categories').insert(categoryMappings);
                }
            }
        } catch (e) {
            console.error('[API] Syncing categories failed:', e);
        }
    }

    return NextResponse.json({ message: '프로젝트가 수정되었습니다.', data });
  } catch (error: any) {
    console.error('서버 오류:', error);
    return NextResponse.json({ error: '서버 오류', details: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
     // [Strict Auth] 1. Identify User
    let authenticatedUser: { id: string, email?: string } | null = null;
    const authHeader = request.headers.get('authorization');

    if (authHeader) {
        const token = authHeader.replace(/^Bearer\s+/i, '').trim();
        if (token.startsWith('vf_')) {
             const { data: keyRecord } = await supabaseAdmin.from('api_keys').select('user_id').eq('api_key', token).eq('is_active', true).single();
             if (keyRecord) {
                 const { data: userData } = await supabaseAdmin.auth.admin.getUserById(keyRecord.user_id);
                 authenticatedUser = { id: keyRecord.user_id, email: userData.user?.email };
             }
        }
    } 
    
    if (!authenticatedUser) {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) authenticatedUser = { id: user.id, email: user.email };
    }

    if (!authenticatedUser) {
        return NextResponse.json({ error: 'Unauthorized', code: 'AUTH_REQUIRED' }, { status: 401 });
    }

    // 2. 권한 확인
    const isAdminEmail = authenticatedUser.email && ADMIN_EMAILS.includes(authenticatedUser.email);
    let isDbAdmin = false;
    if (!isAdminEmail) {
      const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('id', authenticatedUser.id).single();
      isDbAdmin = profile?.role === 'admin';
    }
    const isAuthorizedAdmin = isAdminEmail || isDbAdmin;

    // 프로젝트 조회
    const { data: project, error: fetchError } = await (supabaseAdmin as any)
      .from('Project').select('user_id').eq('project_id', id).single();

    if (fetchError || !project) return NextResponse.json({ error: '프로젝트를 찾을 수 없습니다.' }, { status: 404 });

    if (!isAuthorizedAdmin && project.user_id !== authenticatedUser.id) {
       return NextResponse.json({ error: '삭제 권한이 없습니다.' }, { status: 403 });
    }

    // 삭제 (Soft Delete)
    const { error } = await (supabaseAdmin as any)
      .from('Project').update({ deleted_at: new Date().toISOString() }).eq('project_id', id);

    if (error) return NextResponse.json({ error: '삭제 실패', details: error.message }, { status: 500 });

    return NextResponse.json({ message: '프로젝트가 삭제되었습니다.' });
  } catch (error: any) {
    return NextResponse.json({ error: '서버 오류', details: error.message }, { status: 500 });
  }
}
