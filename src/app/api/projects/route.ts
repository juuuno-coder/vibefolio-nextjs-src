import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { createClient } from '@supabase/supabase-js';
import { GENRE_TO_CATEGORY_ID } from '@/lib/constants';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// 서비스 키가 있으면 어드민 클라이언트 사용, 없으면 일반 클라이언트 사용
const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey) 
  : supabase;

// 캐시 설정 제거 (실시간 디버깅)
export const revalidate = 0; 

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '20');
    const page = parseInt(searchParams.get('page') || '1');
    const search = searchParams.get('search');
    
    const offset = (page - 1) * limit;

    // 필요한 필드만 선택 (최적화) - 안전하게 모든 컬럼 조회 (관계 제거)
    let query = (supabase as any)
      .from('Project')
      .select('*') 
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // 검색어 필터
    if (search) {
      query = query.or(`title.ilike.%${search}%,content_text.ilike.%${search}%`);
    }

    // 카테고리 필터
    if (category && category !== 'korea' && category !== 'all') {
      const categoryId = GENRE_TO_CATEGORY_ID[category];
      if (categoryId) query = query.eq('category_id', categoryId);
    }

    // 사용자 필터
    if (userId) query = query.eq('user_id', userId);

    const { data, error, count } = await query;

    if (error) {
      console.error('프로젝트 조회 실패:', error);
      return NextResponse.json(
        { error: '프로젝트 조회에 실패했습니다.', details: error.message },
        { status: 500 }
      );
    }

    // 사용자 정보 병합 (Dual Fetching)
    if (data && data.length > 0) {
      const userIds = [...new Set(data.map((p: any) => p.user_id).filter(Boolean))] as string[];

      if (userIds.length > 0) {
        // users 테이블 조회 (일반 클라이언트 사용 - Admin 키 없을 때 대비)
        const targetClient = process.env.SUPABASE_SERVICE_ROLE_KEY ? supabaseAdmin : supabase;
        
        // 가능한 테이블 이름들 (프로젝트마다 다를 수 있음)
        const possibleTables = ['users', 'profiles', 'User'];
        let usersData: any[] | null = null;
        let usersError: any = null;

        for (const tableName of possibleTables) {
          const result = await (targetClient
            .from(tableName as any) as any)
            .select('*') 
            .in('id', userIds);
          
          if (!result.error && result.data && result.data.length > 0) {
            usersData = result.data;
            console.log(`[API] Successfully fetched users from table: ${tableName}`);
            break;
          } else {
            console.log(`[API] Failed to fetch from ${tableName}:`, result.error?.message || 'No data');
            usersError = result.error;
          }
        }

        const userMap = new Map();

        if (usersData && usersData.length > 0) {
          usersData.forEach((u: any) => {
            // 프론트엔드가 기대하는 필드명으로 매핑 (username, avatar_url 등 다양한 케이스 대응)
            userMap.set(u.id, {
              username: u.username || u.nickname || u.name || u.display_name || u.email?.split('@')[0] || 'Unknown',
              avatar_url: u.avatar_url || u.profile_image_url || u.profileImage || u.image || '/globe.svg',
            });
          });
        } else {
          console.warn('[API] No user data found from any table. Users will show as Unknown.');
        }

        data.forEach((project: any) => {
          // 프론트엔드가 users 객체를 기대한다면 users 키에 할당
          project.users = userMap.get(project.user_id) || { username: 'Unknown', avatar_url: '/globe.svg' };
          // 호환성을 위해 User 키에도 할당 (혹시 모를 구형 코드 대응)
          project.User = project.users; 
        });
      }
    }

    return NextResponse.json({
      projects: data, // Compatibility for some admin pages
      data: data, // Alignment with pagination logic
      metadata: {
        total: count || 0,
        page: page,
        limit: limit,
        hasMore: data?.length === limit
      }
    });
  } catch (error: any) {
    console.error('서버 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, category_id, title, summary, content_text, thumbnail_url, rendering_type, custom_data } = body;

    if (!user_id || !category_id || !title) {
      return NextResponse.json({ error: '필수 필드가 누락되었습니다.' }, { status: 400 });
    }

    let { data, error } = await (supabaseAdmin as any)
      .from('Project')
      .insert([{ user_id, category_id, title, summary, content_text, thumbnail_url, rendering_type, custom_data, likes_count: 0, views_count: 0 }] as any)
      .select()
      .single();

    // Fallback: If 'summary' column is missing in DB schema, retry without it
    if (error && error.message && error.message.includes("Could not find the 'summary' column")) {
       console.warn("DB Schema mismatch: 'summary' column missing. Retrying without summary.");
       const retryResult = await (supabaseAdmin as any)
        .from('Project')
        .insert([{ user_id, category_id, title, content_text, thumbnail_url, rendering_type, custom_data, likes_count: 0, views_count: 0 }] as any)
        .select()
        .single();
        
       data = retryResult.data;
       error = retryResult.error;
    }

    if (error) {
      console.error('프로젝트 생성 실패:', error);
      return NextResponse.json(
        { error: `프로젝트 생성 실패: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ project: data }, { status: 201 });
  } catch (error: any) {
    console.error('서버 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
