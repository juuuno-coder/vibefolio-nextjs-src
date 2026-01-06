// src/app/api/follows/route.ts
// 팔로우 추가/제거 API

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

// 팔로우 토글 (팔로우/언팔로우)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { follower_id, following_id } = body;

    if (!follower_id || !following_id) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      );
    }

    if (follower_id === following_id) {
      return NextResponse.json(
        { error: '자기 자신을 팔로우할 수 없습니다.' },
        { status: 400 }
      );
    }

    // 이미 팔로우 중인지 확인
    const { data: existingFollow } = await supabaseAdmin
      .from('Follow')
      .select()
      .eq('follower_id', follower_id)
      .eq('following_id', following_id)
      .single();

    if (existingFollow) {
      // 언팔로우
      const { error } = await (supabaseAdmin as any)
        .from('Follow')
        .delete()
        .eq('follower_id', follower_id)
        .eq('following_id', following_id);

      if (error) {
        console.error('언팔로우 실패:', error);
        return NextResponse.json(
          { error: '언팔로우에 실패했습니다.' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        following: false,
        message: '팔로우를 취소했습니다.',
      });
    } else {
      // 팔로우
      const { error } = await (supabaseAdmin as any)
        .from('Follow')
        .insert([{ follower_id, following_id }] as any);

      if (error) {
        console.error('팔로우 실패:', error);
        return NextResponse.json(
          { error: '팔로우에 실패했습니다.' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        following: true,
        message: '팔로우 했습니다.',
      });
    }
  } catch (error) {
    console.error('서버 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 팔로우 상태 조회
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const followerId = searchParams.get('followerId');
    const followingId = searchParams.get('followingId');
    const userId = searchParams.get('userId');
    const type = searchParams.get('type'); // 'followers' | 'following'

    // 팔로우 여부 확인
    if (followerId && followingId) {
      const { data } = await supabaseAdmin
        .from('Follow')
        .select()
        .eq('follower_id', followerId)
        .eq('following_id', followingId)
        .single();

      return NextResponse.json({ following: !!data });
    }

    // 사용자의 팔로워/팔로잉 목록 조회
    if (userId && type) {
      if (type === 'followers') {
        // 나를 팔로우하는 사람들
        const { data, error, count } = await supabaseAdmin
          .from('Follow')
          .select(
            `
            follower_id,
            created_at,
            users!follower_id (
              id,
              nickname,
              profile_image_url
            )
          `,
            { count: 'exact' }
          )
          .eq('following_id', userId)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('팔로워 조회 실패:', error);
          return NextResponse.json(
            { error: '팔로워 조회에 실패했습니다.' },
            { status: 500 }
          );
        }

        return NextResponse.json({ followers: data, count: count || 0 });
      } else if (type === 'following') {
        // 내가 팔로우하는 사람들
        const { data, error, count } = await supabaseAdmin
          .from('Follow')
          .select(
            `
            following_id,
            created_at,
            users!following_id (
              id,
              nickname,
              profile_image_url
            )
          `,
            { count: 'exact' }
          )
          .eq('follower_id', userId)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('팔로잉 조회 실패:', error);
          return NextResponse.json(
            { error: '팔로잉 조회에 실패했습니다.' },
            { status: 500 }
          );
        }

        return NextResponse.json({ following: data, count: count || 0 });
      }
    }

    // 팔로워/팔로잉 수 조회
    if (userId) {
      const { count: followersCount } = await supabaseAdmin
        .from('Follow')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', userId);

      const { count: followingCount } = await supabaseAdmin
        .from('Follow')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', userId);

      return NextResponse.json({
        followersCount: followersCount || 0,
        followingCount: followingCount || 0,
      });
    }

    return NextResponse.json(
      { error: 'userId 또는 followerId/followingId가 필요합니다.' },
      { status: 400 }
    );
  } catch (error) {
    console.error('서버 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
