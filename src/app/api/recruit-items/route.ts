// src/app/api/recruit-items/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

// GET: 모든 활성 항목 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    let query = supabaseAdmin
      .from('recruit_items')
      .select('*')
      .eq('is_active', true)
      .order('date', { ascending: true });

    if (type && type !== 'all') {
      query = query.eq('type', type);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ items: data || [] });
  } catch (error) {
    console.error('Error fetching recruit items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch items' },
      { status: 500 }
    );
  }
}

// POST: 새 항목 추가 (관리자만)
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 관리자 권한 확인
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userData?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin only' }, { status: 403 });
    }

    const body = await request.json();
    
    const { data, error } = await supabaseAdmin
      .from('recruit_items')
      .insert({
        ...body,
        is_crawled: false,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ item: data });
  } catch (error) {
    console.error('Error creating recruit item:', error);
    return NextResponse.json(
      { error: 'Failed to create item' },
      { status: 500 }
    );
  }
}
