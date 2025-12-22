// lib/supabase/client.ts
// Supabase 클라이언트 초기화

import type { Database } from './types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 환경 변수 검증 (클라이언트에서는 경고만 출력)
if (typeof window !== 'undefined' && (!supabaseUrl || !supabaseAnonKey)) {
  console.error(
    'Missing Supabase env variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required.'
  );
}

// 서버에서는 에러 던지기
if (typeof window === 'undefined' && (!supabaseUrl || !supabaseAnonKey)) {
  throw new Error(
    'Missing Supabase env variables: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment.'
  );
}

// 지연 초기화를 위한 내부 Promise
let _clientPromise: Promise<any> | null = null;
const initClient = async () => {
  if (_clientPromise) return _clientPromise;
  
  // 환경 변수가 없으면 null 반환
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Cannot initialize Supabase: missing environment variables');
    return null;
  }
  
  _clientPromise = import('@supabase/supabase-js').then((m) =>
    m.createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  );
  return _clientPromise;
};

// 다단계 속성 접근(예: supabase.auth.getUser()) 및 함수 호출을 지원하는 프록시 생성
const makeLazyProxy = (path: Array<string | number> = []): any => {
  const proxyTarget = () => {}; // function so apply trap works
  return new Proxy(proxyTarget, {
    get(_, prop: string) {
      return makeLazyProxy([...path, prop]);
    },
    apply(_, thisArg, args) {
      return initClient().then((client) => {
        // 클라이언트가 null이면 에러 대신 undefined 반환
        if (!client) {
          console.warn('Supabase client not initialized');
          return undefined;
        }
        
        let target: any = client;
        for (const p of path) {
          target = target[p as any];
          if (target == null) break;
        }
        if (typeof target === 'function') return target.apply(client, args);
        // if target is a value, just return it (no args expected)
        return target;
      });
    },
  });
};

// 기존 코드와의 호환을 위해 `supabase`를 프록시로 내보냄 — 실제 `@supabase/supabase-js` 모듈은
// 위 initClient()가 호출될 때까지 로드되지 않습니다.
export const supabase: any = makeLazyProxy();

// 서버 전용 admin 클라이언트는 별도 모듈에서 재수출합니다.
export { supabaseAdmin } from './admin';
