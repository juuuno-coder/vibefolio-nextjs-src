// src/app/api/likes/route.ts
// 좋아요 추가/제거 API

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

// Helper for Strict Auth
async function validateUser(request: NextRequest) {
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
        const token = authHeader.replace(/^Bearer\s+/i, '').trim();
        if (token.startsWith('vf_')) {
             const { data: keyRecord } = await supabaseAdmin
                .from('api_keys')
                .select('user_id')
                .eq('api_key', token)
                .eq('is_active', true)
                .single();
             if (keyRecord) return { id: keyRecord.user_id };
        }
    }
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) return { id: user.id };
    return null;
}

export async function POST(request: NextRequest) {
  try {
    const authenticatedUser = await validateUser(request);
    if (!authenticatedUser) {
       return NextResponse.json({ error: 'Unauthorized', code: 'AUTH_REQUIRED' }, { status: 401 });
    }
    const userId = authenticatedUser.id;

    const body = await request.json();
    const { projectId, project_id } = body;
    const targetProjectId = projectId || project_id;

    if (!targetProjectId) {
      return NextResponse.json({ error: '프로젝트 ID가 필요합니다.' }, { status: 400 });
    }

    const { data: existingLike } = await supabaseAdmin
      .from('Like')
      .select('user_id, project_id')
      .eq('user_id', userId)
      .eq('project_id', targetProjectId)
      .single();

    if (existingLike) {
      const { error } = await (supabaseAdmin as any)
        .from('Like')
        .delete()
        .eq('user_id', userId)
        .eq('project_id', targetProjectId);

      if (error) return NextResponse.json({ error: '좋아요 제거 실패' }, { status: 500 });
      return NextResponse.json({ liked: false, message: '좋아요 취소' });
    } else {
      const { error } = await (supabaseAdmin as any)
        .from('Like')
        .insert([{ user_id: userId, project_id: targetProjectId }] as any);

      if (error) return NextResponse.json({ error: '좋아요 추가 실패' }, { status: 500 });
      return NextResponse.json({ liked: true, message: '좋아요 추가' });
    }
  } catch (error) {
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
      const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const projectId = searchParams.get('projectId') || searchParams.get('project_id');

    if (userId && projectId) {
      const { data } = await supabaseAdmin
        .from('Like')
        .select('user_id')
        .eq('user_id', userId)
        .eq('project_id', projectId)
        .single();
      return NextResponse.json({ liked: !!data });
    } else if (userId) {
      const { data: likes, error } = await supabaseAdmin
        .from('Like')
        .select('project_id, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) return NextResponse.json({ error: '좋아요 목록 조회 실패' }, { status: 500 });

      if (likes && likes.length > 0) {
        const projectIds = likes.map((like: any) => like.project_id);
        const { data: projects } = await supabaseAdmin
          .from('Project')
          .select('project_id, title, thumbnail_url, user_id')
          .in('project_id', projectIds);

        if (projects) {
          const userIds = [...new Set(projects.map((p: any) => p.user_id))];
          const { data: profiles } = await supabaseAdmin.from('profiles').select('id, username, avatar_url').in('id', userIds);
          const profileMap = new Map(profiles?.map((p: any) => [p.id, p]) || []);

          const enrichedLikes = likes.map((like: any) => {
            const project = projects.find((p: any) => p.project_id === like.project_id);
            if (project) {
              const profile = profileMap.get(project.user_id);
              return {
                ...like,
                Project: {
                  ...project,
                  user: profile ? {
                    id: profile.id,
                    username: profile.username || 'Unknown',
                    profile_image_url: profile.avatar_url || '/globe.svg'
                  } : null
                }
              };
            }
            return like;
          });
          return NextResponse.json({ likes: enrichedLikes });
        }
      }
      return NextResponse.json({ likes: likes || [] });
    } else if (projectId) {
      const { count, error } = await supabaseAdmin
        .from('Like')
        .select('project_id', { count: 'exact', head: true })
        .eq('project_id', projectId);
      if (error) return NextResponse.json({ error: '좋아요 수 조회 실패' }, { status: 500 });
      return NextResponse.json({ count: count || 0 });
    }
    return NextResponse.json({ error: '파라미터 필요' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}
