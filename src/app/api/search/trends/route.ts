import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export const revalidate = 60; // 1분마다 캐시 갱신

export async function GET() {
  try {
    const { data, error } = await (supabase as any)
      .from('search_keywords')
      .select('query, count')
      .order('count', { ascending: false })
      .order('updated_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Trend fetching failed:', error);
      // 에러 발생 시 더미 데이터 반환 (UI 유지 목적)
      return NextResponse.json({ 
        trends: [
          { query: 'AI 아트', count: 100 },
          { query: '모션 그래픽', count: 85 },
          { query: '3D 모델링', count: 70 },
          { query: 'UI 디폴트', count: 60 }
        ]
      });
    }

    return NextResponse.json({ trends: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
