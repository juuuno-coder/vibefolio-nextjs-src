// app/api/v1/projects/route.ts
// Public API for External Project Registration

import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey } from '@/lib/api/auth';
import { createClient } from '@supabase/supabase-js';
import { GENRE_TO_CATEGORY_ID } from '@/lib/constants';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

/**
 * POST /api/v1/projects
 * 외부에서 새 프로젝트 등록
 */
export async function POST(request: NextRequest) {
  try {
    // 1. API Key 인증
    const authResult = await authenticateApiKey(request);
    
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const { userId } = authResult.data;

    // 2. 요청 본문 파싱
    const body = await request.json();
    const {
      title,
      description,
      content,
      visibility = 'public',
      categories = [],
      tech_stack = [],
      thumbnail_base64,
      screenshots_base64 = [],
      live_url,
      repo_url,
      version,
    } = body;

    // 3. 필수 필드 검증
    if (!title) {
      return NextResponse.json(
        { error: 'Missing required field: title' },
        { status: 400 }
      );
    }

    // 4. 썸네일 업로드 (Base64 → Supabase Storage)
    let thumbnailUrl = null;
    if (thumbnail_base64) {
      try {
        const base64Data = thumbnail_base64.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        const fileName = `${userId}/${Date.now()}_thumbnail.png`;

        const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
          .from('project-images')
          .upload(fileName, buffer, {
            contentType: 'image/png',
            upsert: false
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabaseAdmin.storage
          .from('project-images')
          .getPublicUrl(fileName);

        thumbnailUrl = publicUrl;
      } catch (error) {
        console.error('[API] Thumbnail upload failed:', error);
        // Continue without thumbnail
      }
    }

    // 5. 카테고리 ID 매핑 (첫 번째 카테고리를 메인으로)
    let categoryId = 1; // Default
    if (categories.length > 0) {
      const firstCategory = categories[0];
      categoryId = GENRE_TO_CATEGORY_ID[firstCategory] || 1;
    }

    // 6. 프로젝트 생성
    const { data: project, error: projectError } = await (supabaseAdmin as any)
      .from('Project')
      .insert({
        user_id: userId,
        category_id: categoryId,
        title: title,
        description: description || '',
        content_text: content || description || '',
        thumbnail_url: thumbnailUrl,
        rendering_type: 'rich_text',
        visibility: visibility,
        custom_data: JSON.stringify({
          genres: categories,
          tech_stack: tech_stack,
          live_url: live_url,
          repo_url: repo_url,
          api_created: true,
          created_via: 'api_v1'
        }),
        allow_michelin_rating: true,
        allow_stickers: true,
        allow_secret_comments: true,
        likes_count: 0,
        views_count: 0
      })
      .select()
      .single();

    if (projectError) {
      console.error('[API] Project creation failed:', projectError);
      return NextResponse.json(
        { error: 'Failed to create project', details: projectError.message },
        { status: 500 }
      );
    }

    // 7. 복수 카테고리 저장 (project_categories)
    if (categories.length > 0 && project) {
      const categoryMappings = categories
        .map((cat: string) => {
          const catId = GENRE_TO_CATEGORY_ID[cat];
          if (catId) {
            return {
              project_id: project.project_id,
              category_id: catId,
              category_type: 'genre'
            };
          }
          return null;
        })
        .filter(Boolean);

      if (categoryMappings.length > 0) {
        await (supabaseAdmin as any)
          .from('project_categories')
          .insert(categoryMappings);
      }
    }

    // 8. 버전 정보가 있으면 버전 히스토리 생성
    if (version && project) {
      await (supabaseAdmin as any)
        .from('project_versions')
        .insert({
          project_id: project.project_id,
          version_tag: version.tag || '1.0.0',
          version_name: version.name || null,
          changelog: version.changelog || 'Initial release',
          release_type: version.release_type || 'initial',
          snapshot_data: {
            title: title,
            description: description,
            thumbnail_url: thumbnailUrl
          }
        });
    }

    // 9. 성공 응답
    return NextResponse.json({
      success: true,
      project: {
        id: project.project_id,
        title: project.title,
        url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://vibefolio.net'}/project/${project.project_id}`,
        thumbnail_url: thumbnailUrl,
        visibility: visibility,
        created_at: project.created_at
      }
    }, { status: 201 });

  } catch (error: any) {
    console.error('[API v1] POST /projects error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v1/projects
 * 사용자의 프로젝트 목록 조회
 */
export async function GET(request: NextRequest) {
  try {
    // 1. API Key 인증
    const authResult = await authenticateApiKey(request);
    
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const { userId } = authResult.data;

    // 2. 쿼리 파라미터
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '20');
    const page = parseInt(searchParams.get('page') || '1');
    const offset = (page - 1) * limit;

    // 3. 프로젝트 조회
    const { data: projects, error } = await (supabaseAdmin as any)
      .from('Project')
      .select('project_id, title, description, thumbnail_url, visibility, created_at, updated_at, views_count, likes_count')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch projects', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      projects: projects || [],
      pagination: {
        page,
        limit,
        total: projects?.length || 0
      }
    });

  } catch (error: any) {
    console.error('[API v1] GET /projects error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
