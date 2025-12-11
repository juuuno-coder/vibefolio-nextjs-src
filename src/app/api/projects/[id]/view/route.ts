import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = parseInt(params.id);

    if (isNaN(projectId)) {
      return NextResponse.json(
        { error: 'Invalid project ID' },
        { status: 400 }
      );
    }

    // 조회수 증가
    const { data, error } = await supabase
      .from('Project')
      .update({ views: supabase.raw('views + 1') })
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
