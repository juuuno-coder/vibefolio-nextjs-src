// src/app/api/users/[id]/projects/route.ts
// 사용자가 올린 프로젝트 목록 조회 API

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { data, error } = await supabaseAdmin
      .from('Project')
      .select(`
        *,
        users (
          id,
          nickname,
          profile_image_url
        ),
        Category (
          category_id,
          name
        )
      `)
      .eq('user_id', id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('프로젝트 목록 조회 실패:', error);
      return NextResponse.json(
        { error: '프로젝트 목록 조회에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ projects: data });
  } catch (error) {
    console.error('서버 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
