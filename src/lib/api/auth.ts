// lib/api/auth.ts
// API Key 인증 및 Rate Limiting 미들웨어

import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Admin client for API key validation
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export interface AuthenticatedRequest {
  userId: string;
  apiKey: string;
  rateLimit: number;
}

/**
 * API Key 검증 및 사용자 인증
 * @param request NextRequest
 * @returns AuthenticatedRequest | null
 */
export async function authenticateApiKey(
  request: NextRequest
): Promise<{ success: true; data: AuthenticatedRequest } | { success: false; error: string; status: number }> {
  // 1. Authorization 헤더 확인
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      success: false,
      error: 'Missing or invalid Authorization header. Use: Authorization: Bearer {API_KEY}',
      status: 401
    };
  }

  const apiKey = authHeader.replace('Bearer ', '').trim();

  if (!apiKey || apiKey.length < 10) {
    return {
      success: false,
      error: 'Invalid API key format',
      status: 401
    };
  }

  // 2. API Key 조회 및 검증
  try {
    const { data: keyData, error: keyError } = await supabaseAdmin
      .from('api_keys')
      .select('*')
      .eq('api_key', apiKey)
      .eq('is_active', true)
      .single();

    if (keyError || !keyData) {
      return {
        success: false,
        error: 'Invalid or inactive API key',
        status: 401
      };
    }

    // 3. 만료 확인
    if (keyData.expires_at) {
      const expiresAt = new Date(keyData.expires_at);
      if (expiresAt < new Date()) {
        return {
          success: false,
          error: 'API key has expired',
          status: 401
        };
      }
    }

    // 4. Rate Limiting 체크 (간단한 구현)
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);

    // 최근 1분간 요청 수 확인 (실제로는 Redis 등 사용 권장)
    // 여기서는 last_used_at 업데이트만 수행
    await supabaseAdmin
      .from('api_keys')
      .update({ last_used_at: now.toISOString() })
      .eq('key_id', keyData.key_id);

    // 5. 인증 성공
    return {
      success: true,
      data: {
        userId: keyData.user_id,
        apiKey: apiKey,
        rateLimit: keyData.rate_limit_per_minute || 60
      }
    };

  } catch (error) {
    console.error('[API Auth] Error:', error);
    return {
      success: false,
      error: 'Internal server error during authentication',
      status: 500
    };
  }
}

/**
 * 권한 확인 (scopes)
 * @param apiKey API Key 데이터
 * @param requiredScope 필요한 권한
 */
export async function checkScope(apiKey: string, requiredScope: string): Promise<boolean> {
  try {
    const { data } = await supabaseAdmin
      .from('api_keys')
      .select('scopes')
      .eq('api_key', apiKey)
      .single();

    if (!data || !data.scopes) return false;

    return data.scopes.includes(requiredScope);
  } catch {
    return false;
  }
}
