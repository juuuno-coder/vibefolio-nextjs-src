// app/api/v1/projects/[id]/route.ts
// Public API for Project Updates

import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey } from '@/lib/api/auth';
import { createClient } from '@supabase/supabase-js';
import { GENRE_TO_CATEGORY_ID } from '@/lib/constants';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

/**
 * GET /api/v1/projects/[id]
 * 특정 프로젝트 조회
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    const authResult = await authenticateApiKey(request);
    
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const { userId } = authResult.data;

    const { data: project, error } = await (supabaseAdmin as any)
      .from('Project')
      .select('*')
      .eq('project_id', id)
      .eq('user_id', userId)
      .single();

    if (error || !project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      project: project
    });

  } catch (error: any) {
    console.error('[API v1] GET /projects/[id] error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/v1/projects/[id]
 * 프로젝트 수정
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    const authResult = await authenticateApiKey(request);
    
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const { userId } = authResult.data;

    // 권한 확인
    const { data: existingProject } = await (supabaseAdmin as any)
      .from('Project')
      .select('user_id')
      .eq('project_id', id)
      .single();

    if (!existingProject || existingProject.user_id !== userId) {
      return NextResponse.json(
        { error: 'Project not found or access denied' },
        { status: 404 }
      );
    }

    // 요청 본문
    const body = await request.json();
    const {
      title,
      description,
      content,
      visibility,
      categories,
      thumbnail_base64,
    } = body;

    // 썸네일 업로드
    let thumbnailUrl = undefined;
    if (thumbnail_base64) {
      try {
        const base64Data = thumbnail_base64.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        const fileName = `${userId}/${Date.now()}_thumbnail.png`;

        const { error: uploadError } = await supabaseAdmin.storage
          .from('project-images')
          .upload(fileName, buffer, {
            contentType: 'image/png',
            upsert: false
          });

        if (!uploadError) {
          const { data: { publicUrl } } = supabaseAdmin.storage
            .from('project-images')
            .getPublicUrl(fileName);
          thumbnailUrl = publicUrl;
        }
      } catch (error) {
        console.error('[API] Thumbnail upload failed:', error);
      }
    }

    // 업데이트 데이터 준비
    const updateData: any = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (content) updateData.content_text = content;
    if (visibility) updateData.visibility = visibility;
    if (thumbnailUrl) updateData.thumbnail_url = thumbnailUrl;

    // 프로젝트 업데이트
    const { data: updatedProject, error: updateError } = await (supabaseAdmin as any)
      .from('Project')
      .update(updateData)
      .eq('project_id', id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update project', details: updateError.message },
        { status: 500 }
      );
    }

    // 카테고리 업데이트
    if (categories && categories.length > 0) {
      // 기존 카테고리 삭제
      await (supabaseAdmin as any)
        .from('project_categories')
        .delete()
        .eq('project_id', id);

      // 새 카테고리 추가
      const categoryMappings = categories
        .map((cat: string) => {
          const catId = GENRE_TO_CATEGORY_ID[cat];
          if (catId) {
            return {
              project_id: parseInt(id),
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

    return NextResponse.json({
      success: true,
      project: updatedProject
    });

  } catch (error: any) {
    console.error('[API v1] PUT /projects/[id] error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/v1/projects/[id]
 * 프로젝트 삭제
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    const authResult = await authenticateApiKey(request);
    
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const { userId } = authResult.data;

    // 권한 확인
    const { data: existingProject } = await (supabaseAdmin as any)
      .from('Project')
      .select('user_id')
      .eq('project_id', id)
      .single();

    if (!existingProject || existingProject.user_id !== userId) {
      return NextResponse.json(
        { error: 'Project not found or access denied' },
        { status: 404 }
      );
    }

    // Soft delete
    const { error } = await (supabaseAdmin as any)
      .from('Project')
      .update({ deleted_at: new Date().toISOString() })
      .eq('project_id', id);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to delete project', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Project deleted successfully'
    });

  } catch (error: any) {
    console.error('[API v1] DELETE /projects/[id] error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
