import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const projectId = parseInt(id);

    if (isNaN(projectId)) {
      return NextResponse.json(
        { error: 'Invalid project ID' },
        { status: 400 }
      );
    }

    // 조회수 증가 (safe)
    const { data: current, error: fetchError } = await supabase
      .from('Project')
      .select('views')
      .eq('project_id', projectId)
      .single();

    if (fetchError) {
      console.error('조회수 조회 실패:', fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    const newViews = ((current as any)?.views ?? 0) + 1;

    const { data, error } = await supabase
      .from('Project')
      .update({ views: newViews } as any)
      .eq('project_id', projectId)
      .select('views')
      .single();

    if (error) {
      console.error('조회수 증가 실패:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ views: data.views });
  } catch (error: any) {
    console.error('조회수 API 오류:', error);
    return NextResponse.json(
      { error: error.message || '조회수 증가 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
