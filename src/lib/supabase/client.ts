import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 클라이언트 사이드 싱글톤 인스턴스 저장소
let clientInstance: SupabaseClient<Database> | undefined;

function getSupabaseClient(): SupabaseClient<Database> {
  if (clientInstance) {
    return clientInstance;
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[Supabase] CRITICAL: Missing environment variables!');
    // 빌드 타임 에러 방지를 위한 더미 반환 (실제 런타임에선 발생하면 안됨)
    return createClient(
      'https://placeholder.supabase.co',
      'placeholder',
      { auth: { persistSession: false } }
    ) as unknown as SupabaseClient<Database>;
  }

  const client = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true, // 세션 로컬 스토리지 저장
      autoRefreshToken: true,
      detectSessionInUrl: true, // OAuth 리다이렉트 시 세션 감지 필수
    },
  });

  // 브라우저 환경에서는 인스턴스를 캐싱하여 중복 생성 방지
  if (typeof window !== 'undefined') {
    clientInstance = client;
  }

  return client;
}

export const supabase = getSupabaseClient();
export { getSupabaseClient as createClient };
// export { supabaseAdmin} from './admin';
