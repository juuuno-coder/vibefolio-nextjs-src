import { supabase } from '@/lib/supabase/client';

export type ActivityAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'APPROVE' | 'REJECT';
export type TargetType = 'PROJECT' | 'BANNER' | 'RECRUIT' | 'USER' | 'SETTINGS' | 'NOTICE' | 'FAQ' | 'INQUIRY';

interface LogActivityParams {
  action: ActivityAction;
  targetType: TargetType;
  targetId?: string | number;
  details?: any;
  userId: string;
  userEmail?: string;
  ipAddress?: string;
}

/**
 * 관리자 활동 로그를 기록하는 함수
 */
export async function logActivity({
  action,
  targetType,
  targetId,
  details,
  userId,
  userEmail,
  ipAddress
}: LogActivityParams) {
  try {
    const { error } = await (supabase as any)
      .from('activity_logs')
      .insert({
        action,
        target_type: targetType,
        target_id: targetId?.toString(),
        details,
        user_id: userId,
        user_email: userEmail,
        ip_address: ipAddress || 'unknown'
      });

    if (error) {
      console.error('Failed to log activity:', error);
    }
  } catch (err) {
    console.error('Error logging activity:', err);
  }
}
