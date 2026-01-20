// src/app/api/projects/[id]/route.ts
// 개별 프로젝트 조회, 수정, 삭제 API

import { NextRequest, NextResponse } from 'next/server';
import { supabase as supabaseAnon } from '@/lib/supabase/client';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { GENRE_TO_CATEGORY_ID } from '@/lib/constants';

import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    // [Application-Level Security]
    // RLS Context issues in Next.js API Routes can cause "load failed" errors even for owners.
    // We solve this by implementing strict Application-Level Authorization:
    // 1. Verify User Identity (via Token or Cookie)
    // 2. Fetch Data (via Admin Client, ensuring availability)
    // 3. Verify Ownership/Visibility explicitly in code before returning

    let user = null;
    const authHeader = request.headers.get('Authorization');

    // 1. Identify User
    if (authHeader) {
        const token = authHeader.replace(/^Bearer\s+/i, '').trim();
        // Try getting user from Auth (JWT Verification)
        const { data: { user: authUser }, error } = await supabaseAdmin.auth.getUser(token);
        user = authUser;
    } 
    
    if (!user) {
        // Fallback to Cookie Session
        const supabase = createClient();
        const { data: { user: cookieUser } } = await supabase.auth.getUser();
        user = cookieUser;
    }

    // 2. Fetch Data (Securely via Admin)
    const { data, error } = await (supabaseAdmin as any)
      .from('Project')
      .select('*')
      .eq('project_id', id)
      .single();

    if (error || !data) {
      console.error('프로젝트 조회 실패 (App-Level):', error);
      return NextResponse.json(
        { error: '프로젝트를 찾을 수 없습니다.', details: error?.message },
        { status: 404 }
      );
    }

    // 3. Authorization Check (Strict)
    const isOwner = user && user.id === data.user_id;
    const isPublic = !data.visibility || data.visibility === 'public'; // Default to public if null for legacy compatibility

    // If not public AND not owner, deny access
    if (!isPublic && !isOwner) {
        return NextResponse.json(
            { error: '접근 권한이 없습니다. (비공개 프로젝트)' },
            { status: 403 }
        );
    }

    // 4. Populate User Info (If accessible)
    if (data.user_id) {
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
        data.User = null;
      }
    }

    // 5. Update Views (Admin)
    await supabaseAdmin
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
        } else {
             // [Fix] Support JWT Token for Client-side requests
             const { data: { user } } = await supabaseAdmin.auth.getUser(token);
             if (user) {
                 authenticatedUser = { id: user.id, email: user.email };
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

    // 프로젝트 소유자 확인 및 기존 데이터 조회 (Merge용)
    const { data: existingProject, error: fetchError } = await (supabaseAdmin as any)
      .from('Project')
      .select('user_id, custom_data')
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
    let { 
        title, content_text, content, body: bodyContent, text, // Content variants
        description, summary, alt_description, 
        thumbnail_url, category_id, rendering_type, custom_data,
        allow_michelin_rating, allow_stickers, allow_secret_comments,
        scheduled_at, visibility, assets
    } = body;

    // [Robustness] Normalize Content
    let finalContent = content_text || content || bodyContent || text; 

    // Assets & Custom Data Handling (Smart Merge)
    let finalCustomData: any = undefined; // Keep as Object for JSONB
    
    // 뭔가 변경사항(custom_data, assets)이 있을 때만 계산
    if (custom_data !== undefined || assets !== undefined) {
        try {
            // 1) 기존 데이터 파싱 (객체화)
            let baseData = {};
            if (existingProject.custom_data) {
                baseData = typeof existingProject.custom_data === 'string' 
                    ? JSON.parse(existingProject.custom_data) 
                    : existingProject.custom_data;
            }

            // 2) 새 custom_data 병합 (있다면)
            if (custom_data) {
                const newCustom = typeof custom_data === 'string' ? JSON.parse(custom_data) : custom_data;
                // Shallow Merge: 기존 키 유지, 새 키 덮어쓰기
                baseData = { ...baseData, ...newCustom };
            }

            // 3) Assets 덮어쓰기 (있다면)
            if (assets) {
                (baseData as any).assets = assets;
            }

            finalCustomData = baseData; // 객체 그대로 저장
        } catch (e) {
            console.error('[API] Custom Data Merge Error:', e);
            // 에러 시 복구 시도
            if (assets) finalCustomData = { assets };
            else if (custom_data) finalCustomData = typeof custom_data === 'string' ? JSON.parse(custom_data) : custom_data;
        }
    }

    // Build Update Object dynamically
    const updatePayload: any = {
        updated_at: new Date().toISOString()
    };

    if (title !== undefined) updatePayload.title = title;
    if (finalContent !== undefined) updatePayload.content_text = finalContent;
    if (description !== undefined) updatePayload.description = description;
    // description이 없다고 바로 content_text로 덮어쓰지 않음 (의도적 삭제일 수도, Partial일 수도)
    // 단, "생성"이 아니라 "수정"이므로 명시적으로 보낸 값만 처리가 원칙.
    
    if (summary !== undefined) updatePayload.summary = summary;
    if (alt_description !== undefined) updatePayload.alt_description = alt_description;
    if (thumbnail_url !== undefined) updatePayload.thumbnail_url = thumbnail_url;
    if (category_id !== undefined) updatePayload.category_id = category_id;
    if (rendering_type !== undefined) updatePayload.rendering_type = rendering_type;
    if (finalCustomData !== undefined) updatePayload.custom_data = finalCustomData; // 병합된 결과 적용
    
    if (allow_michelin_rating !== undefined) updatePayload.allow_michelin_rating = allow_michelin_rating;
    if (allow_stickers !== undefined) updatePayload.allow_stickers = allow_stickers;
    if (allow_secret_comments !== undefined) updatePayload.allow_secret_comments = allow_secret_comments;
    if (scheduled_at !== undefined) updatePayload.scheduled_at = scheduled_at ? new Date(scheduled_at).toISOString() : null;
    if (visibility !== undefined) updatePayload.visibility = visibility;

    let { data, error } = await (supabaseAdmin as any)
      .from('Project')
      .update(updatePayload)
      .eq('project_id', id)
      .select('*')
      .single();

    if (error) {
      console.error('프로젝트 수정 실패:', error);
      return NextResponse.json({ error: `수정 실패: ${error.message}` }, { status: 500 });
    }

    // [New] Fields 매핑 동기화
    // custom_data가 변경되었을 때만 수행 (finalCustomData가 있으면)
    if (finalCustomData) { 
        try {
             // finalCustomData is already an Object
             const fieldSlugs = finalCustomData.fields; 

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
    if (finalCustomData) { 
        try {
            const genres = finalCustomData.genres || [];
            
            await (supabaseAdmin as any).from('project_categories').delete().eq('project_id', id);

            if (Array.isArray(genres) && genres.length > 0) {
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
                 // isApiContext = true; // Mark as API Context - Not needed for DELETE
             }
        } else {
             // [Fix] Support JWT Token for Client-side requests
             const { data: { user } } = await supabaseAdmin.auth.getUser(token);
             if (user) {
                 authenticatedUser = { id: user.id, email: user.email };
             }
        }
    } 
    
    // The following block is removed as the JWT handling is now part of the 'if (authHeader)' block
    // if (!authenticatedUser) {
    //     const supabase = createClient();
    //     const { data: { user } } = await supabase.auth.getUser();
    //     if (user) authenticatedUser = { id: user.id, email: user.email };
    // }

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
