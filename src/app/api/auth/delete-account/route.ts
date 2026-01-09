// src/app/api/auth/delete-account/route.ts
// 회원탈퇴 API 엔드포인트

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Admin 클라이언트 (사용자 삭제 권한)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export async function DELETE(request: NextRequest) {
  try {
    // 1. Authorization 헤더에서 토큰 추출
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');

    // 2. 토큰으로 사용자 확인
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: '유효하지 않은 인증입니다.' },
        { status: 401 }
      );
    }

    const userId = user.id;
    console.log(`🗑️ [Delete Account] Starting deletion for user: ${userId}`);

    // 3. 관련 데이터 삭제 (순서 중요 - 외래키 제약 고려)
    const deleteOperations = [
      // 댓글 삭제
      supabaseAdmin.from('Comment').delete().eq('user_id', userId),
      // 좋아요 삭제
      supabaseAdmin.from('Like').delete().eq('user_id', userId),
      // 위시리스트 삭제
      supabaseAdmin.from('Wishlist').delete().eq('user_id', userId),
      // 컬렉션 아이템 삭제 (컬렉션 ID로 먼저 조회 필요)
      // 팔로우 삭제 (팔로워/팔로잉 모두)
      supabaseAdmin.from('Follow').delete().eq('follower_id', userId),
      supabaseAdmin.from('Follow').delete().eq('following_id', userId),
      // 제안 삭제 (보낸 것, 받은 것 모두)
      supabaseAdmin.from('Proposal').delete().eq('sender_id', userId),
      supabaseAdmin.from('Proposal').delete().eq('receiver_id', userId),
    ];

    // 병렬 삭제 실행
    await Promise.allSettled(deleteOperations);

    // 4. 컬렉션 및 컬렉션 아이템 삭제
    const { data: collections } = await supabaseAdmin
      .from('Collection')
      .select('collection_id')
      .eq('user_id', userId);

    if (collections && collections.length > 0) {
      const collectionIds = collections.map(c => c.collection_id);
      await supabaseAdmin
        .from('CollectionItem')
        .delete()
        .in('collection_id', collectionIds);
      
      await supabaseAdmin
        .from('Collection')
        .delete()
        .eq('user_id', userId);
    }

    // 5. 프로젝트 삭제 (프로젝트에 연결된 댓글/좋아요는 CASCADE로 삭제되거나 이미 삭제됨)
    await supabaseAdmin.from('Project').delete().eq('user_id', userId);

    // 6. 프로필 삭제
    await supabaseAdmin.from('profiles').delete().eq('id', userId);

    // 7. Auth에서 사용자 삭제 (최종)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error('❌ [Delete Account] Auth deletion failed:', deleteError);
      return NextResponse.json(
        { error: '계정 삭제에 실패했습니다. 관리자에게 문의하세요.' },
        { status: 500 }
      );
    }

    console.log(`✅ [Delete Account] Successfully deleted user: ${userId}`);

    return NextResponse.json({
      success: true,
      message: '계정이 성공적으로 삭제되었습니다.',
    });

  } catch (error) {
    console.error('💥 [Delete Account] Error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
