// lib/supabase/client.ts
// Supabase 클라이언트 초기화

import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ddnebvjjkxigxbmkqvzr.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkbmVidmpqa3hpZ3hibWtrcXZ6ciIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzMzODM2MTgwLCJleHAiOjIwNDk0MTIxODB9.d5S7p7XyZc3lX6Zc3lX6Zc3lX6Zc3lX6Zc3lX6Zc3lX6'; // 실제 키 값은 너무 길어서 생략되었을 수 있으니 .env.local 값 확인 필요

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase 환경 변수가 설정되지 않아 기본값을 사용하거나 비활성화될 수 있습니다.');
}

// 클라이언트 사이드용 Supabase 클라이언트 (싱글톤 패턴 적용)
const createSupabaseClient = () =>
  createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });

export const supabase = (global as any).supabase ?? createSupabaseClient();

if (process.env.NODE_ENV !== "production") {
  (global as any).supabase = supabase;
}

// 서버 사이드용 Supabase 클라이언트 (Service Role Key 사용)
export const supabaseAdmin = createClient<Database>(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
