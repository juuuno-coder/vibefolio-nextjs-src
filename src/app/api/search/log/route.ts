import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    // RPC 함수 호출 (increment_search_count)
    const { error } = await (supabase as any).rpc('increment_search_count', { 
      search_term: query.trim() 
    });

    if (error) {
       // RPC가 없으면 직접 테이블 업데이트 시도 (Fallback)
       console.warn('RPC failed, falling back to manual update:', error.message);
       const { data: existing } = await (supabase as any)
         .from('search_keywords')
         .select('id, count')
         .eq('query', query.trim())
         .single();

       if (existing) {
         await (supabase as any)
           .from('search_keywords')
           .update({ count: existing.count + 1, updated_at: new Date().toISOString() })
           .eq('id', existing.id);
       } else {
         await (supabase as any)
           .from('search_keywords')
           .insert([{ query: query.trim(), count: 1 }] as any);
       }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
