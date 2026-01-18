// app/api/v1/projects/[id]/versions/route.ts
// Public API for Project Version Management

import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey } from '@/lib/api/auth';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

/**
 * POST /api/v1/projects/[id]/versions
 * 새 버전 추가
 */
export async function POST(
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
    const { data: project } = await (supabaseAdmin as any)
      .from('Project')
      .select('user_id, title, description, thumbnail_url')
      .eq('project_id', id)
      .single();

    if (!project || project.user_id !== userId) {
      return NextResponse.json(
        { error: 'Project not found or access denied' },
        { status: 404 }
      );
    }

    // 요청 본문
    const body = await request.json();
    const {
      version_tag,
      version_name,
      changelog,
      release_type = 'minor',
    } = body;

    if (!version_tag) {
      return NextResponse.json(
        { error: 'Missing required field: version_tag' },
        { status: 400 }
      );
    }

    // 버전 생성
    const { data: version, error: versionError } = await (supabaseAdmin as any)
      .from('project_versions')
      .insert({
        project_id: parseInt(id),
        version_tag: version_tag,
        version_name: version_name || null,
        changelog: changelog || '',
        release_type: release_type,
        snapshot_data: {
          title: project.title,
          description: project.description,
          thumbnail_url: project.thumbnail_url,
          created_via: 'api_v1'
        }
      })
      .select()
      .single();

    if (versionError) {
      return NextResponse.json(
        { error: 'Failed to create version', details: versionError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      version: version
    }, { status: 201 });

  } catch (error: any) {
    console.error('[API v1] POST /projects/[id]/versions error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v1/projects/[id]/versions
 * 프로젝트의 모든 버전 조회
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

    // 권한 확인
    const { data: project } = await (supabaseAdmin as any)
      .from('Project')
      .select('user_id')
      .eq('project_id', id)
      .single();

    if (!project || project.user_id !== userId) {
      return NextResponse.json(
        { error: 'Project not found or access denied' },
        { status: 404 }
      );
    }

    // 버전 목록 조회
    const { data: versions, error } = await (supabaseAdmin as any)
      .from('project_versions')
      .select('*')
      .eq('project_id', id)
      .order('released_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch versions', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      versions: versions || []
    });

  } catch (error: any) {
    console.error('[API v1] GET /projects/[id]/versions error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
