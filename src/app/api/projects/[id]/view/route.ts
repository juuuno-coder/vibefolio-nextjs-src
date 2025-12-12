import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import type { ProjectRow } from '@/types/supabase';
import { handleApiError } from '@/lib/apiError';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const projectId = parseInt(id);

    if (isNaN(projectId)) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
    }

    // 현재 조회수 가져오기 (안전)
    const { data: current, error: fetchError } = await supabase
      .from<ProjectRow>('Project')
      .select('views')
      .eq('project_id', projectId)
      .single();

    if (fetchError) {
      return NextResponse.json(handleApiError(fetchError, '조회수 조회 실패', 500));
    }

    const newViews = (current?.views ?? 0) + 1;

    // 조회수 업데이트
    const { data, error } = await supabase
      .from<ProjectRow>('Project')
      .update({ views: newViews } as Partial<ProjectRow>)
      .eq('project_id', projectId)
      .select('views')
      .single();

    if (error) {
      return NextResponse.json(handleApiError(error, '조회수 증가 실패', 500));
    }

    return NextResponse.json({ views: data.views });
  } catch (err: any) {
    return NextResponse.json(handleApiError(err, '조회수 API 오류'));
  }
}
