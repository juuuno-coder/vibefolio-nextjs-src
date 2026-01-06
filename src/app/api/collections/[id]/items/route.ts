// src/app/api/collections/[id]/items/route.ts
// 컬렉션에 프로젝트 추가/제거 API

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

// 컬렉션 아이템 추가
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: collectionId } = await params;
  
  try {
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

    const body = await request.json();
    const { projectId } = body;

    console.log('컬렉션 아이템 추가 요청:', { collectionId, projectId, userId: user.id });

    if (!projectId) {
      return NextResponse.json(
        { error: '프로젝트 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 컬렉션 소유자 확인
    const { data: collection, error: collectionError } = await supabaseAdmin
      .from('Collection')
      .select('user_id')
      .eq('collection_id', collectionId)
      .single() as { data: { user_id: string } | null; error: any };

    console.log('컬렉션 조회 결과:', { collection, collectionError });

    if (collectionError || !collection) {
      return NextResponse.json(
        { error: '컬렉션을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    if (collection.user_id !== user.id) {
      return NextResponse.json(
        { error: '권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 이미 추가되어 있는지 확인
    const { data: existing } = await supabaseAdmin
      .from('CollectionItem')
      .select()
      .eq('collection_id', collectionId)
      .eq('project_id', projectId)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: '이미 컬렉션에 추가된 프로젝트입니다.' },
        { status: 400 }
      );
    }

    // 컬렉션에 추가
    const { data, error } = await (supabaseAdmin as any)
      .from('CollectionItem')
      .insert([{
        collection_id: collectionId,
        project_id: projectId
      }] as any)
      .select()
      .single();

    if (error) {
      console.error('컬렉션 아이템 추가 실패:', error);
      return NextResponse.json(
        { error: `컬렉션에 추가하는데 실패했습니다: ${error.message}` },
        { status: 500 }
      );
    }

    console.log('컬렉션 아이템 추가 성공:', data);
    return NextResponse.json({ item: data, message: '컬렉션에 추가되었습니다.' });
  } catch (error) {
    console.error('서버 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 컬렉션 아이템 제거
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: collectionId } = await params;
  
  try {
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

    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { error: '프로젝트 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 컬렉션 소유자 확인
    const { data: collection } = await supabaseAdmin
      .from('Collection')
      .select('user_id')
      .eq('collection_id', collectionId)
      .single() as { data: { user_id: string } | null };

    if (!collection || collection.user_id !== user.id) {
      return NextResponse.json(
        { error: '권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 컬렉션에서 제거
    const { error } = await (supabaseAdmin as any)
      .from('CollectionItem')
      .delete()
      .eq('collection_id', collectionId)
      .eq('project_id', projectId);

    if (error) {
      console.error('컬렉션 아이템 제거 실패:', error);
      return NextResponse.json(
        { error: '컬렉션에서 제거하는데 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: '컬렉션에서 제거되었습니다.' });
  } catch (error) {
    console.error('서버 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
