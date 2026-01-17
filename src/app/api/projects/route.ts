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
      .is('deleted_at', null) 
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // [Scheduled Publishing] Filter out future posts unless it's the owner requesting
    // Note: Since we don't have session verification here easily (without header parsing), 
    // we default to filtering. The client usually requests 'mypage' data via client-side query 
    // or specific API. If authentication is presented, we could bypass.
    // However, for simplicity and safety: always filter details for public list.
    // If 'userId' is present, we might want to check ownership, but let's stick to Safe Default.
    // (MyPage uses client-side fetch usually with direct RLS, but here we enforce API logic)
    
    // Check Authorization header to see if the requester is the owner of the requested userId profile
    const authHeader = request.headers.get('Authorization');
    let isOwner = false;
    
    if (userId && authHeader) {
        try {
            const token = authHeader.replace('Bearer ', '');
            const { data: { user } } = await supabase.auth.getUser(token);
            if (user && user.id === userId) {
                isOwner = true;
            }
        } catch (e) {}
    }

    if (!isOwner) {
       // Filter: scheduled_at IS NULL OR scheduled_at <= NOW()
       const nowISO = new Date().toISOString();
       query = query.or(`scheduled_at.is.null,scheduled_at.lte.${nowISO}`);
    }

    // 검색어 필터
    if (search) {
      query = query.or(`title.ilike.%${search}%,content_text.ilike.%${search}%`);
    }

    // 카테고리 필터
    if (category && category !== 'korea' && category !== 'all') {
      const categoryId = GENRE_TO_CATEGORY_ID[category];
      if (categoryId) query = query.eq('category_id', categoryId);
    }

    // [New] 분야 필터 (project_fields 테이블 조인 대체)
    const field = searchParams.get('field');
    const mode = searchParams.get('mode');

    // [Growth Mode] Filter
    if (mode === 'growth') {
      query = query.or('custom_data.ilike.%"is_feedback_requested":true%,custom_data.ilike.%"is_feedback_requested": true%');
    }

    if (field && field !== 'all') {
       // 1. 해당 슬러그의 Field ID 조회
       const { data: fieldData } = await (supabase as any)
         .from('fields').select('id').eq('slug', field).single();
       
       if (fieldData) {
          // 2. 해당 Field를 가진 프로젝트 ID들 조회
          const { data: pFields } = await (supabase as any)
             .from('project_fields').select('project_id').eq('field_id', fieldData.id);
          
          if (pFields && pFields.length > 0) {
             const pIds = pFields.map((row:any) => row.project_id);
             query = query.in('project_id', pIds);
          } else {
             // 해당 분야의 프로젝트가 없음 -> 빈 결과 반환
             query = query.eq('project_id', -1); 
          }
       }
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
            userMap.set(u.id, {
              username: u.username || u.nickname || u.name || u.display_name || u.email?.split('@')[0] || 'Unknown',
              avatar_url: u.avatar_url || u.profile_image_url || u.profileImage || u.image || '/globe.svg',
            });
          });
        } else {
          console.warn('[API] No user data found from any table. Users will show as Unknown.');
        }

        data.forEach((project: any) => {
          project.users = userMap.get(project.user_id) || { username: 'Unknown', avatar_url: '/globe.svg' };
          project.User = project.users; 
        });
      }
    }

    return NextResponse.json({
      projects: data, 
      data: data, 
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
    const { 
      user_id, category_id, title, summary, content_text, thumbnail_url, rendering_type, custom_data,
      allow_michelin_rating, allow_stickers, allow_secret_comments, scheduled_at 
    } = body;

    if (!user_id || !category_id || !title) {
      return NextResponse.json({ error: '필수 필드가 누락되었습니다.' }, { status: 400 });
    }

    // [Point System] Growth Mode Check & Points Deduction
    let isGrowthMode = false;
    if (custom_data) {
        try {
            const parsed = typeof custom_data === 'string' ? JSON.parse(custom_data) : custom_data;
            if (parsed.is_feedback_requested) {
                isGrowthMode = true;
            }
        } catch (e) { console.error('Custom data parse error', e); }
    }

    if (isGrowthMode) {
        // 1. Check User Points
        const { data: profile, error: profileError } = await (supabaseAdmin as any)
            .from('profiles')
            .select('points')
            .eq('id', user_id)
            .single();
        
        if (profileError || !profile) {
            return NextResponse.json({ error: '사용자 정보를 찾을 수 없습니다.' }, { status: 400 });
        }

        const currentPoints = profile.points || 0;
        const COST = 500;

        if (currentPoints < COST) {
            return NextResponse.json({ 
                error: `내공이 부족합니다. (보유: ${currentPoints}점 / 필요: ${COST}점)`,
                code: 'INSUFFICIENT_POINTS' 
            }, { status: 402 });
        }

        // 2. Deduct Points
        const { error: updateError } = await (supabaseAdmin as any)
            .from('profiles')
            .update({ points: currentPoints - COST })
            .eq('id', user_id);

        if (updateError) {
             return NextResponse.json({ error: '포인트 차감 중 오류가 발생했습니다.' }, { status: 500 });
        }

        // 3. Log Transaction
        await (supabaseAdmin as any)
            .from('point_logs')
            .insert({
                user_id: user_id,
                amount: -COST,
                reason: '성장하기 피드백 요청 (프로젝트 등록)'
            });
    }

    let { data, error } = await (supabaseAdmin as any)
      .from('Project')
      .insert([{ 
        user_id, category_id, title, summary, content_text, thumbnail_url, rendering_type, custom_data, 
        allow_michelin_rating: allow_michelin_rating ?? true, 
        allow_stickers: allow_stickers ?? true, 
        allow_secret_comments: allow_secret_comments ?? true,
        likes_count: 0, views_count: 0 
      }] as any)
      .select()
      .single();

    // ERROR: Fallback Logic Removed (Requested by User)
    // If error occurs due to missing columns, it will flow to the standard error response below.

    if (error) {
      console.error('프로젝트 생성 실패:', error);
      return NextResponse.json(
        { error: `프로젝트 생성 실패: ${error.message}` },
        { status: 500 }
      );
    }

    // [New] 표준화된 Fields 매핑 저장
    if (data && data.project_id && custom_data) {
        try {
            const parsedCustom = typeof custom_data === 'string' ? JSON.parse(custom_data) : custom_data;
            const fieldSlugs = parsedCustom.fields; 

            if (Array.isArray(fieldSlugs) && fieldSlugs.length > 0) {
                const { data: fieldRecords } = await (supabaseAdmin as any)
                    .from('fields')
                    .select('id, slug')
                    .in('slug', fieldSlugs);

                if (fieldRecords && fieldRecords.length > 0) {
                    const mappings = fieldRecords.map((f: any) => ({
                        project_id: data.project_id,
                        field_id: f.id,
                    }));

                    const { error: mapError } = await (supabaseAdmin as any)
                        .from('project_fields')
                        .insert(mappings);

                    if (mapError) {
                         console.error('[API] Field mapping insert failed:', mapError);
                    } else {
                         console.log('[API] Field mappings created:', mappings.length);
                    }
                }
            }
        } catch (e) {
            console.error('[API] Standardizing fields failed:', e);
        }
    }

    // [New] 공동 제작자 추가 (Collaborators)
    const { collaborator_emails } = body;
    if (data && data.project_id && Array.isArray(collaborator_emails) && collaborator_emails.length > 0) {
        try {
             // 이메일로 User ID 조회 (profiles 테이블 사용 가정)
             const { data: users } = await (supabaseAdmin as any)
                .from('profiles')
                .select('id, email') // profiles에 이메일이 있다고 가정 (Trigger로 동기화됨을 전제)
                .in('email', collaborator_emails);
             
             if (users && users.length > 0) {
                 const currentCollaborators = users.map((u: any) => ({
                     project_id: data.project_id,
                     user_id: u.id
                 }));

                 const { error: collabError } = await (supabaseAdmin as any)
                     .from('project_collaborators')
                     .insert(currentCollaborators);
                 
                 if (collabError) console.error('[API] Collaborators insert error:', collabError);
                 else console.log(`[API] Added ${users.length} collaborators.`);
             } else {
                 console.log('[API] No users found for given emails');
             }
        } catch (e) {
            console.error('[API] Failed to add collaborators:', e);
        }
    }

    // [Point System] Reward for Upload (General Projects)
    if (!isGrowthMode && data && data.project_id) {
         try {
             // 1. Get current points
             const { data: profile } = await (supabaseAdmin as any)
                .from('profiles')
                .select('points')
                .eq('id', user_id)
                .single();
             
             const currentPoints = profile?.points || 0;
             const REWARD = 100;

             // 2. Add Points
             await (supabaseAdmin as any)
                .from('profiles')
                .update({ points: currentPoints + REWARD })
                .eq('id', user_id);

             // 3. Log
             await (supabaseAdmin as any)
                .from('point_logs')
                .insert({
                    user_id: user_id,
                    amount: REWARD,
                    reason: '프로젝트 업로드 보상'
                });
            
             // 4. Send Notification
             await (supabaseAdmin as any)
                .from('notifications')
                .insert({
                    user_id: user_id,
                    type: 'point',
                    title: '내공 획득! 🪙',
                    message: `프로젝트 업로드 보상으로 ${REWARD} 내공을 받았습니다.`,
                    link: '/mypage',
                    read: false
                });
             
             console.log(`[Point System] Awarded ${REWARD} points to user ${user_id} for upload.`);
         } catch (e) {
             console.error('[Point System] Failed to award upload points:', e);
         }
    }
    
    return NextResponse.json({ project: data }, { status: 201 });
  } catch (error: any) {
    console.error('서버 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
